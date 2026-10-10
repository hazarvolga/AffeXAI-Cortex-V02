# Social Media Module Implementation Plan: Phase 4 (Posts & Scheduling)

## Overview
Implement the full lifecycle of Social Posts: Creation, Scheduling, and Dispatching. This involves backend CRUD operations and a frontend creation experience connected to the scheduler.

## User Review Required
> [!IMPORTANT]
> The `Create Post` modal will require a complex form with:
> - Content text area
> - Image/Video uploading (will hook into existing `MediaModule`)
> - Date/Time picker for scheduling
> - Multi-select for Account distribution

## Proposed Changes

### Backend (`apps/backend`)
#### [MODIFY] `SocialMediaService`
- Add `createPost(user, dto)`
- Add `findAllPosts(user, filters)`
- Add `deletePost(postId)`
- Add `updatePost(postId, dto)`

#### [NEW] `SocialPostController`
- `POST /` - Create post
- `GET /` - List posts (with pagination/filters)
- `GET /:id` - Get single post
- `PATCH /:id` - Update post
- `DELETE /:id` - Delete post

#### [NEW] `CreatePostDto`
- `content`: string
- `mediaUrls`: string[]
- `accountIds`: string[] (Distribution list)
- `scheduledAt`: Date (optional)

### Frontend (`apps/frontend`)
#### [MODIFY] `SocialMediaService`
- Add `createPost`, `getPosts`, `deletePost` methods connected to `apiClient`.

#### [NEW] `CreatePostModal`
- A sophisticated modal component using `radix-ui/dialog` (or existing modal pattern).
- Inputs: Content, Media Upload, Date Picker, Account Select.

#### [MODIFY] `SchedulerPage`
- Replace mock data with `socialMediaService.getPosts()`.
- Add "Create Post" button triggering the modal.
- Render posts in the "Dispatch Queue" list.

## Verification Plan
1. **Automated Tests**:
   - Backend unit tests for `SocialMediaService.createPost`.
2. **Manual Verification**:
   - Create a post via UI.
   - Verify it appears in the Scheduler list.
   - Verify database record created.
