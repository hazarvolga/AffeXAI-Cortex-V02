# Plan: RBAC Phase 2 - Advanced Enforcement

## 1. Objective
Enhance the existing RBAC system by implementing strict **Data Scoping (Backend)** and **Hierarchical Safety (Frontend)**.
*   **Backend:** Enforce that Tenant Admins only see data belonging to their `tenantId`.
*   **Frontend:** Prevent Tenant Admins from elevating privileges (e.g., creating/assigning `SUPER_ADMIN`).

## 2. Architecture Changes

### A. Backend (`apps/backend`)
1.  **Service Layer Scoping**:
    *   Target Service: `EventsService` (as a primary example/Proof of Concept).
    *   Pattern: Modify `findAll` (and similar methods) to check `user.tenantId`.
    *   Logic:
        *   If `user.isSuperAdmin` -> Return all.
        *   If `user.tenantId` -> Add `where: { tenantId: user.tenantId }`.

### B. Frontend (`apps/frontend`)
1.  **Role Assignment Security (`/admin/users/roles`)**:
    *   Component: Role creation/editing forms and user management.
    *   Logic:
        *   When assigning a role: Filter out `SUPER_ADMIN` from the dropdown if the current user is NOT a Super Admin.
        *   When creating a role: Prevent non-Super Admins from setting `isSystem: true` (already enforced, but UI should reflect it).

## 3. Execution Steps

### Phase 2.4: Backend Query Filtering
**Agent: `backend-specialist`**
1.  **Target:** `apps/backend/src/modules/events/events.service.ts` (Check if exists, otherwise `users.service.ts`).
2.  **Action:** Inject `REQUEST` (Scope) or pass `User` object to methods.
3.  **Refactor:** Update `findAll` to apply `tenantId` filter.

### Phase 2.5: UI Improvements (Role Hierarchy)
**Agent: `frontend-specialist`**
1.  **Target:** `apps/frontend/src/app/admin/users/roles/create-new-role/page.tsx` (or similar).
2.  **Action:** In the "Create/Edit Role" form, hide/disable the option to create restricted roles if the user lacks permission.
3.  **Target:** `apps/frontend/src/app/admin/users/components/user-role-select.tsx` (or where roles are assigned to users).
4.  **Action:** Filter the role list: `roles.filter(r => isSuperAdmin ? true : r.name !== 'super_admin')`.

## 4. Verification
**Agent: `test-engineer`**
1.  **Backend:** Verification script to call API as Tenant Admin and ensure filtering.
2.  **Frontend:** Screenshot/Manual check of Role Dropdown as Tenant Admin.
