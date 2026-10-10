# Contributing to AffexAI

Welcome! Following these standards ensures code quality and project stability.

## 🚀 Getting Started

1.  **Clone the Repo**: `git clone ...`
2.  **Environment Setup**: Install `pnpm` (required for monorepo management).
3.  **Install Dependencies**: `pnpm install`
4.  **Husky Setup**: Git hooks are installed automatically on `pnpm install`.

## 🌳 Branching Strategy

We use **Trunk-Based Development**. 
*   Always branch from `main`.
*   Naming convention: `feat/feature-name`, `fix/bug-name`, `chore/task-name`.
*   Merge via Pull Request only.

## 📝 Commit Messages

We follow **Conventional Commits**.
Format: `<type>(<scope>): <description>`

Examples:
*   `feat(auth): add google oauth provider`
*   `fix(cms): prevent component overlap in mobile view`
*   `chore(deps): update nestjs to v11`

## 🛠️ Pull Request Process

1.  **Title**: Must follow Conventional Commits.
2.  **Description**: Use the provided template. Link relevant issues.
3.  **Tests**: All `npm run test` and `npm run lint` must pass.
4.  **BCC Impact**: Describe how these changes affect the Brand Communication Center vision.
5.  **Review**: At least one approval is required for `main` merge.

## ⚠️ Coding Standards

*   **TypeScript**: Use strict types. No `any` unless absolutely necessary.
*   **Documentation**: Update JSDoc for new functions.
*   **Performance**: Avoid N+1 queries in backend; use React profiling for frontend.

---
*Building the future of Brand Intelligence.*
