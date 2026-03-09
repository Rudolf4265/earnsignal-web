# Release Ready Smoke Checklist

## Manual smoke steps
1. Sign in at `/login` with an entitled account and confirm landing on `/app`.
2. Go to `/app/data`, upload a valid Patreon CSV, and complete `Upload & Validate`.
3. Wait for upload polling to reach `ready/report_ready`.
4. Click `View report` from upload success and confirm route `/app/report/{report_id}`.
5. Verify report detail renders meaningful content:
   - KPI cards show values (not all `--`)
   - Executive Summary is present
   - Sections render from `report.sections.*` payload
6. Go to `/app/report` and confirm the same report appears with `View` and `Download PDF`.
7. Go to `/app` and confirm dashboard hydrates from latest completed report:
   - Net Revenue populated
   - Stability Index populated
   - Key Signals populated
   - Recommended Actions populated
   - Trend Preview populated
8. On report detail, click `Open PDF` and `Download PDF`; confirm both succeed.

## Expected network calls
- `GET /v1/entitlements`
- `POST /v1/uploads/presign`
- `PUT <presigned storage url>`
- `POST /v1/uploads/callback`
- `GET /v1/uploads/{upload_id}/status` (polling)
- `GET /v1/reports`
- `GET /v1/reports/{report_id}`
- `GET /v1/reports/{report_id}/artifact.json`
- `GET /v1/reports/{report_id}/artifact` (PDF)

## Expected success states
- No requests to `/v1/reports/undefined`.
- Dashboard selects latest completed report deterministically.
- Artifact contract validation passes for `schema_version: "v1"`.
- PDF response validation passes:
  - `content-type` is PDF-compatible
  - `content-length` header is present and `> 0` on canonical API PDF endpoint
  - response body is non-empty

## Rollback indicators
- Dashboard shows fallback-only content despite completed reports.
- Report detail shows repeated artifact contract validation errors for valid reports.
- PDF open/download starts failing with content-type/content-length validation messages.
- Monitoring or logs show `/v1/reports/undefined` requests.

## Post-release follow-up (architecture only, no implementation in this PR)
- Consolidate report artifact normalization + contract validation into a shared package consumed by web and backend.
- Move dashboard/report hydration to a single backend-composed `latest report view-model` endpoint.
- Replace client-side fallback chaining with server-side canonical latest-report resolver.
- Add backend startup schema drift checks and DB contract tests in the backend repository CI pipeline.
