# Social Media Backend Implementation Plan

**Objective:** Build a robust, scalable backend module for managing social media accounts (Twitter/X, LinkedIn), scheduling posts, and tracking analytics.

**Phase:** 1 (Foundation & Architecture)

---

## 1. Architecture Overview

We will create a new NestJS module `SocialMediaModule` in `apps/backend/src/modules/social-media`.

### Components
1.  **Controller:** `SocialMediaController` (Endpoints for UI)
2.  **Services:**
    *   `SocialMediaService`: Core logic (CRUD for accounts/posts).
    *   `SocialIntegrationService`: Factory/Strategy pattern to handle provider-specific logic (Twitter vs LinkedIn).
    *   `SocialAnalyticsService`: Aggregating metrics.
3.  **Entities (TypeORM):**
    *   `SocialAccount`: Stores OAuth tokens and profile info.
    *   `SocialPost`: Stores content, media URLs, schedule time, and status.
4.  **Queues (BullMQ):**
    *   `social-queue`: Handling scheduled posts and background analytics sync.

---

## 2. Database Schema (PostgreSQL)

### `SocialAccount` Entity
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `userId` | UUID | Owner (Foreign Key -> User) |
| `provider` | Enum | `TWITTER`, `LINKEDIN`, `FACEBOOK`, `INSTAGRAM` |
| `providerAccountId` | String | ID from the platform (e.g., Twitter user ID) |
| `accessToken` | String | Encrypted OAuth token |
| `refreshToken` | String | Encrypted refresh token |
| `tokenExpiresAt` | Timestamp | Token expiration |
| `profileData` | JSONB | Name, avatar, handle, follower count |
| `isActive` | Boolean | Default true |

### `SocialPost` Entity
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `userId` | UUID | Creator |
| `accountId` | UUID | Target account (FK -> SocialAccount) |
| `content` | Text | Post text |
| `mediaUrls` | String[] | Array of image/video URLs |
| `scheduledAt` | Timestamp | When to post (NULL = immediate) |
| `publishedAt` | Timestamp | Actual publish time |
| `status` | Enum | `DRAFT`, `SCHEDULED`, `PUBLISHED`, `FAILED` |
| `platformPostId` | String | ID returned by platform after posting |
| `analytics` | JSONB | Likes, shares, impressions snapshot |

---

## 3. API Endpoints

### Accounts
-   `GET /social/accounts`: List connected accounts.
-   `POST /social/connect/:provider`: Start OAuth flow (returns redirect URL).
-   `GET /social/callback/:provider`: OAuth callback handler.
-   `DELETE /social/accounts/:id`: Disconnect account.

### Posts
-   `GET /social/posts`: List posts (filter by status, account).
-   `POST /social/posts`: Create a new post (immediate or scheduled).
-   `PATCH /social/posts/:id`: Edit a scheduled/draft post.
-   `DELETE /social/posts/:id`: Delete a post.

---

## 4. Implementation Steps

### Step 1: Module Skeleton & Entities
-   Create module structure.
-   Define `SocialAccount` and `SocialPost` entities.
-   Run migrations.

### Step 2: Service Layer - Account Management
-   Implement `social-account.service.ts`.
-   Implement secure token storage (AES-256 encryption via existing `EncryptionService` or `ConfigService`).

### Step 3: Provider Integration (The Hard Part)
-   Create `SocialProvider` interface.
-   Implement `TwitterProvider` (using `twitter-api-v2`).
-   Implement `LinkedInProvider` (using official REST API).
-   Implement OAuth flows.

### Step 4: Posting Logic & Queue
-   Set up `social-queue`.
-   Implement `SocialPostProcessor` to handle jobs.
-   Handle "Post Now" vs "Schedule".

### Step 5: Verification
-   Unit tests for services.
-   Manual test: Connect a dummy Twitter account and post "Hello World".

---

## 5. Agent Assignment (Implementation Phase)

| Agent | Responsibilities |
| :--- | :--- |
| **`database-architect`** | Create Entities, Migrations, Repositories. |
| **`backend-specialist`** | Implement Services, Controllers, OAuth Logic, Queue integration. |
| **`security-auditor`** | Review token storage, validate OAuth scopes. |
