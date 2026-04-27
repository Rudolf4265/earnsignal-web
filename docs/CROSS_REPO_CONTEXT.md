# Cross-Repo Context

Responsibilities, contracts, and failure modes shared across `creator_optimizer` (backend) and `earnsignal-web` (frontend).

> This is the same document as `creator_optimizer/docs/CROSS_REPO_CONTEXT.md`, maintained in both repos for discoverability. If they diverge, the version in `creator_optimizer` is authoritative for backend concerns; the version in `earnsignal-web` is authoritative for frontend concerns. Substantive changes should be synced.

---

## Repository Responsibilities

### creator_optimizer (backend)

| Responsibility | Notes |
|---|---|
| Upload presign, validation, ingestion | Full pipeline from CSV to `WorkspaceStagedSource` |
| Workspace source inventory | Per-platform per-creator staged sources |
| Report run lifecycle | Creation, queuing, execution, heartbeat, failure, retry |
| `ReportRunSource` snapshot | Immutable per-run source truth |
| Analytics and metrics computation | Revenue, subscribers, ARPU, churn |
| Report content and narrative | Insights, diagnosis, LLM-assisted sections |
| PDF artifact generation | ReportLab-based styled PDF |
| Entitlement resolution | Plan tier + Stripe billing state → capabilities |
| Platform support policy | `data/platform-support-policy.json` |
| Admin and founder overrides | Manual entitlement management |
| API surface | FastAPI routers; source of truth for all data |

### earnsignal-web (frontend)

| Responsibility | Notes |
|---|---|
| Product UI and UX | Dashboard, report viewer, upload flow, billing page |
| Marketing site | Landing, pricing, features, sample report |
| Authentication flow | Supabase login/signup/callback |
| Rendering backend truth | Display what the backend returns; do not reinterpret |
| Upload UX | File selection, status polling |
| Entitlement-based UI gating | Show/hide features based on backend entitlement response |
| Billing checkout UX | Initiate Stripe checkout via backend endpoint |

### creator_optimizer/web (if present)

Internal tooling or reference implementation only. Not the primary product frontend.

---

## Canonical Product Model

1. Creator uploads data exports → validated and staged in workspace (`WorkspaceStagedSource`).
2. Creator explicitly selects which staged sources to include in a report.
3. Report run is created; `ReportRunSource` snapshot is taken.
4. Worker executes, generates narrative + PDF.
5. Creator views report detail and downloads PDF.
6. Workspace sources persist; report source snapshot is immutable.

**The golden rule: Saved in workspace does not mean included in this run.**

---

## API Contract Points

| Endpoint | Owner | Consumer |
|---|---|---|
| `GET /v1/entitlements` | Backend | Frontend (entitlement gating) |
| `GET /v1/billing/status` | Backend | Frontend (billing UI) |
| `POST /v1/uploads/presign` | Backend | Frontend (upload flow) |
| `POST /v1/uploads/callback` | Backend | Frontend (upload confirmation) |
| `GET /v1/uploads/latest/status` | Backend | Frontend (status polling) |
| `GET /v1/workspace/data-sources` | Backend | Frontend (workspace display) |
| `POST /v1/reports` | Backend | Frontend (report creation) |
| `GET /v1/reports` | Backend | Frontend (report list) |
| `GET /v1/reports/{id}` | Backend | Frontend (report detail) |
| `GET /v1/reports/{id}/artifact` | Backend | Frontend (PDF download) |

**When backend schema changes:** run `npm run api:generate` in earnsignal-web, then `npm run contract:check:entitlements`.

---

## How to Validate Cross-Repo Changes

For any change that spans both repos:
1. Deploy backend. Confirm health endpoint returns new commit SHA.
2. If API schema changed, regenerate frontend types.
3. Deploy frontend.
4. Run full end-to-end smoke test: upload → source selection → report creation → worker → PDF → frontend display.
5. Confirm API payload source count, platform labels, and dashboard display all agree.
6. Confirm PDF source attribution matches API payload.

See `creator_optimizer/docs/PRODUCTION_VALIDATION.md` for the full checklist.

---

## Known Historical Failure Modes

### 1. Hidden Workspace Inclusion

**Symptom:** "I uploaded 2 sources but the report says 3 sources."
**Cause:** Source scope re-derived from ambient workspace at execution time, not from creation-time snapshot.
**Prevention:** Executor must use `ReportRunSource` records only, never re-query workspace.

---

### 2. Invalid RQ Job IDs

**Symptom:** Reports appear queued but never transition to running.
**Cause:** Job IDs with invalid characters (colons) caused silent dispatch failure.
**Prevention:** Use UUID-based job IDs. Validate before enqueueing.

---

### 3. Worker Startup / Schema Guard Drift

**Symptom:** Worker process fails to start; reports queue indefinitely.
**Cause:** Schema guard checks rejected the current DB schema version after a migration.
**Prevention:** Keep schema guards in sync with Alembic state. Confirm worker heartbeat after every deployment.

---

### 4. Multiple Worker/Report Lifecycle Owners

**Symptom:** Reports processed twice, stuck in irreconcilable state, or failed silently.
**Cause:** Multiple code paths both transitioning report status and dispatching jobs.
**Prevention:** Only `reporting/lifecycle.py` transitions status. Only `reporting/queue.py` dispatches. No other code path does either.

---

### 5. Subscriber KPI Counted Free Substack Subscribers as Business Subscribers

**Symptom:** Subscriber count significantly higher than paid patron count; churn appeared lower than actual.
**Cause:** Free Substack subscribers included in the headline subscriber KPI.
**Prevention:** Paid subscriber KPI uses paid-only counts. Free subscribers labeled separately if shown.

---

### 6. PDF / Web / API Title and Source Truth Drifted

**Symptom:** Report title, source count, or platform labels differed between PDF, web dashboard, and API.
**Cause:** Each surface independently constructed its data after a pipeline change.
**Prevention:** All surfaces derive from the same `ReportRun` + `ReportRunSource` data.

---

### 7. Frontend Support Truth Drifted From Backend

**Symptom:** Upload UI showed platforms the backend would reject; users saw confusing upload failures.
**Cause:** Hardcoded frontend platform list not regenerated after backend policy change.
**Prevention:** Frontend source manifest generated from backend truth; never manually edited.

---

### 8. Long Support Copy in Main UI Made Upload Flow Cumbersome

**Symptom:** Upload and workspace screens felt like reading a CSV format manual.
**Cause:** File format rules, schema descriptions, and support caveats inlined into main workflow UI.
**Prevention:** Detailed rules in Upload Guide / help page only. Main workflow shows status, not documentation.

---

## What Must Not Regress

| Regression | Signal |
|---|---|
| Source count mismatch between API and UI | "3 sources" in API, "2 sources" in dashboard |
| Worker never starts after deploy | Reports queue but never transition to `running` |
| Free subscriber included in paid KPI | Subscriber count higher than actual paid patrons |
| PDF source list differs from API | PDF says "Patreon, YouTube"; API says "Patreon only" |
| Report generation without entitlement | Free-tier creator creates a report without error |
| Context-only source drives report alone | Instagram-only upload triggers report creation |
| Upload auto-triggers report | Upload completion creates a report run without user action |
