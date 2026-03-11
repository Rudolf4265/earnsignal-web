"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAppGate } from "@/app/(app)/_components/app-gate-provider";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";
import { clearCheckoutAttempt, fetchBillingStatus } from "@/src/lib/api/entitlements";

export default function BillingCancelPage() {
  const { actions } = useAppGate();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [refreshError, setRefreshError] = useState<{ message: string; requestId?: string } | null>(null);

  const refreshAccessState = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const [entitlementsResult, billingResult] = await Promise.allSettled([
        actions.refreshEntitlements({ forceRefresh: true }),
        fetchBillingStatus({ forceRefresh: true }),
      ]);

      if (entitlementsResult.status === "rejected") {
        setRefreshError({
          message: entitlementsResult.reason instanceof Error ? entitlementsResult.reason.message : "Unable to refresh entitlement state.",
          requestId: isApiError(entitlementsResult.reason) ? entitlementsResult.reason.requestId : undefined,
        });
      } else if (billingResult.status === "rejected") {
        setRefreshError({
          message: billingResult.reason instanceof Error ? billingResult.reason.message : "Unable to refresh billing status.",
          requestId: isApiError(billingResult.reason) ? billingResult.reason.requestId : undefined,
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [actions]);

  useEffect(() => {
    clearCheckoutAttempt();
    void refreshAccessState();
  }, [refreshAccessState]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Checkout canceled</h1>
      <p className="text-sm text-slate-700">No charges were applied and your billing status was not changed.</p>
      <p className="text-xs text-slate-600">{isRefreshing ? "Refreshing account access state..." : "Account access state is up to date."}</p>
      {refreshError ? <ErrorBanner title="Refresh delayed" message={refreshError.message} requestId={refreshError.requestId} onRetry={() => void refreshAccessState()} /> : null}
      <Link href="/app/billing" className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
        Back to billing
      </Link>
    </div>
  );
}
