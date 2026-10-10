import { QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Migration Helper Utilities
 * 
 * Provides idempotent migration operations that check for existence before creation.
 * This ensures migrations can be run multiple times safely without errors.
 * 
 * Usage:
 *   import { MigrationHelpers } from '../utils/migration-helpers';
 *   
 *   await MigrationHelpers.addColumnIfNotExists(queryRunner, 'users', new TableColumn({
 *     name: 'roleId',
 *     type: 'uuid',
 *     isNullable: true,
 *   }));
 */
export class MigrationHelpers {
  /**
   * Add column only if it doesn't exist
   * @returns true if column was added, false if it already existed
   */
  static async addColumnIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn
  ): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    const exists = table?.findColumnByName(column.name);

    if (!exists) {
      await queryRunner.addColumn(tableName, column);
      console.log(`✓ Added column ${column.name} to ${tableName}`);
      return true;
    } else {
      console.log(`⊘ Column ${column.name} already exists in ${tableName}, skipping`);
      return false;
    }
  }

  /**
   * Create table only if it doesn't exist
   * @returns true if table was created, false if it already existed
   */
  static async createTableIfNotExists(
    queryRunner: QueryRunner,
    table: Table,
    _ifNotExists?: boolean // Ignored, as we check existence manually
  ): Promise<boolean> {
    const exists = await queryRunner.hasTable(table.name);

    if (!exists) {
      await queryRunner.createTable(table, true);
      console.log(`✓ Created table ${table.name}`);
      return true;
    } else {
      console.log(`⊘ Table ${table.name} already exists, skipping`);
      return false;
    }
  }

  /**
   * Create foreign key only if it doesn't exist
   * @returns true if foreign key was created, false if it already existed
   */
  static async createForeignKeyIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    foreignKey: TableForeignKey
  ): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    const exists = table?.foreignKeys.find(
      fk => fk.columnNames.join(',') === foreignKey.columnNames.join(',') &&
        fk.referencedTableName === foreignKey.referencedTableName
    );

    if (!exists) {
      await queryRunner.createForeignKey(tableName, foreignKey);
      console.log(`✓ Created foreign key on ${tableName}(${foreignKey.columnNames.join(',')})`);
      return true;
    } else {
      console.log(`⊘ Foreign key already exists on ${tableName}, skipping`);
      return false;
    }
  }

  /**
   * Create index only if it doesn't exist
   * @returns true if index was created, false if it already existed
   */
  static async createIndexIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    index: TableIndex
  ): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    const exists = table?.indices.find(
      idx => idx.name === index.name ||
        idx.columnNames.join(',') === index.columnNames.join(',')
    );

    if (!exists) {
      await queryRunner.createIndex(tableName, index);
      console.log(`✓ Created index ${index.name || index.columnNames.join('_')} on ${tableName}`);
      return true;
    } else {
      console.log(`⊘ Index already exists on ${tableName}, skipping`);
      return false;
    }
  }

  /**
   * Execute query only if condition is met
   * @param checkQuery - Query that returns rows if condition is true
   * @param executeQuery - Query to execute if check passes
   * @param description - Description for logging
   * @returns true if query was executed, false if condition not met
   */
  static async executeConditional(
    queryRunner: QueryRunner,
    checkQuery: string,
    executeQuery: string,
    description: string
  ): Promise<boolean> {
    const result = await queryRunner.query(checkQuery);

    if (result.length === 0 || !result[0].exists) {
      await queryRunner.query(executeQuery);
      console.log(`✓ ${description}`);
      return true;
    } else {
      console.log(`⊘ ${description} - already done, skipping`);
      return false;
    }
  }

  /**
   * Drop column only if it exists
   * @returns true if column was dropped, false if it didn't exist
   */
  static async dropColumnIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    const exists = table?.findColumnByName(columnName);

    if (exists) {
      await queryRunner.dropColumn(tableName, columnName);
      console.log(`✓ Dropped column ${columnName} from ${tableName}`);
      return true;
    } else {
      console.log(`⊘ Column ${columnName} doesn't exist in ${tableName}, skipping`);
      return false;
    }
  }

  /**
   * Drop table only if it exists
   * @returns true if table was dropped, false if it didn't exist
   */
  static async dropTableIfExists(
    queryRunner: QueryRunner,
    tableName: string
  ): Promise<boolean> {
    const exists = await queryRunner.hasTable(tableName);

    if (exists) {
      await queryRunner.dropTable(tableName);
      console.log(`✓ Dropped table ${tableName}`);
      return true;
    } else {
      console.log(`⊘ Table ${tableName} doesn't exist, skipping`);
      return false;
    }
  }
}
