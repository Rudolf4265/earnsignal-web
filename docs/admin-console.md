# Admin Console

Internal admin tooling is available under `/app/admin` for support workflows.

## Access

- Access is determined by backend admin identity (`GET /v1/admin/whoami`).
- Admin routes and mutations rely on backend `/v1/admin/*` authorization; frontend checks are UX only.
- Non-admins do not see an Admin nav link and receive a not-authorized callout when visiting `/app/admin` routes directly.

## Routes

- `/app/admin`
  - Email-first user search (creator ID still supported as fallback).
  - If no query is entered, defaults to recent users from backend.
  - Default list excludes archived/deleted users. Use `Show archived users` to include lifecycle-hidden rows.
  - Rows show explicit fallback text (`No email on record`) when email is missing.
  - Entitlement source is rendered as a color-coded badge:
    - Stripe (blue)
    - Admin Override (emerald)
    - Founder (violet)
    - Trial (amber)
    - Free / None (neutral slate)
    - Unknown source values fall back to a neutral safe badge.
  - Includes a `Grant access by email` panel with plan tier selection, optional expiration, and optional note.
- `/app/admin/users/[creatorId]`
  - Inspect one user with email-forward identity context.
  - Toggle blocked/unblocked (with confirmation before blocking).
  - Archive/unarchive users for normal lifecycle cleanup.
  - Edit `comp_until`.
  - Delete users from a dedicated danger zone with stronger confirmation.
  - View effective plan/source, latest upload/report summaries, and last update metadata.

## User Lifecycle Semantics

- Archive is the primary inactive-user action:
  - keeps data/history intact,
  - hides users from default admin lists,
  - can be reversed from user detail (`Unarchive`) when not deleted.
- Delete is intentionally guarded and stronger:
  - UI requires typed confirmation (`DELETE {creatorId}`) and explicit confirmation prompt,
  - backend performs tombstone soft-delete (`confirmation=DELETE`) rather than hard row deletion,
  - billing, entitlement history, uploads, and reports remain intact for integrity/auditability.
- Deleted users are lifecycle-locked in UI and remain hidden from default list views unless `Show archived users` is enabled.
- True hard delete and undelete are intentionally deferred.

## Grant Access By Email Workflow

- Enter user email, choose plan tier, optionally set expiration and note.
- Submit sends `POST /v1/admin/users/grant-access-by-email`.
- Success shows explicit confirmation and refreshes current admin list results.
- Success includes a direct `Open user details` action that routes to `/app/admin/users/[creatorId]` when available.
- Not-found and validation failures are surfaced as explicit operator-visible errors.

## Notes

- Changes use optimistic UI and rollback on API errors.
- Last updated timestamp is displayed after fetches and mutations.
- The console does not persist sensitive admin state in localStorage.
- Backend requires that target email already belongs to an existing creator account; the admin UI does not auto-create users.
