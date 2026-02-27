# Billing UI flow

## Expected user flow

1. User signs in and enters `/app`.
2. App layout checks session and entitlements:
   - No session: redirect to `/login`.
   - Session + no entitlement: redirect to `/app/billing`.
   - Session + entitlement: render app shell.
3. User can choose **Plan A** or **Plan B** on `/app/billing`.
4. Checkout CTA calls backend checkout endpoint and redirects to Stripe-hosted checkout URL.
5. Stripe success return lands on `/app/billing/success`:
   - forces entitlements refresh
   - auto-redirects to `/app` once entitlements are active
6. Stripe cancel return lands on `/app/billing/cancel`.

## Feature-level gating

- `/app/upload` requires `features.upload === true`.
- `/app/report` and `/app/report/[id]` require `features.report === true`.
- If missing, user is redirected to `/app/billing`.

## Checkout initiation safety

- Checkout creation is deterministic:
  - primary endpoint: `/v1/billing/checkout`
  - fallback endpoint: `/v1/checkout` only if primary responds with `404` or `405`
- The client never probes additional endpoints for `5xx` errors; users see a recoverable error state instead.
- Double-click safety:
  - an in-memory in-flight promise deduplicates concurrent clicks in the same render lifecycle
  - a short sessionStorage marker blocks immediate refresh/retry loops
  - UI shows **"Checkout is already starting…"** with a **Try again** action that clears the marker

## Import hygiene

- App source imports must be extensionless (`./module`, not `./module.ts`).
- Rationale: this keeps behavior aligned with Next.js module resolution defaults and avoids hiding broken import paths behind permissive TS compiler flags.
- Enforcement:
  - ESLint `no-restricted-imports` blocks `*.ts` and `*.tsx` import specifiers in source imports.

## Troubleshooting

- **Billing page loops back to billing:** Confirm `/v1/entitlements` returns active status and feature flags after webhook processing.
- **Checkout button fails:** Ensure `/v1/billing/checkout` exists, or `/v1/checkout` is available as fallback for 404/405 cases.
- **Success page does not unlock app immediately:** Webhook may still be processing; use retry refresh on the success page.
