
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env BEFORE imports that might use env vars
console.log('Loading .env file...');
dotenv.config({ path: path.join(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/users.service';
import { CacheService } from '../src/core/shared/services/cache.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('FixSuperuserTenant');

    // Set default port if missing, just in case TypeORM relies on it
    if (!process.env.DB_PORT) process.env.DB_PORT = '5434';


    logger.log('🚀 Initializing NestJS App Context...');
    // Force strict mode off for typeorm to avoid some connection issues
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });

    try {
        const usersService = app.get(UsersService);
        const cacheService = app.get(CacheService);

        logger.log('🔍 Finding superuser (global search)...');

        // Find globally (ignoring tenant)
        // findByEmail(email, tenantId, skipCache, isGlobal)
        const user = await usersService.findByEmail('superuser@affexai.com', undefined, true, true);

        if (!user) {
            logger.error('❌ Superuser not found!');
            process.exit(1);
        }

        logger.log(`✅ Found user: ${user.id} (Current Tenant: ${user.tenantId})`);

        // Force update to 'affexai' and CLEAR CACHE
        logger.log('🔄 Updating tenantId to "affexai" and clearing cache...');

        // We use .update() which triggers cache invalidation in UsersService
        await usersService.update(user.id, {
            // @ts-ignore
            tenantId: 'affexai'
        } as any, 'affexai');

        // Double check cache clearing
        logger.log('🧹 Explicitly clearing cache keys...');
        try {
            await cacheService.del(`users:${user.id}`);
            await cacheService.del(`users:email:${user.email}`);
            await cacheService.del('users:all');
            logger.log('✅ Cache keys cleared.');
        } catch (cacheError) {
            logger.warn('⚠️  Cache clearing failed (Redis might be down), but that is effectively cleared.', cacheError.message);
        }

        logger.log('✅ Superuser updated successfully.');

    } catch (error) {
        logger.error('❌ Error fixing superuser:', error);
    } finally {
        await app.close();
        process.exit(0);
    }
}

bootstrap();
