# 🚀 Phase 4b & 4c Implementation Plan

**Date:** 2026-02-09  
**Status:** Ready for Implementation  
**Estimated Time:** 10-14 hours total

---

## 🎯 Objectives

Complete Phase 4 (Infrastructure & Access Management) by implementing:
1. **Phase 4b:** System Logs Module (`admin/logs`)
2. **Phase 4c:** Roles & Permissions (`admin/roles`)

---

## 📋 Phase 4b: System Logs Module

### Design Specification

**Route:** `/[tenant]/admin/logs`  
**Aesthetic:** "Black Box" - Terminal-inspired monitoring console  
**Priority:** High (Infrastructure critical)

### Visual Design

**Color Palette:**
- Background: `#050505` (Pure black)
- Text: `#ffffff` (White)
- Info logs: `#9df425` (Neon green)
- Warning logs: `#ff8c00` (Amber)
- Error logs: `#ff0000` (Red)
- Borders: `rgba(255,255,255,0.05)`

**Typography:**
- Primary: `JetBrains Mono` or `Geist Mono`
- Size: `10px` - `12px` (monospace)
- Tracking: Wide (`0.1em` - `0.2em`)

### Components to Build

#### 1. Page Structure (`admin/logs/page.tsx`)
```tsx
<BccEditorialWrapper
  headerTitle="System Logs"
  headerSubtitle="Real-time event monitoring and diagnostics"
  headerBadge="Black_Box"
  telemetryData={[
    { label: "Events/Sec", value: eps, color: "#9df425" },
    { label: "Error Rate", value: errorRate, suffix: "%", color: "#ff0000" }
  ]}
>
  <LogsConsole />
</BccEditorialWrapper>
```

#### 2. LogsConsole Component
- Virtualized list (react-window or react-virtual)
- Real-time streaming support
- Query-param filtering
- Severity color coding

#### 3. Telemetry HUD
- Events Per Second (EPS)
- Error Rate (%)
- Last Sync Timestamp
- Active Filters Count

### Implementation Steps

**Step 1: Scaffold Structure** (30 min)
- [ ] Create `apps/frontend/src/app/[tenant]/admin/logs/page.tsx`
- [ ] Create `apps/frontend/src/components/logs/LogsConsole.tsx`
- [ ] Create `apps/frontend/src/components/logs/LogEntry.tsx`

**Step 2: Mock Data** (30 min)
- [ ] Create mock log generator
- [ ] Generate 10k+ sample logs
- [ ] Test virtualized rendering

**Step 3: UI Implementation** (2-3 hours)
- [ ] Implement BccEditorialWrapper integration
- [ ] Build LogsConsole with virtualized list
- [ ] Add severity color coding
- [ ] Implement filter controls

**Step 4: Backend Integration** (1-2 hours)
- [ ] Create API endpoint for log streaming
- [ ] Implement query-param filtering
- [ ] Add real-time WebSocket support (optional)

**Step 5: Testing** (1 hour)
- [ ] Test with 10k+ logs
- [ ] Verify scroll performance
- [ ] Test filtering
- [ ] Verify real-time updates

---

## 📋 Phase 4c: Roles & Permissions

### Design Specification

**Route:** `/[tenant]/admin/roles`  
**Aesthetic:** "Access Grid" - High-contrast permission matrix  
**Priority:** High (Security critical)

### Visual Design

**Color Palette:**
- Background: `#0a0a0a` (Obsidian)
- Active permissions: `#9df425` (Neon green)
- Inactive permissions: `rgba(255,255,255,0.1)`
- Hover: `rgba(255,140,0,0.2)` (Amber glow)

**Layout:**
- Dense matrix grid
- Rows: Resources (Pages, Features, Actions)
- Columns: Roles (Admin, Editor, Viewer, etc.)
- Cells: Toggle switches or signal lights

### Components to Build

#### 1. Page Structure (`admin/roles/page.tsx`)
```tsx
<BccEditorialWrapper
  headerTitle="Access Control"
  headerSubtitle="Role-based permission management"
  headerBadge="Access_Matrix"
  telemetryData={[
    { label: "Active Sessions", value: activeSessions, color: "#9df425" },
    { label: "Elevated Privileges", value: elevatedCount, color: "#ff8c00" }
  ]}
>
  <PermissionMatrix />
</BccEditorialWrapper>
```

#### 2. PermissionMatrix Component
- Grid layout (CSS Grid or Table)
- Toggle switches for permissions
- Role management sidebar
- Resource grouping

#### 3. Telemetry HUD
- Active Sessions
- Elevated Privileges Granted
- Last Permission Change
- Audit Log Count

### Implementation Steps

**Step 1: Scaffold Structure** (30 min)
- [ ] Create `apps/frontend/src/app/[tenant]/admin/roles/page.tsx`
- [ ] Create `apps/frontend/src/components/roles/PermissionMatrix.tsx`
- [ ] Create `apps/frontend/src/components/roles/RoleEditor.tsx`

**Step 2: Mock Data** (30 min)
- [ ] Define permission schema
- [ ] Create mock roles and resources
- [ ] Generate sample permission matrix

**Step 3: UI Implementation** (3-4 hours)
- [ ] Implement BccEditorialWrapper integration
- [ ] Build PermissionMatrix grid
- [ ] Add toggle switches
- [ ] Implement role editor sidebar

**Step 4: Backend Integration** (2-3 hours)
- [ ] Create RBAC API endpoints
- [ ] Implement permission update logic
- [ ] Add session monitoring
- [ ] Create audit logging

**Step 5: Testing** (1 hour)
- [ ] Test permission toggling
- [ ] Verify role updates
- [ ] Test session tracking
- [ ] Verify audit logs

---

## 🔄 Implementation Order

### Day 1: Phase 4b (System Logs)
1. Morning: Scaffold + Mock Data (1 hour)
2. Midday: UI Implementation (3 hours)
3. Afternoon: Backend Integration + Testing (2 hours)

### Day 2: Phase 4c (Access Control)
1. Morning: Scaffold + Mock Data (1 hour)
2. Midday: UI Implementation (4 hours)
3. Afternoon: Backend Integration + Testing (3 hours)

---

## ✅ Acceptance Criteria

### Phase 4b (System Logs)
- [ ] Page accessible at `/[tenant]/admin/logs`
- [ ] Virtualized list handles 10k+ logs smoothly
- [ ] Filtering works (severity, module, timestamp)
- [ ] Real-time telemetry HUD active
- [ ] BCC Editorial design consistent

### Phase 4c (Access Control)
- [ ] Page accessible at `/[tenant]/admin/roles`
- [ ] Permission matrix displays all resources/roles
- [ ] Toggle switches update permissions
- [ ] Session telemetry HUD active
- [ ] BCC Editorial design consistent

---

## 🚦 Quality Gates

**Before Completion:**
1. Run `npm run build` - Must pass ✅
2. Visual regression check - No layout breaks ✅
3. Performance audit - <16ms frame time ✅
4. Type safety - No `any` types ✅

---

**End of Plan**
