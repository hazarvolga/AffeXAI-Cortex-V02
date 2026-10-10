import { MigrationInterface, QueryRunner } from "typeorm";

// Historical migrations must not change when the runtime permission catalog grows.
const TENANT_PERMISSION_SNAPSHOT = Object.freeze([
  "agent:manage",
  "analytics:read",
  "assignment:grade",
  "assignment:submit",
  "attendee:manage",
  "budget:manage",
  "campaign:create",
  "campaign:manage",
  "certificate:issue",
  "certificate:manage",
  "certificate:read",
  "certificates.create",
  "certificates.edit",
  "certificates.revoke",
  "certificates.update",
  "certificates.view",
  "cms.create",
  "cms.delete",
  "cms.edit",
  "cms.manage_menus",
  "cms.menus.manage",
  "cms.pages.create",
  "cms.pages.delete",
  "cms.pages.edit",
  "cms.pages.update",
  "cms.pages.view",
  "cms.read",
  "cms.view",
  "cms.write",
  "course:manage",
  "course:read",
  "courses.view",
  "email:send",
  "event:create",
  "event:manage",
  "events.create",
  "events.delete",
  "events.edit",
  "events.manage_attendees",
  "events.participants",
  "events.update",
  "events.view",
  "marketing.campaigns",
  "marketing.manage",
  "marketing.manage_campaigns",
  "marketing.manage_newsletters",
  "marketing.manage_social",
  "marketing.receive",
  "newsletter.view",
  "order:read",
  "profile:manage",
  "report:read",
  "roles.manage",
  "roles.view",
  "settings.manage",
  "social:post",
  "student:read",
  "support.assign",
  "support.reply",
  "support.respond",
  "support.view",
  "support.view_all",
  "system.logs",
  "system.settings",
  "ticket:manage",
  "ticket:read",
  "ticket:reply",
  "users.create",
  "users.delete",
  "users.update",
  "users.view",
]);

export class TenantAdminPermissions1791417600000
  implements MigrationInterface
{
  name = "TenantAdminPermissions1791417600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('LOCK TABLE "roles" IN ACCESS EXCLUSIVE MODE');

    const malformedPermissions = await queryRunner.query(`
      SELECT id, name
      FROM roles
      WHERE deleted_at IS NULL
        AND jsonb_typeof(COALESCE(permissions, '[]'::jsonb)) IS DISTINCT FROM 'array'
      LIMIT 10
    `);
    if (malformedPermissions.length > 0) {
      throw new Error(
        "Cannot normalize tenant administrator permissions: malformed permission documents require resolution",
      );
    }

    const unknownPrivilegedRoles = await queryRunner.query(`
      SELECT id, name
      FROM roles
      WHERE deleted_at IS NULL
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(COALESCE(permissions, '[]'::jsonb)) AS permission(value)
          WHERE lower(btrim(permission.value)) IN ('*', 'system.admin')
        )
        AND (
          tenant_id IS NULL
          OR lower(btrim(name)) IS DISTINCT FROM 'organization_owner'
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(COALESCE(permissions, '[]'::jsonb)) AS platform_permission(value)
            WHERE lower(btrim(platform_permission.value)) = 'system.admin'
          )
        )
      LIMIT 10
    `);
    if (unknownPrivilegedRoles.length > 0) {
      throw new Error(
        "Cannot normalize tenant administrator permissions: unknown privileged tenant roles require resolution",
      );
    }

    const invalidOwnerPermissions = await queryRunner.query(
      `
        SELECT DISTINCT role.id, role.name, permission.value
        FROM roles AS role
        CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(role.permissions, '[]'::jsonb)) AS permission(value)
        WHERE role.deleted_at IS NULL
          AND role.tenant_id IS NOT NULL
          AND lower(btrim(role.name)) = 'organization_owner'
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(COALESCE(role.permissions, '[]'::jsonb)) AS wildcard_permission(value)
            WHERE lower(btrim(wildcard_permission.value)) = '*'
          )
          AND lower(btrim(permission.value)) <> '*'
          AND NOT (permission.value = ANY($1::text[]))
        LIMIT 10
      `,
      [TENANT_PERMISSION_SNAPSHOT],
    );
    if (invalidOwnerPermissions.length > 0) {
      throw new Error(
        "Cannot normalize tenant administrator permissions: unknown explicit permissions require resolution",
      );
    }

    await queryRunner.query(
      `
        UPDATE roles
        SET permissions = $1::jsonb,
            updated_at = now()
        WHERE deleted_at IS NULL
          AND tenant_id IS NOT NULL
          AND lower(btrim(name)) = 'organization_owner'
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(COALESCE(permissions, '[]'::jsonb)) AS wildcard_permission(value)
            WHERE lower(btrim(wildcard_permission.value)) = '*'
          )
      `,
      [JSON.stringify(TENANT_PERMISSION_SNAPSHOT)],
    );
  }

  public async down(): Promise<void> {
    // The former wildcard granted ambiguous platform-level authority. Restoring it
    // would weaken authorization, so this data normalization is intentionally kept.
  }
}
