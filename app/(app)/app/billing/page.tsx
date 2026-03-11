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

const plans: Array<{ id: CheckoutPlan; label: string; summary: string; highlights: string[] }> = [
  {
    id: "basic",
    label: "Basic",
    summary: "Core uploads and report generation with practical monthly limits.",
    highlights: ["Upload and process creator data", "Generate core reports", "Dashboard and report access"],
  },
  {
    id: "pro",
    label: "Pro",
    summary: "Higher limits with full premium insights and PDF download access.",
    highlights: ["Higher monthly report allowance", "Full report and PDF access", "Priority support"],
  },
];

const CHECKOUT_CONFIG_ERROR_CODES = new Set(["BILLING_NOT_CONFIGURED", "BILLING_INVALID_STRIPE_PRICE_ID"]);

function isCheckoutConfigError(error: unknown): error is ApiError {
  return error instanceof ApiError && CHECKOUT_CONFIG_ERROR_CODES.has(error.code);
}

function extractMissingConfigKeys(details: unknown): string[] {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return [];
  }
  const record = details as Record<string, unknown>;
  const rawMissing = record.missing;
  if (!Array.isArray(rawMissing)) {
    return [];
  }
  return rawMissing.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
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
            message: "Stripe checkout is not configured for this environment.",
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
        const missingKeys = extractMissingConfigKeys(err.details);
        const missingText = missingKeys.length > 0 ? ` Missing: ${missingKeys.join(", ")}.` : "";
        setCheckoutConfigError({
          message: `Stripe checkout is not configured for this environment.${missingText}`,
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
            message: "Stripe checkout is not configured for this environment.",
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

    return `${generated} generated this period, ${remaining} remaining of ${limit}.`;
  }, [entitlements?.monthlyReportLimit, entitlements?.reportsGeneratedThisPeriod, entitlements?.reportsRemainingThisPeriod]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-brand-text-primary">Billing</h1>
        <p className="text-brand-text-secondary">Compare plans, confirm subscription state, and manage access.</p>
      </header>

      {state === "session_expired" ? <SessionExpiredCallout requestId={requestId} /> : null}

      <section className="rounded-2xl border border-brand-border bg-brand-panel p-6 shadow-brand-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-brand-text-primary">Current subscription</h2>
          <button
            type="button"
            onClick={() => void refreshBillingAndEntitlements()}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh status"}
          </button>
        </div>

        <p className="mt-3 text-sm text-brand-text-secondary" data-testid="billing-current-plan">{`Plan: ${formatPlanLabel(activePlanTier)} - Status: ${activeStatus}`}</p>
        <p className="mt-1 text-xs text-brand-text-muted">
          Feature access: {isActive ? "Active" : "Limited until subscription is active"}
          {source ? ` (${source})` : ""}
        </p>
        {!isActive && billingRequired ? <p className="mt-1 text-xs text-amber-100">Billing action is required to restore premium access.</p> : null}
        {!isActive && accessReasonCode ? <p className="mt-1 text-xs text-brand-text-muted">{`Access reason: ${accessReasonCode}`}</p> : null}
        {usageSummary ? <p className="mt-1 text-xs text-brand-text-muted">{usageSummary}</p> : null}

        {error ? (
          <ErrorBanner
            className="mt-4"
            title="Could not refresh entitlements"
            message={error}
            requestId={errorRequestId}
            onRetry={() => void entitlementState.refresh()}
          />
        ) : null}

        {billingStatusError ? (
          <ErrorBanner
            className="mt-4"
            title="Could not load billing status"
            message={billingStatusError.message}
            requestId={billingStatusError.requestId}
            onRetry={() => void refreshBillingAndEntitlements()}
          />
        ) : null}

        {checkoutConfigError ? (
          <ErrorBanner
            className="mt-4"
            data-testid="billing-config-error-banner"
            title="Stripe checkout configuration required"
            message={checkoutConfigError.message}
            requestId={checkoutConfigError.requestId}
            onRetry={() => void refreshBillingAndEntitlements()}
            retryLabel="Refresh status"
          />
        ) : null}

        {portalUrl ? (
          <Link href={portalUrl} className={buttonClassName({ variant: "secondary", className: "mt-4" })}>
            Manage subscription
          </Link>
        ) : (
          <p className="mt-3 text-xs text-brand-text-muted">Manage subscription is unavailable for this account right now.</p>
        )}
      </section>

      {hasCheckoutMarker ? (
        <section className="rounded-xl border border-amber-300/35 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p>Checkout is already starting...</p>
          <button
            type="button"
            onClick={() => {
              clearCheckoutAttempt();
              setHasCheckoutMarker(false);
              setCheckoutError(null);
            }}
            className="mt-3 inline-flex rounded-xl border border-amber-200/50 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
          >
            Try again
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
                  <h3 className={`text-xl font-semibold ${planCard.titleClassName}`}>{plan.label}</h3>
                  {planCard.isCurrent ? (
                    <span data-testid="billing-current-badge" className={planCard.badgeClassName}>
                      Current
                    </span>
                  ) : null}
                </div>
                <p className={`mt-1 text-sm ${planCard.bodyClassName}`}>{plan.summary}</p>
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

      {checkoutError ? (
        <ErrorBanner
          data-testid="billing-error-banner"
          title="Checkout failed"
          message={checkoutError.message}
          requestId={checkoutError.requestId}
          onRetry={() => setCheckoutError(null)}
          retryLabel="Dismiss"
        />
      ) : null}
    </div>
  );
}
