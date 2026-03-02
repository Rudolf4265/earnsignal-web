"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buildLoginHref } from "@/src/lib/gating/app-gate";
import { AppGateProvider, useAppGate } from "./_components/app-gate-provider";
import { EntitlementsErrorCallout, GateLoadingShell, SessionExpiredCallout } from "./_components/gate-callouts";
import { WorkspaceNav } from "./_components/workspace-nav";

function AppLayoutFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, session, isAdmin, actions, requestId } = useAppGate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const redirectedToLoginRef = useRef(false);

  useEffect(() => {
    if (state === "anon") {
      if (!redirectedToLoginRef.current) {
        redirectedToLoginRef.current = true;
        const queryString = typeof window === "undefined" ? "" : window.location.search.replace(/^\?/, "");
        const returnTo = queryString ? `${pathname}?${queryString}` : pathname;
        router.replace(buildLoginHref(returnTo));
      }
      return;
    }

    redirectedToLoginRef.current = false;
  }, [pathname, router, state]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await actions.signOut();
    } finally {
      setIsLoggingOut(false);
      router.replace("/login");
    }
  };

  if (state === "session_loading" || state === "authed_loading_entitlements") {
    return (
      <div data-testid="gate-loading">
        <GateLoadingShell />
      </div>
    );
  }

  if (state === "session_expired") {
    return <SessionExpiredCallout requestId={requestId} />;
  }

  if (state === "entitlements_error") {
    return <EntitlementsErrorCallout onRetry={() => void actions.refreshEntitlements({ forceRefresh: true })} />;
  }

  if (state === "anon") {
    return (
      <div data-testid="gate-loading">
        <GateLoadingShell />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-white md:flex">
      <aside className="border-b border-white/5 bg-navy-900 px-4 py-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:px-6 md:py-6">
        <Link href="/app" className="mb-6 flex items-center gap-2 md:mb-10">
          <Image src="/brand/earnsigma-mark.svg" alt="EarnSigma" width={28} height={28} />
          <span className="font-semibold">EarnSigma</span>
        </Link>

        <WorkspaceNav
          pathname={pathname}
          isAdmin={isAdmin}
          className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:grid-cols-1 md:space-y-2 md:gap-0"
          linkClassName="rounded-lg border border-transparent px-3 py-2 text-gray-300 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
          activeLinkClassName="border-brand-blue/40 bg-brand-blue/20 text-white"
        />

        <div className="mt-6 border-t border-white/10 pt-4 md:mt-auto md:pt-6">
          <p className="truncate text-xs text-gray-300">{session?.user?.email ?? "Signed in"}</p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-2 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-100 transition hover:bg-white/10 disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out…" : "Log out"}
          </button>
          <p className="mt-3 text-[11px] text-gray-500">Revenue intelligence layer</p>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppGateProvider>
      <AppLayoutFrame>{children}</AppLayoutFrame>
    </AppGateProvider>
  );
}
