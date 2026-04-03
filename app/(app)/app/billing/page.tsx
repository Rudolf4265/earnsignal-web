"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buttonClassName } from "@/src/components/ui/button";
import {
  clearCheckoutAttempt,
  checkoutAttemptInProgress,
  createCheckoutSession,
  fetchBillingStatus,
  type BillingStatusResponse,
  type CheckoutPlan,
} from "@/src/lib/api/entitlements";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { ApiError, isApiError } from "@/src/lib/api/client";
import { buildBillingPlanCardViewModel, formatPlanLabel } from "@/src/lib/billing/plan-card";
import { useAppGate } from "../../_components/app-gate-provider";
import { useEntitlementState } from "../../_components/use-entitlement-state";
import { SessionExpiredCallout } from "../../_components/gate-callouts";

const plans: Array<{ id: CheckoutPlan; label: string; priceLabel: string; summary: string; highlights: string[] }> = [
  {
    id: "report",
    label: "Report",
    priceLabel: "$79 one-time",
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
    priceLabel: "$59 / month",
    summary: "Everything in Report, plus ongoing access to track how your business changes — full history, period comparisons, and continuous monitoring.",
    highlights: [
      "All Report features included",
      "Full-history analysis across eligible uploads",
      "Report history and period comparisons",
      "Ongoing dashboard monitoring",
      "Track how your business evolves over time",
    ],
  },
];

const comparisonRows: Array<{ label: string; report: string; pro: string }> = [
  { label: "Full report", report: "Included", pro: "Included" },
  { label: "PDF download", report: "Included", pro: "Included" },
  { label: "Owned purchased reports", report: "Included", pro: "Included" },
  { label: "Focused 3-month analysis", report: "Included", pro: "Included" },
  { label: "Full-history analysis", report: "-", pro: "Included" },
  { label: "Report history", report: "-", pro: "Included" },
  { label: "Comparisons", report: "-", pro: "Included" },
  { label: "Monitoring", report: "-", pro: "Included" },
  { label: "Ongoing monitoring", report: "-", pro: "Included" },
];

const CHECKOUT_CONFIG_ERROR_CODES = new Set(["BILLING_NOT_CONFIGURED", "BILLING_INVALID_STRIPE_PRICE_ID"]);
const CHECKOUT_UNAVAILABLE_MESSAGE = "Checkout is not available right now. Please try again later.";

function isCheckoutConfigError(error: unknown): error is ApiError {
  return error instanceof ApiError && CHECKOUT_CONFIG_ERROR_CODES.has(error.code);
}

function formatAccessStateLabel(status: string | null | undefined, isActive: boolean): string {
  if (isActive) {
    return "Active";
  }

  const normalized = String(status ?? "").trim().toLowerCase();
  if (!normalized || normalized === "inactive") {
    return "Inactive";
  }

  if (normalized === "past_due") {
    return "Past due";
  }

  if (normalized === "canceled" || normalized === "cancelled") {
    return "Canceled";
  }

  return normalized.replace(/_/g, " ");
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
  const [billingStatus, setBillingStatus] = useState<BillingStatusResponse | null>(null);
  const [billingStatusError, setBillingStatusError] = useState<{ message: string; requestId?: string } | null>(null);

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

  const checkoutConfigured = billingStatus?.checkoutConfigured ?? true;
  const configBlocksCheckout = checkoutConfigured === false || checkoutConfigError !== null;
  const allowCheckout = !hasCheckoutMarker && isCreatingCheckout === null && !configBlocksCheckout;
  const activePlanTier = billingStatus?.effectivePlanTier ?? entitlementState.effectivePlanTier;
  const activeStatus = billingStatus?.status ?? (entitlementState.accessGranted ? "active" : "inactive");
  const isActive = (billingStatus?.accessGranted ?? entitlementState.accessGranted) === true;
  const source = billingStatus?.entitlementSource ?? entitlementState.entitlementSource ?? entitlements?.source ?? null;
  const accessReasonCode = billingStatus?.accessReasonCode ?? entitlementState.accessReasonCode;
  const billingRequired = (billingStatus?.billingRequired ?? entitlementState.billingRequired) === true;
  const portalUrl = billingStatus?.portalUrl ?? entitlements?.portalUrl ?? entitlements?.portal_url;
  const usageSummary = useMemo(() => {
    const generated = entitlements?.reportsGeneratedThisPeriod;
    const remaining = entitlements?.reportsRemainingThisPeriod;
    const limit = entitlements?.monthlyReportLimit;

    if (generated === null || generated === undefined || remaining === null || remaining === undefined || limit === null || limit === undefined) {
      return null;
    }

    return formatUsageSummary({ generated, remaining, limit });
  }, [entitlements?.monthlyReportLimit, entitlements?.reportsGeneratedThisPeriod, entitlements?.reportsRemainingThisPeriod]);
  const accessStateLabel = formatAccessStateLabel(activeStatus, isActive);
  const accessSourceLabel = isActive ? formatAccessSourceLabel(source, accessReasonCode) : "No premium access active";
  const inactiveAccessMessage = !isActive ? formatInactiveAccessMessage(accessReasonCode) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-text-primary">Billing</h1>
        <p className="text-brand-text-secondary">Review your current access, compare plans, and manage billing.</p>
      </header>

      {state === "session_expired" ? <SessionExpiredCallout requestId={requestId} /> : null}

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

        <p className="mt-3 text-sm text-brand-text-secondary" data-testid="billing-current-plan">{`Current plan: ${formatPlanLabel(activePlanTier)} | ${accessStateLabel}`}</p>
        <p className="mt-1 text-xs text-brand-text-muted">{`Access: ${accessSourceLabel}`}</p>
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

        {portalUrl ? (
          <Link href={portalUrl} className={buttonClassName({ variant: "secondary", className: "mt-4" })}>
            Manage Pro subscription
          </Link>
        ) : (
          <p className="mt-3 text-xs text-brand-text-muted">Subscription management appears here when you have an active Pro subscription.</p>
        )}
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

      <section className="grid gap-4 md:grid-cols-2">
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
                    <p className={`mt-1 text-sm ${planCard.bodyClassName}`}>{plan.priceLabel}</p>
                  </div>
                  {planCard.isCurrent ? (
                    <span data-testid="billing-current-badge" className={planCard.badgeClassName}>
                      Current
                    </span>
                  ) : null}
                </div>
                <p className={`mt-2 text-sm ${planCard.bodyClassName}`}>{plan.summary}</p>
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

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-2xl border border-brand-border bg-brand-panel p-5 text-sm text-brand-text-secondary shadow-brand-card">
          <h2 className="text-base font-semibold text-brand-text-primary">Report gives you ownership. Pro gives you continuity.</h2>
          <p className="mt-2">
            A Report gives you a point-in-time diagnosis you keep. Pro keeps your business health visible as it evolves — full history, comparisons, and ongoing monitoring.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-brand-border bg-brand-panel shadow-brand-card">
          <div className="border-b border-brand-border px-5 py-4">
            <h2 className="text-base font-semibold text-brand-text-primary">Included at a glance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-brand-panel-muted text-xs uppercase tracking-[0.14em] text-brand-text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Feature
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-brand-text-secondary">
                    Report
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium text-brand-text-primary">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs text-brand-text-secondary">
                {comparisonRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="px-5 py-3 font-medium text-brand-text-primary">
                      {row.label}
                    </th>
                    <td className="px-4 py-3">{row.report}</td>
                    <td className="px-5 py-3">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
