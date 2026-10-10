# Plan: Auth Architecture Restructuring & Folder Alignment

## 🎯 Objective
Align the backend codebase with the Multi-Tenant Architecture defined in `docs/multi-tenant.MD` and fix the "Invalid Credentials" error by establishing a correct Role hierarchy.

## 🚨 Current State vs. Target State
| Component | Current State (`src/`) | Target State (`multi-tenant.MD`) | Status |
| :--- | :--- | :--- | :--- |
| **Auth** | `src/auth/` (Root) | `src/core/auth/` | ❌ Mismatch |
| **Tenant** | Missing/Scattered | `src/core/tenant/` | ❌ Missing |
| **Database** | `src/database/` | `src/core/database/` | ❌ Mismatch |
| **Users** | `src/modules/users/` | `src/modules/users/` | ✅ Match |
| **Roles** | `src/modules/roles/` | `src/modules/roles/` | ✅ Match |
| **Shared** | `src/shared/` | `src/common/` | ❌ Mismatch |

**Conclusion:** To achieve the "solid structure" requested, we must move core infrastructure code into a `core/` directory and standardize shared utilities.

## 🛠️ Implementation Steps

### Phase 1: Structural Refactor (The "Folder Fix")
**Goal:** Align folder structure with `docs/multi-tenant.MD`.
1.  **Create Directories:**
    *   `mkdir -p apps/backend/src/core/auth`
    *   `mkdir -p apps/backend/src/core/database`
    *   `mkdir -p apps/backend/src/common`
2.  **Move & Rename:**
    *   Move `src/auth/*` -> `src/core/auth/`
    *   Move `src/database/*` -> `src/core/database/`
    *   Move `src/shared/*` -> `src/common/`
3.  **Fix Imports:** Update all import paths in the entire backend (using `sed` or IDE tools).

### Phase 2: Database Role Remediation ("Clean House")
**Goal:** Establish a pristine, correct set of roles in the database.
1.  **Create `scripts/seed-roles-restructure.ts`:**
    *   **Truncate:** Clear existing broken `roles`.
    *   **Seed Super Admin:** Create `SuperAdmin` (Platform Owner).
    *   **Seed Tenant Admin:** Create `Admin` (Tenant Owner).
2.  **Execute Seed:** Run the script to fix the database state.

### Phase 3: Super User Account Alignment
**Goal:** Ensure the "God User" has the "God Role".
1.  **Update Superuser:** Modify `superuser@affexai.com` to use the new `SuperAdmin` Role ID.

### Phase 4: Code Verification
**Goal:** Ensure the backend recognizes the new structure.
1.  **Check `auth.service.ts`:** Verify JWT payload generation.
2.  **Check `users.service.ts`:** Verify `isSuperAdmin` logic.

## ✅ Success Criteria
- [ ] Backend structure matches `docs/multi-tenant.MD`.
- [ ] `roles` table is clean and correct.
- [ ] `superuser@affexai.com` can login as `SuperAdmin`.
