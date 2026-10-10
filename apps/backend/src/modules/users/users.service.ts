import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, ILike } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { User } from './entities/user.entity';
import { UserRole as UserRoleEntity } from './entities/user-role.entity';
import { assertTenantRoleDefinition, assertPlatformAccountMutation, VerifiedPlatformActor } from '../roles/tenant-role-policy';
import { AuthUtilsService } from '../../core/shared/auth-utils.service';
import { CacheService } from '../../core/shared/services/cache.service';
import { RolesService } from '../roles/roles.service';
import { UserRolesService } from './user-roles.service';
import { CrmService } from '../crm/crm.service';
import { UserEmailService } from './services/user-email.service';
import { TenantService } from '../../core/tenant/tenant.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CommerceService } from '../commerce/services/commerce.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { createHash, randomBytes } from 'crypto';
import { Organization } from '../organizations/entities/organization.entity';
import { assertAdminAuthorityCanBeRevoked } from '../organizations/organization-admin-invariant';
import { rotateRefreshCredentials, replacePasswordCredentials, consumeVerificationCredentials, consumePasswordResetCredentials, revokeSessionCredentials, consumeInvitationCredentials } from './auth-persistence';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private authUtilsService: AuthUtilsService,
    private cacheService: CacheService,
    private rolesService: RolesService,
    @Inject(forwardRef(() => UserRolesService))
    private userRolesService: UserRolesService,
    private crmService: CrmService,
    private userEmailService: UserEmailService,
    private tenantService: TenantService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => CommerceService))
    private commerceService: CommerceService,
  ) { }

  async create(createUserDto: CreateUserDto, tenantId?: string): Promise<User> {
    const activeTenantId = tenantId || this.tenantService.getTenantId();
    if (!activeTenantId) throw new BadRequestException('Tenant context required');

    try {
      // Check if email already exists (scoped to tenant)
      const normalizedEmail = createUserDto.email.trim().toLowerCase();
      const existingUser = await this.findByEmail(normalizedEmail, activeTenantId, true);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Check User Limits (Seat Management)
      const limitCheck = await this.commerceService.checkUserLimit(activeTenantId);
      if (!limitCheck.allowed) {
        throw new BadRequestException(`User limit reached for your plan. Upgrade to add more users.`);
      }

      const { primaryRoleId, additionalRoles } = await this.resolveCreationRoles(createUserDto, activeTenantId);
      const hashedPassword = await this.authUtilsService.hashPassword(createUserDto.password);
      const { primaryRoleId: _primary, additionalRoleIds: _additional, ...fields } = createUserDto;
      // User and role assignments commit together; a failed assignment cannot leave a privileged legacy row.
      const savedUser = await this.usersRepository.manager.transaction(async manager => {
        const users = manager.getRepository(User);
        const organization = await manager.getRepository(Organization).findOne({
          where: { slug: activeTenantId, isActive: true },
        });
        if (!organization) throw new BadRequestException('Active organization is required to create a tenant user');
        const user = users.create({
          ...fields,
          email: normalizedEmail,
          roleId: primaryRoleId,
          password: hashedPassword,
          tenantId: activeTenantId,
          organizationId: organization.id,
        });
        const saved = await users.save(user);
        const assignments = new UserRolesService(manager.getRepository(UserRoleEntity), users, this.rolesService);
        await assignments.assignRoles(saved.id, primaryRoleId, additionalRoles, false, undefined, activeTenantId);
        const committedUser = await users.findOne({ where: { id: saved.id, tenantId: activeTenantId } });
        if (!committedUser) throw new NotFoundException('Created user could not be reloaded');
        return committedUser;
      });

      // Clear cache
      await this.cacheService.del('users:all');

      return savedUser;
    } catch (error) {
      console.error('❌ Error in UsersService.create:', error);

      // Re-throw known errors
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      // Handle database constraint violations (duplicate key)
      if (error.code === '23505') { // PostgreSQL unique violation code
        if (error.constraint?.includes('email') || error.detail?.includes('email')) {
          throw new ConflictException('User with this email already exists');
        }
        throw new ConflictException('A user with this information already exists');
      }

      // Log and throw unexpected errors
      console.error('❌ Unexpected error details:', {
        message: error.message,
        code: error.code,
        constraint: error.constraint,
        detail: error.detail,
        stack: error.stack,
        name: error.name,
      });
      throw error;
    }
  }

  async invite(dto: InviteUserDto, tenantId: string): Promise<User> {
    const invitationToken = `invite_${randomBytes(32).toString('hex')}`;
    const user = await this.create({
      ...dto,
      password: randomBytes(48).toString('base64url'),
    }, tenantId);
    await this.usersRepository.update(
      { id: user.id, tenantId },
      {
        emailVerificationToken: `invite_hash_${createHash('sha256').update(invitationToken).digest('hex')}`,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    );
    this.eventEmitter.emit('user.invited', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      invitationToken,
      tenantId,
    });
    return user;
  }

  private async resolveCreationRoles(dto: CreateUserDto, tenantId: string): Promise<{ primaryRoleId: string; additionalRoles: string[] }> {
    const requestedIds = [...new Set([dto.roleId, dto.primaryRoleId, ...(dto.additionalRoleIds || [])].filter((id): id is string => Boolean(id)))];
    if (requestedIds.length > 0) {
      const roles = await this.rolesService.findByIds(requestedIds, tenantId);
      if (roles.length !== requestedIds.length || roles.some(role => role.tenantId !== tenantId)) {
        throw new BadRequestException('All user roles must belong to this tenant');
      }
      roles.forEach(assertTenantRoleDefinition);
    }
    let primaryRoleId = dto.primaryRoleId || dto.roleId;
    if (!primaryRoleId) {
      const viewer = (await this.rolesService.findAll(tenantId)).find(role => role.name === 'viewer');
      if (!viewer) throw new BadRequestException('Default viewer role not found');
      if (viewer.tenantId !== tenantId) throw new BadRequestException('Default role tenant mismatch');
      assertTenantRoleDefinition(viewer);
      primaryRoleId = viewer.id;
    }
    if (!dto.primaryRoleId) {
      // A CRM outage retains the validated default/explicit role; it cannot introduce a new grant.
      const isCustomer = await this.crmService.isCustomerEmail(dto.email).catch(() => false);
      if (isCustomer) {
        const customer = (await this.rolesService.findAll(tenantId)).find(role => role.name === 'customer');
        if (customer) {
          if (customer.tenantId !== tenantId) throw new BadRequestException('Customer role tenant mismatch');
          assertTenantRoleDefinition(customer);
          primaryRoleId = customer.id;
        }
      }
    }
    return { primaryRoleId, additionalRoles: [...new Set(dto.additionalRoleIds || [])].filter(id => id !== primaryRoleId) };
  }

  async findAll(filterDto: FilterUsersDto, tenantId?: string): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const activeTenantId = tenantId || this.tenantService.getTenantId();
    if (!activeTenantId) throw new BadRequestException('Tenant context required');

    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<User> = { tenantId: activeTenantId } as any;

    // Search filter (email or name)
    if (filterDto?.search) {
      // This is simplified - for production, use query builder for OR conditions
      where.email = ILike(`%${filterDto.search}%`);
    }

    // Role filter
    if (filterDto?.roleId) {
      where.roleId = filterDto.roleId;
    }

    // Status filters
    if (filterDto?.isActive !== undefined) {
      where.isActive = filterDto.isActive;
    }

    if (filterDto?.emailVerified !== undefined) {
      where.emailVerified = filterDto.emailVerified;
    }

    // Sorting
    const sortBy = filterDto?.sortBy || 'createdAt';
    const sortOrder = filterDto?.sortOrder || 'DESC';

    const [users, total] = await this.usersRepository.findAndCount({
      where,
      relations: ['roleEntity', 'userRoles', 'userRoles.role'], // Include multi-role data
      take: limit,
      skip,
      order: {
        [sortBy]: sortOrder,
      },
      withDeleted: false, // Exclude soft-deleted users from list
    });

    return {
      data: users,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, tenantId?: string, isGlobal = false): Promise<User> {
    const activeTenantId = isGlobal ? undefined : (tenantId || this.tenantService.getTenantId());
    const where: FindOptionsWhere<User> = { id } as any;
    // CRITICAL: Strict tenant enforcement
    if (activeTenantId) {
      (where as any).tenantId = activeTenantId;
    }

    console.log(`🔍 UsersService.findOne(${id}) context:`, {
      tenantIdArg: tenantId,
      isGlobal,
      resolvedActiveTenantId: activeTenantId,
      whereClause: where
    });

    const user = await this.usersRepository.findOne({
      where,
      relations: ['roleEntity', 'userRoles', 'userRoles.role', 'organization'], // Include both legacy and new role relations + organization
      withDeleted: false, // Exclude soft-deleted users
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Double check tenantId if provided (in case TypeORM query didn't filter correctly for some reason)
    if (activeTenantId && user.tenantId !== activeTenantId) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // DEBUG: Log user roles
    console.log('🔍 UsersService.findOne - user roles:', {
      email: user.email,
      roleId: user.roleId,
      userRolesCount: user.userRoles?.length || 0,
      userRoles: user.userRoles?.map(ur => ({
        roleName: ur.role?.name,
        isPrimary: ur.isPrimary,
      })),
      rolesGetter: user.roles?.map(r => r.name),
    });

    return user;
  }

  async findByEmail(email: string, tenantId?: string, skipCache = false, isGlobal = false): Promise<User | null> {
    email = email.trim().toLowerCase();
    const activeTenantId = isGlobal ? undefined : (tenantId || this.tenantService.getTenantId());

    console.log(`🔍 UsersService.findByEmail(${email}) context:`, {
      tenantIdArg: tenantId,
      isGlobal,
      resolvedActiveTenantId: activeTenantId,
      skipCache
    });


    // Skip cache for critical operations like user registration
    if (!skipCache) {
      const cached = await this.cacheService.get<User>(`users:email:${email}`);
      if (cached) {
        // If we need strict tenant check, validate cached user's tenantId
        if (activeTenantId && cached.tenantId !== activeTenantId) {
          return null;
        }
        return cached;
      }
    }

    const where: FindOptionsWhere<User> = { email } as any;
    if (activeTenantId) (where as any).tenantId = activeTenantId;

    console.log(`🔍 UsersService.findByEmail(${email}) Query WHERE:`, where);

    // Important: Only find users that are NOT soft-deleted
    // TypeORM automatically excludes soft-deleted records when using findOne
    // But we need to be explicit for clarity
    const user = await this.usersRepository.findOne({
      where,
      relations: ['roleEntity', 'userRoles', 'userRoles.role', 'organization'], // Include role and organization information for permission checks
      withDeleted: false, // Explicitly exclude soft-deleted users
    });

    // Validated tenant match if tenantId provided
    if (activeTenantId && user && user.tenantId !== activeTenantId) {
      return null;
    }

    if (user && !skipCache) {
      await this.cacheService.set(`users:email:${email}`, user, 60); // 60 seconds TTL
    }
    return user;
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { emailVerificationToken: token },
      withDeleted: false, // Don't allow verifying deleted accounts
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, tenantId?: string, isGlobal = false, actor?: VerifiedPlatformActor): Promise<User> {
    assertPlatformAccountMutation(id, actor);
    const allowedProfileFields = new Set([
      'email', 'firstName', 'lastName', 'phone', 'avatar', 'address', 'city',
      'country', 'bio', 'metadata', 'customerNumber', 'schoolName', 'studentId',
      'isSubscribedToNewsletter', 'primaryRoleId', 'additionalRoleIds', 'roleId',
    ]);
    const profileUpdate = Object.fromEntries(
      Object.entries(updateUserDto).filter(([key]) => allowedProfileFields.has(key)),
    ) as Record<string, unknown>;
    const activeTenantId = isGlobal ? undefined : (tenantId || this.tenantService.getTenantId());

    // Pass isGlobal to findOne to bypass tenant check if needed
    const user = await this.findOne(id, activeTenantId, isGlobal);
    if (Object.prototype.hasOwnProperty.call(updateUserDto, 'isActive')) {
      throw new BadRequestException('Use the dedicated account lifecycle endpoint to change active status');
    }

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      profileUpdate.email = updateUserDto.email.trim().toLowerCase();
      // Check for email collision, scoping to tenant if available (though user might be updating self)
      // We use user.tenantId to keep it consistent
      const existingUser = await this.findByEmail(updateUserDto.email, user.tenantId);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // NEW: Role handling - Update roles if primaryRoleId is provided
    if (updateUserDto.primaryRoleId) {
      console.log(`🔄 Updating roles for user ${id}:`, {
        primaryRoleId: updateUserDto.primaryRoleId,
        additionalRoleIds: updateUserDto.additionalRoleIds || [],
      });

      try {
        await this.userRolesService.assignRoles(
          id,
          updateUserDto.primaryRoleId,
          updateUserDto.additionalRoleIds || [],
          true, // Replace existing roles
          undefined, // NOTE: Admin user ID can be passed from request context when audit logging is needed
          activeTenantId, // Ensure roles are assigned within tenant
          actor,
        );

        // SMOOTH TRANSITION: Just clear cache - user will get updated role on next request
        // No token invalidation = seamless role change without logout
        await this.cacheService.del(`users:${id}`);
        await this.cacheService.del('users:all');

        // Remove from DTO to prevent duplicate update
        delete profileUpdate.primaryRoleId;
        delete profileUpdate.additionalRoleIds;
      } catch (error) {
        console.error('❌ Error updating user roles:', error);
        throw error;
      }
    }

    // DEPRECATED: Backward compatibility for single roleId
    if (updateUserDto.roleId && updateUserDto.roleId !== user.roleId) {
      console.log(`⚠️ Using deprecated roleId field. Consider using primaryRoleId instead.`);

      // Validate role exists
      const roleExists = await this.rolesService.findOne(updateUserDto.roleId, user.tenantId);
      if (!roleExists) {
        throw new NotFoundException(`Role with ID "${updateUserDto.roleId}" not found`);
      }

      // Assign as primary role using new system
      await this.userRolesService.assignRoles(
        id,
        updateUserDto.roleId,
        [],
        true,
        undefined,
        activeTenantId,
        actor,
      );
    }

    delete profileUpdate.roleId;

    // IMPORTANT: Use update() instead of save() to avoid eager loading issues
    // save() tries to persist eager loaded relations which causes userId to become null
    if (Object.keys(profileUpdate).length > 0) {
      await this.usersRepository.update(id, {
        ...profileUpdate,
      });
    }

    // Clear cache
    await this.cacheService.del(`users:${id}`);
    await this.cacheService.del(`users:email:${user.email}`);
    await this.cacheService.del('users:all');

    // Reload user with updated roles
    return this.findOne(id, activeTenantId, isGlobal);
  }

  /** Atomic authentication writes: no tenant/user-editable role authority is involved. */
  async rotateRefreshToken(userId: string, tenantId: string, expectedStoredToken: string, expectedVersion: number, newToken: string, newExpiry: Date): Promise<boolean> {
    const changed = await rotateRefreshCredentials(this.usersRepository, userId, tenantId, expectedStoredToken, expectedVersion, newToken, newExpiry);
    if (changed) await this.clearAuthCaches(userId, tenantId);
    return changed;
  }

  async changePasswordCredentials(userId: string, tenantId: string, hashedPassword: string, expectedVersion: number): Promise<boolean> {
    const changed = await replacePasswordCredentials(this.usersRepository, userId, tenantId, hashedPassword, expectedVersion);
    if (changed) await this.clearAuthCaches(userId, tenantId);
    return changed;
  }

  async consumeEmailVerificationToken(userId: string, tenantId: string, expectedToken: string): Promise<boolean> {
    const changed = await consumeVerificationCredentials(this.usersRepository, userId, tenantId, expectedToken);
    if (changed) await this.clearAuthCaches(userId, tenantId);
    return changed;
  }

  async consumePasswordResetToken(userId: string, tenantId: string, expectedToken: string, hashedPassword: string): Promise<boolean> {
    const changed = await consumePasswordResetCredentials(this.usersRepository, userId, tenantId, expectedToken, hashedPassword);
    if (changed) await this.clearAuthCaches(userId, tenantId);
    return changed;
  }

  async revokeSessions(userId: string, tenantId: string, expectedVersion: number): Promise<boolean> {
    const changed = await revokeSessionCredentials(this.usersRepository, userId, tenantId, expectedVersion);
    if (changed) await this.clearAuthCaches(userId, tenantId);
    return changed;
  }

  async consumeInvitationToken(userId: string, tenantId: string, invitationToken: string, hashedPassword: string): Promise<boolean> {
    const changed = await consumeInvitationCredentials(this.usersRepository, userId, tenantId, invitationToken, hashedPassword);
    if (changed) await this.clearAuthCaches(userId, tenantId);
    return changed;
  }

  private async clearAuthCaches(userId: string, tenantId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId, tenantId }, select: ['id', 'email'], loadEagerRelations: false });
    await this.cacheService.del(`users:${userId}`);
    if (user) await this.cacheService.del(`users:email:${user.email}`);
    await this.cacheService.del('users:all');
  }

  // Alias for update method (for compatibility)
  async updateUser(
    id: string,
    updateUserDto: Partial<Pick<User, 'refreshToken' | 'refreshTokenExpires' | 'lastLoginAt' | 'emailVerificationToken' | 'emailVerificationExpires' | 'emailVerified' | 'emailVerifiedAt' | 'isActive' | 'password'>>,
    tenantId?: string,
    isGlobal = false,
  ): Promise<User> {
    // Internal auth persistence seam: no arbitrary profile/role writes can use this bypass.
    const authFields = new Set(['refreshToken', 'refreshTokenExpires', 'lastLoginAt', 'emailVerificationToken', 'emailVerificationExpires', 'emailVerified', 'emailVerifiedAt', 'isActive', 'password']);
    if (Object.keys(updateUserDto).some(key => !authFields.has(key))) {
      throw new BadRequestException('Internal authentication update contains unsupported fields');
    }
    const activeTenantId = tenantId || this.tenantService.getTenantId();
    if (!activeTenantId) throw new BadRequestException('Tenant context required');
    const user = await this.findOne(id, activeTenantId, isGlobal);
    await this.usersRepository.update({ id, tenantId: user.tenantId }, updateUserDto);
    await this.clearAuthCaches(id, user.tenantId);
    return this.findOne(id, user.tenantId, isGlobal);
  }

  async remove(id: string, tenantId?: string, actor?: VerifiedPlatformActor): Promise<void> {
    assertPlatformAccountMutation(id, actor);
    const activeTenantId = tenantId || this.tenantService.getTenantId();
    // Need to use withDeleted to find user even if already soft-deleted
    const where: FindOptionsWhere<User> = { id } as any;
    if (activeTenantId) (where as any).tenantId = activeTenantId;

    const user = await this.usersRepository.findOne({
      where,
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const revokeAndDelete = async (users: Repository<User>) => {
      await users.update(
        { id, ...(activeTenantId ? { tenantId: activeTenantId } : {}) } as FindOptionsWhere<User>,
        { tokenVersion: () => '"tokenVersion" + 1', refreshToken: null, refreshTokenExpires: null },
      );
      await users.softDelete({ id, ...(activeTenantId ? { tenantId: activeTenantId } : {}) });
    };
    if (user.organizationId) {
      await this.usersRepository.manager.transaction(async manager => {
        await assertAdminAuthorityCanBeRevoked(manager, user);
        await revokeAndDelete(manager.withRepository(this.usersRepository));
      });
    } else {
      await revokeAndDelete(this.usersRepository);
    }

    // Clear cache
    await this.cacheService.del(`users:${id}`);
    await this.cacheService.del(`users:email:${user.email}`);
    await this.cacheService.del('users:all');
  }

  /**
   * Hard delete - permanently remove user from database
   * Use with caution! This action cannot be undone.
   * Consider using soft delete (remove) instead.
   */
  async hardDelete(id: string, tenantId?: string, actor?: VerifiedPlatformActor): Promise<void> {
    assertPlatformAccountMutation(id, actor);
    const activeTenantId = tenantId || this.tenantService.getTenantId();
    const where: FindOptionsWhere<User> = { id } as any;
    if (activeTenantId) (where as any).tenantId = activeTenantId;

    const user = await this.usersRepository.findOne({
      where,
      withDeleted: true, // Find even soft-deleted users
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    console.warn(`⚠️  HARD DELETE: Permanently removing user ${user.email} (${id})`);

    // Permanently delete from database
    await this.usersRepository.remove(user);

    // Clear cache
    await this.cacheService.del(`users:${id}`);
    await this.cacheService.del(`users:email:${user.email}`);
    await this.cacheService.del('users:all');
  }

  /**
   * Restore a soft-deleted user
   */
  async restore(id: string, tenantId?: string, actor?: VerifiedPlatformActor): Promise<User> {
    assertPlatformAccountMutation(id, actor);
    const activeTenantId = tenantId || this.tenantService.getTenantId();
    // Find soft-deleted user
    const where: FindOptionsWhere<User> = { id } as any;
    if (activeTenantId) (where as any).tenantId = activeTenantId;

    const user = await this.usersRepository.findOne({
      where,
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (!user.deletedAt) {
      throw new BadRequestException('User is not deleted');
    }

    // Restore the user
    await this.usersRepository.restore(id);

    // Clear cache and return updated user
    await this.cacheService.del(`users:${id}`);
    await this.cacheService.del(`users:email:${user.email}`);
    await this.cacheService.del('users:all');

    return this.findOne(id, activeTenantId);
  }

  async changeRole(id: string, changeRoleDto: ChangeUserRoleDto, tenantId?: string, actor?: VerifiedPlatformActor): Promise<User> {
    assertPlatformAccountMutation(id, actor);
    const activeTenantId = tenantId || this.tenantService.getTenantId();
    console.log(`⚠️ changeRole is deprecated. Use update with primaryRoleId instead.`);

    const user = await this.findOne(id, activeTenantId);

    // Use new multi-role system
    await this.userRolesService.assignRoles(
      id,
      changeRoleDto.roleId,
      [], // No additional roles
      true, // Replace existing
      undefined,
      activeTenantId,
      actor,
    );

    // SMOOTH TRANSITION: Just clear cache - user will get updated role on next request
    // No token invalidation = seamless role change without logout
    await this.cacheService.del(`users:${id}`);
    await this.cacheService.del('users:all');

    // Reload user with new role relation
    return this.findOne(id, activeTenantId);
  }

  async toggleActive(id: string, tenantId?: string, actor?: VerifiedPlatformActor): Promise<User> {
    assertPlatformAccountMutation(id, actor);
    const activeTenantId = tenantId || this.tenantService.getTenantId();
    const user = await this.findOne(id, activeTenantId);

    const nextActive = !user.isActive;
    const updateState = async (users: Repository<User>) => users.update(
      { id, ...(activeTenantId ? { tenantId: activeTenantId } : {}) } as FindOptionsWhere<User>,
      {
        isActive: nextActive,
        ...(!nextActive ? {
          tokenVersion: () => '"tokenVersion" + 1',
          refreshToken: null,
          refreshTokenExpires: null,
        } : {}),
      },
    );
    if (!nextActive && user.organizationId) {
      await this.usersRepository.manager.transaction(async manager => {
        await assertAdminAuthorityCanBeRevoked(manager, user);
        await updateState(manager.withRepository(this.usersRepository));
      });
    } else {
      await updateState(this.usersRepository);
    }

    // Clear cache
    await this.cacheService.del(`users:${id}`);
    await this.cacheService.del('users:all');

    return this.findOne(id, activeTenantId);
  }

  async deactivateUser(id: string, tenantId?: string, actor?: VerifiedPlatformActor): Promise<User> {
    assertPlatformAccountMutation(id, actor);
    const activeTenantId = tenantId || this.tenantService.getTenantId();
    const user = await this.findOne(id, activeTenantId);

    const disable = async (users: Repository<User>) => users.update(
      { id, ...(activeTenantId ? { tenantId: activeTenantId } : {}) } as FindOptionsWhere<User>,
      {
        isActive: false,
        tokenVersion: () => '"tokenVersion" + 1',
        refreshToken: null,
        refreshTokenExpires: null,
      },
    );
    if (user.organizationId) {
      await this.usersRepository.manager.transaction(async manager => {
        await assertAdminAuthorityCanBeRevoked(manager, user);
        await disable(manager.withRepository(this.usersRepository));
      });
    } else {
      await disable(this.usersRepository);
    }

    // Clear cache to enforce immediately
    await this.cacheService.del(`users:${id}`);
    await this.cacheService.del('users:all');

    // Emit event
    this.eventEmitter.emit('user.deactivated', { userId: id, tenantId: activeTenantId });

    return this.findOne(id, activeTenantId);
  }

  async getStats(tenantId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    byRole: { role: string; count: number }[];
  }> {
    const activeTenantId = tenantId || this.tenantService.getTenantId();
    if (!activeTenantId) throw new BadRequestException('Tenant context required');

    const total = await this.usersRepository.count({ where: { tenantId: activeTenantId } as any });
    const active = await this.usersRepository.count({ where: { isActive: true, tenantId: activeTenantId } as any });
    const inactive = await this.usersRepository.count({ where: { isActive: false, tenantId: activeTenantId } as any });
    const verified = await this.usersRepository.count({ where: { emailVerified: true, tenantId: activeTenantId } as any });
    const unverified = await this.usersRepository.count({ where: { emailVerified: false, tenantId: activeTenantId } as any });

    // Get count by role
    const byRoleQuery = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.roleEntity', 'role')
      .where('user.tenantId = :tenantId', { tenantId: activeTenantId })
      .select('role.displayName', 'role')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('role.displayName')
      .getRawMany();

    const byRole = byRoleQuery.map(item => ({
      role: item.role || 'No Role',
      count: parseInt(item.count),
    }));

    return {
      total,
      active,
      inactive,
      verified,
      unverified,
      byRole,
    };
  }

  /**
   * Complete user profile after registration
   * This method handles automatic role assignment based on profile data:
   * - Customer role: if customerData is provided
   * - Student role: if studentData is provided
   * - Subscriber role: if newsletter preferences are enabled
   */
  async completeProfile(userId: string, completeProfileDto: CompleteProfileDto): Promise<User> {
    const user = await this.findOne(userId);

    // Update basic profile fields
    if (completeProfileDto.firstName) user.firstName = completeProfileDto.firstName;
    if (completeProfileDto.lastName) user.lastName = completeProfileDto.lastName;
    if (completeProfileDto.phone) user.phone = completeProfileDto.phone;

    // Update metadata
    if (!user.metadata) {
      user.metadata = {};
    }

    // Handle customer data and role assignment
    if (completeProfileDto.customerData &&
      (completeProfileDto.customerData.customerNumber || completeProfileDto.customerData.companyName)) {
      user.metadata.customerData = completeProfileDto.customerData;

      // Update direct customer fields for easier querying in frontend
      if (completeProfileDto.customerData.customerNumber) {
        user.customerNumber = completeProfileDto.customerData.customerNumber;
      }

      // CRITICAL FIX: Also save to flat metadata fields because frontend checks these
      user.metadata.customerNumber = completeProfileDto.customerData.customerNumber;
      user.metadata.companyName = completeProfileDto.customerData.companyName;
      user.metadata.taxNumber = completeProfileDto.customerData.taxNumber;
      user.metadata.companyPhone = completeProfileDto.customerData.companyPhone;
      user.metadata.companyAddress = completeProfileDto.customerData.companyAddress;
      user.metadata.companyCity = completeProfileDto.customerData.companyCity;

      // Assign Customer role
      await this.assignRoleByName(user, 'customer');
    }

    // Handle student data and role assignment
    if (completeProfileDto.studentData &&
      (completeProfileDto.studentData.schoolName || completeProfileDto.studentData.studentId)) {
      user.metadata.studentData = completeProfileDto.studentData;

      // Update direct student fields for easier querying
      if (completeProfileDto.studentData.schoolName) {
        user.schoolName = completeProfileDto.studentData.schoolName;
      }
      if (completeProfileDto.studentData.studentId) {
        user.studentId = completeProfileDto.studentData.studentId;
      }

      // CRITICAL FIX: Also save to flat metadata fields because frontend checks these
      user.metadata.schoolName = completeProfileDto.studentData.schoolName;
      user.metadata.studentId = completeProfileDto.studentData.studentId;

      // Assign Student role (if exists, otherwise log warning)
      await this.assignRoleByName(user, 'student');
    }

    // Handle newsletter preferences and subscriber role
    if (completeProfileDto.newsletterPreferences) {
      user.metadata.newsletterPreferences = completeProfileDto.newsletterPreferences;

      // If any newsletter option is enabled, assign Subscriber role
      const hasNewsletterSubscription = Object.values(completeProfileDto.newsletterPreferences).some(v => v === true);
      if (hasNewsletterSubscription) {
        // Update direct subscription flag
        user.isSubscribedToNewsletter = true;

        await this.assignRoleByName(user, 'subscriber');

        // NOTE: Email marketing integration planned - emit event for SubscriberService integration
        this.eventEmitter.emit('user.subscribed', { userId: user.id, email: user.email });
        console.log(`📧 User ${user.email} subscribed to newsletter - event emitted for email marketing.`);
      }
    }

    // Merge additional metadata
    if (completeProfileDto.metadata) {
      user.metadata = { ...user.metadata, ...completeProfileDto.metadata };
    }

    // Mark profile as completed
    user.metadata.profileCompleted = true;
    user.metadata.profileCompletedAt = new Date().toISOString();

    const updatedUser = await this.usersRepository.save(user);

    // Clear cache
    await this.cacheService.del(`users:${userId}`);
    await this.cacheService.del(`users:email:${user.email}`);
    await this.cacheService.del('users:all');

    return updatedUser;
  }

  /**
   * Assign a role to user by role name
   * CRITICAL: Uses UserRolesService to create proper user_roles junction table entries
   * This is required for roles to appear in user.roles array on login
   */
  private async assignRoleByName(user: User, roleName: string): Promise<void> {
    try {
      const roles = await this.rolesService.findAll(user.tenantId);
      const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());

      if (!role) {
        console.warn(`⚠️ Role "${roleName}" not found in database. Skipping role assignment.`);
        return;
      }

      // Check if user already has this role in user_roles table
      const existingUserRoles = await this.userRolesService.getUserRoles(user.id, user.tenantId);
      const hasRole = existingUserRoles.some(ur => ur.roleId === role.id);

      if (hasRole) {
        console.log(`ℹ️ User ${user.email} already has role "${roleName}" in user_roles`);
        return;
      }

      // CRITICAL: Use UserRolesService to create user_roles entry
      // This creates the many-to-many relationship in the junction table
      // Get current roles to preserve them
      const currentRoleIds = existingUserRoles
        .filter(ur => !ur.isPrimary) // Only additional roles
        .map(ur => ur.roleId);

      // Get primary role (if any)
      const primaryRole = existingUserRoles.find(ur => ur.isPrimary);
      const primaryRoleId = primaryRole?.roleId || user.roleId;

      if (!primaryRoleId) {
        console.error(`❌ User ${user.email} has no primary role. Cannot assign additional role.`);
        return;
      }

      // Add new role to additional roles
      const newAdditionalRoles = [...currentRoleIds, role.id];

      // Assign roles using UserRolesService
      await this.userRolesService.assignRoles(
        user.id,
        primaryRoleId,
        newAdditionalRoles,
        true, // Replace existing
        undefined, // No assignedBy for profile completion
        user.tenantId, // Ensure tenant isolation
      );

      console.log(`✅ Assigned role "${roleName}" to user ${user.email} via user_roles table`);
    } catch (error) {
      console.error(`❌ Error assigning role "${roleName}":`, error);
    }
  }

  /**
   * Invalidate all active tokens for a user
   * This forces the user to login again to get a new token
   * Used when: user role changes, password changes, security breach
   */
  async invalidateAllTokens(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    // Increment tokenVersion - this will invalidate all existing JWTs
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await this.usersRepository.save(user);

    // Clear user cache so next request gets updated tokenVersion
    await this.cacheService.del(`users:${userId}`);
    await this.cacheService.del(`users:email:${user.email}`);

    console.log(`🔒 All tokens invalidated for user ${user.email} (tokenVersion: ${user.tokenVersion})`);
  }
}
