# Plan: FAQ Learning Settings Page BCC Migration

## 1. Analysis
- **Current State**: Complex, data-driven form with 8 tabs, dynamic rendering based on backend config, and heavy state management. Uses standard Shadcn/Light theme.
- **Target State**: BCC "Editorial Console" (Dark, Glassmorphism, Monospace Data).
- **Constraint**: **NO MOCK DATA**. Must preserve `FaqLearningService` integration.
- **Target File**: `apps/frontend/src/app/[tenant]/admin/support/faq-learning/settings/page.tsx`

## 2. Design Mapping

| Element | Current Component | BCC Replacement |
| :--- | :--- | :--- |
| **Layout** | `div` wrapper | `BccEditorialWrapper` |
| **Tabs** | `Tabs`, `TabsList` | Glassmorphic Tabs with Neon Active State |
| **Config Cards** | `Card` | `border-white/5 bg-[#0a0a0a]/40` Container |
| **Inputs (Number)** | `Input type="number"` | Dark Input, `font-mono text-[#9df425]` |
| **Sliders** | `Slider` | Neon Track (`bg-[#9df425]`), Dark Thumb |
| **Switches** | `Switch` | Neon Toggle |
| **Actions** | `Button` | Uppercase, Tracking-Widest, Neon Borders |
| **Validation** | `Toast` | BCC Styled Toast / Terminal Alert |

## 3. Implementation Plan

### Phase 1: Layout & Wrapper Integration
- [ ] Implement `BccEditorialWrapper` with proper telemetry (e.g., "Active Configs", "Last Sync").
- [ ] Retain all `FaqLearningService` calls (`getConfig`, `bulkUpdateConfig`, `resetConfigSection`).

### Phase 2: Tab System Overhaul
- [ ] Refactor `TabsList` to use a dense, glassmorphic rail style.
- [ ] Ensure active tab has a glowing neon underline or border.
- [ ] Map icons (Lucide) to each tab label for a "Console" feel.

### Phase 3: Dynamic Form Styling
- [ ] **Numeric Inputs**: Apply `font-mono` and neon colors to all number fields.
- [ ] **Sliders**: Customize the slider component to match the BCC "Cyber" aesthetic.
- [ ] **Text Areas/Inputs**: Set backgrounds to `bg-black/50`, borders to `border-white/10`.
- [ ] **Validation Messages**: Display as terminal warnings.

### Phase 4: Action Bar & Feedback
- [ ] Redesign the "Save All" and "Reset" buttons to fit the footer rail.
- [ ] Update the specific logical components (like Connection Quality indicator) to use BCC status dots.

### Phase 5: Verification
- [ ] **Functional**: Verify "Save" writes to real backend (check Network tab).
- [ ] **Functional**: Verify "Reset" restores real values.
- [ ] **Visual**: Check dark mode contrast and responsiveness.
- [ ] **Data**: Ensure no data is lost during the UI transition.

## 4. Technical Considerations
- The page uses `transformToConfigSections` to render inputs. We must modify the *rendering* of these sections without changing the *data structure*.
- `ConfigSetting` interface layout needs to be preserved but styled differently.
