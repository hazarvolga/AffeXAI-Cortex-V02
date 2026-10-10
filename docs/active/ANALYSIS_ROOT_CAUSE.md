# 🕵️ Root Cause Analysis: The Mystery of Missing Multi-Tenancy

## Initial Hypothesis vs. Reality
You believed the project was built with a healthy multi-tenant structure. The investigation reveals that while the **Frontend** acts like a multi-tenant app (with URL routing), the **Backend** was built as a single-tenant monolith.

## How Did This Happen? (The 4 Layers of Failure)

### 1. The Foundation (BaseEntity)
Every major entity (`User`, `Event`, `EmailCampaign`) inherits from a shared `BaseEntity`.
*   **Expectation:** `BaseEntity` should have a `tenantId`.
*   **Reality:** It only has `id`, `createdAt`, `updatedAt`.
*   **Consequence:** When you create *any* record, it floats in a global pool, unattached to any specific company/tenant.

### 2. The Gatekeeper (AuthService)
Authentication is the first line of defense.
*   **Expectation:** `req.user` should contain `{ tenantId: '...' }`.
*   **Reality:** The JWT payload only contains `sub`, `email`, and `tokenVersion`.
*   **Consequence:** The backend literally *doesn't know* which tenant a user belongs to when they make a request.

### 3. The Illusion (Frontend Routing)
The frontend uses a dynamic route `[tenant]/admin/...`.
*   **Why it feels implemented:** The URL changes, context providers might even store a "currentTenant" state in React.
*   **The Gap:** When the Frontend calls the Backend, it might send this ID, but the Backend **ignores it** because its database schema has nowhere to store it and its controllers have no logic to filter by it.

### 4. Recent Development (User Entity)
I checked `users/entities/user.entity.ts`.
*   It has complex metadata (`isCustomer`, `studentId`, `customerNumber`).
*   It has **NO** `organizationId` or `tenantId`.
*   **Conclusion:** Users are just users. There is no concept of "Team" or "Organization" in the database relation.

## Summary
The project likely started with a "Clone Tenant" strategy (where you deploy a separate DB for each client) OR it was simply deferred.

**Is it fixable?**
Yes, but it requires a **Migration Strategy**, not just a bug fix.
1.  We need to introduce an `Organization` entity.
2.  We need to link `User` -> `Organization`.
3.  We need to update `BaseEntity` to require `organizationId`.

**Current Status:**
The **Email Validator** module we are building is currently the *only* part of the system where we are about to actively enforce this, effectively making it the "Pilot" for the rest of the system's refactor.
