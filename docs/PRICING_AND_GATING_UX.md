# Pricing and Gating UX

How the frontend handles entitlement states, plan tiers, and gating.

> See also: `docs/billing-ui.md` (Stripe checkout flow), `docs/entitlements-bootstrap.md` (entitlement contract), `creator_optimizer/docs/ENTITLEMENTS_AND_PRICING.md` (backend model).

---

## Canonical Tier Ladder

| Tier | What It Is | Key Capability |
|---|---|---|
| `free` | Default on signup | Upload + validation only. No report generation. |
| `report` | One-time paid report event | One completed report. Durable access to owned report. |
| `pro` | Recurring subscription | Recurring report generation + full history + dashboard intelligence. |

---

## Free Tier UX

**What free users can do:**
- Upload data exports and view validation results.
- See workspace source status (staged, processing, error).
- Access the help/upload guide.
- Navigate to billing to upgrade.

**What free users cannot do:**
- Generate a report.
- Download a PDF.
- Access report history.
- Access dashboard intelligence.

**UX pattern:**
- Show the Run Report button as visible but gated — clicking it surfaces an upgrade prompt, not a broken state.
- The dashboard shows an onboarding / "get started" state, not an empty error.
- Do not show "0 reports" with no guidance — show the upload → run → report flow.

---

## Report (Owned Report) UX

**What Report-tier users can do:**
- Access their one completed owned report.
- Download the PDF for their owned report.
- View read-only dashboard intelligence derived from the owned report.
- View their owned report in history.

**What Report-tier users cannot do:**
- Generate additional reports (credit consumed).
- Access recurring monitoring or Pro-only features.

**UX pattern:**
- Do not present Report-tier as an ongoing subscription. It is a one-time credit.
- After the owned report is generated, the "Run Report" action should show an upgrade prompt for Pro, not silently allow another run.
- Report history shows owned report(s) only.
- Do not confuse the user by showing a "subscription" label next to Report-tier access.

**Common mistake to avoid:** Treating Report-tier identically to Pro-tier in the UI. A Report-tier creator who tries to generate a second report must see a clear prompt to upgrade to Pro, not an opaque failure.

---

## Pro Tier UX

**What Pro users can do:**
- Generate reports repeatedly without per-report credits.
- Access full report history.
- Access dashboard intelligence from all owned and generated reports.
- Access future Pro-only features (comparative analytics, monitoring).

**UX pattern:**
- Pro users should never see upgrade prompts for features included in their plan.
- The billing page shows the active Pro subscription and a link to the customer billing portal (cancel, update payment).
- Show subscription renewal date if available from backend.

---

## Owned Report Access vs Pro Subscription Value

The upgrade path matters:
- Report → Pro: "You've already unlocked one report. With Pro, generate reports whenever you need them."
- Free → Report: "Run your first business diagnostic report."
- Free → Pro: "Full recurring access — run reports, track trends over time."

Avoid copy that implies a Report purchase grants ongoing generation access. It does not.

---

## Paywall / Gating Copy Principles

| Principle | Example |
|---|---|
| Specificity over vagueness | "Run another report — upgrade to Pro" not "Upgrade for more" |
| Show value, not restriction | "Pro gives you recurring reports" not "You can't do this" |
| Keep it brief | One sentence + CTA, not a feature comparison table in a modal |
| Don't block navigation | Gated features show upgrade prompt; app remains navigable |
| Avoid scary error states | Entitlement failure is a soft prompt, not a hard error |

---

## Gate Implementation Principles

**Backend enforcement is the security boundary.** Frontend gates are UX conveniences.

- Read entitlement state from `src/lib/gating/app-gate.ts` and the entitlement context.
- Use `src/lib/entitlements/model.ts` capability matrix to check specific feature gates.
- Do not reimplement entitlement logic per-component — read from the context.
- If the backend returns 402 / `ENTITLEMENT_REQUIRED`, surface an upgrade prompt via `isEntitlementRequiredError()`.

**Gate states to handle:**
| State | User-visible behavior |
|---|---|
| `session_loading` | Loading spinner; do not flash content |
| `anon` | Redirect to login |
| `authed_loading_entitlements` | Loading spinner; do not flash gated content |
| `authed_entitled` | Full access per tier |
| `authed_unentitled` | Free tier UX (upload only) |
| `session_expired` | Session expiry prompt; re-login |
| `entitlements_error` | Show error banner; do not silently assume free tier |

---

## Billing UI Entry Points

| Action | Trigger |
|---|---|
| Upgrade to Report | "Run Report" when free tier; or explicit upgrade link |
| Upgrade to Pro | In-app upgrade prompt; pricing page |
| Manage subscription | "Manage billing" → Stripe customer portal |
| Checkout success | `/app/billing/success` with confirmation state |
| Checkout cancel | `/app/billing/cancel` with soft return |
