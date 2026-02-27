"use client";

import Link from "next/link";
import { useState } from "react";
import {
  clearCheckoutAttempt,
  checkoutAttemptInProgress,
  createCheckoutSession,
  type CheckoutPlan,
} from "@/src/lib/api/entitlements";
import { useEntitlements } from "../../_components/entitlements-provider";
import { ErrorBanner } from "@/src/components/ui/error-banner";

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
  const { entitlements, isLoading, error, refresh } = useEntitlements();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<CheckoutPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [hasCheckoutMarker, setHasCheckoutMarker] = useState(() => checkoutAttemptInProgress());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCheckout = async (plan: CheckoutPlan) => {
    setIsCreatingCheckout(plan);
    setCheckoutError(null);

    try {
      const { checkout_url } = await createCheckoutSession(plan);
      window.location.assign(checkout_url);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Unable to start checkout");
      setIsCreatingCheckout(null);
      setHasCheckoutMarker(checkoutAttemptInProgress());
    }
  };

  const allowCheckout = !hasCheckoutMarker && isCreatingCheckout === null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Billing</h1>
        <p className="text-gray-400">Compare plans, confirm your subscription status, and manage access.</p>
      </header>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-white">Current subscription</h2>
          <button
            type="button"
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await refresh({ forceRefresh: true });
              } finally {
                setIsRefreshing(false);
              }
            }}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-100 hover:bg-white/5 disabled:opacity-60"
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing…" : "Refresh status"}
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-300">
          {isLoading
            ? "Loading subscription status…"
            : `Plan: ${entitlements?.plan ?? "None"} · Status: ${entitlements?.status ?? "inactive"}`}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Feature access: {entitlements?.entitled ? "Active" : "Limited until subscription is active"}
        </p>

        {error ? <ErrorBanner className="mt-4" title="Could not load billing status" message={error} onRetry={() => void refresh({ forceRefresh: true })} /> : null}

        {entitlements?.portal_url ? (
          <Link
            href={entitlements.portal_url}
            className="mt-4 inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
          >
            Manage subscription
          </Link>
        ) : (
          <p className="mt-3 text-xs text-gray-400">Need changes later? Contact support to update billing details.</p>
        )}
      </section>

      {hasCheckoutMarker ? (
        <section className="rounded-lg border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
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
                isCurrentPlan ? "border-brand-blue/50 bg-brand-blue/10" : "border-white/10 bg-white/5"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-semibold text-white">{plan.label}</h3>
                  {isCurrentPlan ? <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] text-emerald-200">Current</span> : null}
                </div>
                <p className="mt-1 text-sm text-gray-300">{plan.summary}</p>
              </div>

              <ul className="space-y-1 text-xs text-gray-300">
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

      {checkoutError ? <ErrorBanner title="Checkout failed" message={checkoutError} onRetry={() => setCheckoutError(null)} retryLabel="Dismiss" /> : null}
    </div>
  );
}
