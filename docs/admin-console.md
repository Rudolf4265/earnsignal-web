# Admin Console

Internal admin tooling is available under `/app/admin` for support workflows.

## Access

- Access is determined by backend admin identity (`GET /v1/admin/whoami`).
- Admin routes and mutations rely on backend `/v1/admin/*` authorization; frontend checks are UX only.
- Non-admins do not see an Admin nav link and receive a not-authorized callout when visiting `/app/admin` routes directly.

## Routes

- `/app/admin`
  - Search users by email or creator ID.
  - Shows: email, creator ID, plan/status, blocked, comp_until, and last upload state.
- `/app/admin/users/[creatorId]`
  - Inspect one user.
  - Toggle blocked/unblocked (with confirmation before blocking).
  - Edit `comp_until`.
  - View latest upload/report status and links if available.

## Notes

- Changes use optimistic UI and rollback on API errors.
- Last updated timestamp is displayed after fetches and mutations.
- The console does not persist sensitive admin state in localStorage.
