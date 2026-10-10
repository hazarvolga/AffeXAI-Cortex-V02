# PLAN: Enterprise Project Health & Git Audit

Analysis of project structure, Git history integrity, and enterprise standard alignment.

## Task Overview
Coordinate exploration of the repository's historical state and structural quality to provide a definitive report on Git "restore points" and enterprise readiness.

## Phase 1: Planning & Deep Discovery
*Done by: `project-planner` & `explorer-agent`*

1.  **Git History Forensic Analysis:**
    *   [x] Audit `git log` vs `git reflog` to identify reset events.
    *   [x] Cross-reference local tags with `origin` to ensure synchronization.
2.  **Monorepo Structural Audit:**
    *   [ ] Verify `package.json` workspaces and cross-dependency integrity.
    *   [ ] Detect "dark" dependencies and unlinked packages.
3.  **Enterprise Standard Baseline:**
    *   [ ] Audit `.gitignore`, `.github/workflows`, and `Dockerfile` configurations.
    *   [ ] Check for secret leaks in Git history (metadata audit).

## Phase 2: Implementation & Reporting (After Approval)
*Done by: `devops-engineer`, `security-auditor`, `project-planner`*

1.  **Git Reconciliation:**
    *   [ ] Pull from `origin/main` to align with the remote (9 commits gap).
    *   [ ] Standardize tag naming conventions for future restore points.
2.  **Structural Fixes:**
    *   [ ] Align `tsconfig` files and resolve workspace link issues.
    *   [ ] Clean up "leftover" modules (`old_email_modules`, `stitch_affexai_frontend`).
3.  **Project Health Report:**
    *   [ ] Compile findings into a unified Enterprise Readiness report.
4.  **Final Verification:**
    *   [ ] Run `security_scan.py` and `lint_runner.py`.

## Completion Criteria
1.  Definitive explanation of the "lost" restore points (Reset detected).
2.  Local branch synchronized with `origin/main`.
3.  Clear report on structural strengths and enterprise gaps.
4.  All core scripts (`dev.sh`, `security_scan.py`) verified as working.
