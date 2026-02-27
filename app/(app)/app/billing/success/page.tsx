"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEntitlements } from "@/app/(app)/_components/entitlements-provider";

export default function BillingSuccessPage() {
  const router = useRouter();
  const { entitlements, refresh } = useEntitlements();
  const [isRefreshing, setIsRefreshing] = useState(true);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh({ forceRefresh: true });
    setIsRefreshing(false);
  };

  useEffect(() => {
    let isMounted = true;

    refresh({ forceRefresh: true }).finally(() => {
      if (isMounted) {
        setIsRefreshing(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (entitlements?.entitled) {
      router.replace("/app");
    }
  }, [entitlements?.entitled, router]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-2xl font-semibold text-white">Checkout complete</h1>
      <p className="text-sm text-gray-300">
        We&apos;re verifying your payment and refreshing your workspace permissions.
      </p>
      <p className="text-sm text-gray-400">
        {entitlements?.entitled
          ? "Entitlements updated. Redirecting you to the app…"
          : "If activation takes a moment, use retry below."}
      </p>
      <button
        type="button"
        onClick={() => void handleRefresh()}
        disabled={isRefreshing}
        className="inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
      >
        {isRefreshing ? "Refreshing…" : "Retry refresh"}
      </button>
    </div>
  );
}
