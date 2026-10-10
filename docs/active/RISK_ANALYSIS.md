# 🛡️ Risk Analysis: Architectural Evolution (Pre-Mortem)

**Objective:** Predict potential failure modes of the "Clean Architecture" refactor and define preemptive mitigations.
**Date:** 2026-02-11
**Context:** Converting a flat NestJS backend to Modular Architecture (`src/core` separation) for 1000+ tenant scalability.

---

## 📊 Risk Matrix

| ID | Risk Scenario | Probability | Impact | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **R1** | **"Build Hell" Cycle** | 🔥 High | 🔴 Critical | **S1** | **Parallel Build:** Do NOT delete old files. Create `src/core`, verify it compiles *alongside* existing code, then switch imports file-by-file. |
| **R2** | **SuperAdmin Lockout** | 🟡 Medium | 🔴 Critical | **S1** | **"Golden Key" Script:** Create a standalone SQL script (`restore-super-admin.ts`) that forces role restoration directly in DB, bypassing Auth Guard code. |
| **R3** | **Data Loss (Roles)** | 🟡 Medium | 🟠 High | **S2** | **Cold Backup:** `pg_dump` before touching `roles` table. **Safe Seed:** Script must `SELECT` existing user mappings before `TRUNCATE`. |
| **R4** | **Tenant Leakage** | 🟢 Low | 🔴 Critical | **S2** | **TDD Verification:** Write a test case *before* refactor that attempts to fetch Tenant B data as Tenant A. Run this test continuously. |
| **R5** | **Team Confusion** | 🟢 Low | 🟡 Medium | **S3** | **"Map of the Territory":** Create `ARCHITECTURE.md` showing old-vs-new paths (`src/auth -> src/core/auth`) before starting. |

---

## 🛑 Mitigations in Detail

### 1. The "Parallel Build" Strategy (Anti-Build Hell)
Instead of a "Big Bang" move (which breaks 500 imports at once):
1.  **Duplicate:** Copy `src/auth` to `src/core/auth`.
2.  **Co-exist:** Both folders exist. The app runs on the old one.
3.  **Migrate:** Change `users.module` to import from `src/core/auth`.
4.  **Verify:** Run compilation.
5.  **Repeat:** For next module.
6.  **Cleanup:** Delete `src/auth` only when 0 references remain.

### 2. The "Golden Key" (Anti-Lockout)
We will create a **Emergency Restore Script** located at `scripts/emergency/restore-access.ts`.
*   **Function:** Connects via Raw SQL (no TypeORM).
*   **Action:** Resets `superuser@affexai.com` password to a known value and forces role to `SuperAdmin` UUID.
*   **Trigger:** If login fails for >15 mins during migration.

### 3. The "TDD Guard" (Anti-Leak)
We will create a specific integration test: `test/security/tenant-isolation.spec.ts`.
*   **Scenario:** Create Tenant A and Tenant B.
*   **Action:** Tenant A Admin tries to GET `/api/users` of Tenant B.
*   **Assertion:** MUST return `403 Forbidden` or filter results to 0.
*   **Execution:** Run this test automatically on every git commit.

---

## 📉 Success Probability Forecast

| Factor | Status | Impact on Success |
| :--- | :--- | :--- |
| **Code Complexity** | 🟡 Moderate | NestJS is strict, which helps. Flat structure makes imports messy but predictable. |
| **Database State** | 🔴 Corrupted | `roles` table is currently broken. This is the biggest risk factor. Fixing it serves as the foundation. |
| **Rollback Ability** | 🟢 Excellent | Git + SQL Dumps provide nearly 100% rollback guarantee if protocols are followed. |

**Overall Success Probability:** **85%** (With Safety Protocols)
*Without Safety Protocols: ~40% (High risk of breaking build for days)*

## 🧠 Recommendation
Proceed **only** if the **Parallel Build** strategy is adopted. The "Big Bang" move is too risky for a project of this maturity.
