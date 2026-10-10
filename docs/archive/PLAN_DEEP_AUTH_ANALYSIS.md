# Deep Project Analysis & Auth Architecture Restoration Plan

## 🎯 Objective
Permanently resolve the "Invalid Credentials" and "Super User" authority usage by reconstructing the intended Multi-Tenant Architecture. Validate the distinction between `Super Admin` (Platform Owner) and `Admin` (Tenant Owner).

## 🔍 Phase 1: Historical & Documentation Forensics
**Goal:** Understand *what was intended* vs. *what exists*.
1. **Analyze Documentation:**
   - Read `docs/proje_durum_analizi_2026.md` (Baseline).
   - List and read all `docs/*` sorted by date to trace architectural evolution.
2. **Analyze Commit History:**
   - `git log -p -- apps/backend/src/modules/auth` (Trace Auth evolution).
   - `git log -p -- apps/backend/src/modules/users` (Trace User/Role evolution).

## 🧬 Phase 2: User Management System Code Audit
**Goal:** Reverse-engineer the *actual* login requirements.
1. **Entity Analysis:**
   - `User` entity (Check for `isSuperAdmin`, `organizationId`, `tenantId` fields).
   - `Role` entity (Check for special flags or hierarchy).
   - `Organization` entity (Check how users link to tenants).
2. **Auth Service Logic:**
   - `validateUser` method: Does it check for active status? Email verification? Tenant context?
   - `login` method: Does it enforce specific role logic?
   - `Password Hashing`: Verify `bcrypt` rounds/salt consistency (Script vs App).

## 🧩 Phase 3: Frontend vs Backend Mismatch Check
**Goal:** Ensure the key fits the lock.
1. **Frontend Request:** What exactly is being sent? (`email`, `password`, `tenantId`??).
2. **Backend Guard:** Does `api/auth/login` have a global guard blocking the request before it even reaches the service logic?

## 📝 Phase 4: Project Status Update
1. Update `docs/proje_durum_analizi_2026.md` with:
   - Current broken state breakdown.
   - Identified architectural gaps (Super Admin vs Admin).
   - Missing tables or columns discovered during debugging.

## 🛠️ Phase 5: Solution (Brainstorming)
Propose 3 distinct paths to fix the Super User based on findings:
- **Option A:** Correct Database Seeding (If Role ID was wrong).
- **Option B:** Code Adaptation (If Backend logic is too strict).
- **Option C:** Architecture alignment (Update DB to match original Super Admin design).

## 📋 Execution Order
1. `list_dir docs` (Sort by date)
2. `view_file docs/proje_durum_analizi_2026.md`
3. `view_file apps/backend/src/modules/auth/auth.service.ts`
4. `view_file apps/backend/src/modules/roles/entities/role.entity.ts` (Already viewed, but checking for *Super Admin* def)
5. `git log` analysis.
