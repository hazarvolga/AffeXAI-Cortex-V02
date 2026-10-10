# 📋 PLAN: Phase 3 - Core Logic & Tenant Isolation

**Goal:** Establish the `TenantContext` in `src/core` and refactor the `UsersModule` to utilize the new Core layer (Auth, DB, Config), severing dependencies on the legacy structure.

**Prerequisites:**
- [x] `src/core/auth` (Live)
- [x] `src/core/config` (Live)
- [x] `src/core/database` (Live)
- [x] `npm run build` passing

## 🛡️ SafetyNet Protocol
For *each* step below:
1.  **Build:** `npm run build`
2.  **Commit:** `git commit -am "refactor(phase3): [Action]"`
3.  **Tag:** `git tag arch-phase-3-step-X`
4.  **Log:** Update `docs/ARCH_MIGRATION_LOG.md`

---

## 📅 Execution Steps

### 3.1: Initialize Core Tenant Module
*   **Target:** `src/core/tenant`
*   **Action:**
    *   Create `src/core/tenant` directory.
    *   Implement `TenantService` (Context storage).
    *   Implement `TenantMiddleware` (Extract `X-Tenant-ID` or Subdomain).
    *   **CRITICAL:** Ensure it works with `src/core/config` and `src/core/database`.
*   **Verification:** Build passes.

### 3.2: Refactor Users Module (The First "Consumer")
*   **Target:** `src/modules/users`
*   **Action:**
    *   Update `UsersService` to import `AppDataSource` from `src/core/database`.
    *   Update `UsersService` to use `AuthService` from `src/core/auth` (if circular dependency allows, otherwise use forwardRef).
    *   Fix all relative imports in `src/modules/users` to point to `src/core/*`.
*   **Verification:** Build passes. Verify `Users` entity is loaded correctly by `AppDataSource`.

### 3.3: Global Tenant Guard integration (Tentative)
*   **Target:** `src/app.module.ts`
*   **Action:**
    *   Import `CoreTenantModule`.
    *   Apply `TenantMiddleware` globally (or to specific routes).
*   **Verification:** Curl test to an endpoint confirming tenant context.

---

## 👥 Agent Assignment (Implementation Phase)
*   **Backend Specialist:** Code implementation (`core/tenant`, `modules/users`).
*   **Security Auditor:** Review `TenantMiddleware` for leakage risks.
*   **Test Engineer:** Run verification builds and tests.
