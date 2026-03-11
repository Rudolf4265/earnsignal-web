# Entitlement Lifecycle E2E Fixtures

This document defines the backend fixture contract for lifecycle-focused browser tests in:

- `tests/e2e/entitlement-lifecycle.spec.ts`

These tests are backend-truth oriented:

- Real Supabase password login (`/login`)
- Real backend entitlement bootstrap (`GET /v1/entitlements`)
- Real guarded app routes and billing UX
- Real upload/report/detail/PDF flow for founder-protected fixture

No entitlement state is mocked in this suite.

The lifecycle suite is intentionally isolated from the default stubbed Playwright path:

- default stubbed config (`tests/e2e/playwright.config.ts`) ignores `entitlement-lifecycle.spec.ts`
- run lifecycle suite explicitly via `npm run test:e2e:lifecycle`

## Fixture provisioning contract

This frontend repo does not provision backend lifecycle fixture state directly.

Fixture state must be created and maintained by backend seeding/admin tooling in the target non-production environment.
At minimum, backend fixture provisioning must guarantee:

1. Fixture users exist and can log in with password auth.
2. `GET /v1/entitlements` resolves to the lifecycle state expected by the table below.
3. Founder fixture is paid-equivalent and can generate/view/download reports.
4. Revoked/expired/future fixtures are denied by backend truth (not client-only flags).

## Required fixture states

Seed or maintain test accounts in a non-production environment with the following backend semantics.

| Fixture key | Lifecycle state | Required backend semantics |
| --- | --- | --- |
| `founder` | Founder protected | `access_granted=true`, paid-equivalent behavior, no billing-required gate |
| `revoked` | Revoked override | override history exists, current access denied (`access_granted=false`, `billing_required=true`) |
| `expired` | Expired override | override end is in the past, access denied |
| `future` | Future-dated override | override start is in the future, access denied until window starts |

Recommended canonical entitlement expectations:

| Fixture key | `access_granted` | `billing_required` | Notes |
| --- | --- | --- | --- |
| `founder` | `true` | `false` | paid-equivalent source/plan may vary (`founder`, `protected_paid`, `pro`, etc.) |
| `revoked` | `false` | `true` | reason code should reflect revoked/required access |
| `expired` | `false` | `true` | reason code should reflect expired/required access |
| `future` | `false` | `true` | reason code should reflect pre-start/future access |

Optional companion fixtures (recommended):

- normal paid Pro user
- normal free user
- active override user

## Founder identity note

Allowed founder identities in non-production fixtures:

- `brits.rudolf.j@gmail.com`
- `admin@earnsigma.com`

If production founder identities must not be used in automation, seed an equivalent founder-protected fixture account that maps to the same backend policy semantics.

## Environment variables

Set these for `npm run test:e2e:lifecycle` (or the underlying Playwright script).

### Required runtime target

- `E2E_BASE_URL` (example: `https://app-staging.earnsigma.com`)

### Founder fixture credentials

- `E2E_LIFECYCLE_FOUNDER_EMAIL`
- `E2E_LIFECYCLE_FOUNDER_PASSWORD`

Fallbacks supported for founder:

- `E2E_FOUNDER_EMAIL` / `E2E_FOUNDER_PASSWORD`
- `E2E_EMAIL` / `E2E_PASSWORD`

### Denied lifecycle fixture credentials

- `E2E_LIFECYCLE_REVOKED_EMAIL`
- `E2E_LIFECYCLE_REVOKED_PASSWORD`
- `E2E_LIFECYCLE_EXPIRED_EMAIL`
- `E2E_LIFECYCLE_EXPIRED_PASSWORD`
- `E2E_LIFECYCLE_FUTURE_EMAIL`
- `E2E_LIFECYCLE_FUTURE_PASSWORD`

### Optional strict reason-code assertions

- `E2E_LIFECYCLE_FOUNDER_REASON_CODE`
- `E2E_LIFECYCLE_REVOKED_REASON_CODE`
- `E2E_LIFECYCLE_EXPIRED_REASON_CODE`
- `E2E_LIFECYCLE_FUTURE_REASON_CODE`

### Optional upload/detail probes

- `E2E_UPLOAD_FIXTURE` (defaults to `tests/fixtures/patreon_minimal.csv`)
- `E2E_LIFECYCLE_DETAIL_PROBE_REPORT_ID` (defaults to `rep_lifecycle_guard_probe`)
- `E2E_LIFECYCLE_DENIED_ARTIFACT_REPORT_ID` (recommended seeded known report id for direct artifact deny checks)

## Backend prerequisites

Before running lifecycle e2e:

1. Fixtures above are seeded and credentials are valid.
2. `/v1/entitlements` returns canonical fields for each fixture (`access_granted`, `billing_required`, `effective_plan_tier`, `access_reason_code`).
3. Founder fixture can complete upload -> report generation and can access PDF artifact endpoints.
4. Revoked/expired/future fixtures are denied by backend truth, not only UI toggles.
5. Provide a known seeded report id for denied artifact enforcement checks (`E2E_LIFECYCLE_DENIED_ARTIFACT_REPORT_ID`), or run founder fixture first so denied fixtures can reuse the generated report id.

## How to run

From repo root:

```bash
npm --prefix tests/e2e ci
npm run test:e2e:lifecycle
```

Direct command:

```bash
npm --prefix tests/e2e run e2e:lifecycle
```

## CI behavior for missing credentials

In CI (`CI=true`), the lifecycle suite fails fast when fixture credentials are missing.
This prevents a green run composed only of skipped lifecycle tests.

## What this suite proves

- Founder/protected fixture behaves as paid-equivalent across bootstrap, dashboard, upload/generate, reports list/detail, artifact/PDF, and billing.
- Revoked/expired/future fixtures stay denied after reload and route transitions.
- Denied fixtures consistently receive upgrade-required UX on protected report surfaces.
- Denied fixtures directly call report artifact endpoints and verify deny/redirect/error contract.
- Frontend does not unlock premium UI from override metadata alone without backend access grant.
