# Plan: AffeXAI Dev Portability Guide

**Goal**: Create a comprehensive guide for transplanting the "AffeXAI Dev" zero-error infrastructure (Agents, QRA, CLI, Scripts) to other projects.

## User Review Required

> [!IMPORTANT]
> The guide will assume the target project uses a similar tech stack (Next.js/Node.js) or at least a structure where `python` and `node` are available, as the system relies heavily on `checklist.py`, `lint_runner.py`, and `bin/affexai`.

## 1. Discovery Scope (Explorer Agent)
Identify all "System Artifacts" that must be copied:
- `.agent/` (Agents, Skills, Workflows, Scripts)
- `bin/` (The `affexai` CLI entry point)
- `docs/` (Templates like `system_circuit_map.json`)
- Root configs: `GEMINI.md`, `task.md` template.

## 2. Documentation Structure (Writer Agent)
**Target File**: `.agent/PORTABILITY_GUIDE.md`

### Section 1: The Core System
- Explanation of the "Zero-Error Architecture".
- Role of `.agent` folder and `GEMINI.md`.

### Section 2: Installation
- Step-by-step copy instructions.
- `cp -r .agent target_project/`
- `cp -r bin target_project/`
- Setting up the `affexai` alias.

### Section 3: Configuration
- How to customize `system_circuit_map.json` for a new project.
- Updating `GEMINI.md` rules for different project types (e.g., Mobile vs Web).

### Section 4: Validation
- How to run the first `affexai audit` in a new environment.

## 3. Verification Plan (DevOps Agent)
- Verify that the instructions cover dependency calls (e.g., does `checklist.py` need specific python packages?).
- Ensure paths in scripts are relative/dynamic and not hardcoded to "AffeXAI-main".

## 4. Execution Order
1.  **Explorer**: Map the dependencies.
2.  **Writer**: Draft the artifact.
3.  **DevOps**: Review and refine.
