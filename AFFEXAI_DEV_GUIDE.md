# AffeXAI dev: Zero-Error Architecture Guide

Welcome to the **AffeXAI dev** ecosystem. This system is a unified engineering layer that integrates **Quantum Resonance Auditor (QRA)** with **Deep-Dive Debugging** to ensure a 100% stable, "Self-Healing" production environment.

## 1. Vision: The Zero-Error Standard
AffeXAI dev operates on the principle of **Biological Logic Synchronization**. Every UI element (a node) must have a verified, resonant path to a backend execution unit. If a signal is dropped, the system detects it, captures the forensic data, and assists in surgical repair.

---

## 2. Command Reference
The system is managed via the `./bin/affexai` command-line utility.

### `audit`
**Command:** `./bin/affexai audit`
- **Function:** Initiates system-wide Resonance Probes.
- **Workflow:** 
  1. Crawls the `system_circuit_map.json`.
  2. Tests L1 (Existence), L2 (Path), and L3 (Execution) resonance.
  3. Identifies **Broken Circuits** (unimplemented or failing nodes).
  4. Triggers **Deep-Dive Forensics** on failure.

### `manage`
**Command:** `./bin/affexai manage`
- **Function:** Displays the current resonance state of the project.
- **Use Case:** Quick health check before pushing to production.

### `heal`
**Command:** `./bin/affexai heal`
- **Status:** *In Active Development*
- **Function:** Automated repair of identified broken signals based on Deep-Dive forensic data.

---

## 3. The System Circuit Map
The source of truth for all project interactions is stored in `docs/system_circuit_map.json`.

### Node Structure:
```json
{
  "id": "SOCIAL_COMPOSE",
  "node": "Compose Signal Button",
  "service": "socialMediaService.createPost",
  "status": "STABLE"
}
```
- **STABLE**: Path is fully functional.
- **REPAIRED**: Previously broken, now verified.
- **BROKEN**: Signal is dead; requires immediate attention.
- **PARTIAL**: Logical link exists but physical node (e.g., SMTP) is inactive.

---

## 4. Deep-Dive Forensics
When an `audit` fails, the system automatically generates a **Forensic Report** in `docs/qra_debug_[id].json`.

### Anatomy of a failure:
- **traceId**: The unique execution identifier.
- **payload**: The exact data sent during the failed resonance.
- **context**: The automated state at the moment of failure.

Use these files to perform surgical debugging or feed them into the `debugger` agent for automated healing.

---

## 5. Expanding the Neural Network
To add a new module to the AffeXAI dev system:
1. Identify interactive nodes in your `page.tsx`.
2. Map them to the corresponding `lib/api` service.
3. Register the path and circuits in `docs/system_circuit_map.json`.
4. Run `./bin/affexai audit` to verify initialization.

---

*“Error is not a failure; it’s a signal waiting to be resonant.”* - **AffeXAI Orchestrator**
