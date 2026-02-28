"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSession, onAuthStateChange } from "@/src/lib/supabase/session";
import { decideAppGate } from "@/src/lib/billing/gating";
import { EntitlementsProvider, useEntitlements } from "./_components/entitlements-provider";
import { checkIsAdmin } from "@/src/lib/admin/access";
import { createClient } from "@/src/lib/supabase/client";
import { WorkspaceLoadingShell } from "./_components/ui/skeleton";
import { APP_NAV_LINKS } from "@/src/lib/navigation/app-nav";

function AppLayoutFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { entitlements, isLoading: isLoadingEntitlements, error: entitlementsError } = useEntitlements();

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const hasSessionRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const bootSession = async () => {
      unsubscribe = await onAuthStateChange((_event, session) => {
        if (!isMounted) {
          return;
        }

        const sessionExists = Boolean(session);
        hasSessionRef.current = sessionExists;
        setHasSession(sessionExists);
        setUserEmail(session?.user?.email ?? null);

        if (!sessionExists) {
          router.replace("/login");
        }
      });

      await Promise.resolve();

      const { data } = await getSession();

      if (!isMounted) {
        return;
      }

      const sessionExists = Boolean(data.session);
      hasSessionRef.current = sessionExists;
      setHasSession(sessionExists);
      setUserEmail(data.session?.user?.email ?? null);
      setIsLoadingSession(false);

      if (sessionExists) {
        const allowed = await checkIsAdmin();
        if (isMounted) {
          setIsAdmin(allowed);
        }
      }

      if (!sessionExists) {
        await wait(50);

        if (isMounted && !hasSessionRef.current) {
          router.replace("/login");
        }
      }
    };

    void bootSession();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [router]);

  const gateDecision = decideAppGate({
    hasSession,
    isLoadingSession,
    isLoadingEntitlements,
    hasEntitlementsError: Boolean(entitlementsError),
    isEntitled: Boolean(entitlements?.entitled),
    pathname,
    isAdmin,
  });

  useEffect(() => {
    if (pathname.startsWith("/app/admin") && !isAdmin) {
      router.replace("/app");
      return;
    }

    if (gateDecision === "redirect_login") {
      router.replace("/login");
      return;
    }

    if (gateDecision === "redirect_billing") {
      router.replace("/app/billing");
    }
  }, [gateDecision, isAdmin, pathname, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } finally {
      setIsLoggingOut(false);
      router.replace("/login");
    }
  };

  if (gateDecision !== "allow") {
    return (
      <WorkspaceLoadingShell
        title={gateDecision === "redirect_billing" ? "Preparing billing workspace" : "Loading workspace"}
        subtitle="This should only take a few seconds."
      />
    );
  }

  const navLinks = isAdmin ? [...APP_NAV_LINKS, { href: "/app/admin", label: "Admin" }] : APP_NAV_LINKS;

  return (
    <div className="min-h-screen bg-navy-950 text-white md:flex">
      <aside className="border-b border-white/5 bg-navy-900 px-4 py-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:px-6 md:py-6">
        <Link href="/app" className="mb-6 flex items-center gap-2 md:mb-10">
          <Image src="/brand/earnsigma-mark.svg" alt="EarnSigma" width={28} height={28} />
          <span className="font-semibold">EarnSigma</span>
        </Link>

        <nav className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:grid-cols-1 md:space-y-2 md:gap-0">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/app" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg border px-3 py-2 transition ${
                  isActive
                    ? "border-brand-blue/40 bg-brand-blue/20 text-white"
                    : "border-transparent text-gray-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4 md:mt-auto md:pt-6">
          <p className="truncate text-xs text-gray-300">{userEmail ?? "Signed in"}</p>
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
    <EntitlementsProvider>
      <AppLayoutFrame>{children}</AppLayoutFrame>
    </EntitlementsProvider>
  );
}
