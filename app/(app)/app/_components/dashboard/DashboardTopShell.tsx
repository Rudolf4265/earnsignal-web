import Link from "next/link";
import type { ReactNode } from "react";
import { Button, buttonClassName } from "@/src/components/ui/button";
import type { DashboardMode } from "@/src/lib/dashboard/mode";

type DashboardTopShellProps = {
  mode: DashboardMode;
  refreshing: boolean;
  refreshDisabled: boolean;
  onRefresh: () => void;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  modeSwitch: ReactNode;
};

const MODE_SUBTITLE: Record<DashboardMode, string> = {
  earn: "See revenue health, the biggest shift, and the next move from your latest report.",
  grow: "Review measured growth signals, what is ready now, and what unlocks next.",
};

export function DashboardTopShell({
  mode,
  refreshing,
  refreshDisabled,
  onRefresh,
  primaryCtaLabel,
  primaryCtaHref,
  modeSwitch,
}: DashboardTopShellProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-brand-border-strong/80 bg-[linear-gradient(145deg,rgba(10,24,50,0.96),rgba(15,35,75,0.95),rgba(16,32,67,0.98))] px-6 py-6 shadow-brand-card md:px-7 md:py-7">
      <div className="pointer-events-none absolute -left-20 top-[-6rem] h-72 w-72 rounded-full bg-brand-accent-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-7rem] top-12 h-64 w-64 rounded-full bg-brand-accent-emerald/14 blur-3xl" />

      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.2fr),minmax(22rem,0.95fr)] xl:items-end">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-accent-teal">Creator Operating Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-text-primary md:text-[2.8rem]">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-text-secondary md:text-base">{MODE_SUBTITLE[mode]}</p>
        </div>

        <div className="space-y-4 xl:justify-self-end xl:w-full xl:max-w-[28rem]">
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onRefresh}
              disabled={refreshDisabled}
              className="border-brand-border-strong/70 bg-brand-panel/80 shadow-brand-card hover:bg-brand-panel-muted/90"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Link
              href={primaryCtaHref}
              className={buttonClassName({ variant: "primary", className: "shadow-brand-glow" })}
            >
              {primaryCtaLabel}
            </Link>
          </div>
          {modeSwitch}
        </div>
      </div>
    </section>
  );
}
