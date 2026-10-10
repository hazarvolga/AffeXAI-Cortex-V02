# Plan: Mock Data Migration & Project Audit

**Goal**: Eliminate hardcoded "mock" data from the frontend and ensure all dashboard visualizations reflect real system state.

## User Review Required

> [!WARNING]
> This migration will reveal "Empty States" in the dashboard.
> Currently, the dashboard looks "alive" because of fallback randomizers (e.g., `CampaignsBarChart` generates random stats if no data exists).
> After this change, if you have 0 campaigns, the charts will show 0 data. This is **correct** behavior but visually less appealing for demos without seed data.

## 1. Audit Findings

### A. Pure Mocks (High Priority)
| Component | Location | Issue | Requirement |
|-----------|----------|-------|-------------|
| `SocialMediaAreaChart` | `dashboard/charts` | Uses hardcoded `mockData` array. | Backend missing `getEngagementTrend` endpoint. |

### B. Soft Mocks / Fallbacks (Medium Priority)
| Component | Location | Issue | Requirement |
|-----------|----------|-------|-------------|
| `EventsTrendChart` | `dashboard/charts` | Generates random participants if count is 0. | Remove fallback logic. |
| `CampaignsBarChart` | `dashboard/charts` | Generates random open/click rates if data missing. | Remove fallback logic. |
| `CmsStatsChart` | `dashboard/charts` | Shows "Veri Yüklenemedi" but mimics data structure. | Ensure clean empty state. |

### C. Verified Real (No Action)
- `CrmController` & `crmService`: Fully wired to DB.
- `SocialMediaService` (Posts/Stats): Wired to DB (except Trend).
- `Profile`: Wired to Auth/User service.

## 2. Implementation Strategy

### Phase 1: Backend Implementation (Missing Endpoints)
**Agent**: `backend-specialist`

#### [NEW] Social Media Trend Endpoint
- **File**: `apps/backend/src/modules/social-media/social-media.controller.ts`
- **Action**: Implement `GET /social-media/analytics/trend`.
- **Logic**: Aggregate post analytics grouped by date (last 7 days).

### Phase 2: Frontend Integration
**Agent**: `frontend-specialist`

#### [MODIFY] Social Media Service
- **File**: `apps/frontend/src/lib/api/socialMediaService.ts`
- **Action**: Add `getEngagementTrend()` method calling the new endpoint.

#### [MODIFY] Chart Components
- **Files**: `SocialMediaAreaChart`, `EventsTrendChart`, `CampaignsBarChart`
- **Action**: 
    1.  Remove `mockData` arrays.
    2.  Remove `|| Math.random()` fallback logic.
    3.  Implement legitimate `Loading` and `Empty` states.

## 3. Verification Plan

### Automated Tests
- Run `security_scan.py` to ensure no sensitive data was hardcoded (unlikely, but good practice).
- Run `lint_runner.py` to check for unused variables after removing mocks.

### Manual Verification
1.  **Seed Data**: Create 1 real Social Post, 1 Event, 1 Campaign.
2.  **Verify Dashboard**: Check if charts reflect exactly 1 data point each.
