# Plan: Fix White Screen (3D Component SSR)

## 1. Objective
Resolve the "White Screen" issue reported by the user.
The mostly likely cause is the `SentimentHeatmap` component (using `@react-three/fiber`) attempting to render on the server (SSR), which fails because WebGL/Canvas is browser-only.

## 2. Analysis
*   **File:** `apps/frontend/src/app/editorial-console/modules/page.tsx`
*   **Import:** `import SentimentHeatmap from '@/components/editorial/SentimentHeatmap';`
*   **Issue:** Standard import in Next.js (even with `'use client'`) attempts hydration which can mismatch or crash with complex 3D libraries.

## 3. Proposed Changes

### Phase 1: Disable SSR for 3D Component
**Agent: `frontend-specialist`**
1.  Modify `apps/frontend/src/app/editorial-console/modules/page.tsx`:
    *   Change the import of `SentimentHeatmap` to use `next/dynamic`.
    *   Set `{ ssr: false }`.
    *   Add a loading fallback.

### Phase 2: Safety Check
**Agent: `frontend-specialist`**
1.  Check `apps/frontend/src/components/editorial/SentimentHeatmap.tsx` for any direct window/document access outside of hooks (though `useRef` seems safe).

## 4. Verification
**Agent: `test-engineer`**
1.  Manual Verification: User to refresh the page.
2.  Build: Run `pnpm build` again to ensure no static generation errors.
