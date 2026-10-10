# Database Migrations Guide

## Overview
This project uses **TypeORM Migrations** to manage database schema changes safely and reliably. We have moved away from `synchronize: true` to prevent accidental data loss and ensure reproducible environments.

## Core Commands (Backend)

Run these commands from `apps/backend`:

### 1. Generate a Migration
When you modify an entity (e.g., add a column to `user.entity.ts`), run:
```bash
npm run typeorm:migration:generate src/database/migrations/YourMigrationName
```
This will:
- Compare your entities with the database.
- Generate a new file in `src/database/migrations/TIMESTAMP-YourMigrationName.ts` with output SQL.

### 2. Apply Migrations
To apply pending migrations to the database:
```bash
npm run typeorm:migration:run
```

### 3. Revert Last Migration
If you need to undo the last applied migration:
```bash
npm run typeorm:migration:revert
```

## Baseline Migration (Existing Databases)
The file `src/database/migrations/*-BaselineSchema.ts` contains the entire schema as of the transition to migrations.

- **New Environments:** Simply run `npm run typeorm:migration:run` to create the full DB.
- **Existing Environments:** Since the tables already exist, **DO NOT** run the baseline migration naturally. It will fail with "Table already exists". The system is configured with `migrationsRun: false` by default to prevent this.

## Production Setup
In `app.module.ts`:
- `synchronize`: MUST be `false`.
- `migrationsRun`: Can be `true` to auto-migrate on start, but ensure the baseline is handled (e.g., via `migrations` table seeding) if deploying to an existing legacy DB.
