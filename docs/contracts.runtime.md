# Runtime API contracts (discovered from code)

This document records **only endpoints that are referenced in this repository's runtime code paths**.
No endpoints are invented here.

## Cross-cutting request assumptions

- API base URL comes from `NEXT_PUBLIC_API_BASE_URL` and paths are joined against it.
- Requests include `Accept: application/json`.
- Requests with a body default to `Content-Type: application/json`.
- Auth is bearer-token based when a browser Supabase session exists (`Authorization: Bearer <access_token>`).
- Errors are expected to include optional `x-request-id` in response headers and may include JSON fields like `code`, `message`, and `details`.
- In environments where Playwright browser download is blocked, request-trace tests are optional and will skip.

## Confirmed endpoints

### Entitlements / gate state

#### `GET /v1/entitlements`
- **Used by pages:** `/app`, `/app/report`, `/app/data` (via app gate provider / feature guards)
- **Auth:** Bearer token expected when session exists
- **Response shape (normalized):**
  - `plan: string | null`
  - `status: string | null`
  - `entitled: boolean` (or inferred from features/status)
  - `features: { app?: boolean; upload?: boolean; report?: boolean; [key: string]: boolean | undefined }`
  - `portal_url?: string` (`portalUrl` also accepted)
- **Entitlement interaction:**
  - Gate states derived from this call: entitled, unentitled, session expired, entitlements error.
  - Unentitled users can still access `/app/data` but report routes are blocked/redirected by guard policy.

### Report detail (single report read)

#### `GET /v1/reports/:reportId`
- **Used by pages:** `/app/report/[reportId]`
- **Auth:** Bearer token expected when session exists
- **Response fields consumed (aliases accepted):**
  - `id | report_id | reportId` -> `id: string`
  - `title | name` -> `title: string`
  - `status` -> `status: string`
  - `summary | description | message` -> `summary: string`
  - `created_at | createdAt` -> `createdAt?: string`
  - `updated_at | updatedAt` -> `updatedAt?: string`
  - `artifact_url | artifactUrl` -> `artifactUrl?: string`
  - `artifact_kind | artifactKind` -> `artifactKind?: string`
- **Entitlement interaction:**
  - Route is wrapped in report feature guard and requires entitled `report` access.

### Upload status + generation flow

#### `POST /v1/uploads/presign`
- **Used by pages:** `/app/data`
- **Auth:** Bearer token expected when session exists
- **Request shape:**
  - `platform: string`
  - `filename: string`
  - `content_type: string`
  - `size: number`
  - `checksum?: string`
  - `sha256?: string`
  - `content_md5?: string`
- **Response shape consumed:**
  - `upload_id: string`
  - `object_key?: string`
  - `presigned_url: string` (`presign_url` / `url` accepted)
  - `callback_url?: string`
  - `callback_proof?: Record<string, unknown> | string`
  - `headers?: Record<string, string>`

#### `POST /v1/uploads/callback` (or same-origin path returned by presign)
- **Used by pages:** `/app/data`
- **Auth:** Bearer token expected when session exists
- **Request shape:**
  - `upload_id: string`
  - `success: boolean`
  - `size_bytes: number`
  - `callback_proof: Record<string, unknown> | string`
  - `platform: string`
  - `object_key?: string`
  - `filename: string`
  - `content_type: string`
  - `sha256?: string`
  - `content_md5?: string`
- **Response shape consumed:**
  - `upload_id: string`
  - `status?: string`
  - `warnings?: string[]`

#### `POST /v1/reports/generate`
- **Used by pages:** `/app/data`
- **Auth:** Bearer token expected when session exists
- **Request shape:**
  - `upload_id: string`
  - `platform: string`
- **Response shape consumed:**
  - `report_id: string`
  - `warnings?: string[]`

#### `GET /v1/uploads/:uploadId/status`
- **Used by pages:** `/app/data`
- **Auth:** Bearer token expected when session exists
- **Response fields consumed:**
  - `upload_id | uploadId?: string`
  - `status?: string`
  - `created_at | createdAt?: string`
  - `validated_at | validatedAt?: string`
  - `ingested_at | ingestedAt?: string`
  - `report_started_at | reportStartedAt?: string`
  - `ready_at | readyAt?: string`
  - `reason?: string`
  - `reason_code | reasonCode?: string`
  - `recommended_next_action | recommendedNextAction?: string`
  - `rows_written | rowsWritten?: number`
  - `months_present | monthsPresent?: number`
  - `message?: string`
  - `report_id | reportId?: string`
  - `updated_at | updatedAt?: string`

#### `GET /v1/uploads/latest/status`
- **Used by pages:** `/app/data` (resume fallback when prior upload id is missing/not found)
- **Auth:** Bearer token expected when session exists
- **Response shape:** same consumed shape as `GET /v1/uploads/:uploadId/status`

## Additional contracts and known gaps

### Reports listing endpoint
- **Status:** CONFIRMED (200 observed in production logs and consumed by `/app/report`).

#### `GET /v1/reports`
- **Used by pages:** `/app/report`
- **Auth:** Bearer token expected when session exists
- **Query params:**
  - `limit: number` (default `25`, max `100`)
  - `offset: number` (default `0`)
- **Response shape consumed:**
  - `items: ReportListItem[]`
    - `report_id: string` (`reportId` / `id` accepted)
    - `created_at: string` (`createdAt` accepted)
    - `status: "queued" | "running" | "ready" | "failed"` (normalized from backend status values)
    - `title: string | null`
    - `platforms: string[] | null`
    - `coverage_start: string | null` (`coverageStart` accepted)
    - `coverage_end: string | null` (`coverageEnd` accepted)
    - `artifact_kind: string | null` (`artifactKind` accepted)
    - `artifact_url: string | null` (`artifactUrl` accepted)
    - `upload_id: string | null` (`uploadId` accepted)
    - `job_id: string | null` (`jobId` accepted)
  - `next_offset: number` (`nextOffset` accepted)
  - `has_more: boolean` (`hasMore` accepted)
- **Page behavior notes:**
  - `/app/report` renders loading, empty, error, not-entitled, and paginated list states from this endpoint.
  - List canonical identifier is `report_id`; aliases `reportId` and `id` are accepted for normalization.
  - Report detail route is `/app/report/[reportId]` and calls `GET /v1/reports/:reportId`.
  - Sample report CTA is preserved as a secondary/fallback action.

### Dashboard summary endpoint
- **Status:** unknown/missing; requires backend confirmation.
- **Reason:** `/app` dashboard currently renders static placeholder cards/panels and no dashboard-summary API endpoint call was found in runtime code.

