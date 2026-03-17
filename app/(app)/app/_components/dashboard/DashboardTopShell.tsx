import Link from "next/link";
import { Button, buttonClassName } from "@/src/components/ui/button";
import type { DashboardMode } from "@/src/lib/dashboard/mode";

type DashboardTopShellProps = {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  refreshing: boolean;
  refreshDisabled: boolean;
  onRefresh: () => void;
  primaryCtaLabel: string;
  primaryCtaHref: string;
};

export function DashboardTopShell({
  mode,
  onModeChange,
  refreshing,
  refreshDisabled,
  onRefresh,
  primaryCtaLabel,
  primaryCtaHref,
}: DashboardTopShellProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-0.5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-accent-teal">Creator Operating Dashboard</p>
        <p className="mt-0.5 text-lg font-semibold tracking-tight text-brand-text-primary">
          {mode === "earn" ? "Earn" : "Grow"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center rounded-full border border-brand-border-strong/60 bg-brand-panel/70 p-0.5">
          <button
            type="button"
            onClick={() => onModeChange("earn")}
            className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition ${
              mode === "earn"
                ? "bg-brand-accent-teal/20 text-brand-accent-teal"
                : "text-brand-text-muted hover:text-brand-text-secondary"
            }`}
          >
            Earn
          </button>
          <button
            type="button"
            onClick={() => onModeChange("grow")}
            className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition ${
              mode === "grow"
                ? "bg-brand-accent-teal/20 text-brand-accent-teal"
                : "text-brand-text-muted hover:text-brand-text-secondary"
            }`}
          >
            Grow
          </button>
        </div>
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
    </div>
  );
}
