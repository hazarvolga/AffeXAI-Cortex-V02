import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Fix theme_settings to link Main Navigation menu
 *
 * Purpose: Ensure theme_settings has proper headerMenuId reference
 * This fixes the issue where production database didn't have menu linked
 *
 * Related Issue: Dynamic menu not loading on production (headerMenuId was null)
 */
export class FixThemeSettingsMenuRelation1732449600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. First, ensure Main Navigation menu exists
    const menuExists = await queryRunner.query(`
      SELECT id FROM cms_menus
      WHERE name = 'Main Navigation' AND location = 'header'
      LIMIT 1
    `);

    if (menuExists && menuExists.length > 0) {
      const menuId = menuExists[0].id;

      // 2. Update theme_settings to link this menu (if not already linked)
      // Note: headerMenuId is UUID type, so we can only check for NULL (not empty string)
      await queryRunner.query(`
        UPDATE theme_settings
        SET "headerMenuId" = $1, "updated_at" = NOW()
        WHERE "headerMenuId" IS NULL
      `, [menuId]);

      console.log(`✅ Migration: Linked theme_settings to Main Navigation menu (${menuId})`);
    } else {
      console.warn('⚠️  Migration: Main Navigation menu not found, skipping headerMenuId update');
      console.warn('   This is expected if CMS seed data hasn\'t been imported yet');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Set headerMenuId to null
    await queryRunner.query(`
      UPDATE theme_settings
      SET "headerMenuId" = NULL, "updated_at" = NOW()
    `);

    console.log('↩️  Migration rolled back: headerMenuId set to NULL');
  }
}
