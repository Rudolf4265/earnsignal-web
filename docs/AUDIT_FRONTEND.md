# Frontend Audit: post-login dashboard/report regressions

## PR-style summary

### Root causes
1. **Dashboard stays mostly placeholder by design, not by API failure**: KPI cards and analysis panels are hardcoded placeholder content and do not consume report payloads, so the screen still reads “Available after first report” even after reports load.
2. **Reports “View” gating was too strict**: `/app/report` previously disabled “View” unless `report_id` existed, even for `status=ready` rows that had a usable `artifact_url`.
3. **Fetches can appear canceled/pending due to gate-vs-fetch race**: report-list and report-detail requests start on mount before entitlement guard resolution/redirect completes, so in-flight requests may be interrupted by route replacement.

### Fixes implemented (minimal)
- Added a shared report viewability helper (`getReportHref`, `isReportViewable`) and reused it in dashboard and reports list.
- Updated `/app/report` row action to use `<Link>` with href fallback (`report_id` route or `artifact_url`) when report is viewable.
- Added dev-only structured logging (guarded) for entitlements evaluation and report mapping/href/viewability derivations.
- Added scripted API timeline harness under `scripts/audit/frontend-api-timeline.mjs`.
- Added unit tests for href/viewability edge-cases.

### Tests run
- Targeted node tests for dashboard model + new viewability helper (pass).
- ESLint (pass with existing unrelated warning).
- Playwright reports-list smoke attempted but blocked by missing browser binaries in container.

### Risk / rollback
- **Risk level: low** (localized UI decision logic only).
- Rollback is straightforward: revert `src/lib/report/viewability.ts`, report list link logic, and dashboard model mapping changes.

---

## Symptoms audited

1) `/app` dashboard stays in placeholder state (“Available after first report”) despite existing reports.

2) `/app/report` can show `Ready` rows while `View` is disabled (or detail route is unreachable/inconsistent).

3) DevTools pending/canceled fetches and incomplete/stuck UI impressions after login/navigation.

---

## Scripted reproduction steps

### A. API timeline harness (no backend code changes)
```bash
# Requires API base URL and (optionally) a bearer token copied from app session.
NEXT_PUBLIC_API_BASE_URL="https://<api-host>" \
AUDIT_BEARER_TOKEN="<jwt_optional>" \
node scripts/audit/frontend-api-timeline.mjs
```

What it calls:
- `GET /v1/entitlements`
- `GET /v1/reports?limit=25&offset=0`
- `GET /v1/reports/:id` (for first report id found)

### B. Existing Playwright smoke
```bash
npm --prefix tests/e2e run e2e -- reports-list.spec.ts
```
(Attempted here, but browser binary missing in this environment.)

---

## Network timeline evidence

## 1) From scripted harness in this environment
Command:
```bash
NEXT_PUBLIC_API_BASE_URL='http://127.0.0.1:65535' node scripts/audit/frontend-api-timeline.mjs
```
Observed timeline:
- `/v1/entitlements` → `NETWORK_ERROR` (fetch failed)
- `/v1/reports?limit=25&offset=0` → `NETWORK_ERROR` (fetch failed)

This validates harness behavior/output format but not production API semantics.

## 2) From deterministic request trace scaffolding in repo
`tests/e2e/request-trace.spec.ts` stubs and records:
- `/v1/entitlements` → `200` with `plan,status,entitled,features,request_id`
- `/v1/uploads/latest/status` → `404` with typed JSON error + `request_id`
- `/v1/uploads/:id/status` → `404` with typed JSON error + `request_id`
- default `/v1/*` fallback → `200`

This confirms expected endpoint inventory and state transitions used by `/app/data`, `/app/report`, `/app` smoke navigation.

---

## Exact UI decision points

## Dashboard placeholder vs metrics render
- Dashboard page client loads model via `buildDashboardModel()` and falls back to empty model on catch.
- KPI cards and major panels are currently static placeholders (hardcoded “Available after first report” / “No signals yet”), independent of report payload.
- Data Status and Recent Reports are dynamic from `DashboardViewModel`.

## Reports list: View enabled/disabled
- `canView` now derives from `isReportViewable(report)`:
  - requires normalized `status === "ready"`
  - requires resolvable href from either `artifact_url` OR `report_id`
- If viewable + href exists, render `<Link href=...>View</Link>`.
- Else render disabled button.

## View click navigation target
- href comes from `getReportHref(report)`:
  - prefer `artifact_url` when present
  - fallback `/app/report/:report_id`
  - else null

## Entitlements gate and billing redirect
- Feature guard uses app gate state to decide render/redirect.
- `authed_unentitled` + restricted path (`/app/report*`, `/app`) => redirect to:
  - `/app/billing?reason=upgrade_required&from=<pathname>`
- Allowed while unentitled: `/app/billing`, `/app/settings`, `/app/data`.

---

## API clients / base URL / auth attachment inventory

- Primary wrapper: `apiFetchJson` in `src/lib/api/client.ts`.
- Base URL source: `NEXT_PUBLIC_API_BASE_URL` (required; throws if missing).
- URL resolution: relative `/v1/...` paths become absolute `${NEXT_PUBLIC_API_BASE_URL}/v1/...`.
- Auth behavior: browser session access token is fetched from Supabase client and attached as `Authorization: Bearer <token>` for `apiFetchJson`.
- Relative path usage: API modules call relative `/v1/...` consistently (`reports`, `entitlements`, `uploads`, `upload`, `admin`), relying on wrapper for absolute URL construction.

---

## Contract expectations (frontend)

## `GET /v1/reports?limit=25&offset=0`
Frontend normalizes and expects:
- top-level: `items[]`, `next_offset|nextOffset`, `has_more|hasMore`
- per item:
  - `created_at|createdAt` (required for row inclusion)
  - `status` (normalized to queued/running/ready/failed)
  - id candidates: `report_id|reportId|id`
  - optional: `artifact_url|artifactUrl`, `artifact_kind|artifactKind`, `title`, `platforms[]`, `coverage_start|coverageStart`, `coverage_end|coverageEnd`

## `GET /v1/reports/:id`
Frontend expects and normalizes:
- id candidates: `report_id|reportId|id`
- `title|name`, `status`, `summary|description|message`
- optional timestamps: `created_at|createdAt`, `updated_at|updatedAt`
- optional artifact: `artifact_url|artifactUrl`, `artifact_kind|artifactKind`

## `GET /v1/entitlements`
Frontend expects:
- `plan`, `status`, `entitled` (or derives from features/status)
- `features` object (`app`, `upload`, `report` booleans)
- optional `portal_url|portalUrl`

---

## Routes affected
- `/app`
- `/app/report`
- `/app/report/[id]`
- `/app/billing`

---

## Ranked root causes (with evidence)

1. **Dashboard placeholders are static, so UX remains “first report” style even with data** (highest confidence).
   - KPI/panel placeholder content is hardcoded in dashboard view.

2. **View action logic originally required `report_id` only; ignored valid `artifact_url` fallback** (high confidence).
   - This directly produced ready rows with disabled View when backend omitted `report_id` but returned artifact link.

3. **Guard/render race causes transient pending/canceled requests** (medium-high confidence).
   - Report list/detail fetches execute in `useEffect` immediately on mount.
   - FeatureGuard redirect can replace route while fetch in-flight.

4. **Some “stuck” perceptions are fallback/empty-state behavior after swallowed errors** (medium confidence).
   - dashboard client catches any error and resets to empty model.

---

## Minimal fix plan (file-by-file)

Implemented now:
- `src/lib/report/viewability.ts`
  - single source of truth for `reportHref` and `isViewable`.
- `app/(app)/app/report/page.tsx`
  - use shared derivation; render link when viewable (id or artifact).
  - add gated structured logs for row mapping and href.
- `src/lib/dashboard/model.ts`
  - use shared derivation for recent report links/viewability.
  - add gated structured logs for per-row + model summary.
- `app/(app)/_components/app-gate-provider.tsx`
  - add gated structured logs for entitlement outcomes/errors.
- `scripts/audit/frontend-api-timeline.mjs`
  - reproducible endpoint timeline collector.
- `tests/report_viewability.test.mjs`
  - unit coverage for required edge-cases.

Not implemented (left as follow-up):
- Refactor dashboard KPI/insight cards to render real metrics once backend contract is finalized.
- Potentially defer report fetch effects until gate enters an entitled state to reduce canceled fetch noise.

---

## Verification checklist

## Unit
- [x] `tests/report_viewability.test.mjs`
  - ready + id + null artifact => viewable `/app/report/:id`
  - ready + missing id + artifact_url => viewable external link
  - non-ready + href => not viewable
- [x] `tests/dashboard_model.test.mjs`

## E2E / smoke
- [ ] `tests/e2e/reports-list.spec.ts`
  - scenario: “View enabled when Ready and report_id exists”
  - attempted in this container but blocked by missing Playwright browser executable.

