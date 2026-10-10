# PLAN: BCC Intelligence Pipeline Repair

The objective is to resolve the `404 Not Found` error for `GET /api/bcc/status` and restore the "Zero-Error" state of the platform.

## User Review Required
> [!IMPORTANT]
> The `/bcc/status` endpoint was implemented in the service but missing in the controller. This was a gap in the final integration phase.

## Proposed Changes

### Backend (BCC Module)

#### [MODIFY] [bcc.controller.ts](file:///Users/hazarekiz/sunucu_yonetimi/affex_ai_servers/AffeXAI-main/apps/backend/src/modules/bcc/bcc.controller.ts)
- Add `@Get('status')` endpoint to expose `bccService.getStatus(tenantId)`.

### Documentation & Tracking

#### [MODIFY] [task.md](file:///Users/hazarekiz/.gemini/antigravity/brain/74666cb6-fca8-490a-a755-99aae48c7fbb/task.md)
- Add "Repair: BCC Status Endpoint" task to Phase 4.

## Verification Plan

### Automated Tests
- Run `curl` or use the browser agent to verify `GET /api/bcc/status` returns `200 OK` with valid resonance data.

### Manual Verification
- Check the Frontend Dashboard (Sidebar) to ensure the residence dots (intensity indicators) are now rendered correctly without console errors.
