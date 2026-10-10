# Plan: Editorial Migration Plan

## 1. Objective
Migrate the **Brand Communication Center (BCC)** and its sub-modules (Intelligence, Strategy, Resonance, etc.) to the **Editorial Console** aesthetic. This ensures a consistent "System Intelligence Interface" design across the platform.

## 2. Technical Strategy
We will follow the **Local Wrapper Pattern** established in previous BCC refactors.

### Core Components
- `BccEditorialWrapper`: The foundational layout component.
- `BccCollapsibleSidebar`: The new navigation system for BCC modules.
- `[Context]LayoutWrapper`: Local wrappers for each module (e.g., `IntelligenceLayoutWrapper`).

## 3. Implementation Steps

### Phase 1: Foundation
- [ ] **Sidebar Integration**: Update `BccCollapsibleSidebar` to handle active states for all BCC modules.
- [ ] **Theme Sync**: Ensure `tenant-admin` and `super-admin` identities use the correct accent colors (Green/Orange).

### Phase 2: Refactoring Sub-Modules
- [ ] **Brand Intelligence**: Refactor `/admin/brand` or sub-pages to use `IntelligenceLayoutWrapper`.
- [ ] **Strategic Insights**: Migrate `/admin/strategy` to the editorial layout.
- [ ] **Resonance Analytics**: Migrate the resonance module to the same pattern.

### Phase 3: UX & Performance
- [ ] **Hydration Safety**: Ensure all new wrappers are hydrated safely to prevent white-screen issues.
- [ ] **Loading/Error States**: Sync loading states to use the local wrappers to avoid layout shifts.

## 4. Verification
- [ ] Verify that the sidebar correctly expands/collapses without overlapping content.
- [ ] Confirm `isSuperAdmin` checks are resilient in the new layouts.
- [ ] Audit color consistency (Primary `#f9f906` and BCC identity accents).

---
> [!NOTE]
> This plan is documented and committed as requested before implementation phase begins.
