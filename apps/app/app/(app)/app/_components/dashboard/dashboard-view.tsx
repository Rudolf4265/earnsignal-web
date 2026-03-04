import Link from "next/link";

import { DashboardKpiCard } from "@/components/dashboard/DashboardKpiCard";
import { DataStatusCard } from "@/components/dashboard/DataStatusCard";
import { KeySignalsCard } from "@/components/dashboard/KeySignalsCard";
import { RecentReportsCard } from "@/components/dashboard/RecentReportsCard";
import { RecommendedActionsCard } from "@/components/dashboard/RecommendedActionsCard";
import { RevenueTrendCard } from "@/components/dashboard/RevenueTrendCard";
import type { DashboardViewModel } from "@/src/lib/dashboard/model";
import { ErrorBanner } from "@/src/components/ui/error-banner";

type DashboardViewProps = {
  model: DashboardViewModel;
  loading: boolean;
  onRefresh: () => void;
};

export function DashboardView({ model, loading, onRefresh }: DashboardViewProps) {
  const kpiData = {
    netRevenue: null,
    subscribers: null,
    stabilityIndex: null,
    churnVelocity: null,
  };

  return (
    <div className="relative space-y-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] rounded-[36px] bg-[radial-gradient(circle_at_20%_5%,rgba(59,130,246,0.24),transparent_45%),radial-gradient(circle_at_80%_15%,rgba(99,102,241,0.18),transparent_42%)]"
      />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-2 text-base text-white/60">High-level revenue signals and structural stability.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <Link
            href="/app/upload"
            className="inline-flex items-center rounded-xl bg-blue-500 px-5 py-2 text-sm font-medium text-white shadow-[0_8px_28px_rgba(59,130,246,0.38)] transition hover:bg-blue-400"
          >
            Upload data
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardKpiCard title="Net Revenue" subtitle="Last 30 days" value={kpiData.netRevenue ? `$${kpiData.netRevenue}` : "$—"} />
        <DashboardKpiCard title="Subscribers" subtitle="Current" value={kpiData.subscribers ?? "—"} />
        <DashboardKpiCard title="Stability Index" subtitle="Revenue concentration" value={kpiData.stabilityIndex ?? "—"} />
        <DashboardKpiCard title="Churn Velocity" subtitle="Monthly movement" value={kpiData.churnVelocity ?? "—"} />
      </div>

      {model.hasReports && model.reportDataError ? (
        <ErrorBanner
          title="Report data unavailable"
          message="Unable to hydrate dashboard cards from report JSON. Please retry."
          requestId={model.reportDataRequestId}
          action={
            <button type="button" onClick={onRefresh} className="inline-flex rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50">
              Retry
            </button>
          }
        >
          {model.reportDataDiagnostics ? <p className="text-xs text-rose-100/80">{model.reportDataDiagnostics}</p> : null}
        </ErrorBanner>
      ) : null}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7">
          <RevenueTrendCard />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <KeySignalsCard />
        </div>
        <div className="col-span-12 lg:col-span-2">
          <DataStatusCard platformsConnected="None" coverageMonths="— months" lastUpload="—" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7">
          <RecommendedActionsCard />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <RecentReportsCard reports={model.recentReports} loading={loading} />
        </div>
      </div>
    </div>
  );
}
