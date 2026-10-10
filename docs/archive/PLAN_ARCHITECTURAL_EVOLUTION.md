# 🏗️ PLAN: Architectural Evolution for BCC (Brand Communication Center)

## 🎯 Strategic Vision: The "Swiss Army Knife" of Brand Strategy
**Business Context:**  
*   **AffexAI:** The SaaS Product / Platform Owner (SuperAdmin Scope).
*   **Allplan (AEC):** The First Enterprise Tenant (TenantAdmin Scope).
*   **Goal:** A unified intelligent orchestration system (BCC) serving multiple tenants like Allplan.

## 🛡️ SafetyNet & Commit Protocol (Strict)
**Principle:** "Never break the build. Commit often. Tag always."

### 🔄 Step-by-Step Loop
For every sub-task (e.g., "Move Auth Guard"):
1.  **Pre-Check:** Ensure `npm run build` passes.
2.  **Work:** Perform the file move/refactor.
3.  **Verify:** Run `npm run build` again.
4.  **Commit:** `git commit -am "refactor(core): [Step X] Moved Auth Guard"`
5.  **Checkpoint:** If a major milestone, `git tag arch-phase-1-step-X`.
6.  **Log:** Update `docs/ARCH_MIGRATION_LOG.md` with the restore command.

### 🆘 Emergency Restore
To rollback to the last safe state:
```bash
# Check the log for the last tag
git checkout arch-phase-1-step-X
# If DB was touched
psql < backups/step-X.sql
```

## 🚧 The Barrier: Current "Flat" Architecture

## 🚧 The Barrier: Current "Flat" Architecture
The current "Flat" architecture creates **Data Silos**. `EmailModule` doesn't talk deeply to `SocialModule`. `Auth` is scattered. This prevents the "Brand Brain" from seeing the whole picture.

## 🏗️ The Solution: Modular Clean Architecture
To enable the BCC vision, we must pivot to a **Modular Clean Architecture**. This allows a central "Brand Strategy" kernel to orchestrate all other modules.

---

## 📦 Phase 1: Structural "Core" Migration (The Foundation)
**Objective:** Create the stable runtime environment required for 1,000+ tenants and the Intelligence Layer.

1.  **Refactor Directory Structure:**
    *   **`src/core` (The Kernel):**
        *   `auth/` (Guards, Strategies - Gatekeeper)
        *   `tenant/` (Isolation Logic - The Scaler)
        *   `database/` (Connections, RLS - The Data Lake)
        *   `config/` (Environment - The Controls)
    *   **`src/common`:** Shared Utilties.
    *   **`src/modules` (The Limbs):** Where specific features live (Email, Social, etc.).

2.  **Align Imports:**
    *   Example: `import { AuthService } from '../../auth/auth.service'` becomes `import { AuthService } from '@core/auth/auth.service'`.

## 🔐 Phase 2: Auth & Identity Remediation (The Gatekeeper)
**Objective:** Fix `roles` to allow "Super Admin" (Platform Intelligence View) vs "Tenant Admin" (Operational View).

1.  **Seed Clean Roles:**
    *   **SuperAdmin:** Visibility across the entire ecosystem (required for Global AI Training).
    *   **TenantAdmin:** Full control within their Brand Sandbox.
2.  **Repair Superuser:**
    *   Restore `superuser@affexai.com` as the primary "Brand Architect".
3.  **Update Guard Logic:**
    *   Ensure `jwt-auth.guard` respects this new hierarchy.

## 🧠 Phase 3: Bringing the "BCC" to Life (Future Enablement)
**Objective:** Prepare the codebase for the "Brand Brain".

*   **New Module:** `src/modules/brand-strategy`
    *   *Purpose:* The central nervous system.
    *   *Inputs:* Consumes events from `Email`, `Social`, `Support` via `EventBus`.
    *   *Outputs:* "Strategic Insights" and "Content Optimization" suggestions.
*   *Note:* This phase relies entirely on the stability of Phase 1 & 2.

## 🧩 Phase 4: Verification & Stabilization
1.  **Build Check:** Ensure backend compiles with new structure.
2.  **Login Test:** Verify Superuser access.
3.  **Tenant Isolation Check:** Verify data safety.

## 👥 Orchestration Tasks
- **Backend Specialist:** Execute Phase 1 (Refactor) & Phase 2 (DB Fixes).
- **Database Architect:** Validate RLS/Isolation for cross-module intelligence.
- **Test Engineer:** Verify the platform is stable for the new capabilities.

## ✅ Success Criteria
- [ ] Backend structure aligns with BCC vision (`core` vs `modules`).
- [ ] `roles` table supports SuperAdmin hierarchy.
- [ ] `superuser` login works.
- [ ] Platform is ready for "Brand Intelligence" module injection.
