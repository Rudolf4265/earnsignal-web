# Canonical Entitlement Bootstrap

## Endpoint consumed

- Canonical snapshot endpoint: `GET /v1/entitlements`
- Billing supplemental snapshot: `GET /v1/billing/status`
  - canonical entitlement snapshot lives at `BillingStatusResponse.entitlements`

## Normalized frontend model

The frontend normalizes entitlement snapshots in [src/lib/api/entitlements.ts](/c:/Users/brits/GitHub/earnsignal-web/src/lib/api/entitlements.ts) and exposes canonical-first fields:

- `effectivePlanTier` / `effective_plan_tier`
- `entitlementSource` / `entitlement_source`
- `accessGranted` / `access_granted`
- `accessReasonCode` / `access_reason_code`
- `billingRequired` / `billing_required`

Legacy aliases are preserved for compatibility (`plan_tier`, `plan`, `is_active`, `entitled`, `source`) but do not drive gating decisions.
Fallback typing in `src/lib/api/generated/index.ts` has been reduced for entitlements/billing snapshots so generated OpenAPI schema remains the source of truth.

## Generated contract source of truth

- Backend model source: `../creator_optimizer/src/creator_optimizer/routers/billing.py`
  - `EntitlementsResponse` for `GET /v1/entitlements`
  - `BillingStatusResponse` for `GET /v1/billing/status`
- Frontend generated files:
  - `src/lib/api/generated/schema.ts`
  - `src/lib/api/generated/index.ts`

## Regeneration flow

1. Export backend OpenAPI JSON from local backend source:
   - from `../creator_optimizer`:
     - `.\.venv\Scripts\python.exe -c "import json, os; from creator_optimizer.api import create_app; os.makedirs('..\\earnsignal-web\\.tmp-openapi', exist_ok=True); spec=create_app().openapi(); open('..\\earnsignal-web\\.tmp-openapi\\creator_optimizer-openapi.json','w',encoding='utf-8').write(json.dumps(spec, indent=2, sort_keys=True))"`
2. Regenerate frontend schema:
   - from `earnsignal-web`:
     - `$env:OPENAPI_SCHEMA_URL=(Resolve-Path '.tmp-openapi\creator_optimizer-openapi.json').Path; cmd /c npm run api:generate`
3. Validate drift guard:
   - `npm run contract:check:entitlements`

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

- E2E coverage exercises grant/revoke refresh behavior and entitlement-required error states on upload/report flows, but does not include a live backend admin grant workflow fixture.
