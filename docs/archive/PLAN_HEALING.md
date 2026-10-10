# Plan: Autonomous Healing - Backup Cloud Circuits

Orchestrating surgical repairs for the 2 broken circuits identified in the Backup Module.

## Problem Diagnosis
- **`BACKUP_CLOUD_TEST`**: The "TEST SIGNAL" button in the UI only triggers a `toast.info` message. It does not invoke the available `backupService.testCloudConnection` method.
- **`BACKUP_CLOUD_PERSIST`**: The "PERSIST LINK" button in the UI only triggers a `toast.success` message. It does not invoke the `updateConfigMutation`.

## Proposed Changes

### Frontend Wiring (`settings/backup/page.tsx`)
1.  **Enhance `testCloudConnection` Logic**:
    -   Connect the `:: TEST_SIGNAL` button to a real async function.
    -   Call `backupService.testCloudConnection(provider.id)`.
    -   Show success/error toasts based on the API response.

2.  **Enhance `persistCloudConfig` Logic**:
    -   Connect the `:: PERSIST_LINK` button to `updateConfigMutation`.
    -   Map the local state (`s3Config`, `googleDriveConfig`, etc.) to the `BackupConfigDto` structure.
    -   Trigger the mutation to save credentials to the backend.

## Verification Plan
1.  **Manual Verification**: Confirm buttons trigger network requests in the Network Tab (simulated via code review).
2.  **System Audit**: Re-run `./bin/affexai audit`.
3.  **Resonance Check**: Expect 100% Resonance Score (42/42 Stable).
