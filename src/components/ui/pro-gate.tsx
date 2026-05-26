"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@earnsigma/ui";

type ProGateMode = "pro-unlocked" | "pro-locked" | "loading-safe";

type ProGateProps = {
  /** Pass the section's ProSectionMode from buildReportDetailSectionGatingModel */
  mode: ProGateMode;
  children: ReactNode;
  /** Short label for the upgrade CTA, e.g. "advisor insight cards" */
  feature?: string;
  upgradeHref?: string;
  className?: string;
};

/**
 * Inline Pro gate — wraps a report section with a blur + upgrade prompt for
 * Report-tier users. Pro users see the content normally. Loading state hides
 * everything to avoid flashing gated content.
 *
 * Usage:
 *   <ProGate mode={proSectionGate.opportunity}>
 *     <MySection />
 *   </ProGate>
 */
export function ProGate({ mode, children, feature, upgradeHref = "/app/billing", className }: ProGateProps) {
  if (mode === "loading-safe") {
    return null;
  }

  if (mode === "pro-unlocked") {
    return <>{children}</>;
  }

  // pro-locked — render blurred content with upgrade overlay
  const featureLabel = feature ?? "this section";

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Blurred content underneath */}
      <div
        className="pointer-events-none select-none blur-sm brightness-50"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-brand-accent-blue/30 bg-[linear-gradient(165deg,rgba(11,27,61,0.92),rgba(14,36,80,0.88))] px-6 py-8 text-center shadow-[0_0_40px_-8px_rgba(29,78,216,0.25)]">
        {/* Lock icon */}
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-brand-accent-blue/35 bg-brand-accent-blue/12">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5 text-brand-accent-blue"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-blue">
          Pro
        </p>
        <p className="mt-1.5 max-w-xs text-sm font-medium leading-snug text-white">
          Upgrade to Pro to unlock {featureLabel}
        </p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-brand-text-secondary">
          Pro gives you your full advisor analysis, unlimited report runs, and ongoing monitoring as your business evolves.
        </p>

        <Link
          href={upgradeHref}
          className="mt-4 inline-flex items-center rounded-lg border border-brand-accent-emerald/50 bg-[linear-gradient(120deg,rgba(29,78,216,0.95),rgba(47,217,197,0.85))] px-5 py-2 text-xs font-semibold text-white shadow-brand-glow transition-all hover:brightness-110"
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}
