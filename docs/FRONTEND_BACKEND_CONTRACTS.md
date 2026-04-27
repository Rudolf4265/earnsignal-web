# Frontend–Backend Contracts

How the frontend consumes backend truth, and where drift happens.

---

## The Core Contract

`creator_optimizer` is the source of truth. The frontend is a consumer, not a co-author.

When backend truth changes, the frontend must:
1. Regenerate API types: `npm run api:generate`
2. Run the entitlement contract check: `npm run contract:check:entitlements`
3. Verify no UI surface is constructing data the API now provides directly.

---

## Authoritative Backend Endpoints

| Concern | Endpoint | Frontend Usage |
|---|---|---|
| User entitlements and capabilities | `GET /v1/entitlements` | Gate features, show upgrade prompts |
| Billing status | `GET /v1/billing/status` | Show billing state, subscription status |
| Workspace data sources | `GET /v1/workspace/data-sources` | Show what's staged per platform |
| Upload presign | `POST /v1/uploads/presign` | Get presigned URL for upload |
| Upload callback | `POST /v1/uploads/callback` | Confirm upload complete |
| Upload status | `GET /v1/uploads/latest/status` | Poll upload progress |
| Report creation | `POST /v1/reports` | Submit source selection + trigger run |
| Report list | `GET /v1/reports` | Show report history |
| Report detail | `GET /v1/reports/{id}` | Full report content |
| Report status | `GET /v1/reports/{id}/status` | Poll report generation progress |
| PDF artifact | `GET /v1/reports/{id}/artifact` | PDF download |
| Checkout session | `POST /v1/billing/create-checkout-session` | Initiate Stripe checkout |
| Billing portal | `POST /v1/billing/create-portal-session` | Open Stripe customer portal |

---

## Generated Types

`src/lib/api/generated/schema.ts` and `src/lib/api/generated/index.ts` are generated from the backend's OpenAPI spec. They are committed to git.

**Regenerate after any backend schema change:**
```bash
npm run api:generate
```

**Verify entitlement contract shape hasn't drifted:**
```bash
npm run contract:check:entitlements
```

Do not manually edit generated files. Any manual edit will be overwritten on the next `api:generate` run.

---

## Source Eligibility: Backend Owns It

The frontend must not decide which platforms are eligible for upload or report inclusion by consulting a hardcoded local list.

**Correct approach:**
- Workspace sources come from `GET /v1/workspace/data-sources`.
- Source eligibility for a run is validated by the backend at `POST /v1/reports`.
- The upload UI shows supported platforms based on backend-generated source manifest or the platform support policy.

**The drift risk:**
`src/lib/upload/source-manifest-static.generated.ts` is a static snapshot of source metadata. If this file is manually edited or not regenerated after a backend change, the frontend and backend diverge. Any time a platform is added, removed, or reclassified, this manifest must be regenerated.

---

## Entitlement Gating: Backend Owns It

`src/lib/api/entitlements.ts` fetches and caches entitlements from the backend. `src/lib/entitlements/model.ts` defines the local capability matrix.

**Rule:** The capability matrix in `model.ts` must stay in sync with backend entitlement semantics. When the backend adds a new capability or changes tier access, `model.ts` must be updated to match.

**The drift risk:** A capability that the backend grants to `report` tier is also granted locally in `model.ts` to `pro` tier only. The frontend silently blocks access even though the backend would allow it.

If local model logic diverges from backend truth, the backend is correct.

---

## Local Static / Generated Snapshots

| File | What It Is | Regeneration |
|---|---|---|
| `src/lib/api/generated/schema.ts` | OpenAPI-generated backend types | `npm run api:generate` |
| `src/lib/upload/source-manifest-static.generated.ts` | Platform source metadata snapshot | Must be regenerated when backend source policy changes |

Both files must be treated as **generated artifacts**, not as hand-authored source of truth. Do not add local business logic to generated files.

---

## What the Frontend Must Not Do

| Do Not | Instead |
|---|---|
| Maintain a hardcoded list of supported platforms | Consume from backend workspace/source endpoints |
| Compute plan capabilities from raw plan tier string | Read from backend entitlement response |
| Construct source scope for a report from workspace state | Use source selection payload returned by backend |
| Decide if a source is "report-driving" locally | Backend classifies this; frontend renders the classification |
| Cache entitlements indefinitely | Respect TTL (currently 5min for entitlements, 30s for billing status) |
| Create checkout URLs client-side | Backend creates checkout sessions; frontend navigates to returned URL |

---

## Versioning and Backwards Compatibility

- The backend may expose legacy alias tier names (`basic`, `starter`, `plan_a`, etc.) at API edges. The frontend should normalize to `free | report | pro` via the generated schema — do not write fresh code against alias names.
- If an endpoint is deprecated, prefer the canonical endpoint. The fallback logic in `entitlements.ts` (legacy checkout endpoints) should be removed when the canonical endpoint is confirmed stable.

---

## API Error Handling

| Error | Frontend Behavior |
|---|---|
| 402 / `ENTITLEMENT_REQUIRED` | Show upgrade prompt; do not expose raw error code to user |
| 401 / `UNAUTHORIZED` | Redirect to login |
| 404 on report | Show "report not found" state |
| 5xx | Show error banner; do not blame user |
| Upload validation error | Show specific error message from `error.details` |

`isEntitlementRequiredError()` in `src/lib/api/client.ts` detects entitlement failures. Use this helper rather than checking status codes directly.
