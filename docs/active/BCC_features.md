# Brand Communication Center (BCC) - AI Features & Roadmap

## 🧠 Core Vision
The BCC is the central nervous system of AffeXAI, designed to not just "chat" but to **listen (Ingest)**, **think (Strategize)**, and **act (Present/Execute)** based on brand signals.

## 🏗️ Layer 1: The Sensory System (Ingestion) [✅ Established]
**Goal:** Gather raw data and turn it into vector memories.
*   **Infrastructure:** Qdrant (Hulya Server / Remote).
*   **Mechanism:** Secure SSH Tunnel (Localhost:11434 -> Remote).
*   **Data Sources (Signals):**
    *   User inputs (Mission Control).
    *   System events (Editorial Console).
    *   *Upcoming:* Social listening, Market data.

## 🧠 Layer 2: The Strategist (Strategy & Processing) [🚧 Active Focus]
**Frontend Agent:** `AiCoPilot.tsx`
*   **Role:** Embedded AI assistant available in every module (Email, Social, etc.).
*   **Placement:** **Inline Header** (not floating). Configured to sit above/next to Page Titles (e.g., "Node Deployment") via `BccEditorialWrapper`.
*   **Mechanism:** Sends `context` (e.g., 'event_node_creator') and `data` to backend.

**Backend Refactor:** `StrategyService`
*   **Current Issue:** Hardcoded Axios call to `http://161.118...:3000`.
*   **New Logic:**
    1.  Receive `context` + `draftContent`.
    2.  Construct a **Strategic System Prompt** (e.g., "You are a Brand Strategist... context is email...").
    3.  Route via `AiService` -> `AI_PROVIDER_URL` (Localhost Tunnel) -> Remote Ollama.
    4.  Return actionable insight to UI.

## 🎨 Layer 3: The Presentation (User Experience) [📅 Planned]
**Goal:** Present complex strategies in an intuitive, dashboard-like interface.
*   **Interface:** "The Overseer" & "The Auditor" dashboards.
*   **Components:**
    *   Real-time "Brain Activity" visualization (3D/Pulse).
    *   Strategy Cards with "Approve/Reject" flows.
    *   Live Cost & Token Metering.

## 🚀 Deployment Strategy
*   **Development:** fully Local (Hybrid Mode).
*   **Staging:** Deploy Backend to Server 1 (Orko) only when "Production Ready".
*   **Production:** Full cluster deployment.
