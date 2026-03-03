"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { buildLoginHref } from "@/src/lib/gating/app-gate";
import { AppGateProvider, useAppGate } from "./_components/app-gate-provider";
import { EntitlementsErrorCallout, GateLoadingShell, SessionExpiredCallout } from "./_components/gate-callouts";
import { WorkspaceNav } from "./_components/workspace-nav";

function AppLayoutFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, session, adminStatus, actions, requestId } = useAppGate();
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
    <div className="relative isolate min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="relative z-10 border-b border-slate-800 bg-slate-950 px-4 py-4 text-slate-100 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:px-6 md:py-6">
        <Link href="/app" className="mb-6 inline-flex items-center md:mb-10" aria-label="EarnSigma">
          <BrandMark
            priority
            className="inline-flex items-center gap-2.5"
            iconClassName="h-7 w-7"
            labelClassName="text-base font-semibold leading-none"
          />
        </Link>

        <WorkspaceNav
          pathname={pathname}
          adminStatus={adminStatus}
          className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:grid-cols-1 md:space-y-2 md:gap-0"
          linkClassName="rounded-lg border border-transparent px-3 py-2 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100"
          activeLinkClassName="border-slate-600 bg-slate-800 text-slate-100"
        />

        <div className="mt-6 border-t border-slate-800 pt-4 md:mt-auto md:pt-6">
          <p className="truncate text-xs text-slate-400">{session?.user?.email ?? "Signed in"}</p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out…" : "Log out"}
          </button>
          <p className="mt-3 text-[11px] text-slate-500">Revenue intelligence layer</p>
        </div>
      </aside>

      <main className="relative z-10 flex-1 bg-slate-50 p-4 sm:p-6 lg:p-10">{children}</main>
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
