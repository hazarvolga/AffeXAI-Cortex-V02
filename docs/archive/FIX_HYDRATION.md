# Plan: Resolving Hydration Mismatch in BccEditorialWrapper

## Analysis
The user reported a hydration mismatch error: `+ 01:42:04 - 01:42:01`.
This is caused by rendering `new Date().toLocaleTimeString()` directly in a Client Component during SSR. 
Since the server and client generate the HTML at slightly different times, the content mismatch triggers a full tree regeneration.

### Root Cause:
- `BccEditorialWrapper.tsx` line 94: `new Date().toLocaleTimeString('en-GB', { hour12: false })` is called during the initial render (SSR).

## Proposed Fix

### 1. Hydration-Safe State
Modify `BccEditorialWrapper.tsx` to:
- Initialize the time string to `null` or a placeholder.
- Use a `useEffect` to set the actual time once the component has mounted on the client.
- Optionally add a `setInterval` to keep the time live without triggering hydration errors.

### 2. Implementation Steps
1. Add `useState` for the time string.
2. Add `useEffect` to update the time only after mounting (`mounted` state).
3. Ensure the server-rendered HTML matches the initial client-rendered HTML (e.g., "00:00:00" or empty).

## Verification
- Verify the hydration error disappears in the browser console.
- Confirm the UTC clock still functions correctly on the client side.
- Run `lint_runner.py`.
