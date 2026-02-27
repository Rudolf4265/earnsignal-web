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

const plans: Array<{ id: CheckoutPlan; label: string; summary: string }> = [
  { id: "plan_a", label: "Plan A", summary: "Core upload + reporting for one workspace." },
  { id: "plan_b", label: "Plan B", summary: "Advanced limits and team-ready usage." },
];

export default function BillingPage() {
  const { entitlements, isLoading, error } = useEntitlements();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState<CheckoutPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [hasCheckoutMarker, setHasCheckoutMarker] = useState(() => checkoutAttemptInProgress());

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
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Billing</h1>
        <p className="text-gray-400">Pick a plan to unlock upload and report features for your workspace.</p>
      </header>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white">Current subscription</h2>
        <p className="mt-3 text-sm text-gray-300">
          {isLoading
            ? "Loading subscription status…"
            : `Plan: ${entitlements?.plan ?? "None"} · Status: ${entitlements?.status ?? "inactive"}`}
        </p>
        {error ? <p className="mt-2 text-sm text-amber-300">{error}</p> : null}

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
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
            <h3 className="text-xl font-semibold text-white">{plan.label}</h3>
            <p className="text-sm text-gray-300">{plan.summary}</p>
            <button
              type="button"
              onClick={() => void handleCheckout(plan.id)}
              disabled={!allowCheckout}
              className="inline-flex rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isCreatingCheckout === plan.id ? "Redirecting…" : `Subscribe to ${plan.label}`}
            </button>
          </article>
        ))}
      </section>

      {checkoutError ? (
        <p className="rounded-lg border border-rose-300/30 bg-rose-500/10 p-3 text-sm text-rose-200">{checkoutError}</p>
      ) : null}
    </div>
  );
}
