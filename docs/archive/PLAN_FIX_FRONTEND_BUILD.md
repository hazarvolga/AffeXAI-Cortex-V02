# Plan: Fix Frontend Build Errors

## Goal
Resolve build warnings and errors in `apps/frontend` related to `socialMediaService.ts`.

## Analysis
The file `src/lib/api/socialMediaService.ts` attempts to import `BaseService` from `./base-service`.
However, `src/lib/api/base-service.ts` exports `BaseApiService` (both as default and named), not `BaseService`.

## Proposed Changes

### Frontend
#### [MODIFY] [apps/frontend/src/lib/api/socialMediaService.ts](file:///Users/hazarekiz/sunucu_yonetimi/affex_ai_servers/AffeXAI-main/apps/frontend/src/lib/api/socialMediaService.ts)
- Update import statement to use `BaseApiService` from `./base-service`.
- Update class definition to extend `BaseApiService`.

## Verification Plan

### Automated
1. Run build command in `apps/frontend` directory:
   ```bash
   npm run build
   ```
2. Verify that the "Attempted import error" messages are gone.
