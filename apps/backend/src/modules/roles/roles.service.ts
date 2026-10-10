import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RoleTemplate } from './entities/role-template.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { TenantService } from '../../core/tenant/tenant.service';
import { assertTenantRoleDefinition, normalizeTenantRoleName } from './tenant-role-policy';
import {
  ORGANIZATION_ADMIN_ROLES,
  assertAdminRoleCanBeRevoked,
} from '../organizations/organization-admin-invariant';
import {
  TENANT_PERMISSION_CATALOG,
  getPermissionCategory,
} from '../../lib/permissions';

export interface PermissionResource {
  id: string;
  name: string;
  category: string;
  description: string;
}

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(RoleTemplate)
    private roleTemplateRepository: Repository<RoleTemplate>,
    private tenantService: TenantService,
  ) { }

  private getActiveTenantId(tenantId?: string): string {
    const id = tenantId || this.tenantService.getTenantId();
    if (!id) {
      throw new BadRequestException('Tenant context required');
    }
    return id;
  }

  async create(createRoleDto: CreateRoleDto, tenantId?: string): Promise<Role> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const normalizedRole = {
      ...createRoleDto,
      name: normalizeTenantRoleName(createRoleDto.name),
    };
    if (!normalizedRole.name) throw new BadRequestException('Role name cannot be blank');
    assertTenantRoleDefinition(normalizedRole);
    // Check if role name already exists in this tenant
    const existingRole = await this.rolesRepository.findOne({
      where: { name: normalizedRole.name, tenantId: activeTenantId },
    });

    if (existingRole) {
      throw new ConflictException(`Role with name "${normalizedRole.name}" already exists in this tenant`);
    }

    const role = this.rolesRepository.create({
      ...normalizedRole,
      tenantId: activeTenantId,
      isCustom: true, // Custom roles created by tenant
    });

    return await this.rolesRepository.save(role);
  }

  async findAll(tenantId?: string): Promise<Array<Role & { userCount: number }>> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const roles = await this.rolesRepository.find({
      where: { tenantId: activeTenantId },
      relations: ['template', 'userRoles', 'users'],
      order: {
        createdAt: 'DESC',
      },
    });
    return roles.map(role => {
      const { userRoles, users, ...publicRole } = role;
      const assignedUserIds = new Set([
        ...(userRoles || []).map(assignment => assignment.userId),
        ...(users || []).map(user => user.id),
      ]);
      return {
        ...publicRole,
        isSystem: !role.isCustom,
        userCount: assignedUserIds.size,
      } as Role & { userCount: number };
    });
  }

  getResources(): PermissionResource[] {
    return [...TENANT_PERMISSION_CATALOG]
      .sort()
      .map(id => ({
        id,
        name: id
          .split(/[.:_]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' '),
        category: getPermissionCategory(id) || 'Legacy',
        description: `${id} tenant izni`,
      }));
  }

  async findOne(id: string, tenantId?: string): Promise<Role> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const role = await this.rolesRepository.findOne({
      where: { id, tenantId: activeTenantId },
      relations: ['template'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found in this tenant`);
    }

    return role;
  }

  async findByName(name: string, tenantId?: string): Promise<Role | null> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    return await this.rolesRepository.findOne({
      where: { name: normalizeTenantRoleName(name), tenantId: activeTenantId },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, tenantId?: string): Promise<Role> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const normalizedUpdate = updateRoleDto.name === undefined
      ? { ...updateRoleDto }
      : { ...updateRoleDto, name: normalizeTenantRoleName(updateRoleDto.name) };
    if (normalizedUpdate.name === '') throw new BadRequestException('Role name cannot be blank');
    return this.rolesRepository.manager.transaction(async manager => {
      const repository = manager.withRepository(this.rolesRepository);
      const role = await repository.findOne({
        where: { id, tenantId: activeTenantId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) {
        throw new NotFoundException(`Role with ID "${id}" not found in this tenant`);
      }

      assertTenantRoleDefinition(role);
      assertTenantRoleDefinition(normalizedUpdate);
      if (!role.isCustom && normalizedUpdate.name && normalizedUpdate.name !== role.name) {
        throw new BadRequestException('Cannot change name of template-based roles');
      }

      const isAdminRole = role.isActive !== false
        && ORGANIZATION_ADMIN_ROLES.includes(role.name as typeof ORGANIZATION_ADMIN_ROLES[number]);
      const nextName = normalizedUpdate.name ?? role.name;
      const remainsAdminRole = normalizedUpdate.isActive !== false
        && ORGANIZATION_ADMIN_ROLES.includes(nextName as typeof ORGANIZATION_ADMIN_ROLES[number]);
      if (isAdminRole && !remainsAdminRole) {
        await assertAdminRoleCanBeRevoked(manager, role);
      }

      if (normalizedUpdate.name && normalizedUpdate.name !== role.name) {
        const existingRole = await repository.findOne({
          where: { name: normalizedUpdate.name, tenantId: activeTenantId },
        });
        if (existingRole) {
          throw new ConflictException(`Role with name "${normalizedUpdate.name}" already exists in this tenant`);
        }
      }

      return repository.save({ ...role, ...normalizedUpdate });
    });
  }

  async remove(id: string, tenantId?: string): Promise<void> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    await this.rolesRepository.manager.transaction(async manager => {
      const repository = manager.withRepository(this.rolesRepository);
      const role = await repository.findOne({
        where: { id, tenantId: activeTenantId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) {
        throw new NotFoundException(`Role with ID "${id}" not found in this tenant`);
      }

      assertTenantRoleDefinition(role);
      if (!role.isCustom) {
        throw new BadRequestException('Cannot delete template-based roles');
      }
      const [assignmentState] = await manager.query(
        `SELECT count(DISTINCT assigned.user_id)::int AS assignment_count
           FROM (
             SELECT ur."userId" AS user_id
               FROM user_roles ur
              WHERE ur."roleId"=$1 AND ur.tenant_id=$2 AND ur.deleted_at IS NULL
             UNION
             SELECT u.id AS user_id
               FROM users u
              WHERE u."roleId"=$1 AND u.tenant_id=$2 AND u.deleted_at IS NULL
           ) assigned`,
        [role.id, activeTenantId],
      );
      const assignmentCount = Number(assignmentState?.assignment_count || 0);
      if (assignmentCount > 0) {
        throw new BadRequestException(
          `Cannot delete role "${role.displayName}" because it has ${assignmentCount} assigned user(s)`,
        );
      }

      await repository.softRemove(role);
    });
  }

  async getPermissions(id: string, tenantId?: string): Promise<string[]> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const role = await this.findOne(id, activeTenantId);
    return role.permissions || [];
  }

  async updatePermissions(id: string, permissions: string[], tenantId?: string): Promise<Role> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    return this.update(id, { permissions }, activeTenantId);
  }

  async getUserCount(id: string, tenantId?: string): Promise<number> {
    const activeTenantId = this.getActiveTenantId(tenantId);
    const [state] = await this.rolesRepository.manager.query(
      `SELECT count(DISTINCT assigned.user_id)::int AS assignment_count
         FROM (
           SELECT ur."userId" AS user_id
             FROM user_roles ur
            WHERE ur."roleId"=$1 AND ur.tenant_id=$2 AND ur.deleted_at IS NULL
           UNION
           SELECT u.id AS user_id
             FROM users u
            WHERE u."roleId"=$1 AND u.tenant_id=$2 AND u.deleted_at IS NULL
         ) assigned`,
      [id, activeTenantId],
    );
    return Number(state?.assignment_count || 0);
  }

  /**
   * Find multiple roles by their IDs within a tenant
   * NEW: Added for multi-role support
   */
  async findByIds(ids: string[], tenantId: string): Promise<Role[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    return this.rolesRepository.find({
      where: ids.map(id => ({ id, tenantId })),
    });
  }
}
