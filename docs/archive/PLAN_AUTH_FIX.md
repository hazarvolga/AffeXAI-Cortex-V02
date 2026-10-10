# PLAN: Fix Auth Session & Logout Issue

## 🎯 Goal
Prevent automatic logouts during navigation by fixing the `tenantId` mismatch in the JWT payload.

## 🕵️ Analysis
1.  **JWT Content**: The `AuthService` currently populates the `tenantId` claim in the JWT with `user.organizationId` (a UUID).
2.  **DB Lookup**: The `UsersService.findOne` method uses the `tenantId` from the JWT to filter the `User` table on the `tenantId` column.
3.  **Mismatch**: The `User.tenantId` column contains the string slug `'default'`. Filtering for `tenantId = [UUID]` fails, causing a 404 (NotFoundException) which the frontend interprets as a session failure, triggering a logout.

## 🛠️ Proposed Changes

### Phase 1: Backend Fix (Agent: backend-specialist)
-   **File**: `apps/backend/src/core/auth/auth.service.ts`
-   **Change**: Update `login()` and `refreshAccessToken()` to use `fullUser.tenantId` instead of `fullUser.organizationId` for the JWT payload.
-   **Why**: This ensures the technical tenant identifier ('default') is used consistently for context scoping.

### Phase 2: Verification (Agent: test-engineer)
-   **Step 1**: Run the updated code.
-   **Step 2**: Perform a login and inspect the JWT payload (via console log or debugger) to verify `tenantId: 'default'`.
-   **Step 3**: Verify that token refresh (`/api/auth/refresh`) works without 404.

### Phase 3: Identity Audit (Agent: security-auditor)
-   **Audit**: Check if other parts of the system rely on `organizationId` being in the token. If so, add it as a separate claim `orgId` rather than overloading `tenantId`.

## ✅ Success Criteria
- [ ] JWT payload contains `tenantId: 'default'`.
- [ ] `/api/auth/refresh` returns 200 OK for superadmin.
- [ ] User remains logged in while navigating the dashboard.
