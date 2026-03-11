# Canonical Entitlement Bootstrap

## Endpoint consumed

- Canonical snapshot endpoint: `GET /v1/entitlements`
- Billing supplemental snapshot: `GET /v1/billing/status`

## Normalized frontend model

The frontend normalizes entitlement snapshots in [src/lib/api/entitlements.ts](/c:/Users/brits/GitHub/earnsignal-web/src/lib/api/entitlements.ts) and exposes canonical-first fields:

- `effectivePlanTier` / `effective_plan_tier`
- `entitlementSource` / `entitlement_source`
- `accessGranted` / `access_granted`
- `accessReasonCode` / `access_reason_code`
- `billingRequired` / `billing_required`

Legacy aliases are preserved for compatibility (`plan_tier`, `plan`, `is_active`, `entitled`, `source`) but do not drive gating decisions.

## Bootstrap location

- Provider: [app/(app)/_components/app-gate-provider.tsx](/c:/Users/brits/GitHub/earnsignal-web/app/(app)/_components/app-gate-provider.tsx)
- Shared hook: [app/(app)/_components/use-entitlement-state.ts](/c:/Users/brits/GitHub/earnsignal-web/app/(app)/_components/use-entitlement-state.ts)

Bootstrap behavior:

- initial load fetches canonical entitlements with `forceRefresh: true`
- shared state exposes loading, error, resolved snapshot, and `refresh()`
- access state is fail-closed for premium flows when snapshot resolution is pending

## Refresh and invalidation

- Checkout success (`/app/billing/success`): bounded retries refresh entitlements + billing snapshots before redirect.
- Checkout cancel (`/app/billing/cancel`): clears checkout marker and refreshes entitlements + billing snapshots.
- Manual billing refresh (`/app/billing`): refreshes both snapshots on demand.
- Admin grant/revoke: reflected after full page refresh (bootstrap force-refresh bypasses stale session cache).

## Known follow-ups

- OpenAPI generated schema currently lags canonical entitlement fields; local fallback typing includes canonical fields until schema regeneration catches up.
- E2E coverage now exercises grant/revoke refresh behavior and entitlement-required error states on upload/report flows, but does not yet include a live backend admin grant workflow fixture.

