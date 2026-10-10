# Plan: Resolving Persistent Automation API 404

## Diagnosis
The user reports:
1.  `Automation API Error: {}` at `automation.ts:55`
2.  `AxiosError: Request failed with status code 404` at `automation.ts:74` (inside `getAll()`)
3.  The frontend error suggests `apiClient.get<Automation[]>('')` is failing.

Even though we updated the `baseURL` to `${API_BASE_URL}/email-marketing/automations`, the request is still failing.

**Potential Causes:**
1.  **Double Slash:** If `API_BASE_URL` ends with `/`, appending `/email-marketing` might create `//email-marketing`, which some servers reject or mishandle.
2.  **Backend Route Issues:** `AutomationController` might not be correctly registered in the main `AppModule` or `EmailMarketingModule`.
3.  **CORS/Proxy:** The request might be hitting a proxy that doesn't forward the path correctly.

## Implementation Steps

### 1. Verify Request URL
- Add detailed logging to `automation.ts` request interceptor to print the *exact* full URL being requested. This will confirm if it's `http://localhost:9006/api/email-marketing/automations` or something else.

### 2. Verify Backend Registration
- Inspect `apps/backend/src/app.module.ts` and `apps/backend/src/modules/email-marketing/email-marketing.module.ts` to ensure `AutomationController` is imported and provided.

### 3. Backend Route Debugging
- If the URL looks correct, the backend might simply not be listening on that path. I will use `nest start --debug` or inspect the server logs (if possible) to see the mapped routes. Since I can't see live server logs easily, I will rely on code inspection.

## Orchestration Steps
| Agent | Task |
|---|---|
| **frontend-specialist** | Add enhanced debug logging to `automation.ts`. |
| **backend-specialist** | Verify Module and Controller registration in NestJS. |
| **debugger** | Synthesize findings. |
