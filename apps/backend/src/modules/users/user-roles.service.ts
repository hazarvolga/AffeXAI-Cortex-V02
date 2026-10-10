import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from './entities/user-role.entity';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { RolesService } from '../roles/roles.service';
import { assertTenantRoleDefinition, assertPlatformAccountMutation, VerifiedPlatformActor } from '../roles/tenant-role-policy';
import { assertAdminAuthorityCanBeRevoked, ORGANIZATION_ADMIN_ROLES } from '../organizations/organization-admin-invariant';

/**
 * UserRolesService
 *
 * Handles multi-role assignment and management for users.
 * Supports primary role designation and audit trail.
 */
@Injectable()
export class UserRolesService {
  constructor(
    @InjectRepository(UserRole)
    private userRolesRepository: Repository<UserRole>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private rolesService: RolesService,
  ) { }

  /**
   * Assign roles to a user
   * @param userId User ID
   * @param primaryRoleId Primary role ID
   * @param additionalRoleIds Additional role IDs (optional)
   * @param replaceExisting Replace all existing roles (default: true)
   * @param assignedBy User ID who is assigning roles (for audit trail)
   */
  async assignRoles(userId: string, primaryRoleId: string, additionalRoleIds: string[] = [], replaceExisting = true, assignedBy?: string, tenantId?: string, actor?: VerifiedPlatformActor): Promise<UserRole[]> {
    assertPlatformAccountMutation(userId, actor);
    if (!tenantId) throw new BadRequestException('Tenant context required for role assignment');
    return this.userRolesRepository.manager.transaction(async manager => {
      const service = new UserRolesService(manager.withRepository(this.userRolesRepository), manager.withRepository(this.usersRepository), this.rolesService);
      return service.assignRolesInTransaction(userId, primaryRoleId, additionalRoleIds, replaceExisting, assignedBy, tenantId, actor);
    });
  }

  private async assignRolesInTransaction(
    userId: string,
    primaryRoleId: string,
    additionalRoleIds: string[] = [],
    replaceExisting: boolean = true,
    assignedBy?: string,
    tenantId?: string,
    actor?: VerifiedPlatformActor,
  ): Promise<UserRole[]> {
    assertPlatformAccountMutation(userId, actor);
    console.log(`🔄 Assigning roles to user ${userId}:`, {
      primaryRoleId,
      additionalRoleIds,
      replaceExisting,
      assignedBy,
    });

    if (!tenantId) {
      throw new BadRequestException('Tenant context required for role assignment');
    }
    await this.userRolesRepository.manager.query(
      `SELECT id FROM users
        WHERE id=$1 AND tenant_id=$2 AND deleted_at IS NULL
        FOR UPDATE`,
      [userId, tenantId],
    );
    const user = await this.usersRepository.findOne({ where: { id: userId, tenantId } });
    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('User not found in this tenant');
    }
    const resolvedTenantId = tenantId;

    // Validate all role IDs exist
    const distinctAdditionalRoleIds = [...new Set(additionalRoleIds)]
      .filter(roleId => roleId !== primaryRoleId);
    const allRoleIds = [primaryRoleId, ...distinctAdditionalRoleIds];
    await this.userRolesRepository.manager.query(
      `SELECT id
         FROM roles
        WHERE tenant_id = $1
          AND id = ANY($2::uuid[])
        ORDER BY id
        FOR KEY SHARE`,
      [resolvedTenantId, [...allRoleIds].sort()],
    );
    const roles = await this.rolesService.findByIds(allRoleIds, resolvedTenantId);

    if (roles.length !== allRoleIds.length) {
      const foundIds = roles.map(r => r.id);
      const missingIds = allRoleIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Roles not found: ${missingIds.join(', ')}`);
    }

    for (const role of roles) {
      if (role.tenantId !== resolvedTenantId) throw new NotFoundException('Role not found in this tenant');
      assertTenantRoleDefinition(role);
      if (role.isActive === false) throw new BadRequestException('Inactive roles cannot be assigned');
    }

    // Validate primary role exists in the list
    if (!roles.find(r => r.id === primaryRoleId)) {
      throw new BadRequestException(`Primary role "${primaryRoleId}" not found`);
    }

    const replacementRetainsAdmin = roles.some(role => role.isActive !== false &&
      ORGANIZATION_ADMIN_ROLES.includes(role.name as typeof ORGANIZATION_ADMIN_ROLES[number]),
    );
    if (replaceExisting && !replacementRetainsAdmin) {
      await assertAdminAuthorityCanBeRevoked(this.userRolesRepository.manager, user);
    }

    // Remove existing roles if replaceExisting is true
    if (replaceExisting) {
      await this.userRolesRepository.delete({ userId, tenantId } as any);
      console.log(`🗑️  Removed existing roles for user ${userId}`);
    } else {
      await this.userRolesRepository.update(
        { userId, tenantId, isPrimary: true } as any,
        { isPrimary: false },
      );
      await this.userRolesRepository.delete({
        userId,
        tenantId,
        roleId: In(allRoleIds),
      } as any);
    }

    // Prepare user roles
    const userRolesToCreate: Partial<UserRole>[] = [];

    // Add primary role
    userRolesToCreate.push({
      userId,
      roleId: primaryRoleId,
      isPrimary: true,
      assignedBy,
      tenantId,
    });

    // Add additional roles
    for (const roleId of distinctAdditionalRoleIds) {
      userRolesToCreate.push({
        userId,
        roleId,
        isPrimary: false,
        assignedBy,
        tenantId,
      });
    }

    // Save all user roles
    const savedUserRoles = await this.userRolesRepository.save(userRolesToCreate);

    // Update legacy roleId field for backward compatibility
    // AND increment tokenVersion to invalidate old JWT tokens
    await this.usersRepository.update({ id: userId, tenantId }, {
      roleId: primaryRoleId,
      tokenVersion: () => '"tokenVersion" + 1'
    });

    console.log(`✅ Assigned ${savedUserRoles.length} role(s) to user ${userId}, tokenVersion incremented`);

    return savedUserRoles;
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string, tenantId?: string): Promise<UserRole[]> {
    if (!tenantId) throw new BadRequestException('Tenant context required for role lookup');
    return this.userRolesRepository.find({
      where: { userId, tenantId } as any,
      relations: ['role'],
      order: { isPrimary: 'DESC', assignedAt: 'ASC' },
    });
  }

  /**
   * Get primary role for a user
   */
  async getPrimaryRole(userId: string, tenantId?: string): Promise<UserRole | null> {
    if (!tenantId) throw new BadRequestException('Tenant context required for role lookup');
    return this.userRolesRepository.findOne({
      where: { userId, isPrimary: true, tenantId } as any,
      relations: ['role'],
    });
  }

  /**
   * Remove a specific role from a user
   */
  async removeRole(userId: string, roleId: string, tenantId?: string, actor?: VerifiedPlatformActor): Promise<void> {
    assertPlatformAccountMutation(userId, actor);
    if (!tenantId) throw new BadRequestException('Tenant context required for role removal');
    await this.userRolesRepository.manager.transaction(async manager => {
      const service = new UserRolesService(manager.withRepository(this.userRolesRepository), manager.withRepository(this.usersRepository), this.rolesService);
      await service.removeRoleInTransaction(userId, roleId, tenantId, actor);
    });
  }

  private async removeRoleInTransaction(userId: string, roleId: string, tenantId: string, actor?: VerifiedPlatformActor): Promise<void> {
    assertPlatformAccountMutation(userId, actor);
    if (!tenantId) throw new BadRequestException('Tenant context required for role removal');
    await this.userRolesRepository.manager.query(
      `SELECT id FROM users
        WHERE id=$1 AND tenant_id=$2 AND deleted_at IS NULL
        FOR UPDATE`,
      [userId, tenantId],
    );
    const user = await this.usersRepository.findOne({ where: { id: userId, tenantId } });
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('User not found in this tenant');
    await this.userRolesRepository.manager.query(
      `SELECT id FROM roles
        WHERE id=$1 AND tenant_id=$2 AND deleted_at IS NULL
        FOR KEY SHARE`,
      [roleId, tenantId],
    );
    const role = await this.rolesService.findOne(roleId, tenantId);
    if (role.tenantId !== tenantId) throw new NotFoundException('Role not found in this tenant');
    assertTenantRoleDefinition(role);
    const userRole = await this.userRolesRepository.findOne({
      where: { userId, roleId, tenantId } as any,
    });

    if (!userRole || userRole.tenantId !== tenantId) {
      throw new NotFoundException(`Role assignment not found`);
    }

    if (userRole.isPrimary) {
      throw new BadRequestException('Cannot remove primary role. Assign a new primary role first.');
    }

    if (ORGANIZATION_ADMIN_ROLES.includes(role.name as typeof ORGANIZATION_ADMIN_ROLES[number])) {
      const assignments = await this.userRolesRepository.find({
        where: { userId, tenantId } as any,
        relations: ['role'],
      });
      const retainsAdmin = assignments.some(assignment =>
        assignment.roleId !== roleId &&
        assignment.role?.isActive !== false &&
        ORGANIZATION_ADMIN_ROLES.includes(assignment.role?.name as typeof ORGANIZATION_ADMIN_ROLES[number]),
      );
      if (!retainsAdmin) {
        await assertAdminAuthorityCanBeRevoked(this.userRolesRepository.manager, user);
      }
    }

    const deleteResult = await this.userRolesRepository.delete({ id: userRole.id, tenantId });
    if (deleteResult.affected !== 1) {
      throw new NotFoundException('Role assignment changed before it could be removed');
    }

    // Increment tokenVersion to invalidate old JWT tokens
    await this.usersRepository.update({ id: userId, tenantId }, {
      tokenVersion: () => '"tokenVersion" + 1'
    });

    console.log(`✅ Removed role ${roleId} from user ${userId}, tokenVersion incremented`);
  }

  /**
   * Check if user has a specific role
   */
  async userHasRole(userId: string, roleName: string, tenantId?: string): Promise<boolean> {
    if (!tenantId) throw new BadRequestException('Tenant context required for role lookup');
    const count = await this.userRolesRepository
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'role')
      .where('ur.userId = :userId', { userId })
      .andWhere('ur.tenantId = :tenantId', { tenantId })
      .andWhere('role.tenantId = :tenantId', { tenantId })
      .andWhere('role.isActive = true')
      .andWhere('role.name = :roleName', { roleName })
      .getCount();

    return count > 0;
  }

  /**
   * Check if user has any of the specified roles
   */
  async userHasAnyRole(userId: string, roleNames: string[], tenantId?: string): Promise<boolean> {
    if (!tenantId) throw new BadRequestException('Tenant context required for role lookup');
    const count = await this.userRolesRepository
      .createQueryBuilder('ur')
      .innerJoin('ur.role', 'role')
      .where('ur.userId = :userId', { userId })
      .andWhere('ur.tenantId = :tenantId', { tenantId })
      .andWhere('role.tenantId = :tenantId', { tenantId })
      .andWhere('role.isActive = true')
      .andWhere('role.name IN (:...roleNames)', { roleNames })
      .getCount();

    return count > 0;
  }

  /**
   * Get all users with a specific role
   */
  async getUsersByRole(roleId: string, tenantId?: string): Promise<User[]> {
    if (!tenantId) throw new BadRequestException('Tenant context required for role lookup');
    const where = { roleId, tenantId };

    const userRoles = await this.userRolesRepository.find({
      where,
      relations: ['user'],
    });

    return userRoles.map(ur => ur.user);
  }

  /**
   * Count users with a specific role
   */
  async countUsersByRole(roleId: string, tenantId?: string): Promise<number> {
    if (!tenantId) throw new BadRequestException('Tenant context required for role lookup');
    const where = { roleId, tenantId };

    return this.userRolesRepository.count({
      where,
    });
  }
}
