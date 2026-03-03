# Launch Gate (internal)

Use this gate before merging UI changes that touch upload/reporting flows.

## Internal page

- Route: `/app/debug/launch-gate`
- Availability: non-production debug builds, admin-only inside the app gate.

The page contains:

1. API health links (`/livez`, `/readyz`)
2. Upload golden-path checklist and expected outcomes
3. A copy/paste curl pack for:
   - `POST /v1/uploads/presign`
   - `POST /v1/uploads/callback`
   - `GET /v1/uploads/:upload_id/status`
   - `GET /v1/uploads/latest/status`

## Minimal smoke script

Command:

```bash
API_BASE_URL=https://api.example.com TOKEN=<bearer> npm run smoke:launch-gate
```

What it verifies:

1. `POST /v1/uploads/presign` does not return a 5xx.
2. Upload status endpoint does not return a 5xx.
3. Status response has an expected shape on 2xx (`status`/`upload_id` fields) or a recognizable error payload on non-2xx.

Environment variables:

- `API_BASE_URL` (required; falls back to `NEXT_PUBLIC_API_BASE_URL`)
- `TOKEN` or `API_TOKEN` (optional bearer token)
- `UPLOAD_ID` (optional fallback if presign does not return one)
