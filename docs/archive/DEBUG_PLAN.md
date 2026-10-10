# Deep Dive Debugging Plan

This plan focuses on clearing environment-level blockers (zombie processes) and restarting the platform in a high-observability state.

## User Review Required

> [!WARNING]
> **Process Termination**: All current Node.js and Next.js processes will be forcefully terminated. Save any unsaved work in other terminals.

## Proposed Changes

### [Process Management]
Stop current executions to prevent port conflicts and memory leaks.

#### Cleanup Strategy
*   Kill all processes matching `node`, `nest`, `next`.
*   Prune dangling Docker containers if applicable.

### [High-Visibility Execution]
Start services with enhanced logging and debugger attachment points.

#### Backend Debugging
*   Run `cd apps/backend && npm run start:dev -- --debug` (or equivalent).
*   Attach inspector to port `9229`.

#### Frontend Debugging
*   Run `cd apps/frontend && next dev`.
*   Enable `NEXT_PUBLIC_DEBUG=true` if supported.

## Verification Plan

### Automated Checks
1. `ps aux | grep node`: Verify zero active project processes before restart.
2. `lsof -i :9003`: Ensure frontend port is clear.
3. `lsof -i :3003`: Ensure backend port is clear.

### Manual Verification
1. Access `/api/docs` (Swagger) to verify backend health.
2. Access `http://localhost:9003` to verify frontend rendering.
