# Implementation Plan: Email Marketing Module Multi-Tenancy Refactoring

## 1. Analysis

### Current State
The `EmailMarketingModule` currently handles multi-tenancy manually. Every service method takes a `tenantId: string` parameter and uses it for database filtering (`where: { tenantId }`), entity creation, and cache key generation (`email-campaigns:${tenantId}:all`).

### Desired State
The module will use the `TenantService` (leveraging `AsyncLocalStorage`) to automatically retrieve the current tenant context. This reduces boilerplate, ensures consistent isolation, and prevents manual errors in passing the correct ID.

---

## 2. Step-by-Step Implementation Plan

### Step 1: Refactor `SubscriberService`
- **Location:** `apps/backend/src/modules/email-marketing/subscriber/subscriber.service.ts`
- **Actions:**
    1.  Inject `TenantService` in the constructor.
    2.  Update methods (`create`, `findAll`, `findOne`, `update`, `remove`, `count`, `isEmailSuppressed`, `addSubscriberToSuppressedList`):
        - Remove `tenantId` from method arguments.
        - Retrieve `tenantId` using `this.tenantService.getTenantId()`.
        - Throw `UnauthorizedException` if `tenantId` is missing.
        - Update repository calls and cache keys to use the retrieved `tenantId`.

### Step 2: Refactor `EmailCampaignService`
- **Location:** `apps/backend/src/modules/email-marketing/email-campaign.service.ts`
- **Actions:**
    1.  Inject `TenantService`.
    2.  Update all methods to remove manual `tenantId` passing.
    3.  **Critical:** In `sendCampaign`, continue passing `tenantId` to the `emailQueue.add` call, as queue processors operate outside the current request's context.
    4.  Update internal calls to `subscriberService` to remove the manual `tenantId` argument.

### Step 3: Refactor `TemplateService`
- **Location:** `apps/backend/src/modules/email-marketing/template.service.ts`
- **Actions:**
    1.  Inject `TenantService`.
    2.  Refactor methods to use the automated context for filtering and creation.

### Step 4: Update Controllers
- **Location:** `apps/backend/src/modules/email-marketing/*.controller.ts`
- **Actions:**
    1.  Update `EmailMarketingController`, `SubscriberController`, and `EmailCampaignController`.
    2.  Remove `tenantId` from service call arguments.
    3.  Clean up method signatures where `tenantId` was previously extracted from the request solely for passing to services.

---

## 3. Verification Plan

### 3.1 Unit Testing
- **Test Suite:** Update `*.service.spec.ts` for each service.
- **Verification:**
    - Use `jest.spyOn` to mock `TenantService.getTenantId()` returning `tenant-1`. 
    - Verify that the TypeORM repository is called with `{ where: { tenantId: 'tenant-1' } }`.
    - Change mock to `tenant-2` and verify the repository call updates accordingly.

### 3.2 Automated Isolation Check (New Script)
- **Script:** `scripts/verify-tenant-isolation-email.ts`
- **Logic:** 
  1. Login as Tenant A.
  2. Create an Email Campaign.
  3. Login as Tenant B.
  4. Attempt to fetch Tenant A's campaign.
  5. Assert failure (404 or empty list).
