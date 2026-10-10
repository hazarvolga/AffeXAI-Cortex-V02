# 📊 Project GAP Report: AffexAI Architectural Assessment

## 🌍 Executive Summary
**Vision:** AffexAI aims to be a **"Swiss Army Knife" for Brand Communication (BCC)**, serving 1,000+ tenants with a unified strategy platform.
**Reality Check:** While the core tech stack (NestJS, React) is solid, the **current project structure is "Flat & Fragile"**, whereas world-class platforms (Salesforce, Hubspot, Frontify) use **"Modular Clean Architecture"**.
**Verdict:** To reach 1,000+ tenants without technical collapse, a **Structural Pivot is Mandatory**.

---

## 🔍 1. Architecture GAP Analysis

| Feature | 🔴 Current State (AffexAI) | 🟢 World-Class Standard (Scale 1k+) | ⚠️ GAP / Risk |
| :--- | :--- | :--- | :--- |
| **Code Structure** | **Flat / Heterogeneous:** Files like `auth` and `database` are scattered in `src/`. No strict boundary between `Framework` and `Business Logic`. | **Modular Clean Arch:** Strict separation: `src/core` (Infra), `src/modules` (Features), `src/common` (Shared). | **High Debt Risk:** As features grow, dependency cycles will crash the build. Maintenance becomes a nightmare. |
| **Multi-Tenancy** | **Logical / Mixed:** `tenantId` usage is inconsistent. `SuperAdmin` logic is hardcoded in services. `jwt-auth.guard` is complex. | **Row Level Security (RLS):** Database-enforced isolation. Middleware-driven context. Zero leakage guarantee. | **Data Leak Risk:** Without RLS or strict Service Wrappers, a developer error *will* eventually expos data to the wrong tenant. |
| **Auth & RBAC** | **Broken Hierarchy:** `roles` table data corrupted (IDs only). Code checks for `SuperAdmin` but DB lacks it. | **Hierarchical RBAC:** Explicit `Platform Admin` vs `Tenant Admin` scopes. Policies defined in DB, cached in Redis. | **Security Risk:** Current "Invalid Credentials" issues are just a symptom of a missing auth governance model. |
| **BCC Capability** | **Siloed Features:** Email, Social, Events exist but don't talk to each other deeply. | **Unified "Swiss Knife":** A central "Brand Brain" (DAM + Strategy) that feeds *all* modules automatically. | **Product Risk:** Without a unified data layer (DAM/CRM), it's just a collection of tools, not a "Platform". |

---

## 🏗️ 2. Structural "Clean House" Proposal

To support 1,000+ tenants, we must verify the physical structure matches the logical design in `multi-tenant.MD`.

### 🚨 Critical Missing Piece: `src/core`
The `src/core` folder is the **immune system** of a SaaS. It must handle Tenant Isolation, Auth, and DB Connections *before* any business logic runs. Currently, these are mixed into `src/`.

**Proposed Folder Evolution:**
```diff
  apps/backend/src/
- ├── auth/                 <-- ❌ (Orphaned)
- ├── database/             <-- ❌ (Exposed)
- ├── shared/               <-- ⚠️ (Vague)
+ ├── core/                 <-- ✅ THE KERNEL
+ │   ├── tenant/           (Isolation Logic)
+ │   ├── auth/             (Guards, Strategies)
+ │   ├── database/         (Connections, RLS)
+ │   └── config/           (Env Validation)
  ├── modules/              <-- ✅ BUSINESS LOGIC
  │   ├── users/
  │   ├── crm/
  │   └── brand-strategy/   (The "Brain")
+ ├── common/               <-- ✅ UTILITIES
```

---

## 🛡️ 3. Risk Analysis of "Clean House" Fix

**The Change:** Moving `auth`, `database`, `shared` into `core/` and `common/`, and re-seeding the DB roles.

| Risk Category | Level | Description | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Build Stability** | 🔴 High | Moving files breaks imports. The backend *will* fail to compile immediately. | **Atomic Refactor:** Use automated scripts (sed/AST) to update imports in one go. Validate with `check-types`. |
| **Data Integrity** | 🟡 Medium | Re-seeding roles (`Truncate roles`) deletes existing custom roles. | **Safe Seed:** Script checks for existing users mappings before truncating. Backup roles first. |
| **Developer UX** | 🟢 Low | Team needs to learn new folder paths. | **Documentation:** Update `CONTRIBUTING.md` and `multi-tenant.MD` immediately. |

---

## 🚀 4. "Swiss Army Knife" Strategy (BCC Specifics)

Research shows top Brand Platforms (Frontify, Bynder) are successful because they centralized **DAM (Digital Asset Management)**.

**Recommendation:**
AffexAI needs a **`Core Brand Entity`** module. Currently, `Email` and `Social` are separate. They should both consume from a central `BrandIdentity` (Logos, Tone of Voice, Colors). This is the "Swiss Army Knife" differentiators.

**Immediate Action:**
1.  **Refactor Backend Structure:** Move infrastructure to `core/` (Base for stability).
2.  **Fix Auth:** Establish `SuperAdmin` (Platform) vs `TenantAdmin` hierarchy (Security).
3.  **Unified Brand Module:** Create a `brand-core` module that other modules consume (Strategy).

---

## 🧠 Decision Point

**Recommendation:** Proceed with **Option A (Clean House) + Structural Refactor**.
We cannot build a skyscraper (1,000 tenants) on a cracked foundation (flat structure & broken roles).

**Next Step:** Initiate `PLAN_ARCHITECTURAL_EVOLUTION.md` to execute this transformation.
