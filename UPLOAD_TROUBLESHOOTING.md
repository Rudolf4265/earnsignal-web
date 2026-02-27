# Upload troubleshooting

This document describes what users should expect on `/app/upload` and how to recover when something goes wrong.

## What users see

1. **Uploading**
   - The app requests a secure upload URL, uploads the file, and finalizes the upload.
2. **Processing**
   - The app polls backend status endpoints automatically until the upload is terminal.
   - Processing can include validation, ingestion, and report generation.
3. **Ready**
   - A success state appears with a clear action to open the generated report.
4. **Failed**
   - A friendly message is shown.
   - A reason code is shown when provided by backend.
   - Users can use **Try again** (re-poll status), **Reset** (clear state), and **Copy diagnostics**.

## Refresh and resume behavior

- The app stores the last `upload_id` in local storage.
- On return to `/app/upload`, the app resumes with `/v1/uploads/{upload_id}/status` first.
- If the stored upload is gone (`404/not found`), polling stops and users get a recoverable error with **Try again** and **Reset**.
- The app only checks `/v1/uploads/latest/status` as a fallback path when stored upload status cannot be resumed.

## Auth/session-expired behavior

- If status calls return `401/403`, polling stops immediately.
- The UI shows a **Session expired** message and a **Log in again** action.
- There is no automatic redirect loop from the upload screen.

## Timeout behavior

- Polling is bounded (~3 minutes with short backoff).
- If processing does not finish in time, polling stops with a timeout message.
- Users can retry status checks or reset and upload again.

## Retry and reset actions

- **Try again**
  - Cancels any active polling before starting a new status poll.
  - Re-runs status polling for the current upload ID.
- **Reset**
  - Clears selected file, upload ID, report ID, errors, and stored upload state.
  - Returns the user to a clean upload flow.

## Diagnostics safety

- Diagnostics copy uses deterministic JSON and includes only safe operational fields:
  - `upload_id`
  - status
  - reason code
  - message
  - update timestamp
- Diagnostics never include auth tokens, headers, object keys, or presigned URLs.
