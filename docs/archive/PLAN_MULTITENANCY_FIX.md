# Plan: Fix Email Validator Multi-Tenancy

## Problem
The Email Validator module (`ValidationJob`, `ValidationController`) lacks multi-tenancy support.
-   **Security Risk:** Users from Tenant A could potentially access or trigger jobs for Tenant B if IDs are guessed or if no isolation is enforced.
-   **Data Leak:** Job results and stats are global.
-   **Context:** The frontend is tenant-aware (`[tenant]/admin/...`), but the backend endpoint `POST /email-marketing/validation/start` does not capture or enforce this.

## Proposed Changes

### 1. Update `ValidationJob` Entity
-   Add `tenantId` column (indexed).
-   Make it mandatory.

### 2. Update `ValidationController`
-   Inject `REQUEST` object to access `req.user.tenantId` (assuming standard AuthGuard populates this).
-   **Verify Auth Guard:** Ensure the controller is protected by `JwtAuthGuard` or `TenantGuard`.
-   Update `startValidation`:
    -   Extract `tenantId` from request.
    -   Save `tenantId` to the job.
-   Update `getJobStatus`:
    -   Enforce `where: { id: id, tenantId: currentTenantId }`.

### 3. Database Migration
-   Since this is a dev environment and `synchronize: true` is likely on (based on `app.module.ts` config `process.env.NODE_ENV === 'development'`), modifying the entity should auto-update the table.
-   *Fallback:* If sync is off, we need a migration, but for now we rely on dev sync.

## Execution Steps

### Phase 2: Implementation (Parallel Agents)
1.  **Backend Specialist (`apps/backend/src/modules/email-marketing/entities/validation-job.entity.ts`):**
    -   Add `@Column({ nullable: true }) tenantId: string;` (Temporarily nullable to avoid migration crash, then enforce).
    -   *Better:* Add `tenantId` column.

2.  **Backend Specialist (`apps/backend/src/modules/email-marketing/validation.controller.ts`):**
    -   Import `UseGuards` from `@nestjs/common`.
    -   Apply `@UseGuards(JwtAuthGuard)`.
    -   Use `@Req() req` to get `req.user.tenantId`.
    -   Update repository calls to include `tenantId`.

3.  **Verification:**
    -   Test creating a job.
    -   Verify `tenantId` is saved in DB.
    -   Try to access job from another tenant (should fail).

## User Review Required
> [!IMPORTANT]
> This requires `JwtAuthGuard` to be working and correctly populating `req.user`. I will assume the standard `AuthModule` does this.

## Testing Plan
1.  **Manual Verification:**
    -   Start a validation job via Frontend.
    -   Check Database: `SELECT * FROM email_validation_jobs WHERE id = '...'`. Verify `tenantId` is not null.
