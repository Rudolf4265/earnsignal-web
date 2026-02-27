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

## Troubleshooting

- **Billing page loops back to billing:** Confirm `/v1/entitlements` returns active status and feature flags after webhook processing.
- **Checkout button fails:** Ensure at least one checkout endpoint is available (`/v1/billing/checkout`, `/v1/checkout`, or `/v1/stripe/checkout`).
- **Success page does not unlock app immediately:** Webhook may still be processing; use retry refresh on the success page.
