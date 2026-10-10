# Plan: Fix Auto-Redirect from Editorial Console

## 1. Objective
Prevent Super Admin users from being auto-redirected from `/editorial-console` to `/portal/dashboard` after staying on the page for a while.

## 2. Analysis
*   **Symptom:** Super Admin successfully lands on `/editorial-console` after login, but gets redirected to `/portal/dashboard` after some time.
*   **Root Cause (Hypothesis):**
    1.  `apps/frontend/src/app/editorial-console/layout.tsx` (line 23-24) redirects users if `!isSuperAdmin`.
    2.  `isSuperAdmin` is calculated in `auth-context.tsx` based on `user.roleNames` or `user.roles`.
    3.  After initial login, a background user sync (`useUserSync` hook or similar) may be fetching fresh user data from the backend.
    4.  If the backend response is missing `roleNames` or `roles`, `isSuperAdmin` becomes `false`, triggering the redirect.
    5.  The redirect goes to `/admin`, but user reports `/portal/dashboard` — this suggests there's *another* redirect in `/admin` that sends non-admins to portal.

## 3. Proposed Changes
**Agent: `frontend-specialist`**
1.  **Add Debug Logging to `layout.tsx`:**
    *   Log `isSuperAdmin` value on every render to confirm when it changes.
2.  **Inspect `useUserSync` Hook (if exists):**
    *   Check if user sync is overwriting `user` state with incomplete data.
3.  **Fix `isSuperAdmin` Calculation:**
    *   Ensure `isSuperAdmin` check is resilient to missing `roleNames` or `roles`.
    *   Fallback to `user.primaryRole?.name` or `user.roleEntity?.name`.

## 4. Verification
**Agent: `test-engineer`**
1.  **Manual Test:**
    *   Login as `superuser@affexai.com` (password: `Super123!`).
    *   Stay on `/editorial-console` for 1-2 minutes.
    *   Confirm no redirect occurs.
    *   Check browser console for `isSuperAdmin` logs.
