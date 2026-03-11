"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppGate } from "@/app/(app)/_components/app-gate-provider";
import { useEntitlementState } from "@/app/(app)/_components/use-entitlement-state";
import { SessionExpiredCallout } from "@/app/(app)/_components/gate-callouts";
import { clearCheckoutAttempt, fetchBillingStatus } from "@/src/lib/api/entitlements";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";

const REFRESH_ATTEMPTS = 4;
const RETRY_DELAY_MS = 1_250;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function BillingSuccessPage() {
  const router = useRouter();
  const { state, requestId, actions } = useAppGate();
  const entitlementState = useEntitlementState();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [attemptCount, setAttemptCount] = useState(0);
  const [billingStatusText, setBillingStatusText] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<{ message: string; requestId?: string } | null>(null);

  const refreshCheckoutState = useCallback(
    async (options?: { boundedRetries?: boolean }) => {
      const maxAttempts = options?.boundedRetries ? REFRESH_ATTEMPTS : 1;
      setIsRefreshing(true);
      setRefreshError(null);

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        setAttemptCount(attempt);

        const [entitlementsResult, billingStatusResult] = await Promise.allSettled([
          actions.refreshEntitlements({ forceRefresh: true }),
          fetchBillingStatus({ forceRefresh: true }),
        ]);

        if (billingStatusResult.status === "fulfilled") {
          const snapshot = billingStatusResult.value;
          setBillingStatusText(`Plan: ${snapshot.effectivePlanTier} - Status: ${snapshot.status}`);
        } else if (attempt === maxAttempts) {
          setRefreshError({
            message: billingStatusResult.reason instanceof Error ? billingStatusResult.reason.message : "Unable to refresh billing status.",
            requestId: isApiError(billingStatusResult.reason) ? billingStatusResult.reason.requestId : undefined,
          });
        }

        if (entitlementsResult.status === "fulfilled" && entitlementsResult.value?.accessGranted) {
          setIsRefreshing(false);
          return true;
        }

        if (attempt < maxAttempts) {
          await wait(RETRY_DELAY_MS);
        }
      }

      setIsRefreshing(false);
      return false;
    },
    [actions],
  );

  useEffect(() => {
    let cancelled = false;
    clearCheckoutAttempt();

    const refreshTimer = window.setTimeout(() => {
      void refreshCheckoutState({ boundedRetries: true }).then((isActive) => {
        if (!cancelled && isActive) {
          router.replace("/app");
        }
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
    };
  }, [refreshCheckoutState, router]);

  useEffect(() => {
    if (entitlementState.accessGranted) {
      router.replace("/app");
    }
  }, [entitlementState.accessGranted, router]);

  if (state === "session_expired") {
    return <SessionExpiredCallout requestId={requestId} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Checkout complete</h1>
      <p className="text-sm text-slate-700">Payment redirect succeeded. We are verifying billing and refreshing entitlements.</p>
      <p className="text-sm text-slate-600">
        {entitlementState.accessGranted
          ? "Entitlements are active. Redirecting you to the dashboard..."
          : "Activation can take a moment while webhook events finalize."}
      </p>
      {billingStatusText ? <p className="text-xs text-slate-600">{billingStatusText}</p> : null}
      <p className="text-xs text-slate-500">{`Refresh attempts: ${attemptCount}`}</p>

      {refreshError ? (
        <ErrorBanner
          title="Billing refresh delayed"
          message={refreshError.message}
          requestId={refreshError.requestId}
          onRetry={() => void refreshCheckoutState({ boundedRetries: true })}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void refreshCheckoutState({ boundedRetries: true })}
          disabled={isRefreshing}
          className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Retry refresh"}
        </button>
        <Link href="/app/billing" className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
          Back to billing
        </Link>
      </div>
    </div>
  );
}
