# Plan: Fix UserRole Runtime Error

## 1. Objective
Fix the `Runtime Error: UserRole is not defined` in `apps/frontend/src/lib/auth/auth-context.tsx`.

## 2. Analysis
*   **Error:** `UserRole is not defined` at runtime.
*   **Cause:** `UserRole` is imported using `import type { UserRole } from '@affexai/shared-types'`.
*   **Impact:** Type imports are removed during compilation, so `UserRole` (used as a value: `UserRole.SUPER_ADMIN`) does not exist in the JavaScript output.

## 3. Proposed Changes
**Agent: `frontend-specialist`**
1.  Modify `apps/frontend/src/lib/auth/auth-context.tsx`:
    *   Remove `UserRole` from `import type`.
    *   Add `import { UserRole } from '@affexai/shared-types';` (value import).

## 4. Verification
**Agent: `test-engineer`**
1.  **Build Check:** Run `cd apps/frontend && pnpm build` to ensure no TS errors.
2.  **Manual Check:** User refreshes the page. The error should be gone.
