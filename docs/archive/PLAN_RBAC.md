# Plan: Super Admin & Tenant RBAC Implementation

## 1. Objective
Implement a strict Role-Based Access Control (RBAC) system distinguishing between **Super Admin** (Platform Owner) and **Admin** (Tenant/Brand Manager).
- **Super Admin**: Full access to all systems, including `editorial-console`.
- **Tenant Admin**: Access restricted to their specific Tenant/Brand data only.

## 2. Architecture Changes

### A. Backend (`apps/backend`)
1.  **Entity Modification (`User`)**:
    - Add `tenantId` (UUID, nullable) to `User` entity.
    - *Rationale*: Links a user to a specific brand/organization. Super Admins have `tenantId: null`.

2.  **Role Definition (`shared-types` & `Database`)**:
    - Add `SUPER_ADMIN` to `UserRole` enum.
    - Create/Seed `SUPER_ADMIN` role in `roles` table.
    - Permissions:
        - `SUPER_ADMIN`: `*` (All permissions) + `VIEW_EDITORIAL_CONSOLE`.
        - `ADMIN`: `MANAGE_TENANT`, `VIEW_DASHBOARD`, `MANAGE_USERS` (Scoped).

3.  **Authentication & Authorization (`JwtAuthGuard` & Services)**:
    - Update `JwtAuthGuard` / `AuthService`:
        - Inject `tenantId` into `request.user`.
    - **Global Filter**: Implement a mechanism (e.g., specific Service method wrapper or TypeORM subscriber) to enforce `where: { tenantId: user.tenantId }` for Tenants. *(For Phase 1, we will enforce this in the Service layer manual checks).*

### B. Frontend (`apps/frontend`)
1.  **Access Control**:
    - Create `CheckRole` component or HOC to conditionally render UI.
    - Protect `/editorial-console` routes (Redirect non-Super Admins to `/admin`).

2.  **Navigation (`AdminSidebar`)**:
    - Hide `Editorial Console` link for non-Super Admins.
    - Show "Tenant Dashboard" for Admins.

3.  **Roles Page (`/admin/users/roles`)**:
    - Update to display Role Types clearly.
    - Ensure Admins can only assign roles equal to or lower than themselves (cannot create Super Admins).

## 3. Execution Steps

### Phase 2.1: Foundation (Database & Types)
**Agent: `database-architect` / `backend-specialist`**
1.  Update `packages/shared-types/src/user.types.ts`: Add `SUPER_ADMIN`.
2.  Update `apps/backend/src/modules/users/entities/user.entity.ts`: Add `tenantId`.
3.  Update `apps/backend/src/database/seeds/seed-users-roles.ts`:
    - Ensure `SUPER_ADMIN` role exists.
    - Create a default `superuser@affexai.com` account.
4.  Run seeds/migrations.

### Phase 2.2: Backend Logic
**Agent: `backend-specialist`**
1.  Validate `JwtAuthGuard` propagates `tenantId`.
2.  (Optional) Add `TenantGuard` if needing strict route protection.

### Phase 2.3: Frontend Implementation
**Agent: `frontend-specialist`**
1.  Update `auth` store/hook to include `isSuperAdmin` helper.
2.  Modify `apps/frontend/src/app/admin/layout.tsx` (or sidebar component) to conditionally show links.
3.  Implement protection for `apps/frontend/src/app/editorial-console`.

## 4. Verification
**Agent: `test-engineer`**
1.  Login as Super Admin -> Access Editorial Console (Pass).
2.  Login as Tenant Admin -> Access Editorial Console (Fail/Redirect).
3.  Login as Tenant Admin -> Verify only Tenant Data is visible (Mock data check).

## 5. Deployment
- Re-run `seed:users`.
