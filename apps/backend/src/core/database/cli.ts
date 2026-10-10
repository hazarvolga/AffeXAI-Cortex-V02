import AppDataSource from './data-source';

async function runMigrations() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Check existing migrations
    console.log('📋 Checking migration status...');
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      const executedMigrations = await queryRunner.query(
        'SELECT * FROM migrations ORDER BY timestamp DESC'
      );
      console.log(`📊 Found ${executedMigrations.length} executed migrations in database`);
      if (executedMigrations.length > 0) {
        console.log('   Latest migrations:');
        executedMigrations.slice(0, 5).forEach((m: any) => {
          console.log(`   - ${m.name} (${new Date(Number(m.timestamp)).toISOString()})`);
        });
      }
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log('⚠️  Migrations table does not exist yet - this is normal for first run');
      } else {
        console.warn('⚠️  Could not check existing migrations:', error.message);
      }
    } finally {
      await queryRunner.release();
    }

    console.log('🚀 Running pending migrations...');
    const migrations = await AppDataSource.runMigrations({ transaction: 'all' });

    if (migrations.length === 0) {
      console.log('✅ No pending migrations to run');
    } else {
      console.log(`✅ Successfully executed ${migrations.length} migration(s):`);
      migrations.forEach(migration => {
        console.log(`   - ${migration.name}`);
      });
    }

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await AppDataSource.destroy().catch(() => { });
    process.exit(1);
  }
}

runMigrations();
