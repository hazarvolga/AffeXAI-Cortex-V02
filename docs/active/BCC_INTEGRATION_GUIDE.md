# BCC Design System Integration Guide: Hybrid AI & RAG

## 🟢 RAG Integration (Qdrant)
To enable Long-Term Memory (RAG), you must connect to the remote Qdrant instance.

### 1. Start the Secure Tunnel
Run this script in a background terminal. It creates a secure bridge to Hulya Server 2.
```bash
./scripts/qdrant-tunnel.sh
```
*   **Port:** 6333 (Mapped to localhost:6333)
*   **Auth:** Uses your existing SSH keys for `root@161.118.171.201`

### 2. Verify Connection
open http://localhost:6333 in your browser. You should see the Qdrant version info.

---

# BCC Design System Integration Guide

This document serves as the technical reference for migrating multi-tenant admin pages to the **Brand Communication Center (BCC)** design system.

## 🔐 Development Credentials
- **Superuser**: `superuser@affexai.com` / `Super123!`
- **Admin**: `admin@affexai.com` / `admin`

## 🎨 Design Philosophy: "Editorial Console"
- **Base Theme**: Obsidian/Dark Mode (`bg-[#09090b]`, `bg-black`).
- **Accent Identity**: AffeX Green (`#9df425`) and Orange (`#ff8c00`).
- **Aesthetic**: Glassmorphism, mono-spaced typography for metrics, and dense information display.

---

## 🏗️ Core Components & Patterns

### 1. `BccEditorialWrapper`
The primary layout shell. It provides the standardized header and telemetry bars.

**Standard Usage:**
```tsx
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';

return (
  <BccEditorialWrapper
    headerTitle="MODULE_NAME"
    headerSubtitle="Functional description of the module."
    headerBadge="BADGE_TEXT"
    telemetryData={[
      { label: "METRIC_1", value: "VALUE_1" },
      { label: "STATUS", value: "OPTIMAL" }
    ]}
    action={<Button>ACTION</Button>}
  >
    {/* Page Content */}
  </BccEditorialWrapper>
);
```

### 2. `BccHudTile`
Used for top-level statistical metrics. Replacing standard `Card` components.

**Critical Rule**: Always use string identifiers for icons, not raw component classes.
```tsx
import { BccHudTile } from '@/components/brand/BccHudTile';

<BccHudTile 
  title="METRIC_TITLE" 
  subtitle="Description" 
  icon="inbox" // "visible", "star", "verified", "schedule", "wizard"
>
  <div className="text-3xl font-bold font-mono tracking-tighter">
    {value}
  </div>
</BccHudTile>
```

### 3. Management Registries (Tables)
Tables should be contained in glassmorphic containers.

- **Container**: `border border-white/5 bg-white/[0.02] rounded-md overflow-hidden`
- **Header**: `bg-black/40`
- **Typography**: Metrics and labels should use `font-mono text-[10px] uppercase tracking-widest`.
- **Badges**: Use `rounded-none`, `border-white/10`, and identity colors for "Live" status.

### 4. Dialogs & Modals
All dialogs must be dark-themed to prevent "flash-bang" effect.

```tsx
<DialogContent className="bg-[#0a0a0a] border-white/10 text-white shadow-2xl">
  {/* Content */}
</DialogContent>
```

---

## 📋 Support Module Migration Status

| Page | Status | Key Components |
| :--- | :--- | :--- |
| `categories` | ✅ DONE | Registry Table |
| `new` | ✅ DONE | Form Layout |
| `knowledge-sources` | ✅ DONE | Complex Dashboard, HudTiles |
| `analytics` | ✅ DONE | Multi-Tab Dashboard, HudTiles |
| `templates` | ✅ DONE | Card Grid, Creation Dialog |
| `knowledge-base` | ✅ DONE | Fixed Runtime Error, HudTiles |
| `macros` | ✅ DONE | Operational Registry, HudTiles |
| `faq-learning` | ✅ DONE | Review Registry, HudTiles |
| `settings` | ✅ DONE | - |
| `page.tsx` (Dashboard) | ⏳ PENDING | Needs Migration |

---

## 🛠️ Common Fixes
- **Runtime Error**: `Objects are not valid as a React child`. 
  - **Cause**: Passing Lucide component objects to `BccHudTile`.
  - **Fix**: Use strings (`"inbox"`) or renderable JSX (`<Icon />`).

---

## 📌 Next Steps
When resuming work:
1. Reference `BCC_AUDIT_REPORT.md` for remaining pages across all modules.
2. Prioritize `Email Module` after completing the `Support` module.
