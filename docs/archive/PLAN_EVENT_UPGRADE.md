# 📋 Plan: Event Management Enterprise Upgrade

> **Strategy**: Option C+ (Visual Insight -> Form Builder -> Lifecycle Wizard)
> **Constraint**: Zero-Error Architecture with Commit/Restore checkpoints between phases.

## 📦 Phase 1: Visual Insight (The Quick Fix)
**Goal:** Solve the "Blind Choice" friction in `EventForm` immediately without breaking the current architecture.

### Tasks
1.  **Component Design (`TemplatePreviewModal`)**
    *   Create a reusable `Dialog` component that updates based on the selected Template ID.
    *   Inject high-fidelity mock content (Banner, Title, Description, Ticket UI) into the modal.
    *   Add "Select This Template" primary action within the modal.
2.  **`EventForm` Integration**
    *   Update the `templateId` grid in `apps/frontend/src/components/admin/event-form.tsx`.
    *   Add a "Hover > Eye Icon" or "Preview" button to each card.
    *   Connect the Preview button to the `TemplatePreviewModal`.
3.  **Authentication/Verification**
    *   Verify that the preview renders correctly on Desktop and Mobile (modal responsive modes).
    *   **COMMIT POINT**: `git commit -m "feat(events): add visual insight modal for templates"`

---

## 🛠️ Phase 2: Universal Form Builder (The Foundation)
**Goal:** Extract the Drag-and-Drop engine from `email-builder` to create a reusable `FormBuilder` for the entire project.

### Tasks
1.  **Architecture Refactor**
    *   Create `apps/frontend/src/components/shared/visual-builder`.
    *   Extract `email-builder-canvas.tsx` logic into a generic `BuilderCanvas`.
    *   Abstract "Block Types" so they can be injected (Email Blocks vs. Form Blocks).
2.  **Form Block Implementation**
    *   Create `blocks/form`: `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `DatePicker`.
    *   Create `FormPropertiesPanel` for configuring field labels, validation, and required status.
3.  **Integration Test**
    *   Create a standalone "Form Builder Playground" page (`/admin/dev/form-builder`) to verify functionality.
    *   **COMMIT POINT**: `git commit -m "feat(core): implement universal form builder engine"`

---

## 🚀 Phase 3: Lifecycle Wizard (The Enterprise Pivot)
**Goal:** Replace the monolithic `EventForm` with a guided "Intent-First" Wizard.

### Tasks
1.  **Backend "Blueprints"**
    *   Define `EventType` schemas (Webinar, Summit, Party).
    *   Map Types to Default Configs (e.g., Webinar = Online=True, Form=[Name, Email, Job]).
2.  **Frontend Wizard (`apps/frontend/src/app/[tenant]/admin/events/wizard`)**
    *   **Step 1 (Intent)**: Large cards selecting the Event Type.
    *   **Step 2 (Data Collection)**: Integrate the **Form Builder** from Phase 2 to customize the registration form.
    *   **Step 3 (Visuals)**: Visual Insight Matrix from Phase 1.
    *   **Step 4 (Logic)**: TIcket & Email settings.
3.  **Verification**
    *   End-to-End test of creating a complete event via the Wizard.
    *   **COMMIT POINT**: `git commit -m "feat(events): launch new lifecycle wizard"`

---

## 📅 Execution Schedule
- **Now:** Phase 1 Implementation.
- **Next:** Phase 2 Architecture.
- **Final:** Phase 3 Integration.
