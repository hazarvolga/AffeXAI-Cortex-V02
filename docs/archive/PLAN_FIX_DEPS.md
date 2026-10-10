# Plan: Fix React Three Fiber Dependency

## 1. Objective
Resolve the build error `Module not found: Can't resolve '@react-three/fiber'` by installing the required 3D libraries.

## 2. Analysis
The error indicates that `SentimentHeatmap.tsx` imports from `@react-three/fiber`, but the package is not installed in the `apps/frontend` project.

## 3. Execution Steps

### Phase 3.1: Dependency Installation
**Agent: `frontend-specialist`**
1.  Navigate to `apps/frontend`.
2.  Install required packages:
    *   `three` (Core 3D library)
    *   `@react-three/fiber` (React renderer for three.js)
    *   `@react-three/drei` (Useful helpers, likely used too)
    *   `@types/three` (TypeScript definitions)

### Phase 3.2: Verification
**Agent: `test-engineer`**
1.  Run `pnpm build` (or relevant build command) in `apps/frontend`.
2.  Verify the error is gone.

## 4. Verification Scripts
*   `security_scan.py`
*   `lint_runner.py`
