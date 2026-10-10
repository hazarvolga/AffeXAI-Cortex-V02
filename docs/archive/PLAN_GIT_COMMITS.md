# Plan: Commit Session Changes & Create Restore Point

The system is now functional with corrected database schema and seeded roles. This plan outlines committing the changes in logical chunks and creating a stable restore point.

## User Review Required

> [!NOTE]
> I will commit the changes in 3 logical groups: Infrastructure/Dependencies, Entity Improvements, and Seeder Fixes. Finally, a git tag will be created as a restore point.

## Proposed Changes

### 1. FAQ Learning & Documentation Updates
- **Files**: 
    - `apps/frontend/src/app/[tenant]/admin/support/faq-learning/providers/page.tsx`
    - `apps/frontend/src/app/[tenant]/admin/support/faq-learning/review/page.tsx`
    - `apps/frontend/src/app/[tenant]/admin/support/faq-learning/settings/page.tsx`
    - `docs/BCC_INTEGRATION_GUIDE.md`
    - `docs/PLAN.md`
    - `docs/2026-02-09.md`
- **Action**: Commit initial BCC integration work and documentation.

### 2. User Management Implementation (Frontend)
- **Files**: 
    - `apps/frontend/src/app/[tenant]/admin/users/` (New directory)
    - `apps/frontend/src/services/user-management.service.ts`
- **Action**: Commit new User Management UI and service.

### 3. Infrastructure, Config & Dependencies (Backend)
- **Files**: 
    - `apps/backend/package.json`
    - `apps/backend/src/database/data-source.ts`
    - `package-lock.json`
    - `apps/backend/scripts/run-role-seed.ts`
- **Action**: Commit dependency updates (`typeorm-extension`) and backend config fixes.

### 4. Entity Unification & Schema Alignment (Backend)
- **Files**: 
    - `apps/backend/src/database/entities/base.entity.ts`
    - `apps/backend/src/modules/roles/entities/role.entity.ts`
    - `apps/backend/src/modules/users/entities/user.entity.ts`
- **Action**: Commit transition to snake_case column mappings and base entity unification.

### 5. Database Seeding Improvements & Analysis
- **Files**: 
    - `apps/backend/src/database/seeds/seed-users-roles.ts`
    - `apps/backend/src/database/seeds/1723456789001-TemplateRoles.ts`
    - `docs/PLAN_USER_ROLES.md`
    - `docs/USER_ROLES_ANALYSIS_REPORT.md`
- **Action**: Commit corrected seeder scripts and role analysis reports.

### 6. Restore Point
- **Action**: Create a git tag named `restore-point-v1-stable-roles`.

## Verification Plan

### Automated Checks
- `git log -n 5` to verify commit history.
- `git tag` to verify restore point exists.

### Manual Verification
- Confirm that `git status` is clean.
