import { MigrationInterface, QueryRunner } from "typeorm";

const ENUMS: ReadonlyArray<readonly [string, string]> = [
  [
    "social_accounts_provider_enum",
    "'twitter', 'linkedin', 'facebook', 'instagram'",
  ],
  [
    "social_posts_status_enum",
    "'draft', 'pending', 'scheduled', 'published', 'failed'",
  ],
  [
    "email_validation_jobs_status_enum",
    "'queued', 'processing', 'completed', 'failed'",
  ],
  ["ai_usage_logs_provider_enum", "'openai', 'anthropic', 'gemini', 'local'"],
  [
    "token_usage_provider_enum",
    "'openai', 'anthropic', 'google', 'deepseek', 'openrouter', 'local'",
  ],
  [
    "token_usage_model_enum",
    "'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash', 'deepseek-chat', 'deepseek-coder', 'deepseek-reasoner', 'openai/gpt-4', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.1-70b-instruct', 'llama3.1', 'mistral', 'codellama'",
  ],
];

// Columns every BaseEntity subclass carries.
const BASE = `"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" character varying,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP`;

// Creation order respects foreign keys; down() walks it backwards.
const TABLES: ReadonlyArray<readonly [string, string]> = [
  [
    "social_accounts",
    `${BASE},
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
  "isActive" boolean NOT NULL DEFAULT true`,
  ],
  [
    "social_posts",
    `${BASE},
  "userId" uuid NOT NULL,
  "accountId" uuid NOT NULL,
  "content" text NOT NULL,
  "mediaUrls" text array NOT NULL DEFAULT '{}',
  "scheduledAt" TIMESTAMP,
  "publishedAt" TIMESTAMP,
  "status" "public"."social_posts_status_enum" NOT NULL DEFAULT 'draft',
  "platformPostId" text,
  "analytics" jsonb,
  "errorMessage" text`,
  ],
  [
    "post_analytics",
    `${BASE},
  "postId" uuid NOT NULL,
  "likes" integer NOT NULL DEFAULT 0,
  "shares" integer NOT NULL DEFAULT 0,
  "impressions" integer NOT NULL DEFAULT 0,
  "comments" integer NOT NULL DEFAULT 0,
  "clicks" integer NOT NULL DEFAULT 0,
  "engagementRate" double precision NOT NULL DEFAULT 0,
  "snapshotAt" TIMESTAMP NOT NULL`,
  ],
  [
    "social_post_feedback",
    `"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "postId" uuid NOT NULL,
  "externalId" character varying NOT NULL,
  "content" text NOT NULL,
  "authorName" character varying NOT NULL,
  "authorId" character varying,
  "sentimentScore" integer,
  "sentimentLabel" character varying,
  "platform" character varying NOT NULL,
  "tenantId" character varying NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
  ],
  [
    "email_validation_jobs",
    `"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "type" character varying(50) NOT NULL,
  "targetId" character varying,
  "tenantId" character varying,
  "status" "public"."email_validation_jobs_status_enum" NOT NULL DEFAULT 'queued',
  "totalRecords" integer NOT NULL DEFAULT 0,
  "processedRecords" integer NOT NULL DEFAULT 0,
  "stats" jsonb NOT NULL DEFAULT '{}',
  "threatTopology" jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
  ],
  // The entity maps both the camelCase id columns and the snake_case relation
  // join columns; the table mirrors it until the entity is cleaned up.
  [
    "theme_settings",
    `"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" character varying(128) NOT NULL,
  "name" character varying(100),
  "headerConfig" jsonb NOT NULL DEFAULT '{}',
  "headerMenuId" uuid,
  "footerConfig" jsonb NOT NULL DEFAULT '{}',
  "isActive" boolean NOT NULL DEFAULT false,
  "createdById" integer,
  "updatedById" integer,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "header_menu_id" uuid,
  "created_by" uuid,
  "updated_by" uuid`,
  ],
  [
    "ai_usage_logs",
    `"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "provider" "public"."ai_usage_logs_provider_enum" NOT NULL DEFAULT 'openai',
  "model" character varying NOT NULL,
  "tokens_input" integer NOT NULL DEFAULT 0,
  "tokens_output" integer NOT NULL DEFAULT 0,
  "total_tokens" integer NOT NULL DEFAULT 0,
  "cost" numeric(10,6) NOT NULL DEFAULT 0,
  "user_id" uuid,
  "session_id" uuid,
  "context_type" character varying NOT NULL DEFAULT 'chat',
  "response_time_ms" integer NOT NULL DEFAULT 0,
  "metadata" jsonb,
  "tenant_id" character varying(128) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
  ],
  [
    "token_usage",
    `${BASE},
  "provider" "public"."token_usage_provider_enum" NOT NULL,
  "model" "public"."token_usage_model_enum" NOT NULL,
  "tokens_used" integer NOT NULL,
  "cost_estimated" numeric(10,4) NOT NULL DEFAULT 0,
  "taskType" character varying(50) NOT NULL,
  "is_local" boolean NOT NULL DEFAULT false`,
  ],
];

const INDEXES: ReadonlyArray<readonly [string, string, string]> = [
  ["IDX_social_accounts_tenant", "social_accounts", "tenant_id"],
  ["IDX_social_posts_tenant", "social_posts", "tenant_id"],
  ["IDX_social_posts_account", "social_posts", "accountId"],
  ["IDX_post_analytics_post", "post_analytics", "postId"],
  ["IDX_social_post_feedback_post", "social_post_feedback", "postId"],
  ["IDX_email_validation_jobs_tenant", "email_validation_jobs", "tenantId"],
  ["IDX_theme_settings_tenant", "theme_settings", "tenant_id"],
  ["IDX_theme_settings_header_menu", "theme_settings", "headerMenuId"],
  ["IDX_theme_settings_active", "theme_settings", "isActive"],
  ["IDX_ai_usage_logs_provider", "ai_usage_logs", "provider"],
  ["IDX_ai_usage_logs_model", "ai_usage_logs", "model"],
  ["IDX_ai_usage_logs_user", "ai_usage_logs", "user_id"],
  ["IDX_ai_usage_logs_session", "ai_usage_logs", "session_id"],
  ["IDX_ai_usage_logs_tenant", "ai_usage_logs", "tenant_id"],
  ["IDX_token_usage_tenant", "token_usage", "tenant_id"],
];

// [name, table, column, referenced table, on delete] — on delete as the entities declare.
const FOREIGN_KEYS: ReadonlyArray<
  readonly [string, string, string, string, string]
> = [
  ["FK_social_accounts_user", "social_accounts", "userId", "users", "CASCADE"],
  ["FK_social_posts_user", "social_posts", "userId", "users", "CASCADE"],
  [
    "FK_social_posts_account",
    "social_posts",
    "accountId",
    "social_accounts",
    "CASCADE",
  ],
  [
    "FK_post_analytics_post",
    "post_analytics",
    "postId",
    "social_posts",
    "CASCADE",
  ],
  [
    "FK_social_post_feedback_post",
    "social_post_feedback",
    "postId",
    "social_posts",
    "NO ACTION",
  ],
  [
    "FK_theme_settings_header_menu",
    "theme_settings",
    "header_menu_id",
    "cms_menus",
    "SET NULL",
  ],
  [
    "FK_theme_settings_created_by",
    "theme_settings",
    "created_by",
    "users",
    "NO ACTION",
  ],
  [
    "FK_theme_settings_updated_by",
    "theme_settings",
    "updated_by",
    "users",
    "NO ACTION",
  ],
];

/**
 * Social media, theme settings, email validation and AI usage entities were
 * mapped without tables in the active history, so their screens failed with
 * "relation does not exist". Mirrors the entities; idempotent where a database
 * already has some of them from synchronize.
 */
export class MissingModuleTables1791453600000 implements MigrationInterface {
  name = "MissingModuleTables1791453600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [type, values] of ENUMS) {
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "public"."${type}" AS ENUM(${values});
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
    }
    for (const [table, columns] of TABLES) {
      await queryRunner.query(
        `CREATE TABLE IF NOT EXISTS "${table}" (${columns}, CONSTRAINT "PK_${table}" PRIMARY KEY ("id"))`,
      );
    }
    for (const [index, table, column] of INDEXES) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "${index}" ON "${table}" ("${column}")`,
      );
    }
    for (const [fk, table, column, target, onDelete] of FOREIGN_KEYS) {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "${table}" ADD CONSTRAINT "${fk}" FOREIGN KEY ("${column}") REFERENCES "${target}"("id") ON DELETE ${onDelete};
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table] of [...TABLES].reverse()) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}"`);
    }
    for (const [type] of [...ENUMS].reverse()) {
      await queryRunner.query(`DROP TYPE IF EXISTS "public"."${type}"`);
    }
  }
}
