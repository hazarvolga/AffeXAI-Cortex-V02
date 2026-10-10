# Plan: Fix Super Admin Redirect Logic

## 1. Objective
Ensure "Super Admin" users are redirected to `/editorial-console` upon login, instead of the legacy `/admin` dashboard.

## 2. Analysis
*   **File:** `apps/frontend/src/app/login/page.tsx`
*   **Current Logic:**
    ```typescript
    const staffRoles = ['admin', 'editor', ...];
    // ...
    if (hasStaffRole) {
      router.push('/admin');
      return;
    }
    ```
*   **Problem:** Super Admin role is likely caught by `hasStaffRole` or treated as "admin" (or just falls through to staff check if user has multiple roles). Even if not explicitly "admin", the current logic prioritizes `/admin` for all staff.
*   **Solution:** Insert a specific check for Super Admin *before* the generic staff check.

## 3. Proposed Changes
**Agent: `frontend-specialist`**
1.  Modify `apps/frontend/src/app/login/page.tsx`:
    *   Check if `primaryRoleName` or `userRoles` contains "Super Admin" (or `super_admin`).
    *   If yes, redirect to `/editorial-console`.
    *   Else, proceed with existing `/admin` check.

## 4. Verification
**Agent: `test-engineer`**
1.  **Manual Verification:** User logs in as Super Admin. Should land on Editorial Console.
2.  **Lint Check:** Ensure no syntax errors.
