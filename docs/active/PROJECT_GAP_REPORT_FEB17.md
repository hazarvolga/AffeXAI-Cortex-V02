# 📉 Project Gap Report (Feb 17, 2026)

## 🚨 Critical Gaps (Must Fix for Launch)

### 1. Security & Access Control
- **Severity:** CRITICAL
- **Gap:** `AdminProductController` has RBAC disabled (`// TODO: Enable RBAC`).
- **Impact:** Unauthorized users performing admin actions on products.
- **Fix:** Uncomment `@Roles` decorators and verify Guards.

### 2. AI Strategy Intelligence
- **Severity:** HIGH
- **Gap:** `StrategyService` is not generating real embeddings. It relies on mock logic or TODOs.
- **Impact:** AI suggestions will be generic or hallucinated, not based on brand history.
- **Fix:** Connect `StrategyService` to `Cortex` API for vector retrieval.

### 3. CMS Functionality
- **Severity:** HIGH
- **Gap:** Visual Editor frontend changes are not saved to backend (`// TODO: Save components`).
- **Impact:** Content editors cannot publish changes.
- **Fix:** Implement `saveComponents` endpoint in CMS module.

### 4. Social Media Completeness
- **Severity:** MEDIUM
- **Gap:** Twitter comments implementation missing. Media upload missing.
- **Progress (Feb 18):**
    - [x] Twitter Authentication Fixed.
    - [x] LinkedIn Integration Configured (Needs verification).
    - [x] Facebook/Instagram Configured (Needs verification).
- **Impact:** Partial social management features.

### 5. Commerce Architecture (Critical)
- **Severity:** CRITICAL
- **Gap:** `CommerceModule` entities (`Product`, `Price`, `Subscription`) exist but have **no database tables** (missing migration).
- **Impact:** Subscription queries fail (`relation "subscriptions" does not exist`), preventing any purchase or quota logic.
- **Fix:** generating and running a migration for Commerce entities.

### 6. Purchase Workflow (Critical)
- **Severity:** HIGH
- **Gap:** `PaymentWebhookController` logic is commented out. Raw body parsing for Stripe signature verification is likely unhandled.
- **Impact:** Purchases on Stripe do not trigger subscription activation in Cortex.
- **Fix:** Uncomment logic, ensure raw body middleware, handle subscription cancellations.

### 7. User Provisioning (Critical)
- **Severity:** CRITICAL
- **Gap:** `CommerceService` webhook handler does not create a `User` or `Tenant` when a new subscription is purchased.
- **Impact:** New customers pay but cannot log in (no account created).
- **Fix:** Implement `ProvisioningService` to create Tenant + Admin User + Welcome Email upon successful Stripe Checkout.

### 8. Transactional Emails (Partial)
- **Severity:** MEDIUM
- **Gap:** Email templates (`welcome.tsx`, `account-created.tsx`) exist but are not triggered by the purchase flow.
- **Impact:** Users do not receive login credentials after buying.
- **Fix:** Wire up `MailService` to the new `ProvisioningService`.

## 🛠 Technical Debt

1.  **Frontend Auth Duplication:**
    - Inline forms in `app/login` vs. Unused `modules/auth/components`.
    - Recommendation: Refactor `app/login` to use the shared components.

2.  **Mock Auth Actions:**
    - Frontend Next.js actions (`apps/backend/.../actions.ts` found in grep?) seem to have mock comments. Need to verify if this is actual backend logic or misplaced files.

## ✅ Closed Gaps (Feb 17)
- [x] Backend Circular Dependencies (Social Media).
- [x] Cortex Memory Logic (Vector Store implementation).
- [x] Frontend Component Structure (Initial modularization).
