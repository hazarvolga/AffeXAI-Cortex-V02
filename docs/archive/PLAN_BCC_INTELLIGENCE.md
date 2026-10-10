# Plan: BCC Intelligence Layer (Option C)

This plan outlines the implementation of the "Brain" for AffexAI, transitioning the Brand Communication Center (BCC) from a static dashboard to an active orchestrator.

## Phase 1: Persistence Layer (The Memory)
Signals are currently in-memory. We must persist them to enable trend analysis and historical resonance mapping.

- **[BACKEND] `BccSignal` Entity**: Create TypeORM entity to store signals. **Mandatory:** Include `tenantId` column for RLS.
- **[BACKEND] PostgreSQL RLS Policy**: 
  - Enable RLS on `bcc_signals` table.
  - Create policy: `USING (tenant_id = current_setting('app.current_tenant'))`.
- **[BACKEND] NestJS RLS Interceptor**: Implement an interceptor to run `SET LOCAL app.current_tenant = ...` at the start of every transaction.
- **[BACKEND] Migration**: Apply DB schema update to `affexai_dev`.

## Phase 2: Pattern Recognition (The Logic)
Developing the logic to interpret raw signal data into actionable "Intelligence", scoped strictly per tenant.

- **[BACKEND] `InsightService`**:
  - `detectResonancePeaks(tenantId)`: Identify high-performing message windows for the specific tenant.
  - `detectFrictionClusters(tenantId)`: Identify tenant-specific UX blockers or system errors.
- **[BACKEND] `BccController`**: Add `@Get('insights')` to return these patterns to the frontend.

## Phase 3: AI Narrative Engine (The Voice)
Providing human-readable strategic summaries instead of just numbers.

- **[BACKEND] Simulated Narrative Logic**: Map specific signal combinations to strategic strings (e.g., *Sentiment > 0.8 + Interaction > 0.7 = "Organic resonance detected; suggest expansion"*).
- **[BACKEND/AI] Prototype Claude Integration**: Prepare service for future LLM-based analysis of the last 100 signals.

## Phase 4: High-Fidelity UI (The Interface)
Making the BCC Console truly dynamic.

- **[FRONTEND] Dynamic `AiInsightsTiles`**: Replace hardcoded mocks with real fetching from `/api/bcc/insights`.
- **[FRONTEND] Pulse Sync**: Connect the neural pulse animation to the actual signal frequency.
- **[FRONTEND] 3D Resonance Field**: Update `ThreeResonanceField.tsx` to reflect active signal nodes in space.

## Verification
1. Emit signal via `Forms` submission.
2. Verify signal exists in DB with correct `tenantId`.
3. **RLS Test**: Attempt to fetch signals using a different `app.current_tenant` session and verify zero results are returned.
4. Check BCC Dashboard for updated AI Insight card.
