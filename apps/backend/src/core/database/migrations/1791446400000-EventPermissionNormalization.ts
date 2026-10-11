import { MigrationInterface, QueryRunner } from "typeorm";

const PORTAL_EVENT_ROLE_NAMES = Object.freeze([
  "admin",
  "customer",
  "organization_owner",
  "student",
  "subscriber",
  "viewer",
]);

export class EventPermissionNormalization1791446400000
  implements MigrationInterface
{
  name = "EventPermissionNormalization1791446400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('LOCK TABLE "roles" IN ACCESS EXCLUSIVE MODE');

    const malformedPermissions = (await queryRunner.query(`
      SELECT id, name
      FROM roles
      WHERE deleted_at IS NULL
        AND jsonb_typeof(COALESCE(permissions, '[]'::jsonb)) IS DISTINCT FROM 'array'
      LIMIT 10
    `)) as Array<{ id: string; name: string }>;
    if (malformedPermissions.length > 0) {
      throw new Error(
        "Cannot normalize event permissions: malformed permission documents require resolution",
      );
    }

    await queryRunner.query(`
      WITH normalized AS (
        SELECT role.id,
          COALESCE(
            jsonb_agg(DISTINCT CASE
              WHEN permission.value = 'events.participants' THEN 'events.manage_attendees'
              ELSE permission.value
            END),
            '[]'::jsonb
          ) AS permissions
        FROM roles AS role
        CROSS JOIN LATERAL jsonb_array_elements_text(
          COALESCE(role.permissions, '[]'::jsonb)
        ) AS permission(value)
        WHERE role.deleted_at IS NULL
          AND role.permissions ? 'events.participants'
        GROUP BY role.id
      )
      UPDATE roles AS role
      SET permissions = normalized.permissions,
          updated_at = now()
      FROM normalized
      WHERE role.id = normalized.id
    `);

    await queryRunner.query(
      `
        UPDATE roles
        SET permissions = COALESCE(permissions, '[]'::jsonb) || '["events.view"]'::jsonb,
            updated_at = now()
        WHERE deleted_at IS NULL
          AND lower(btrim(name)) = ANY($1::text[])
          AND NOT (COALESCE(permissions, '[]'::jsonb) ? 'events.view')
      `,
      [PORTAL_EVENT_ROLE_NAMES],
    );
  }

  public async down(): Promise<void> {
    // This migration repairs authorization data. Reintroducing a legacy alias or
    // removing portal read access would break active users, so it is irreversible.
  }
}
