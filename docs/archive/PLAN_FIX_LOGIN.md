# Fix Plan: Login Connectivity (ECONNREFUSED)

## 🚨 Issue
User receives `ECONNREFUSED 127.0.0.1:9006` when attempting to login.
- **Hypothesis A:** Backend process crashed after startup.
- **Hypothesis B:** Backend listening on IPv6 (`::1`) but frontend trying IPv4 (`127.0.0.1`).
- **Hypothesis C:** Port 9006 is blocked or occupied by a zombie process.

## 🛠️ Remediation Plan

### Phase 1: Diagnostics (Debugger Agent)
1. **Check Process:** Is `node` running the NestJS app?
2. **Check Port:** Is port 9006 open? (`lsof -i :9006`)
3. **Check Logs:** Did the backend crash after the "Successfully started" message?

### Phase 2: Configuration & Fix (Backend/DevOps Agents)
1. **Force IPv4 binding:** If listen issue, force `0.0.0.0` or `127.0.0.1` in `main.ts`.
2. **Restart Service:** Ensure clean start.
3. **Frontend Config:** Verify `API_URL` matching.

### Phase 3: Verification (Test Engineer)
1. `curl http://127.0.0.1:9006/api/health`
2. Retry Login from UI.

## 📋 Execution Checklist
- [ ] Check backend logs for post-startup crash
- [ ] Verify port binding (IPv4 vs IPv6)
- [ ] Update `main.ts` listen address if needed
- [ ] Verify connectivity with curl
