# ⚡ Action Plan: Feb 17 Remediation

This plan addresses the critical gaps identified in the `PROJECT_GAP_REPORT_FEB17.md`.

## 🚨 Immediate Actions (Next 24 Hours)

### 1. Fix Security Hole (RBAC)
- [ ] **Task:** Enable RBAC in `AdminProductController`.
- [ ] **File:** `apps/backend/src/modules/commerce/controllers/admin-product.controller.ts`
- [ ] **Action:** Uncomment `@Roles` and ensure `JwtAuthGuard` is active.

### 2. Connect Strategy Brain
- [ ] **Task:** Implement Real VDB Search in `StrategyService`.
- [ ] **File:** `apps/backend/src/modules/strategy/services/strategy.service.ts`
- [ ] **Action:**
    - Inject `HttpService` (Axios).
    - Call Cortex API (`http://localhost:8000/retrieve`).
    - Parse vector results into strategy suggestions.

### 3. CMS Data Persistence
- [ ] **Task:** Implement Save Endpoint for Visual Editor.
- [ ] **File:** `apps/backend/src/modules/cms/cms.controller.ts`
- [ ] **Action:** Create `POST /cms/components` to receive JSON from the frontend editor.

## 📅 Secondary Actions (This Week)

### 4. Cleanup Frontend Auth
- [ ] **Task:** Remove inline forms in `app/login`.
- [ ] **Action:** Import `LoginForm` from `@modules/auth/components`.
- [ ] **Benefit:** Reduces technical debt and ensures consistent auth logic.

### 5. Social Media Polish
- [ ] **Task:** Implement Twitter Comments.
- [ ] **Action:** Fill in the TODO in `twitter.provider.ts` using standard Twitter API v2.

## 📦 Deliverable
A fully "Green" status report for the Feb 20 Launch Candidate.
