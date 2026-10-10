# Plan: Logic Node Expansion (Phase 5.3)

## Goal
Enhance the Automation Command Canvas with high-fidelity logic processors that allow for branching strategies, temporal control, and subscriber metadata management.

---

## 1. New Node Definitions

### 1.1 [BranchNode] (A/B Split)
*Visuals*: Diamond shape (Standard Flowchart decision) or Split Container.
*Function*: Splits the workflow into two distinct paths based on a condition or random distribution.
*Data Schema*:
```typescript
interface BranchNodeData {
  label: string;
  type: 'CONDITION' | 'RANDOM_SPLIT';
  condition?: {
    field: string; // e.g., 'open_rate', 'tags'
    operator: 'gt' | 'lt' | 'eq' | 'contains';
    value: any;
  };
  splitRatio?: [50, 50]; // Defaults to 50/50 for A/B
}
```
*UI*: Two source handles (Bottom-Left: "True/A", Bottom-Right: "False/B").

### 1.2 [DelayNode] (Advanced Temporal)
*Visuals*: Clock/Hourglass Icon (Amber/Orange).
*Function*: Pauses execution. Existing node needs upgrade.
*Refactor*: Add support for "Wait Until" and "Wait for Event".
*Data Schema*:
```typescript
interface DelayNodeData {
  label: string;
  mode: 'DURATION' | 'SPECIFIC_TIME' | 'EVENT';
  duration?: number; // seconds
  targetTime?: string; // ISO timestamp or CRON
  waitForEvent?: string; // e.g., 'LINK_CLICKED'
}
```

### 1.3 [TagNode] (Metadata Action)
*Visuals*: Tag Icon (Blue/Cyan).
*Function*: Adds or removes tags from the subscriber profile.
*Data Schema*:
```typescript
interface TagNodeData {
  label: string;
  action: 'ADD' | 'REMOVE';
  tags: string[];
}
```

---

## 2. Component Architecture

### 2.1 Node Registry (`src/components/.../automation/nodes/`)
- Create `BranchNode.tsx`: Custom Node component with multiple handles.
- Create `TagNode.tsx`: Simple action node.
- Update `DelayNode.tsx`: Enhance label display to show mode.

### 2.2 Configuration Panel (`configuration-panel.tsx`)
- Implement `BranchConfigForm`: Form for Logic/Split settings.
- Implement `DelayConfigForm`: Tabbed interface (Duration | Until | Event).
- Implement `TagConfigForm`: Multi-select for tags.

### 2.3 Sidebar (`step-library-sidebar.tsx`)
- Add "Logic" section.
- Add draggable items for "Split Path" and "Tag Subscriber".

---

## 3. Implementation Steps (Orchestration)

| Agent | Task |
|-------|------|
| **frontend-specialist** | Create `BranchNode` and `TagNode` custom components in React Flow. |
| **frontend-specialist** | Update `StepLibrarySidebar` to include new nodes. |
| **backend-specialist** | Update `ConfigurationPanel` to handle new node data types. |
| **test-engineer** | Verify handle connections and data persistence. |

---

## 4. Verification Criteria
- [ ] Dragging "Split Path" to canvas creates a Diamond node.
- [ ] Branch Node has 2 output handles.
- [ ] Connecting Edge A and Edge B works independently.
- [ ] Tag Node configuration saves to node data.
