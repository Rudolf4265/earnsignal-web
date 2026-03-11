# Billing UI flow

## PR2 scope

- Frontend now treats canonical entitlements as primary:
  - `effective_plan_tier`, `entitlement_source`, `access_granted`, `access_reason_code`, `billing_required`
  - compatibility aliases remain available (`plan_tier`, `plan`, `is_active`, `entitled`, `source`)
  - `can_upload`, `can_generate_report`, `can_view_reports`, `can_download_pdf`, `can_access_dashboard`
  - usage limits (`reports_remaining_this_period`, `reports_generated_this_period`, `monthly_report_limit`)
- Shared entitlement bootstrap details live in `docs/entitlements-bootstrap.md`.
- This change does not introduce broad new app-wide gating. Existing upload/report/dashboard flows stay intact for entitled/manual users.

## Checkout initiation

- Primary endpoint: `POST /v1/billing/create-checkout-session`
  - canonical payload first: `{ plan_tier: "basic" | "pro" }`
  - compatibility retry (same endpoint): `{ plan: "plan_a" | "plan_b" }` on validation-style failures
- Legacy endpoint fallback remains only for compatibility:
  - `/v1/billing/checkout`
  - `/v1/checkout`
  - fallback is only used for `404` / `405` endpoint-missing responses
- Checkout URL is validated for HTTPS before redirect.
- Stripe config errors are only surfaced as config banners when backend truth reports checkout is not configured (`checkout_configured=false`).
- When backend reports checkout configured, checkout failures are shown as operational errors instead of false config warnings.

## Billing status surface

- Billing page now calls `GET /v1/billing/status` to render plan/status details.
- Canonical entitlement fields are consumed from `BillingStatusResponse.entitlements` and normalized into frontend-safe aliases.
- Billing status failures are isolated to the billing page and never crash app shell/navigation.
- Entitlements remain the durable source of truth for app access; billing status is informational.

## Success / cancel return behavior

- Success route: `/app/billing/success`
  - clears checkout marker
  - performs bounded refresh attempts for both entitlements + billing status
  - redirects to `/app` after entitlements become active
- Cancel route: `/app/billing/cancel`
  - clears checkout marker
  - shows non-destructive canceled state

## What PR2 intentionally does not do

- No broad new feature lockouts.
- No redesign of upload/report generation contracts.
- No Stripe customer portal overhaul.
