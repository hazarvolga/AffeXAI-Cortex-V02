# Architecture: Email Automation Orchestration Engine

## Vision
To evolve the AffeXAI Email Module from a simple "task list" into a high-fidelity **Command Center for Brand Communication**. The system acts not just as a tool, but as a strategic partner that orchestrates intelligent, signal-driven transmission paths.

---

## 1. Core Architecture: The Nodal Command Center
We are moving away from linear lists to a **Spatial Orchestration Model**.

### 1.1 The Macro-Micro Nexus
- **Directory View (The List)**: The `/automations` page remains the administrative directory. It provides high-level telemetry (Active Nodes, Pulse Count, Success Rate) and quick access to status filters.
- **Transitional UX**: Clicking "EDIT" or "VIEW" on a list item triggers a semantic zoom transition, expanding the card into the full-screen **Nodal Canvas**.
- **The Workbench (The Canvas)**: A React Flow-powered infinite canvas where strategy is designed. It visualizes the "Neural Network" of the brand's communication.

### 1.2 Live Telemetry Visualization
- **Pulse Animations**: Active automations will show visual "pulses" traveling along the edges (connections) between nodes, representing real-time subscriber movement.
- **Node Health**: Nodes will glow Green (Optimal), Amber (Warning), or Red (Error) based on execution success rates.

---

## 2. Strategic Template Pack (Default Blueprints)
Instead of e-commerce focused "Cart Recovery" templates, we will provide **Brand Marketing specialized blueprints**:

### 2.1 [WELCOME_RESONANCE]
*For new subscriber acquisition and onboarding.*
- **Trigger**: New Subscriber Signal
- **Flow**: Delay 1m -> **Transmission: "Vision Alignment"** -> Delay 2d -> **Transmission: "Strategic Value"** -> Condition: Engaged? -> **Branch: "VIP Path" / "Standard Path"**.

### 2.2 [STAGNATION_RECOVERY]
*For re-activating dormant network nodes.*
- **Trigger**: No Signal (Open/Click) > 30 Days
- **Flow**: **Transmission: "Signal Check"** -> Wait 3d -> Condition: Opened? -> Yes: **Tag "Revived"** | No: **Transmission: "Final Pulse"** -> Exit.

### 2.3 [LEAD_VELOCITY]
*For accelerating potential leads into qualified status through education.*
- **Trigger**: Segement Entry (Lead)
- **Flow**: **Transmission: "Authority Piece 1"** -> Wait 1d -> **Transmission: "Case Study"** -> Condition: Clicked? -> **Alert: "Sales Team Notification"**.

### 2.4 [PREMIUM_LATTICE]
*For high-value VIP management.*
- **Trigger**: High Engagement Score (>80)
- **Flow**: **Tag "VIP"** -> **Transmission: "Exclusive Access"** -> **Wait 1w** -> **Transmission: "Founder's Note"**.

---

## 3. Implementation Phases

### Phase 5.1: Template Engine
- Build the `TemplateGallery` modal component.
- Implements the schema definitions for the 4 strategic blueprints.

### Phase 5.2: Unified Command Canvas
- Refactor `WorkflowBuilder` to support "ReadOnly" and "Live" modes.
- Implement the "Zoom Transition" from `AutomationList`.

### Phase 5.3: Logic Node Expansion
- Add `BranchNode` (A/B Testing), `DelayNode` (Advanced Temporal), and `WebhookNode` (External Sync).
