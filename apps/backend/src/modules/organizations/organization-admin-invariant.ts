import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

export const ORGANIZATION_ADMIN_ROLES = [
  'admin',
  'organization_owner',
  'organization_admin',
] as const;

export async function assertAdminAuthorityCanBeRevoked(
  manager: EntityManager,
  user: { id: string; tenantId: string; organizationId?: string | null; isActive?: boolean },
): Promise<void> {
  if (!user.organizationId || user.isActive === false) return;

  await manager.query(
    'SELECT id FROM organizations WHERE id=$1 AND slug=$2 FOR UPDATE',
    [user.organizationId, user.tenantId],
  );
  const [state] = await manager.query(
    `SELECT EXISTS(
       SELECT 1 FROM user_roles ur
       JOIN roles r ON r.id=ur."roleId" AND r.tenant_id=ur.tenant_id
       WHERE ur."userId"=$1 AND ur.tenant_id=$2 AND ur.deleted_at IS NULL
         AND r.deleted_at IS NULL AND r.is_active=true AND lower(btrim(r.name))=ANY($3::varchar[])
     ) AS is_admin,
     (SELECT count(DISTINCT u.id)::int FROM users u
       JOIN user_roles ur ON ur."userId"=u.id AND ur.tenant_id=u.tenant_id AND ur.deleted_at IS NULL
       JOIN roles r ON r.id=ur."roleId" AND r.tenant_id=ur.tenant_id
       WHERE u."organizationId"=$4 AND u.tenant_id=$2 AND u."isActive"=true AND u.deleted_at IS NULL
         AND r.deleted_at IS NULL AND r.is_active=true AND lower(btrim(r.name))=ANY($3::varchar[])
     ) AS admin_count`,
    [user.id, user.tenantId, ORGANIZATION_ADMIN_ROLES, user.organizationId],
  );

  if (state?.is_admin && Number(state.admin_count) <= 1) {
    throw new BadRequestException('The last active organization administrator cannot be removed');
  }
}

export async function assertAdminRoleCanBeRevoked(
  manager: EntityManager,
  role: { id: string; tenantId: string },
): Promise<void> {
  const organizations = await manager.query(
    'SELECT id FROM organizations WHERE slug=$1 AND "isActive"=true FOR UPDATE',
    [role.tenantId],
  );
  if (!organizations.length) {
    throw new BadRequestException('Active organization not found for role tenant');
  }

  const [state] = await manager.query(
    `SELECT EXISTS(
       SELECT 1 FROM users u
       JOIN user_roles ur ON ur."userId"=u.id AND ur.tenant_id=u.tenant_id
       WHERE ur."roleId"=$1 AND ur.tenant_id=$2 AND ur.deleted_at IS NULL
         AND u."isActive"=true AND u.deleted_at IS NULL
     ) AS affected_admins,
     (SELECT count(DISTINCT u.id)::int FROM users u
       JOIN user_roles ur ON ur."userId"=u.id AND ur.tenant_id=u.tenant_id AND ur.deleted_at IS NULL
       JOIN roles r ON r.id=ur."roleId" AND r.tenant_id=ur.tenant_id
       WHERE ur.tenant_id=$2 AND r.id<>$1 AND u."isActive"=true AND u.deleted_at IS NULL
         AND r.deleted_at IS NULL AND r.is_active=true AND lower(btrim(r.name))=ANY($3::varchar[])
     ) AS other_admin_count`,
    [role.id, role.tenantId, ORGANIZATION_ADMIN_ROLES],
  );

  if (state?.affected_admins && Number(state.other_admin_count) < 1) {
    throw new BadRequestException('The last active organization administrator role cannot be revoked');
  }
}
