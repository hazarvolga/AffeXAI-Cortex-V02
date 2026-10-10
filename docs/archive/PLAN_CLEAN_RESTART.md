# Plan: Project Cleanup and Clean Restart

The goal is to eliminate all zombie processes, clean build artifacts, and restart both the backend and frontend services while monitoring logs for potential errors.

## User Review Required

> [!IMPORTANT]
> This process will temporarily stop all running application services. I will also be clearing the `dist` and `.next` folders to ensure a perfectly clean state.

## Proposed Changes

### 1. Process Cleanup
- **Action**: Identify and kill all processes on port 9006 (Backend) and port 3000 (Frontend).
- **Tool**: `lsof` and `kill`.

### 2. File Cleanup
- **Action**: Delete `dist` folder in `apps/backend`.
- **Action**: Delete `.next` folder in `apps/frontend`.

### 3. Application Restart
- **Backend**: Start in development mode with `npm run start:dev`.
- **Frontend**: Start in development mode with `npm run dev`.

### 4. Log Monitoring
- **Action**: Tail logs for both services to detect any initialization errors or runtime warnings.

## Verification Plan

### Automated Checks
- `curl -s http://localhost:9006/api/health`
- `curl -I http://localhost:3000`

### Manual Verification
- Review log output for "Error", "Exception", or "Warning" strings.
