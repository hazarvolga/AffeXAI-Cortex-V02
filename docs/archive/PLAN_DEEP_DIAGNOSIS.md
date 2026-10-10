# Deep Diagnosis Plan: Persistent Login Failure (ECONNREFUSED)

## 🚨 Problem Statement
Despite confirming backend startup and schema synchronization, the frontend consistently fails to connect to the backend with `ECONNREFUSED 127.0.0.1:9006`. This implies a network layer issue, immediate process crash, or race condition.

## 🕵️‍♂️ Investigation Strategy

### Phase 1: Network & Process Forensics (Debugger + DevOps)
1. **Port Binding Verification:**
   - Determine EXACTLY what interface port 9006 is bound to (`IPv4 127.0.0.1`, `IPv6 ::1`, or `Any 0.0.0.0`).
   - Command: `lsof -i :9006` and `netstat -an | grep 9006`.
2. **Process Stability Check:**
   - Verify if the PID changes between requests (indicating potential crash-restart loop).
   - Check `backend_startup_email_fix.log` for *runtime* errors that happen *after* initialization (e.g., Redis connection failure causing shutdown).
3. **Connectivity Simulation:**
   - Test connection from terminal using `curl` to both `localhost` and `127.0.0.1`.

### Phase 2: Configuration Analysis (Backend Specialist)
1. **Review `main.ts`:**
   - Analyze `app.listen()` arguments.
2. **Review Environment:**
   - Check `HOST`, `PORT`, `API_URL` variable consistency.

### Phase 3: Remediation (Backend Specialist)
1. **Explicit Binding:** Modify `main.ts` to strictly bind to `0.0.0.0` or `127.0.0.1` to eliminate ambiguity.
2. **Health Check Endpoint:** Ensure `/api/health` is accessible.

## 📋 Execution Steps
- [ ] **Debugger:** Run `netstat` and `lsof` to inspect port 9006.
- [ ] **Debugger:** Inspect tail of backend logs for silent crashes.
- [ ] **Backend Specialist:** Verify `main.ts` listen configuration.
- [ ] **Backend Specialist:** Implement explicit IPv4 binding in `main.ts`.
- [ ] **Test Engineer:** Validate login connectivity.
