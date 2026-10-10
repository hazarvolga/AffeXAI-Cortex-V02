import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Migration: Add Block Support to cms_components
 * Date: 2024-11-29
 * Description: Extends cms_components table to support prebuild blocks and reusable components
 * Related: CMS_REFACTORING_SPEC.md
 */
export class AddBlockSupportToComponents1732886400000 implements MigrationInterface {
  name = 'AddBlockSupportToComponents1732886400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================================
    // STEP 1: Add new columns
    // ============================================================================

    // Check if columns already exist (for idempotency)
    const table = await queryRunner.getTable('cms_components');
    const hasBlockType = table?.columns.find(col => col.name === 'block_type');

    if (!hasBlockType) {
      // Add block_type column
      await queryRunner.addColumn(
        'cms_components',
        new TableColumn({
          name: 'block_type',
          type: 'varchar',
          length: '100',
          isNullable: true,
          comment: 'Prebuild block type identifier (e.g., hero-centered-bg-image, features-icon-grid-three)',
        }),
      );

      // Add block_category column
      await queryRunner.addColumn(
        'cms_components',
        new TableColumn({
          name: 'block_category',
          type: 'varchar',
          length: '100',
          isNullable: true,
          comment: 'Block category for grouping (e.g., hero, features, testimonials, pricing)',
        }),
      );

      // Add block_id column
      await queryRunner.addColumn(
        'cms_components',
        new TableColumn({
          name: 'block_id',
          type: 'varchar',
          length: '100',
          isNullable: true,
          comment: 'Unique block identifier within template (e.g., hero, features, footer)',
        }),
      );

      // Add reusable_component_id column
      await queryRunner.addColumn(
        'cms_components',
        new TableColumn({
          name: 'reusable_component_id',
          type: 'uuid',
          isNullable: true,
          comment: 'Reference to reusable_components table if this component uses a reusable component',
        }),
      );

      console.log('✅ Added new columns to cms_components');
    } else {
      console.log('ℹ️  Columns already exist, skipping column creation');
    }

    // ============================================================================
    // STEP 2: Create indexes for performance
    // ============================================================================

    // Index on block_type
    await queryRunner.createIndex(
      'cms_components',
      new TableIndex({
        name: 'IDX_cms_components_block_type',
        columnNames: ['block_type'],
      }),
    );

    // Index on block_category
    await queryRunner.createIndex(
      'cms_components',
      new TableIndex({
        name: 'IDX_cms_components_block_category',
        columnNames: ['block_category'],
      }),
    );

    // Index on block_id
    await queryRunner.createIndex(
      'cms_components',
      new TableIndex({
        name: 'IDX_cms_components_block_id',
        columnNames: ['block_id'],
      }),
    );

    // Index on reusable_component_id
    await queryRunner.createIndex(
      'cms_components',
      new TableIndex({
        name: 'IDX_cms_components_reusable_component_id',
        columnNames: ['reusable_component_id'],
      }),
    );

    // Composite index for common queries (type + block_type)
    await queryRunner.createIndex(
      'cms_components',
      new TableIndex({
        name: 'IDX_cms_components_type_block_type',
        columnNames: ['type', 'block_type'],
        where: "type = 'block'",
      }),
    );

    console.log('✅ Created indexes on cms_components');

    // ============================================================================
    // STEP 3: Add foreign key constraint
    // ============================================================================

    // Check if reusable_components table exists
    const reusableComponentsTable = await queryRunner.getTable('reusable_components');
    
    if (reusableComponentsTable) {
      await queryRunner.createForeignKey(
        'cms_components',
        new TableForeignKey({
          name: 'FK_cms_components_reusable_component',
          columnNames: ['reusable_component_id'],
          referencedTableName: 'reusable_components',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
      console.log('✅ Created foreign key constraint');
    } else {
      console.log('⚠️  reusable_components table not found, skipping foreign key creation');
    }

    // ============================================================================
    // STEP 4: Migrate existing data
    // ============================================================================

    // Migrate blockType, blockCategory, and blockId from props to columns
    // Note: We migrate components that have EITHER blockType OR blockId
    await queryRunner.query(`
      UPDATE cms_components
      SET 
        block_type = props->>'blockType',
        block_category = props->>'blockCategory',
        block_id = props->>'blockId'
      WHERE 
        type = 'block' 
        AND (props ? 'blockType' OR props ? 'blockId')
        AND block_type IS NULL
    `);

    // Extract block_category from block_type if not present
    await queryRunner.query(`
      UPDATE cms_components
      SET block_category = SPLIT_PART(block_type, '-', 1)
      WHERE 
        block_type IS NOT NULL 
        AND block_category IS NULL
    `);

    console.log('✅ Migrated existing component data');

    // ============================================================================
    // STEP 5: Verify migration
    // ============================================================================

    const result = await queryRunner.query(`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'block') as total_blocks,
        COUNT(*) FILTER (WHERE type = 'block' AND block_type IS NOT NULL) as migrated_blocks,
        COUNT(*) FILTER (WHERE type = 'block' AND block_type IS NULL) as unmigrated_blocks
      FROM cms_components
    `);

    const stats = result[0];
    console.log('📊 Migration Statistics:');
    console.log(`   Total block components: ${stats.total_blocks}`);
    console.log(`   Migrated components: ${stats.migrated_blocks}`);
    console.log(`   Unmigrated components: ${stats.unmigrated_blocks}`);

    if (stats.unmigrated_blocks > 0) {
      console.log('⚠️  Some block components were not migrated. Manual review may be needed.');
    } else {
      console.log('✅ All block components successfully migrated!');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============================================================================
    // ROLLBACK: Restore data to props before dropping columns
    // ============================================================================

    // Restore blockType to props
    await queryRunner.query(`
      UPDATE cms_components
      SET props = jsonb_set(
        jsonb_set(
          jsonb_set(
            props,
            '{blockType}',
            to_jsonb(block_type)
          ),
          '{blockCategory}',
          to_jsonb(block_category)
        ),
        '{blockId}',
        to_jsonb(block_id)
      )
      WHERE block_type IS NOT NULL
    `);

    console.log('✅ Restored block data to props');

    // ============================================================================
    // ROLLBACK: Drop foreign key
    // ============================================================================

    const table = await queryRunner.getTable('cms_components');
    const foreignKey = table?.foreignKeys.find(
      fk => fk.name === 'FK_cms_components_reusable_component',
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('cms_components', foreignKey);
      console.log('✅ Dropped foreign key constraint');
    }

    // ============================================================================
    // ROLLBACK: Drop indexes
    // ============================================================================

    await queryRunner.dropIndex('cms_components', 'IDX_cms_components_type_block_type');
    await queryRunner.dropIndex('cms_components', 'IDX_cms_components_reusable_component_id');
    await queryRunner.dropIndex('cms_components', 'IDX_cms_components_block_id');
    await queryRunner.dropIndex('cms_components', 'IDX_cms_components_block_category');
    await queryRunner.dropIndex('cms_components', 'IDX_cms_components_block_type');

    console.log('✅ Dropped indexes');

    // ============================================================================
    // ROLLBACK: Drop columns
    // ============================================================================

    await queryRunner.dropColumn('cms_components', 'reusable_component_id');
    await queryRunner.dropColumn('cms_components', 'block_id');
    await queryRunner.dropColumn('cms_components', 'block_category');
    await queryRunner.dropColumn('cms_components', 'block_type');

    console.log('✅ Dropped columns from cms_components');
    console.log('✅ Migration rollback completed');
  }
}
