# Plan: AffeXAI Dev Comprehensive User Guide

Creating a definitive guide for the **AffeXAI dev (Zero-Error Architecture)** system.

## 1. Objective
Provide a clear, technical, and operational manual for utilizing the `affexai` command-line tool, understanding the Resonance Audit cycle, and managing the System Circuit Map.

## 2. Orchestration Matrix (Min. 3 Agents)
- `project-planner`: Structure definition and section mapping.
- `explorer-agent`: Context retrieval from `bin/affexai`, `scripts/qra/`, and `docs/system_circuit_map.json`.
- `documentation-writer`: Drafting the high-fidelity `AFFEXAI_DEV_GUIDE.md` in the root directory.

## 3. Guide Architecture
1.  **Overview**: The Vision of Zero-Error Engineering.
2.  **Command Reference**: 
    - `audit`: How resonance probes work.
    - `manage`: interpreting the Circuit Map.
    - `heal`: The roadmap for surgical repairs.
3.  **Circuit Map Syntax**: Defining nodes, services, and resonance statuses.
4.  **Forensic Deep-Dive**: How to read `qra_debug_*.json` reports.
5.  **Extending the System**: Mapping new modules into the Neural Context.

## 4. Deliverables
- [ ] `AFFEXAI_DEV_GUIDE.md` created in project root.
- [ ] Code snippets and usage examples verified.

## Verification Plan
- **Markdown Lint**: Ensure clean document structure.
- **Accuracy Audit**: Verify that all commands listed in the guide match the implementation in `bin/affexai`.
