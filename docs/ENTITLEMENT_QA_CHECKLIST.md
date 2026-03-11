# Entitlement QA Checklist

Use this checklist to verify entitlement correctness across UI and backend-enforced paths after PR2 (admin overrides).

## Test fixtures

Prepare accounts with known backend state:

- `free_user`: no trial, no active Stripe subscription, no active admin override.
- `pro_user`: active paid entitlement (`effective_plan_tier=pro`, `access_granted=true`).
- `trial_user`: active trial (`access_granted=true`, non-paid source).
- `override_user_active`: active admin override (`entitlement_source=admin_override`, `access_granted=true`).
- `override_user_revoked`: override history exists but current override inactive/revoked (`access_granted=false`).
- `override_user_expired`: override ended in the past (`access_granted=false`).
- `override_user_future`: override starts in the future (`access_granted=false`).
- `founder_protected_a`: `brits.rudolf.j@gmail.com`.
- `founder_protected_b`: `admin@earnsigma.com`.
- `non_admin_user`: authenticated user without admin role.
- `admin_user`: backend-recognized admin (`GET /v1/admin/whoami` -> `is_admin=true`).

## Canonical entitlement payload checks

For each fixture, call `GET /v1/entitlements` and verify:

- `effective_plan_tier` is correct for current state.
- `entitlement_source` reflects override/trial/stripe/none precedence.
- `access_granted` is the source of truth for access decisions.
- `access_reason_code` explains deny/allow reason.
- `billing_required` is true only when billing action is required.
- Legacy aliases (`plan_tier`, `plan`, `entitled`, `is_active`, `source`) do not conflict with canonical fields.

Expected:

- Revoked/expired/future override fixtures must return `access_granted=false`.
- Founder-protected fixtures must return paid-equivalent access even without Stripe when configured by backend policy.

## Dashboard checks (`/app`)

- `free_user`: dashboard loads, Pro action cards remain locked, premium recommendations are not shown.
- `pro_user`, `override_user_active`, founder fixtures: Pro action cards unlock.
- `override_user_revoked` and expired/future fixtures: Pro cards lock after refresh/reload.

Expected:

- No premium recommendation content is visible while entitlement state is unresolved.

## Upload and report generation checks (`/app/data`)

- `free_user`: `Upload & Validate` remains disabled and upgrade guidance is shown.
- `pro_user` and paid-equivalent fixtures: upload flow can proceed to report generation.
- Force backend deny (`ENTITLEMENT_REQUIRED`) during generation: UI shows entitlement-required error and Billing CTA.

Expected:

- Backend deny cannot be bypassed by client-side UI state.

## Reports list and detail checks (`/app/report`, `/app/report/[id]`)

- `free_user`: guarded routes redirect to Billing.
- `pro_user`: can open report list/detail and use PDF actions when artifact exists.
- paid-equivalent override/founder fixtures: Pro-gated report sections and PDF controls unlock.
- revoked/expired/future override fixtures: report routes deny or redirect as configured, and Pro sections remain locked.

Expected:

- Report detail `Debug + Raw JSON` is only visible for Pro-equivalent access.
- `ENTITLEMENT_REQUIRED` backend responses render upgrade-required state with Billing CTA.

## Download and artifact checks

- Attempt PDF download from list/detail with free or revoked fixture via direct API call.
- Verify backend returns denial (`403/402` with entitlement reason) when not entitled.
- Verify entitled fixtures can download valid PDF and content-type/length checks pass.

## Billing flow checks (`/app/billing`, `/app/billing/success`, `/app/billing/cancel`)

- Checkout start uses canonical endpoint first (`POST /v1/billing/create-checkout-session`).
- Success path performs bounded entitlement + billing refresh and redirects only after access activates.
- Cancel path refreshes state without granting access.

Expected:

- After successful grant, premium surfaces unlock without requiring new login.
- After revoke, premium surfaces lock after refresh/reload and backend denies protected actions.

## Admin access checks (`/app/admin`)

- `non_admin_user`: no Admin nav link; direct route shows not-authorized UI.
- `admin_user`: admin routes load successfully.
- Non-admin calls to `/v1/admin/*` return backend denial (`403`/`401`).

Expected:

- Frontend admin state is derived from backend `admin.whoami`, not only local claims.

## Cache and refresh checks

- Validate entitlements cache TTL behavior does not keep stale granted access after revoke beyond expected refresh windows.
- Run manual refresh from Billing; verify canonical snapshot updates immediately.
- Validate checkout and admin grant/revoke transitions with hard reload and in-app refresh.

Expected:

- No stale client snapshot should allow premium actions when backend has already revoked access.

## Legacy compatibility checks

- When canonical checkout endpoint is unavailable, fallback to `/v1/billing/checkout` and `/v1/checkout` only for endpoint-missing responses (`404/405`).
- Confirm deprecated legacy fields do not override canonical deny state.

## Sign-off criteria

- All fixture scenarios above pass expected outcomes.
- No premium/admin-only path is reachable without matching effective entitlement/admin backend status.
- No report lifecycle step (generate/view/download) bypasses canonical entitlement enforcement.
