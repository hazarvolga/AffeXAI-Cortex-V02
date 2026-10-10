# Fix Plan: Startup & Hydration Recovery

## 🚨 Critical Issues
1. **Backend Crash (Blocker):** `QueryFailedError: column "firstName" ... contains null values`.
   - **Cause:** `User` entity added non-nullable `firstName`/`lastName` columns to an existing table with data.
   - **Impact:** Backend enters restart loop, preventing API access.
2. **Frontend Hydration Error:** `Hydration failed... className="... antigravity-scroll-lock"`.
   - **Cause:** Client-side library or extension injecting classes into `<body>` before React hydration completes.
   - **Impact:** React tree regeneration, potential layout shifts, and console errors.

## 🛠️ Remediation Plan

### Phase 1: Database Schema Recovery (Backend Specialist)
**Goal:** Allow backend to start without data loss.
- **Action:** Modify `apps/backend/src/modules/users/entities/user.entity.ts`.
- **Change:** Mark `firstName` and `lastName` as `nullable: true` temporarily.
- **Rationale:** This allows TypeORM to `ALTER TABLE` successfully on existing rows. We can enforce non-nullability later via a proper data backfill migration.

### Phase 2: React Hydration Fix (Frontend Specialist)
**Goal:** Eliminate hydration mismatch errors.
- **Action:** Modify `apps/frontend/src/app/layout.tsx`.
- **Change:** Add `suppressHydrationWarning` to the `<body>` tag.
- **Rationale:** Next.js requires explicit suppression for attributes modified by browser extensions or third-party scripts on the body tag.

### Phase 3: Verification (Test Engineer)
1. **Backend:** Verify startup logs show successful connection and schema sync.
2. **Frontend:** Verify page load without hydration errors in console.
3. **Integration:** Verify login capability (requires running backend).

## 📋 Execution Checklist
- [ ] Backend: Update `User` entity (`firstName`, `lastName` -> nullable)
- [ ] Frontend: Update `RootLayout` (`<body>` -> `suppressHydrationWarning`)
- [ ] Verify: Restart server & Check Health
