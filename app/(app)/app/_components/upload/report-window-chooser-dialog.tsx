"use client";

import Link from "next/link";
import { buttonClassName } from "@/src/components/ui/button";
import type { SnapshotWindowOption } from "@/src/lib/workspace/report-window-policy";

type ReportWindowChooserDialogProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  latestSnapshotWindow: SnapshotWindowOption | null;
  onClose: () => void;
  onRunLatestWindow: () => void;
};

function formatMonthLabel(value: string): string {
  const [yearPart, monthPart] = value.split("-");
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
}

function formatWindowLabel(window: SnapshotWindowOption): string {
  return `${formatMonthLabel(window.startMonth)} to ${formatMonthLabel(window.endMonth)}`;
}

export default function ReportWindowChooserDialog({
  open,
  busy,
  error,
  latestSnapshotWindow,
  onClose,
  onRunLatestWindow,
}: ReportWindowChooserDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-window-title"
        className="w-full max-w-2xl rounded-[1.75rem] border border-white/10 bg-[linear-gradient(155deg,rgba(10,21,44,0.98),rgba(12,28,59,0.98),rgba(8,17,35,0.99))] p-6 shadow-[0_28px_90px_-38px_rgba(15,23,42,0.95)] sm:p-7"
        data-testid="analysis-window-dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200/80">Analysis window</p>
            <h2 id="analysis-window-title" className="text-2xl font-semibold text-white">
              Choose your analysis window
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              Report includes a focused 3-month business diagnostic.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <section className="rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.05] p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Analyze latest 3 months</h3>
                <p className="mt-1 text-sm text-slate-300">
                  {latestSnapshotWindow ? formatWindowLabel(latestSnapshotWindow) : "Use the newest 3-month workspace window."}
                </p>
              </div>
              <button
                type="button"
                data-testid="analysis-window-latest"
                disabled={!latestSnapshotWindow || busy}
                onClick={onRunLatestWindow}
                className={buttonClassName({
                  variant: "primary",
                  className: "min-w-48 justify-center rounded-xl px-4 shadow-brand-glow disabled:cursor-not-allowed disabled:opacity-60",
                })}
              >
                {busy ? "Starting..." : "Analyze latest 3 months"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-blue-300/20 bg-blue-400/[0.05] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Upgrade to Pro for full-history analysis</h3>
                <p className="mt-1 text-sm text-slate-300">Run the full staged workspace without trimming to a 3-month window.</p>
              </div>
              <Link
                href="/app/billing"
                data-testid="analysis-window-upgrade"
                className={buttonClassName({
                  variant: "secondary",
                  className: "min-w-40 justify-center rounded-xl border-blue-300/40 bg-blue-500/10 px-4 text-blue-100 hover:bg-blue-500/15",
                })}
              >
                Upgrade to Pro
              </Link>
            </div>
          </section>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-rose-300" data-testid="analysis-window-error">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
