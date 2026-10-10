# Specification: Quantum Resonance Auditor (QRA)

High-fidelity diagnostic system for end-to-end synchronization between AffeXAI Frontend components and Backend services.

## Objective
Detect "Broken Circuits" where UI interactions fail to execute correct backend logic, ensuring zero-error production state.

## Architecture Layers

### L1: Neural Mapping (Circuit Discovery)
- **Tool**: AI Agent (`explorer-agent`)
- **Action**: Crawl `apps/frontend/src` for all `onClick`, `onSubmit`, and `Link` nodes.
- **Output**: `qra/circuit_map.json` (Mapping UI Node -> Service Function -> API Endpoint).

### L2: Trace Synchronization (Deep Chain Audit)
- **Tool**: AI Agent (`backend-specialist`)
- **Action**: Match `circuit_map.json` endpoints with NestJS `Controllers` and `Services`.
- **Validation**: Verify DTO schema alignment and parameter resonance.

### L3: Active Probing (Surgical Execution)
- **Tool**: Playwright Agent (`test-engineer`)
- **Action**: Headless browser execution.
- **Verification**:
  - Console Log Integrity (Zero Uncaught Errors).
  - Network Resonance (Success status 2xx).
  - Backend Side-Effect Check (Verify log entry/db change if possible).

## Execution Roadmap (Phase 26)
1. **[L1] Inventory**: Map Social Media and Backup page circuits.
2. **[L2] Trace**: Audit the backend handlers for these circuits.
3. **[L3] Probe**: Execute automated clicks and generate the "Resonance Report".
