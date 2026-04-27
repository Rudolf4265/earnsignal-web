# EarnSigma Frontend — Agent Context

> Read this before making any change in `earnsignal-web`.

## What earnsignal-web Is

`earnsignal-web` is the **primary product frontend** for EarnSigma. It is a Next.js application (App Router) serving two domains from one codebase:
- `app.earnsigma.com` — The authenticated product app (dashboard, upload, report, billing, settings).
- `www.earnsigma.com` — The public marketing site (landing, pricing, features, sample report).

Domain routing is handled in `src/lib/config/domains.ts` and middleware via `proxy.ts`. Route groups: `app/(app)`, `app/(auth)`, `app/(marketing)`.

## What EarnSigma Is

EarnSigma is a **private creator business intelligence** product. It ingests creator-owned data exports, persists them in a per-creator workspace, and generates combined creator business diagnostic reports + premium PDFs.

**Not:** a public social stats tracker, influencer discovery tool, or vanity analytics product. The user must feel they are getting *private, honest diagnostics of their own business* — not a follower count dashboard.

## The Frontend's Job

**Render backend truth clearly.** The frontend does not:
- Compute entitlements. It consumes `GET /v1/entitlements` and renders what the backend returns.
- Determine source eligibility. It relies on backend workspace/source endpoints.
- Recompute metric definitions. It displays numbers from the API with the labels the API assigns.
- Maintain a separate platform support registry. It generates or consumes source metadata from backend truth.

When the backend changes any of these, the frontend updates its rendering — it does not introduce local logic to compensate.

## Primary User Flows

| Flow | Key Files |
|---|---|
| Upload data export | `app/(app)/app/data/page.tsx`, `src/lib/api/upload.ts` |
| View workspace sources | `app/(app)/app/data/page.tsx`, `src/lib/api/workspace.ts` |
| Create a report run | `app/(app)/app/report/page.tsx`, `src/lib/api/reports.ts` |
| View report detail | `app/(app)/app/report/[id]/page.tsx` |
| Download PDF | Report detail → artifact endpoint |
| View dashboard | `app/(app)/app/dashboard/page.tsx`, `src/lib/dashboard/` |
| Billing / upgrade | `app/(app)/app/billing/page.tsx`, `src/lib/api/entitlements.ts` |
| Upload guide / help | `app/(app)/app/help/page.tsx` |

## UX Trust Principles

1. **Source count and platforms must agree** — API payload, dashboard, PDF, and report title must all say the same thing.
2. **Paid subscribers ≠ total subscribers** — Never label a number as "paid subscribers" if it includes free-tier users.
3. **Status first, details second** — Show what matters at a glance. Expand details on demand.
4. **One concept once per screen** — Don't explain report-driving vs context-only on every source card.
5. **Plain English, not internal taxonomy** — "Earnings data" not "revenue-contributing source."

## What Not to Do

- Do not add local platform support logic separate from backend truth.
- Do not compute plan capabilities from raw plan tier strings — consume the backend entitlement response.
- Do not inline detailed file format rules into the main upload workflow.
- Do not show a different source count on the dashboard than what the API returns for that run.
- Do not let the billing page confuse Report-only access (one-time credit) with a Pro subscription.
- Do not render a "report generating" state that persists past the actual job completion.

## Key Existing Documentation

| File | Purpose |
|---|---|
| `docs/billing-ui.md` | Checkout flow and billing states |
| `docs/entitlements-bootstrap.md` | Entitlement contract and bootstrap details |
| `docs/ENTITLEMENT_QA_CHECKLIST.md` | Manual QA matrix for entitlement states |
| `docs/admin-console.md` | Admin tooling |
| `docs/PRODUCT_UX_MODEL.md` | Core UX model for workspace and report flows |
| `docs/REPORT_UI_TRUTH.md` | How report/dashboard surfaces must render truth |
| `docs/FRONTEND_BACKEND_CONTRACTS.md` | API contract and drift prevention |
| `docs/PRICING_AND_GATING_UX.md` | Entitlement-aware UI behavior |
| `docs/UI_COPY_AND_DENSITY_RULES.md` | Copy and density lessons |
| `docs/CROSS_REPO_CONTEXT.md` | Cross-repo responsibilities and failure modes |

## How This Repo Relates to creator_optimizer

- `creator_optimizer` is the backend. It owns all business logic, entitlement resolution, metric computation, and report generation.
- This frontend calls the backend API and renders the results.
- When the backend API schema changes, regenerate types: `npm run api:generate`.
- Entitlement contract check: `npm run contract:check:entitlements`.
- For cross-repo changes, see `docs/CROSS_REPO_CONTEXT.md`.
