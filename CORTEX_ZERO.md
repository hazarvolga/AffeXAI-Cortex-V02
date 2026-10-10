# CORTEX ZERO - Project Persistent Memory v1.0
**Project:** AffexAI Universal Neural Grid
**Identity:** Autonomous Multi-Tenant Intelligence & Ecosystem Command

---

## 🧠 Core Architecture: Neural Grid Backbone
The system is built on a central "Merkezi Sinir Sistemi" (Central Nervous System) called **Neural Grid Service**. 

### 📡 Signal Protocols
- All modules (Tickets, Social, Email, Forms) emit `neural.signal` via `EventEmitter2`.
- **Standard Interface:** `NeuralSignal` (tenantId, source, type, successScore, context, data).
- **Backbone Listener:** `NeuralGridService` in `apps/backend/src/modules/neural-grid`.

### 🏆 Reward Logic (Current Integration)
1. **Tickets:** `ticket.created` (Context), `ticket.resolved` (**+5 Reward**).
2. **Social Media:** `post.created`. (High engagement analysis pending).
3. **Email Marketing:** `email.opened` (**+1**), `email.clicked` (**+5**), `email.unsubscribed` (**-10 Penalty**).
4. **Forms:** `form.submitted` (**+2**).

---

## 🎯 Development Roadmap (Cortex Vision)
- **Phase 1 (Backbone):** [DONE] Central event bus and global ingestion service.
- **Phase 2 (Omni-Channel):** [DONE] Integration across all key business modules.
- **Phase 3 (Reciprocity):** [UP NEXT] Strategy Engine uses these rewards to adjust AI behavior via RAG.
- **Phase 4 (Autonomy):** Final goal where the system autonomously generates strategies for each tenant based on learned "Success Signals".

---

## 🛠️ Critical Paths
- **Backend Core:** `apps/backend/src/modules/neural-grid`
- **Frontend Vision:** `apps/frontend/src/app/(marketing)/manifesto`
- **Strategy Logic:** `apps/backend/src/modules/strategy/services/strategy.service.ts`

> [!IMPORTANT]
> If a server restart or session timeout occurs, read this file FIRST to restore implementation context.
