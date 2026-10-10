# Plan: Comprehensive Backend Analysis & Fix

## 1. Objective
Diagnose and resolve the "Backend process died unexpectedly" error preventing the application from starting. Conduct a comprehensive analysis of the failure root cause.

## 2. Situation Analysis
*   **Symptom:** `dev.sh` reports `[✗] Backend process died unexpectedly!` and `[✗] Backend failed to start within 3 minutes`.
*   **Evidence:** Logs available at `/tmp/affexai-backend.log`.
*   **Potential Causes:**
    1.  Database connection failure (Docker container down/port conflict).
    2.  Environment variable mismatch (missing `.env` or invalid config).
    3.  TypeScript compilation errros (recent changes?).
    4.  Port conflict (Port 9006 in use).

## 3. Execution Strategy

### Phase 3.1: Forensics & Intel (Sequential)
**Agent: `debugger`**
1.  **Log Analysis:** Read `/tmp/affexai-backend.log` (last 200 lines).
2.  **Environment Check:** Verify `apps/backend/.env` exists and contains valid DB credentials.
3.  **Infrastructure Check:** Check status of Docker containers (`docker ps`) to ensure Postgres/Redis are running.

### Phase 3.2: Resolution (Parallel)
**Agent: `backend-specialist`**
*   Fix code errors if found in logs.
*   Update dependencies if mismatched.

**Agent: `devops-engineer`**
*   Restart Docker services if DB is unhealthy.
*   Kill zombie processes handling port 9006.

### Phase 3.3: Verification
**Agent: `test-engineer`**
1.  Manually start backend (`cd apps/backend && pnpm start:dev`) to verify fix.
2.  Run system health check (`curl http://localhost:9006/api/health` - assuming health endpoint exists).

## 4. Verification Scripts
*   `security_scan.py`
*   `lint_runner.py`
