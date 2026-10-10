# Plan: Modules Page Content Mapping (Functional Hub)

## 1. Concept: "System Intelligence Surface" as a Functional Hub
The `/modules` page serves as the central gateway to the AffeXAI platform's capabilities. It lists the high-level functional modules available to the enterprise.

## 2. Functional Module Mapping (Module Matrix)
We map the user-facing features to the "System Intelligence" aesthetic.

| Functional Module | System Name | Description | Status |
| :--- | :--- | :--- | :--- |
| **Social Media** | **SOCIAL_ARRAY** | Omni-channel signal monitoring and response matrix. | **ACTIVE** |
| **Event Management** | **EVENT_HORIZON** | Physical and digital gathering orchestration system. | **ACTIVE** |
| **Email Marketing** | **CAMPAIGN_RELAY** | High-volume outbound communication dispatcher. | **IDLE** |
| **Support Tickets** | **SUPPORT_NEXUS** | Customer resolution and issue tracking core. | **ACTIVE** |
| **Knowledge Base** | **KNOWLEDGE_CORE** | Self-learning information architecture. | **STABLE** |
| **Certificates** | **CERT_AUTHORITY** | Automated credential issuance and verification. | **ACTIVE** |
| **Email Validation** | **VALIDATION_GATE** | Real-time syntax and deliverability verification. | **ACTIVE** |
| **IP Reputation** | **THREAT_INDEX** | Global blocklist monitoring and sender score analysis. | **ACTIVE** |

## 3. Attention Queue (Insights)
Real-world examples of what these modules detect:
*   `SOCIAL_SENTIMENT_SPIKE` (from Social Array)
*   `EVENT_CAPACITY_WARN` (from Event Horizon)
*   `TICKET_VOLUME_ANOMALY` (from Support Nexus)

## 4. Vectors (Quick Actions)
*   `INITIATE_CAMPAIGN`
*   `ORGANIZE_EVENT`
*   `ANALYZE_SENTIMENT`
*   `ISSUE_CERTIFICATES`

## 5. Execution
*   Update `apps/frontend/src/app/(marketing)/modules/page.tsx` with this specific list.
*   Ensure the design remains "Unified Command" but the content clearly indicates functionally what the platform does.
