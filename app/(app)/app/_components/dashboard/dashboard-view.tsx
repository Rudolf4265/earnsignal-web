import Link from "next/link";

import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";
import { KpiCard } from "./KpiCard";
import { Panel } from "./Panel";
import type { DashboardViewModel } from "@/src/lib/dashboard/model";
import { ErrorBanner } from "@/src/components/ui/error-banner";

const keySignals = [
  {
    title: "Revenue trend detection",
    description: "Momentum and inflection points will appear here after your first upload.",
  },
  {
    title: "Concentration watch",
    description: "Identify over-reliance on a small set of customers or plans.",
  },
  {
    title: "Retention pressure",
    description: "Track cohorts with early churn risk and revenue drag.",
  },
  {
    title: "Seasonality fingerprints",
    description: "Reveal cyclical changes in growth and contraction periods.",
  },
];

const recommendedActions = [
  "Upload your latest exports to initialize baseline trend analysis.",
  "Reconnect source systems monthly to keep quality and confidence high.",
  "Review generated reports and share findings with finance and GTM leads.",
  "Track changes over time to verify whether actions improve net revenue.",
];

type DashboardViewProps = {
  model: DashboardViewModel;
  loading: boolean;
  onRefresh: () => void;
};

export function DashboardView({ model, loading, onRefresh }: DashboardViewProps) {
  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-slate-600">High-level revenue signals and structural stability.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <Link
            href="/app/data"
            className="inline-flex w-fit rounded-xl bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Upload data
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Net Revenue" value={model.kpis.netRevenue} subtext={model.hasReports ? "From latest report JSON" : "Available after first report"} />
        <KpiCard label="Subscribers" value={model.kpis.subscribers} subtext={model.hasReports ? "From latest report JSON" : "Available after first report"} />
        <KpiCard label="Stability Index" value={model.kpis.stabilityIndex} subtext={model.hasReports ? "From latest report JSON" : "Available after first report"} />
        <KpiCard label="Churn Velocity" value={model.kpis.churnVelocity} subtext={model.hasReports ? "From latest report JSON" : "Available after first report"} />
      </div>

      {model.hasReports && model.reportDataError ? (
        <ErrorBanner title="Report data unavailable" message="Unable to hydrate dashboard cards from report JSON." action={<button type="button" onClick={onRefresh} className="inline-flex rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50">Retry</button>} />
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Panel
            title="Key Signals"
            description="AI-generated highlights from trend, concentration, and retention analysis."
          >
            <ul className="divide-y divide-slate-200">
              {keySignals.map((signal) => (
                <li key={signal.title} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-slate-900">{signal.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{signal.description}</p>
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No signals yet — upload data to generate your first report.
            </p>
          </Panel>

          <Panel title="Recommended Actions" description="Practical next steps based on your latest data quality and signals.">
            <ul className="divide-y divide-slate-200">
              {recommendedActions.map((action) => (
                <li key={action} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm text-slate-700">{action}</p>
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No actions yet — upload data to unlock tailored recommendations.
            </p>
          </Panel>

          <Panel title="Trend Preview" description="Charts will render automatically when enough historical data is available.">
            <EmptyState
              title="Charts appear once data is connected"
              body="Upload revenue data to populate trend lines, variance windows, and seasonality insights."
              ctaLabel="Upload data"
              ctaHref="/app/data"
            />
          </Panel>
        </div>

        <div className="space-y-8">
          <Panel
            title="Data Status"
            rightSlot={
              <Link
                href="/app/data"
                className="inline-flex rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Upload data
              </Link>
            }
          >
            <dl className="space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-600">Platforms connected</dt>
                <dd className="mt-1 text-sm text-slate-900">{model.dataStatus.platformsConnected}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-600">Coverage</dt>
                <dd className="mt-1 text-sm text-slate-900">{model.dataStatus.coverageMonths}</dd>
                {model.dataStatus.coverageHint ? <p className="mt-1 text-xs text-slate-500">{model.dataStatus.coverageHint}</p> : null}
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-600">Last upload</dt>
                <dd className="mt-1 text-sm text-slate-900">{model.dataStatus.lastUpload}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Recent Reports" description="Latest generated analyses and quality status.">
            {model.hasReports ? (
              <div className="space-y-2">
                {model.recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{report.title}</p>
                      <p className="text-xs text-slate-600">{report.createdAt}</p>
                    </div>
                    <Badge variant="neutral">Ready</Badge>
                    {report.canView ? (
                      <Link
                        href={report.href}
                        className="inline-flex rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        View
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500"
                      >
                        View
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No reports yet"
                body="Upload your data and generate analysis to see report quality and summaries here."
                ctaLabel="Upload data"
                ctaHref="/app/data"
              />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

