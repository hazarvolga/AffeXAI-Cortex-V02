# AffexAI: Professional Git Standards Report

## 1. Executive Summary
This report outlines the "World Standards" Git structure and workflow recommended for the AffexAI enterprise-grade SaaS platform. To support the **Brand Communication Center (BCC)** vision, the codebase must maintain high stability, strict traceability, and automated quality gates.

## 2. Recommended Git Workflow: Trunk-Based Development
For a fast-moving AI platform like AffexAI, we recommend **Trunk-Based Development** (TBD) combined with short-lived feature branches.

*   **Main Branch (`main`)**: Always deployable. No direct commits allowed.
*   **Feature Branches (`feat/...`, `fix/...`)**: Created from `main`, merged back via Pull Request.
*   **Merge Strategy**: Squash and Merge. Keeps the `main` history clean and atomic.

## 3. Commit Message Standards (Conventional Commits)
All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
`type(scope): description`

| Type | Description |
| :--- | :--- |
| `feat` | A new feature for the user |
| `fix` | A bug fix |
| `chore` | Maintenance, dependencies, build tasks |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only changes |
| `perf` | Progressively improves performance |
| `test` | Adding missing tests |

## 4. Automated Quality Gates (The "AffexAI Shield")
To prevent the "frequent frontend issues" reported, we are implementing automated gates:

1.  **Stage 1: Pre-Commit (Local)**
    *   **Linting**: Block commits with styling or syntax errors.
    *   **Formatting**: Auto-format code using Prettier.
2.  **Stage 2: Pre-Push (Local)**
    *   **Type Checking**: Ensure `tsc --noEmit` passes across all packages.
3.  **Stage 3: CI (GitHub Actions)**
    *   **Automated Tests**: Run unit and E2E tests.
    *   **Security Scan**: Automated vulnerability scanning.

## 5. Implementation Roadmap
1.  **Standardization**: Migrate to `pnpm` workspaces for faster, reliable dependency management.
2.  **Enforcement**: Install `husky` and `lint-staged`.
3.  **Documentation**: Deploy `CONTRIBUTING.md` and PR templates.
4.  **BCC Integration**: Add "BCC Impact" field to all PRs to track data orchestration changes.

---
*Prepared by Antigravity DevOps & Security Team.*
