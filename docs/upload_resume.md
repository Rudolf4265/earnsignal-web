# Upload resume policy (`/app/data`)

The upload page uses `localStorage["earnsignal:last_upload_id"]` for continuity across refreshes.

## Deterministic resume behavior

On mount, the page performs a **single** status lookup for the stored upload id.

- If the status is **non-terminal** (`processing`):
  - The stepper enters resume mode.
  - Polling starts from that upload id.
- If the status is **terminal** (`ready` or `failed`):
  - The stepper does **not** auto-enter processing.
  - The UI shows a **Last upload finished** panel with actions.
- If lookup returns **404**:
  - Stored id is cleared.
  - UI returns to neutral empty state (`No uploads yet`).
- If lookup returns **401/403**:
  - UI shows session-expired guidance and sign-in action.
- If lookup has a **network error**:
  - UI shows retry action.
  - No auto-polling starts.

## Why

This prevents surprising resume behavior when the previous upload already finished, and keeps the upload stepper and recent-uploads summary sourced from the same lookup result.
