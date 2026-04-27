# Codex Start Here

> Read these files before implementing any feature in `earnsignal-web`.

---

## What Is EarnSigma

Private creator business intelligence. Creators upload their own data exports, choose which sources to include in a report run, and get a combined business diagnostic report + PDF. This frontend renders the backend's truth — it does not compute it.

**Not** a social stats tracker, influencer discovery tool, or vanity analytics product.

---

## Read These First (In Order)

| Document | Read When |
|---|---|
| `docs/AGENT_CONTEXT.md` | Always — high-level context for every session |
| `docs/PRODUCT_UX_MODEL.md` | Before any change to upload, workspace, source selection, or report creation UX |
| `docs/REPORT_UI_TRUTH.md` | Before any change to report detail, dashboard, or any surface that shows report data |
| `docs/FRONTEND_BACKEND_CONTRACTS.md` | Before any change to API calls, entitlement logic, or generated types |
| `docs/PRICING_AND_GATING_UX.md` | Before any change to billing UI, gating, upgrade prompts, or tier-conditional rendering |
| `docs/UI_COPY_AND_DENSITY_RULES.md` | Before writing new copy or adding new UI to the main workflow |
| `docs/CROSS_REPO_CONTEXT.md` | For any change that touches the API contract or depends on backend behavior |

---

## The Three Rules You Must Not Violate

1. **Render backend truth; don't reinterpret it.** Entitlements, source eligibility, metric values, and report content come from the API. Do not compute local alternatives.
2. **Source count and labels must agree.** API, dashboard, PDF, and report title must all show the same source count and platform labels for a given run.
3. **Paid subscribers ≠ total subscribers.** The headline subscriber KPI must use paid-only counts, labeled clearly.

---

## Existing Docs That Are Still Authoritative

| File | What It Documents |
|---|---|
| `docs/billing-ui.md` | Checkout flow, billing states, Stripe integration |
| `docs/entitlements-bootstrap.md` | Entitlement contract and bootstrap details |
| `docs/ENTITLEMENT_QA_CHECKLIST.md` | Manual QA matrix for entitlement states |
| `docs/admin-console.md` | Admin tooling |
| `docs/auth-troubleshooting.md` | Supabase auth troubleshooting |
| `docs/instagram-exports.md` | Instagram export guidance |
| `docs/patreon-members-export.md` | Patreon export guidance |

---

## Where Key Frontend Logic Lives

| What | Where |
|---|---|
| Domain routing | `src/lib/config/domains.ts`, middleware |
| Auth gate state machine | `src/lib/gating/app-gate.ts` |
| Entitlements fetch and cache | `src/lib/api/entitlements.ts` |
| Capability matrix by tier | `src/lib/entitlements/model.ts` |
| Upload API client | `src/lib/api/upload.ts` |
| Workspace API client | `src/lib/api/workspace.ts` |
| Report API client | `src/lib/api/reports.ts` |
| Dashboard logic | `src/lib/dashboard/` |
| Generated backend types | `src/lib/api/generated/schema.ts` |
| Source manifest (generated) | `src/lib/upload/source-manifest-static.generated.ts` |
| App gate provider (context) | `app/(app)/_components/app-gate-provider.tsx` |
| Upload flow | `app/(app)/app/data/page.tsx`, `app/(app)/app/_components/upload/` |
| Report creation + list | `app/(app)/app/report/page.tsx` |
| Report detail | `app/(app)/app/report/[id]/page.tsx` |
| Dashboard | `app/(app)/app/dashboard/page.tsx` |
| Billing | `app/(app)/app/billing/page.tsx` |
| Help / upload guide | `app/(app)/app/help/page.tsx` |

---

## After Any Backend Schema Change

```bash
# In earnsignal-web:
npm run api:generate
npm run contract:check:entitlements
```

Then verify no UI surface is manually constructing data the API now provides directly.

---

## Cross-Repo Note

- `creator_optimizer` is the backend and source of truth for all business logic.
- The companion start-here guide for that repo is at `creator_optimizer/docs/CODEX_START_HERE.md`.
- For changes that touch the API contract, see `docs/CROSS_REPO_CONTEXT.md` and `creator_optimizer/docs/PRODUCTION_VALIDATION.md`.
