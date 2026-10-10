## 🧠 Brainstorm: Event Managment & Form Architecture (Option C+)

### Context
**User Decision:** We are proceeding with **Option C (Lifecycle Templates)**.
**Key Insight:** There is a critical gap in "Form Management" across the project (Event Registration, Email Marketing Lead Gen).
**Technical Discovery:** The project already has a robust `email-builder` (custom Drag-and-Drop engine). We can refactor this into a "Universal Builder" core.

---

### 🚀 The "Option C+" Strategy: Lifecycle + Universal Builder

This strategy integrates the "Event Type" selection with a new "Form Command" module, unifying how users gather data across the platform.

#### 1. The Lifecycle Wizard (Frontend)
A new "Create Event" flow replacing the split-screen form:
*   **Step 1: Intent**: "What are you hosting?" (Webinar, Summit, Party, Networking)
*   **Step 2: Configuration**: "Lifecycle Logic" (Auto-selects Ticket Types, Email Sequences, and **Default Registration Form**).
*   **Step 3: Design**: Visual Selection (The "Visual Insight" modal from Opt A is used here).

#### 2. The Universal Form Builder (New Core Module)
We will extract the "Drag-and-Drop" logic from `apps/frontend/src/components/email-builder` into a shared `ui/builder-core`.
*   **Reuse:** The `Row > Column > Block` architecture is perfect for Forms.
*   **New Blocks:** Instead of `image` or `text`, we add `input`, `select`, `checkbox`, `payment_field`.
*   **Usage:**
    *   **Events:** "Customize Registration Form" uses this builder.
    *   **Email Marketing:** "Create Lead Gen Form" uses this builder.

#### 3. Architecture Change
*   **Old:** `EventForm` (Monolithic React Component) -> `eventsService`
*   **New:**
    *   `LifecycleWizard` (Orchestrator)
    *   `FormBuilder` (Visual Editor for JSON Schema)
    *   `TemplateEngine` (Backend mapper for Type -> Config)

---

### Implementation Plan (Phased)

#### Phase 1: The "Visual Insight" Fix (Immediate - 2 Days)
*   **Goal:** Solve the immediate UX pain point while we architect the big shift.
*   **Action:** Add the "Preview Modal" to the current `EventForm` (from Brainstorm Option A).
*   **Why:** Gives the user immediate relief while we build the Form Builder.

#### Phase 2: The "Form Command" Core (Next Sprint - 1 Week)
*   **Goal:** Create the Form Builder engine.
*   **Action:**
    *   Refactor `email-builder-canvas.tsx` -> `generic-builder-canvas.tsx`.
    *   Create `FormBlockRegistry` (Input, Email, Phone, Checkbox).
    *   Create `FormPropertiesPanel`.

#### Phase 3: The "Lifecycle" Pivot (Q2 - 2 Weeks)
*   **Goal:** Shift the entire "New Event" flow to the Wizard.
*   **Action:**
    *   Build `Blueprint` backend service (maps Event Type -> Default Form + Email Seq).
    *   Deploy the new 3-Step Wizard.

---

## 💡 Recommendation

We proceed with **Option C+**.
To start, I will implement **Phase 1** (Visual Insight Modal) immediately to fix the user's current "blindness" complaint.
Simultaneously, I will spec out the **Phase 2** (Form Builder) architecture.

**Approval Request:**
Shall I start implementing **Phase 1 (Visual Insight Modal)** now to close the immediate gap?
