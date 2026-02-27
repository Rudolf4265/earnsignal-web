"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEntitlements } from "./entitlements-provider";
import { SkeletonBlock } from "./ui/skeleton";

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
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-gray-300">Checking your plan access…</p>
        <SkeletonBlock className="h-6 w-2/5" />
        <SkeletonBlock className="h-20 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
