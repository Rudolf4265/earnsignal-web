"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPricingPlanPrice, getPricingPlan } from "@earnsigma/config";
import { buttonClassName } from "@/src/components/ui/button";
import {
  clearCheckoutAttempt,
  checkoutAttemptInProgress,
  createBillingPortalSession,
  createCheckoutSession,
  fetchBillingStatus,
  type BillingStatusResponse,
  type CheckoutPlan,
} from "@/src/lib/api/entitlements";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { ApiError, isApiError } from "@/src/lib/api/client";
import {
  buildBillingPlanCardViewModel,
  buildFreePlanCardViewModel,
  formatPlanLabel,
  FREE_PLAN_ALIASES,
  REPORT_PLAN_ALIASES,
  PRO_PLAN_ALIASES,
} from "@/src/lib/billing/plan-card";
import { buildSubscriptionStateViewModel } from "@/src/lib/billing/subscription-state";
import { useAppGate } from "../../_components/app-gate-provider";
import { useEntitlementState } from "../../_components/use-entitlement-state";
import { SessionExpiredCallout } from "../../_components/gate-callouts";

const reportPlan = getPricingPlan("report");
const proPlan = getPricingPlan("pro");

const plans: Array<{ id: CheckoutPlan; label: string; priceLabel: string; summary: string; highlights: string[] }> = [
  {
    id: "report",
    label: "Report",
    priceLabel: formatPricingPlanPrice(reportPlan),
    summary: "One complete business diagnosis from your workspace data — full report, downloadable PDF, yours to keep.",
    highlights: [
      "One complete report from your workspace data",
      "Focused 3-month analysis window",
      "Biggest opportunity and platform risk",
      "Strengths, risks, and next 3 actions",
      "Owned access and downloadable PDF",
    ],
  },
  {
    id: "pro",
    label: "Pro",
    priceLabel: formatPricingPlanPrice(proPlan),
    summary: "Everything in Report, plus ongoing visibility as your business evolves — full history, comparisons, and continuous monitoring.",
    highlights: [
      "All Report features included",
      "Full-history analysis across eligible uploads",
      "Report history and period comparisons",
      "Ongoing dashboard monitoring",
      "Track how your business evolves over time",
    ],
  },
];

const comparisonRows: Array<{ label: string; free: string; report: string; pro: string }> = [
  { label: "Upload data",             free: "Included", report: "Included", pro: "Included" },
  { label: "Workspace setup",         free: "Included", report: "Included", pro: "Included" },
  { label: "Full report",             free: "-",        report: "Included", pro: "Included" },
  { label: "PDF download",            free: "-",        report: "Included", pro: "Included" },
  { label: "Owned purchased reports", free: "-",        report: "Included", pro: "Included" },
  { label: "Focused 3-month analysis",free: "-",        report: "Included", pro: "Included" },
  { label: "Full-history analysis",   free: "-",        report: "-",        pro: "Included" },
  { label: "Report history",          free: "-",        report: "-",        pro: "Included" },
  { label: "Comparisons",             free: "-",        report: "-",        pro: "Included" },
  { label: "Ongoing monitoring",      free: "-",        report: "-",        pro: "Included" },
];

const CHECKOUT_CONFIG_ERROR_CODES = new Set(["BILLING_NOT_CONFIGURED", "BILLING_INVALID_STRIPE_PRICE_ID"]);
const CHECKOUT_UNAVAILABLE_MESSAGE = "Checkout is not available right now. Please try again later.";

function isCheckoutConfigError(error: unknown): error is ApiError {
  return error instanceof ApiError && CHECKOUT_CONFIG_ERROR_CODES.has(error.code);
}

function formatAccessSourceLabel(source: string | null | undefined, accessReasonCode: string | null | undefined): string {
  const normalizedSource = String(source ?? "").trim().toLowerCase();
  const normalizedReason = String(accessReasonCode ?? "").trim().toLowerCase();

  if (normalizedSource === "admin_override") {
    return normalizedReason === "founder_protected" ? "Founder access" : "Admin-granted access";
  }

  if (normalizedSource === "stripe") {
    return "Subscription access";
  }

  if (normalizedSource === "owned_report") {
    return "Purchased report access";
  }

  if (normalizedSource === "trial") {
    return "Trial access";
  }

  return "Premium access";
}

function formatResolutionSourceCode(source: string | null | undefined, isActive: boolean): string {
  const normalizedSource = String(source ?? "").trim().toLowerCase();
  if (!normalizedSource || normalizedSource === "none") {
    return isActive ? "unknown" : "fallback_free";
  }

  return normalizedSource;
}

function formatResolutionReasonCode(accessReasonCode: string | null | undefined, isActive: boolean): string {
  const normalizedReason = String(accessReasonCode ?? "").trim();
  if (normalizedReason.length > 0) {
    return normalizedReason;
  }

  return isActive ? "ENTITLEMENT_ACTIVE" : "FALLBACK_FREE";
}

function formatInactiveAccessMessage(accessReasonCode: string | null | undefined): string | null {
  const normalizedReason = String(accessReasonCode ?? "").trim().toLowerCase();

  if (!normalizedReason || normalizedReason === "active_subscription") {
    return null;
  }

  if (normalizedReason === "entitlement_required") {
    return "Upgrade to Report or Pro to unlock report generation.";
  }

  if (normalizedReason === "override_revoked") {
    return "This account no longer has admin-granted access.";
  }

  return "Premium access is not active on this account right now.";
}

function formatUsageSummary({
  generated,
  remaining,
  limit,
}: {
  generated: number;
  remaining: number;
  limit: number;
}): string {
  return `${generated} of ${limit} reports used this period. ${remaining} remaining.`;
}

export default function BillingPage() {
  const { state, entitlements, error, errorRequestId, requestId, actions } = useAppGate();
  const entitlementState = useEntitlementState();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<CheckoutPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState<{ message: string; requestId?: string } | null>(null);
  const [checkoutConfigError, setCheckoutConfigError] = useState<{ message: string; requestId?: string } | null>(null);
  const [hasCheckoutMarker, setHasCheckoutMarker] = useState(() => checkoutAttemptInProgress());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingPortal, setIsCreatingPortal] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillingStatusResponse | null>(null);
  const [billingStatusError, setBillingStatusError] = useState<{ message: string; requestId?: string } | null>(null);
  const [portalError, setPortalError] = useState<{ message: string; requestId?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchBillingStatus()
      .then((nextStatus) => {
        if (cancelled) {
          return;
        }
        setBillingStatus(nextStatus);
        if (!nextStatus.checkoutConfigured) {
          setCheckoutConfigError({
            message: CHECKOUT_UNAVAILABLE_MESSAGE,
          });
        } else {
          setCheckoutConfigError(null);
        }
        setBillingStatusError(null);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        setBillingStatusError({
          message: err instanceof Error ? err.message : "Unable to load billing status.",
          requestId: isApiError(err) ? err.requestId : undefined,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCheckout = async (plan: CheckoutPlan) => {
    setIsCreatingCheckout(plan);
    setCheckoutError(null);
    setCheckoutConfigError(null);
    setPortalError(null);

    try {
      const { checkout_url } = await createCheckoutSession(plan);
      window.location.assign(checkout_url);
    } catch (err) {
      if (isCheckoutConfigError(err) && billingStatus?.checkoutConfigured !== true) {
        setCheckoutConfigError({
          message: CHECKOUT_UNAVAILABLE_MESSAGE,
          requestId: err.requestId,
        });
      } else {
        setCheckoutError({
          message: err instanceof Error ? err.message : "Unable to start checkout.",
          requestId: isApiError(err) ? err.requestId : undefined,
        });
      }
      if (billingStatus?.checkoutConfigured === true && isCheckoutConfigError(err)) {
        setCheckoutConfigError(null);
      }
      setIsCreatingCheckout(null);
      setHasCheckoutMarker(checkoutAttemptInProgress());
    }
  };

  const refreshBillingAndEntitlements = async () => {
    setIsRefreshing(true);
    setCheckoutError(null);
    setPortalError(null);

    try {
      const [entitlementsResult, billingStatusResult] = await Promise.allSettled([
        actions.refreshEntitlements({ forceRefresh: true }),
        fetchBillingStatus({ forceRefresh: true }),
      ]);

      if (billingStatusResult.status === "fulfilled") {
        const nextStatus = billingStatusResult.value;
        setBillingStatus(nextStatus);
        if (!nextStatus.checkoutConfigured) {
          setCheckoutConfigError({
            message: CHECKOUT_UNAVAILABLE_MESSAGE,
          });
        } else {
          setCheckoutConfigError(null);
        }
        setBillingStatusError(null);
      } else {
        setBillingStatusError({
          message: billingStatusResult.reason instanceof Error ? billingStatusResult.reason.message : "Unable to refresh billing status.",
          requestId: isApiError(billingStatusResult.reason) ? billingStatusResult.reason.requestId : undefined,
        });
      }

      if (entitlementsResult.status === "rejected") {
        // Entitlements errors are already handled in AppGateProvider; keep this page stable.
      }
    } finally {
      setIsRefreshing(false);
      setHasCheckoutMarker(checkoutAttemptInProgress());
    }
  };

  const handleManageSubscription = async () => {
    setIsCreatingPortal(true);
    setPortalError(null);

    try {
      const { portal_url } = await createBillingPortalSession();
      window.location.assign(portal_url);
    } catch (err) {
      setPortalError({
        message: err instanceof Error ? err.message : "Unable to open subscription management.",
        requestId: isApiError(err) ? err.requestId : undefined,
      });
      setIsCreatingPortal(false);
    }
  };

  const checkoutConfigured = billingStatus?.checkoutConfigured ?? true;
  const configBlocksCheckout = checkoutConfigured === false || checkoutConfigError !== null;
  const allowCheckout = !hasCheckoutMarker && isCreatingCheckout === null && !configBlocksCheckout;
  const activePlanTier = billingStatus?.effectivePlanTier ?? entitlementState.effectivePlanTier;
  const activeStatus = billingStatus?.status ?? (entitlementState.accessGranted ? "active" : "inactive");
  const isActive = (billingStatus?.accessGranted ?? entitlementState.accessGranted) === true;
  const source = billingStatus?.entitlementSource ?? entitlementState.entitlementSource ?? entitlements?.source ?? null;
  const accessReasonCode = billingStatus?.accessReasonCode ?? entitlementState.accessReasonCode;
  const billingRequired = (billingStatus?.billingRequired ?? entitlementState.billingRequired) === true;
  const usageSummary = useMemo(() => {
    const generated = entitlements?.reportsGeneratedThisPeriod;
    const remaining = entitlements?.reportsRemainingThisPeriod;
    const limit = entitlements?.monthlyReportLimit;

    if (generated === null || generated === undefined || remaining === null || remaining === undefined || limit === null || limit === undefined) {
      return null;
    }

    return formatUsageSummary({ generated, remaining, limit });
  }, [entitlements?.monthlyReportLimit, entitlements?.reportsGeneratedThisPeriod, entitlements?.reportsRemainingThisPeriod]);
  const accessSourceLabel = isActive ? formatAccessSourceLabel(source, accessReasonCode) : "No premium access active";
  const inactiveAccessMessage = !isActive ? formatInactiveAccessMessage(accessReasonCode) : null;
  const subscriptionState = buildSubscriptionStateViewModel({
    effectivePlanTier: activePlanTier === "report" || activePlanTier === "pro" ? activePlanTier : "free",
    accessGranted: isActive,
    entitlementSource: source,
    status: activeStatus,
    cancelAtPeriodEnd: billingStatus?.cancelAtPeriodEnd ?? null,
    currentPeriodEnd: billingStatus?.currentPeriodEnd ?? null,
    stripeCustomerId: billingStatus?.stripeCustomerId ?? null,
    stripeSubscriptionId: billingStatus?.stripeSubscriptionId ?? null,
  });
  const resolutionSourceCode = formatResolutionSourceCode(source, isActive);
  const resolutionReasonCode = formatResolutionReasonCode(accessReasonCode, isActive);

  // Plan-state helpers for state-aware CTAs
  const normalizedTier = String(activePlanTier ?? "").trim().toLowerCase();
  const isProUser = PRO_PLAN_ALIASES.has(normalizedTier) && isActive;
  const isReportUser = REPORT_PLAN_ALIASES.has(normalizedTier) && isActive;
  const isFreeUser = !isProUser && !isReportUser;
  const isStripeSubscription = String(source ?? "").trim().toLowerCase() === "stripe";
  const isAdminOverride = String(source ?? "").trim().toLowerCase() === "admin_override";

  const freeCard = buildFreePlanCardViewModel(activePlanTier);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-text-primary">Billing</h1>
        <p className="text-brand-text-secondary">Review your current access, compare plans, and manage billing.</p>
      </header>

      {state === "session_expired" ? <SessionExpiredCallout requestId={requestId} /> : null}

      {/* ── Current access ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-brand-border bg-brand-panel p-6 shadow-brand-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-brand-text-primary">Current access</h2>
          <button
            type="button"
            onClick={() => void refreshBillingAndEntitlements()}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh access"}
          </button>
        </div>

        <p className="mt-3 text-sm text-brand-text-secondary" data-testid="billing-current-plan">{`Current plan: ${formatPlanLabel(activePlanTier)} | ${subscriptionState.stateLabel}`}</p>
        <p className="mt-1 text-xs text-brand-text-muted">{`Access: ${accessSourceLabel}`}</p>
        <p className="mt-1 text-xs text-brand-text-muted">{`Resolution: ${formatPlanLabel(activePlanTier)} via ${resolutionSourceCode} (${resolutionReasonCode})`}</p>
        {subscriptionState.description ? <p className="mt-1 text-xs text-brand-text-muted">{subscriptionState.description}</p> : null}
        {!isActive && billingRequired ? <p className="mt-1 text-xs text-amber-100">Update billing to restore premium access.</p> : null}
        {inactiveAccessMessage ? <p className="mt-1 text-xs text-brand-text-muted">{inactiveAccessMessage}</p> : null}
        {usageSummary ? <p className="mt-1 text-xs text-brand-text-muted">{usageSummary}</p> : null}

        {error ? (
          <ErrorBanner
            className="mt-4"
            title="Access refresh delayed"
            message={error}
            requestId={errorRequestId}
            onRetry={() => void entitlementState.refresh()}
          />
        ) : null}

        {billingStatusError ? (
          <ErrorBanner
            className="mt-4"
            title="Billing status unavailable"
            message={billingStatusError.message}
            requestId={billingStatusError.requestId}
            onRetry={() => void refreshBillingAndEntitlements()}
          />
        ) : null}

        {portalError ? (
          <ErrorBanner
            className="mt-4"
            title="Subscription management unavailable"
            message={portalError.message}
            requestId={portalError.requestId}
            onRetry={() => void handleManageSubscription()}
            retryLabel="Try again"
          />
        ) : null}

        {checkoutConfigError ? (
          <ErrorBanner
            className="mt-4"
            data-testid="billing-config-error-banner"
            title="Checkout unavailable"
            message={checkoutConfigError.message}
            requestId={checkoutConfigError.requestId}
            onRetry={() => void refreshBillingAndEntitlements()}
            retryLabel="Refresh access"
          />
        ) : null}

        {/* State-aware primary CTA */}
        {subscriptionState.showManageSubscription ? (
          <div className="mt-4 space-y-1.5">
            <button
              type="button"
              onClick={() => void handleManageSubscription()}
              className={buttonClassName({ variant: "primary" })}
              disabled={isCreatingPortal}
              data-testid="billing-manage-subscription-btn"
            >
              {isCreatingPortal ? "Opening..." : subscriptionState.manageSubscriptionLabel}
            </button>
            <p className="text-xs text-brand-text-muted">
              Manage billing, payment method, renewal, or cancellation.
            </p>
          </div>
        ) : isReportUser && !isAdminOverride ? (
          <button
            type="button"
            onClick={() => void handleCheckout("pro")}
            className={buttonClassName({ variant: "primary", className: "mt-4" })}
            disabled={!allowCheckout}
            data-testid="billing-upgrade-to-pro-btn"
          >
            {isCreatingCheckout === "pro" ? "Redirecting..." : "Upgrade to Pro"}
          </button>
        ) : isFreeUser && !isAdminOverride ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCheckout("report")}
              className={buttonClassName({ variant: "secondary" })}
              disabled={!allowCheckout}
              data-testid="billing-get-report-btn"
            >
              {isCreatingCheckout === "report" ? "Redirecting..." : "Get your report"}
            </button>
            <button
              type="button"
              onClick={() => void handleCheckout("pro")}
              className={buttonClassName({ variant: "primary" })}
              disabled={!allowCheckout}
              data-testid="billing-upgrade-to-pro-free-btn"
            >
              {isCreatingCheckout === "pro" ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          </div>
        ) : null}
      </section>

      {hasCheckoutMarker ? (
        <section className="rounded-xl border border-amber-300/35 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p>Checkout is already opening.</p>
          <button
            type="button"
            onClick={() => {
              clearCheckoutAttempt();
              setHasCheckoutMarker(false);
              setCheckoutError(null);
            }}
            className="mt-3 inline-flex rounded-xl border border-amber-200/50 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
          >
            Start again
          </button>
        </section>
      ) : null}

      {/* ── Plan cards: Free / Report / Pro ────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-3" data-testid="billing-plan-cards">

        {/* Free card */}
        <article
          className={freeCard.cardClassName}
          data-testid="billing-plan-card-free"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className={`text-xl font-semibold ${freeCard.titleClassName}`}>Free</h3>
                <p className={`mt-1 text-sm ${freeCard.bodyClassName}`}>Always free</p>
              </div>
              {freeCard.isCurrent ? (
                <span data-testid="billing-current-badge" className={freeCard.badgeClassName}>
                  Current
                </span>
              ) : null}
            </div>
            <p className={`mt-2 text-sm ${freeCard.bodyClassName}`}>
              Set up your workspace and validate your data. Upgrade when you&apos;re ready for a full report or ongoing monitoring.
            </p>
          </div>

          <ul className={`space-y-1 text-xs ${freeCard.highlightsClassName}`}>
            {[
              "Upload and validate your data",
              "Prepare your workspace",
              "Access when you purchase a report or upgrade",
            ].map((line) => (
              <li key={line}>- {line}</li>
            ))}
          </ul>

          <button
            type="button"
            disabled={freeCard.ctaDisabled}
            className={buttonClassName({ variant: "secondary", className: "disabled:opacity-60" })}
            data-testid="billing-plan-cta-free"
          >
            {freeCard.isCurrent ? "Free plan active" : "Free"}
          </button>
        </article>

        {/* Report and Pro cards */}
        {plans.map((plan) => {
          const planCard = buildBillingPlanCardViewModel({
            planId: plan.id,
            planLabel: plan.label,
            activePlanTier,
            isActive,
            allowCheckout,
          });
          return (
            <article key={plan.id} className={planCard.cardClassName} data-testid={`billing-plan-card-${plan.id}`}>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className={`text-xl font-semibold ${planCard.titleClassName}`}>{plan.label}</h3>
                    {plan.id === "report" && reportPlan.anchorPrice ? (
                      <p className={`mt-1 text-xs line-through decoration-current/70 ${planCard.bodyClassName}`}>{reportPlan.anchorPrice} one-time</p>
                    ) : null}
                    <p className={`mt-1 text-sm ${planCard.bodyClassName}`}>{plan.priceLabel}</p>
                    {plan.id === "report" ? (
                      <p className={`mt-1 text-xs font-medium uppercase tracking-[0.12em] ${planCard.bodyClassName}`}>{reportPlan.badge}</p>
                    ) : null}
                  </div>
                  {planCard.isCurrent ? (
                    <span data-testid="billing-current-badge" className={planCard.badgeClassName}>
                      Current
                    </span>
                  ) : null}
                </div>
                <p className={`mt-2 text-sm ${planCard.bodyClassName}`}>{plan.summary}</p>
                {plan.id === "report" ? <p className={`mt-2 text-xs ${planCard.bodyClassName}`}>{reportPlan.footnote}</p> : null}
              </div>

              <ul className={`space-y-1 text-xs ${planCard.highlightsClassName}`}>
                {plan.highlights.map((line) => (
                  <li key={line}>- {line}</li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => void handleCheckout(plan.id)}
                disabled={planCard.checkoutDisabled}
                className={buttonClassName({ variant: planCard.ctaVariant, className: planCard.ctaClassName })}
                data-testid={`billing-plan-cta-${plan.id}`}
              >
                {isCreatingCheckout === plan.id ? "Redirecting..." : planCard.ctaLabel}
              </button>
            </article>
          );
        })}
      </section>

      {/* ── Included at a glance ───────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-brand-border bg-brand-panel shadow-brand-card">
        <div className="border-b border-brand-border px-5 py-4">
          <h2 className="text-base font-semibold text-brand-text-primary">Included at a glance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-brand-panel-muted text-xs uppercase tracking-[0.14em] text-brand-text-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Feature</th>
                <th scope="col" className="px-4 py-3 font-medium text-brand-text-secondary">Free</th>
                <th scope="col" className="px-4 py-3 font-medium text-brand-text-secondary">Report</th>
                <th scope="col" className="px-5 py-3 font-medium text-brand-text-primary">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-xs text-brand-text-secondary">
              {comparisonRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-5 py-3 font-medium text-brand-text-primary">{row.label}</th>
                  <td className="px-4 py-3">{row.free}</td>
                  <td className="px-4 py-3">{row.report}</td>
                  <td className="px-5 py-3">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {checkoutError ? (
        <ErrorBanner
          data-testid="billing-error-banner"
          title="Checkout unavailable"
          message={checkoutError.message}
          requestId={checkoutError.requestId}
          onRetry={() => setCheckoutError(null)}
          retryLabel="Dismiss"
        />
      ) : null}
    </div>
  );
}
