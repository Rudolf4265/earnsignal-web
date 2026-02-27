"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSession, onAuthStateChange } from "@/src/lib/supabase/session";
import { decideAppGate } from "@/src/lib/billing/gating";
import { EntitlementsProvider, useEntitlements } from "./_components/entitlements-provider";
import { checkIsAdmin } from "@/src/lib/admin/access";

const baseNavLinks = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/upload", label: "Data" },
  { href: "/app/report", label: "Reports" },
  { href: "/app/billing", label: "Billing" },
  { href: "/app/settings", label: "Settings" },
];

function AppLayoutFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { entitlements, isLoading: isLoadingEntitlements } = useEntitlements();

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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

  if (gateDecision !== "allow") {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">
        <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-gray-200">
          {gateDecision === "redirect_billing"
            ? "Redirecting to billing…"
            : gateDecision === "redirect_login"
              ? "Redirecting to login…"
              : "Loading workspace…"}
        </div>
      </div>
    );
  }

  const navLinks = isAdmin ? [...baseNavLinks, { href: "/app/admin", label: "Admin" }] : baseNavLinks;

  return (
    <div className="min-h-screen bg-navy-950 flex text-white">
      <aside className="w-64 border-r border-white/5 bg-navy-900 p-6 flex flex-col">
        <Link href="/" className="flex items-center gap-2 mb-10">
          <Image src="/brand/earnsigma-mark.svg" alt="EarnSigma" width={28} height={28} />
          <span className="font-semibold">EarnSigma</span>
        </Link>

        <nav className="space-y-3 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/app" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg transition ${isActive ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 text-xs text-gray-400">Revenue intelligence layer</div>
      </aside>

      <main className="flex-1 p-10">{children}</main>
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
