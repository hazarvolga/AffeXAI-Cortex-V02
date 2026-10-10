import { DataSource } from "typeorm";
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from correct path relative to script location (apps/backend/scripts -> apps/backend/.env)
dotenv.config({ path: path.join(__dirname, '../.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'affexai_dev',
    synchronize: false,
    logging: true,
    entities: [],
    migrations: [],
    subscribers: [],
});

async function run() {
    try {
        console.log('Connecting to database...');
        await dataSource.initialize();
        const queryRunner = dataSource.createQueryRunner();
        console.log('Connected. Running manual fix...');

        // 1. Social Accounts Provider Enum & Table
        console.log('Step 1: Social Accounts...');
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."social_accounts_provider_enum" AS ENUM('twitter', 'linkedin', 'facebook', 'instagram');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "social_accounts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "tenant_id" character varying, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "deleted_at" TIMESTAMP, 
                "userId" uuid NOT NULL, 
                "provider" "public"."social_accounts_provider_enum" NOT NULL, 
                "providerAccountId" text NOT NULL, 
                "username" text, 
                "tokenDek" text, 
                "accessToken" text NOT NULL, 
                "refreshToken" text, 
                "refreshTokenDek" text, 
                "tokenExpiresAt" TIMESTAMP, 
                "profileData" jsonb NOT NULL DEFAULT '{}', 
                "isActive" boolean NOT NULL DEFAULT true, 
                CONSTRAINT "PK_e9e58d2d8e9fafa20af914d9750" PRIMARY KEY ("id")
            )
        `);

        // 2. Social Posts Status Enum & Table
        console.log('Step 2: Social Posts...');
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."social_posts_status_enum" AS ENUM('draft', 'pending', 'scheduled', 'published', 'failed');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "social_posts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "tenant_id" character varying, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "deleted_at" TIMESTAMP, 
                "userId" uuid NOT NULL, 
                "accountId" uuid NOT NULL, 
                "content" text NOT NULL, 
                "mediaUrls" text array NOT NULL DEFAULT '{}', 
                "scheduledAt" TIMESTAMP, 
                "publishedAt" TIMESTAMP, 
                "status" "public"."social_posts_status_enum" NOT NULL DEFAULT 'draft', 
                "platformPostId" text, 
                "analytics" jsonb, 
                "errorMessage" text, 
                CONSTRAINT "PK_2161864ea79f14525b8804bd7ff" PRIMARY KEY ("id")
            )
        `);

        // 3. FKs (Safe)
        console.log('Step 3: Foreign Keys...');
        try {
            await queryRunner.query(`ALTER TABLE "social_posts" ADD CONSTRAINT "FK_0437a58152209125b4edf53ed7a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
            console.log('FK_users added.');
        } catch (e: any) { console.log('FK_users note:', e.message); }

        try {
            await queryRunner.query(`ALTER TABLE "social_posts" ADD CONSTRAINT "FK_d853ba01d7e62d4621dc1c60bb0" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
            console.log('FK_social_accounts added.');
        } catch (e: any) {
            console.log('FK_social_accounts note:', e.message);
        }

        console.log('✅ Fix applied successfully!');
        await dataSource.destroy();
    } catch (error) {
        console.error('❌ Error running fix:', error);
        process.exit(1);
    }
}

run();
