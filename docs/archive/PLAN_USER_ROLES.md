# Plan: Restore User & Role Management Pages (BCC)

## 1. Diagnostics & Analysis
**Status**: 404 Findings
- `admin/users` and `admin/users/roles` are missing in the `[tenant]` route structure.
- **Legacy Location**: Found traces in `apps/backend/src/app/admin/users/roles/` (looks like some frontend code got mixed into backend or old structure residue?).
- **Backend Readiness**: Backend seems robust.
    - `RolesController` exists in `apps/backend/src/modules/roles`.
    - `UsersModule` exists with role assignment DTOs.
    - `RoleEntity` and `UserRoleEntity` are defined.

**Missing Link**: The frontend routes for `[tenant]/admin/users` and `[tenant]/admin/users/roles` do not exist in `apps/frontend/src/app`.

## 2. Restoration Strategy
We will recreate these pages from scratch using the **BCC Editorial Console** design system, connecting to the existing backend endpoints.

### Target Routes
1.  `/admin/users` -> `apps/frontend/src/app/[tenant]/admin/users/page.tsx`
    -   **View**: User Registry (Data Grid).
    -   **Actions**: Invite User, Edit Role, Deactivate.
2.  `/admin/users/roles` -> `apps/frontend/src/app/[tenant]/admin/users/roles/page.tsx`
    -   **View**: Role Matrix (Permissions Grid).
    -   **Actions**: Create Role, Edit Permissions.

## 3. Design System (BCC) Implementation
-   **Layout**: `BccEditorialWrapper`
-   **Lists**: Glassmorphic Registry Tables (`border-white/5`).
-   **Badges**: Neon identity badges for roles (Admin=#ff8c00, User=#blue, Custom=#9df425).
-   **Typography**: Monospace email/ID columns.

## 4. Implementation Steps

### Phase 1: Service Layer (`frontend-specialist`)
- [ ] Create `apps/frontend/src/services/user-management.service.ts`
    -   `getUsers()`, `inviteUser()`, `updateUserRole()`
    -   `getRoles()`, `createRole()`, `updateRolePermissions()`

### Phase 1.5: Schema Alignment (`frontend-specialist`)
- [ ] **DTO Alignment**:
    -   Update `UserManagementService.createUser` payload mapping:
        -   Frontend `roleId` -> Backend `primaryRoleId`.
        -   Frontend `roleIds` -> Backend `additionalRoleIds` (if multiple).
- [ ] **Field Expansion**:
    -   Add `phone`, `bio`, `address`, `city`, `country` to `CreateUserPage`.
    -   Add `isActive` toggle.
    -   Add `metadata` handling (optional, maybe just empty object for now).

### Phase 2: Page Construction (`frontend-specialist`)
- [x] **Users Page** (`/admin/users`) (DONE):
    -   Header: "User Registry"
    -   Telemetry: "Active Users", "Pending Invites".
    -   Table: Avatar, Name, Email, Role (Badge), Status, Actions.
- [x] **Roles Page** (`/admin/users/roles`) (DONE):
    -   Header: "Permission Matrix"
    -   Telemetry: "Defined Roles", "Custom Policies".
    -   Cards: Role Name, Users Count, Permission Summary, Actions.

### Phase 2.1: Creation Workflows (`frontend-specialist`)
- [ ] **Create User Page**: `apps/frontend/src/app/[tenant]/admin/users/new/page.tsx`
    -   Design: BCC Form Layout (Glassmorphic).
    -   Components:
        -   Personal Info (Name, Email, Phone).
        -   Account Settings (Role Selection, Password).
        -   Actions: "Create Identity", "Cancel".
    -   API: `UserManagementService.createUser(data)`.
- [ ] **Create Role Page**: `apps/frontend/src/app/[tenant]/admin/users/roles/new/page.tsx`
    -   Design: BCC Permission Matrix.
    -   Components:
        -   Role Metadata (Name, Description).
        -   Permission Toggles (Grouped by Domain).
        -   Actions: "Define Policy", "Cancel".
    -   API: `UserManagementService.createRole(data)`.

### Phase 2.2: Detail & Edit Workflows
- [ ] **Edit User**: `apps/frontend/src/app/[tenant]/admin/users/[userId]/page.tsx`
    -   Reuse 'Create' form logic.
    -   Add "Reset Password" and "Deactivate" dangerous actions.
- [ ] **Edit Role**: `apps/frontend/src/app/[tenant]/admin/users/roles/[roleId]/page.tsx`
    -   Read-only view for 'System' roles.
    -   Full edit for 'Custom' roles.

### Phase 3: Backend Verification (`backend-specialist`)
- [ ] Verify `RolesController` endpoints match frontend expectations.
- [ ] Ensure Multi-tenant Context (`@CurrentTenant`) is respected in role listing.

## 5. Verification
- [x] Navigate to `/admin/users` (No 404).
- [x] List users (from real backend).
- [x] Navigate to `/admin/users/roles`.
- [x] List available roles.
- [ ] **Data Integrity**:
    -   [x] Add "Event Manager", "Marketing Manager", "Training Manager" to template roles.
    -   [ ] Run `npm run seed:run` (or equivalent) to populate Template Roles.
    -   Verify roles appear in available templates.
- [ ] **New User Flow**:
    -   Navigate to `/admin/users/new`.
    -   Fill form -> Submit -> Redirect to Registry -> Verify new user appears.
- [ ] **New Role Flow**:
    -   Navigate to `/admin/users/roles/new`.
    -   Define Role -> Select Permissions -> Submit -> Verify in Access Matrix.
