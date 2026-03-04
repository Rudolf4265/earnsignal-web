"use client";

import Link from "next/link";
import { useState } from "react";
import {
  clearCheckoutAttempt,
  checkoutAttemptInProgress,
  createCheckoutSession,
  type CheckoutPlan,
} from "@/src/lib/api/entitlements";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";
import { useAppGate } from "../../_components/app-gate-provider";
import { SessionExpiredCallout } from "../../_components/gate-callouts";

const plans: Array<{ id: CheckoutPlan; label: string; summary: string; highlights: string[] }> = [
  {
    id: "plan_a",
    label: "Plan A",
    summary: "Core upload + reporting for one workspace.",
    highlights: ["Single workspace", "Upload + processing", "Essential report views"],
  },
  {
    id: "plan_b",
    label: "Plan B",
    summary: "Advanced limits and team-ready usage.",
    highlights: ["Higher usage limits", "Priority processing", "Team-ready controls"],
  },
];

export default function BillingPage() {
  const { state, entitlements, error, errorRequestId, requestId, actions } = useAppGate();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<CheckoutPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState<{ message: string; requestId?: string } | null>(null);
  const [hasCheckoutMarker, setHasCheckoutMarker] = useState(() => checkoutAttemptInProgress());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCheckout = async (plan: CheckoutPlan) => {
    setIsCreatingCheckout(plan);
    setCheckoutError(null);

    try {
      const { checkout_url } = await createCheckoutSession(plan);
      window.location.assign(checkout_url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start checkout";
      setCheckoutError({
        message,
        requestId: isApiError(err) ? err.requestId : undefined,
      });
      setIsCreatingCheckout(null);
      setHasCheckoutMarker(checkoutAttemptInProgress());
    }
  };

  const allowCheckout = !hasCheckoutMarker && isCreatingCheckout === null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Billing</h1>
        <p className="text-slate-600">Compare plans, confirm your subscription status, and manage access.</p>
      </header>

      {state === "session_expired" ? <SessionExpiredCallout requestId={requestId} /> : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-slate-900">Current subscription</h2>
          <button
            type="button"
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await actions.refreshEntitlements({ forceRefresh: true });
              } finally {
                setIsRefreshing(false);
              }
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing…" : "Refresh status"}
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-700" data-testid="billing-current-plan">{`Plan: ${entitlements?.plan ?? "None"} · Status: ${entitlements?.status ?? "inactive"}`}</p>
        <p className="mt-1 text-xs text-slate-600">
          Feature access: {entitlements?.entitled ? "Active" : "Limited until subscription is active"}
        </p>

        {error ? (
          <ErrorBanner className="mt-4" title="Could not load billing status" message={error} requestId={errorRequestId} onRetry={() => void actions.refreshEntitlements({ forceRefresh: true })} />
        ) : null}

        {entitlements?.portal_url ? (
          <Link
            href={entitlements.portal_url}
            className="mt-4 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Manage subscription
          </Link>
        ) : (
          <p className="mt-3 text-xs text-slate-600">Need changes later? Contact support to update billing details.</p>
        )}
      </section>

      {hasCheckoutMarker ? (
        <section className="rounded-lg border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-800">
          <p>Checkout is already starting…</p>
          <button
            type="button"
            onClick={() => {
              clearCheckoutAttempt();
              setHasCheckoutMarker(false);
              setCheckoutError(null);
            }}
            className="mt-3 inline-flex rounded-lg border border-amber-200/50 px-3 py-1.5 text-xs hover:bg-amber-300/10"
          >
            Try again
          </button>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const isCurrentPlan = (entitlements?.plan ?? "").toLowerCase() === plan.id;
          return (
            <article
              key={plan.id}
              className={`space-y-4 rounded-xl border p-6 ${
                isCurrentPlan ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-semibold text-slate-900">{plan.label}</h3>
                  {isCurrentPlan ? <span data-testid="billing-current-badge" className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">Current</span> : null}
                </div>
                <p className="mt-1 text-sm text-slate-700">{plan.summary}</p>
              </div>

              <ul className="space-y-1 text-xs text-slate-700">
                {plan.highlights.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => void handleCheckout(plan.id)}
                disabled={!allowCheckout}
                className="inline-flex rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isCreatingCheckout === plan.id ? "Redirecting…" : `Subscribe to ${plan.label}`}
              </button>
            </article>
          );
        })}
      </section>

      {checkoutError ? <ErrorBanner data-testid="billing-error-banner" title="Checkout failed" message={checkoutError.message} requestId={checkoutError.requestId} onRetry={() => setCheckoutError(null)} retryLabel="Dismiss" /> : null}
    </div>
  );
}
