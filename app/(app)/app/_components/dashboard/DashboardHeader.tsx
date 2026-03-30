import Link from "next/link";
import { Button, buttonClassName } from "@/src/components/ui/button";
import type { DashboardMode } from "@/src/lib/dashboard/mode";

type DashboardHeaderProps = {
  snapshotLabel?: string | null;
  note?: string | null;
  mode: DashboardMode;
  refreshing?: boolean;
  refreshDisabled?: boolean;
  onModeChange: (mode: DashboardMode) => void;
  onRefresh: () => void;
};

export function DashboardHeader({
  snapshotLabel,
  note,
  mode,
  refreshing = false,
  refreshDisabled = false,
  onModeChange,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <section className="flex flex-col gap-4 rounded-[1.6rem] border border-brand-border/75 bg-[linear-gradient(145deg,rgba(10,24,50,0.94),rgba(15,35,75,0.93),rgba(16,32,67,0.96))] px-5 py-5 shadow-brand-card md:flex-row md:items-start md:justify-between md:px-6">
      <div className="max-w-3xl space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-accent-teal">Dashboard</p>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-text-primary">Creator Operating Dashboard</h1>
          <p className="text-sm leading-relaxed text-brand-text-secondary">
            {snapshotLabel ?? "Track your latest report snapshot without digging through raw reporting detail."}
          </p>
          {note ? <p className="text-xs leading-relaxed text-brand-text-muted">{note}</p> : null}
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:items-end">
        <div className="inline-flex items-center rounded-full border border-brand-border-strong/60 bg-brand-panel/70 p-0.5">
          <button
            type="button"
            onClick={() => onModeChange("earn")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
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
            className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
              mode === "grow"
                ? "bg-brand-accent-teal/20 text-brand-accent-teal"
                : "text-brand-text-muted hover:text-brand-text-secondary"
            }`}
          >
            Grow
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            href="/app/report"
            className={buttonClassName({
              variant: "primary",
              className: "shadow-brand-glow",
            })}
          >
            View reports
          </Link>
        </div>
      </div>
    </section>
  );
}
