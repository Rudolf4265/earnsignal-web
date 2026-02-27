"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEntitlements } from "./entitlements-provider";

type GuardedFeature = "upload" | "report";

export function FeatureGuard({ feature, children }: { feature: GuardedFeature; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { entitlements, isLoading } = useEntitlements();

  const hasFeature = Boolean(entitlements?.features?.[feature]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!hasFeature && !pathname.startsWith("/app/billing")) {
      router.replace(`/app/billing?feature=${feature}`);
    }
  }, [feature, hasFeature, isLoading, pathname, router]);

  if (isLoading || !hasFeature) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-gray-300">
        Checking your plan access…
      </div>
    );
  }

  return <>{children}</>;
}
