import Link from "next/link";

import { Badge } from "./_components/dashboard/Badge";
import { EmptyState } from "./_components/dashboard/EmptyState";
import { KpiCard } from "./_components/dashboard/KpiCard";
import { Panel } from "./_components/dashboard/Panel";

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

const recentReports = [
  { id: "demo-q1", date: "2026-01-20", quality: "neutral" as const, label: "Neutral" },
  { id: "demo-q2", date: "2026-01-08", quality: "warn" as const, label: "Warn" },
  { id: "demo-q3", date: "2025-12-18", quality: "good" as const, label: "Good" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-gray-400">High-level revenue signals and structural stability.</p>
        </div>
        <Link
          href="/app/upload"
          className="inline-flex w-fit rounded-xl bg-brand-blue px-4 py-2 text-sm font-medium text-white shadow-brandGlow transition hover:opacity-90"
        >
          Upload data
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Net Revenue" value="$—" subtext="Last 30 days" />
        <KpiCard label="Subscribers" value="—" subtext="Current" />
        <KpiCard label="Stability Index" value="—" subtext="Revenue concentration" />
        <KpiCard label="Churn Velocity" value="—" subtext="Monthly movement" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Panel
            title="Key Signals"
            description="AI-generated highlights from trend, concentration, and retention analysis."
          >
            <ul className="divide-y divide-white/5">
              {keySignals.map((signal) => (
                <li key={signal.title} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-white">{signal.title}</p>
                  <p className="mt-1 text-sm text-gray-400">{signal.description}</p>
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
              No signals yet — upload data to generate your first report.
            </p>
          </Panel>

          <Panel title="Recommended Actions" description="Practical next steps based on your latest data quality and signals.">
            <ul className="divide-y divide-white/5">
              {recommendedActions.map((action) => (
                <li key={action} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm text-gray-200">{action}</p>
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
              No actions yet — upload data to unlock tailored recommendations.
            </p>
          </Panel>

          <Panel title="Trend Preview" description="Charts will render automatically when enough historical data is available.">
            <EmptyState
              title="Charts appear once data is connected"
              body="Upload revenue data to populate trend lines, variance windows, and seasonality insights."
              ctaLabel="Upload data"
              ctaHref="/app/upload"
            />
          </Panel>
        </div>

        <div className="space-y-8">
          <Panel
            title="Data Status"
            rightSlot={
              <Link
                href="/app/upload"
                className="inline-flex rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/5"
              >
                Upload data
              </Link>
            }
          >
            <dl className="space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Platforms connected</dt>
                <dd className="mt-1 text-sm text-white">None</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Coverage</dt>
                <dd className="mt-1 text-sm text-white">— months</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Last upload</dt>
                <dd className="mt-1 text-sm text-white">—</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Recent Reports" description="Latest generated analyses and quality status.">
            {recentReports.length > 0 ? (
              <div className="space-y-2">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm text-white">{report.date}</p>
                    </div>
                    <Badge variant={report.quality}>{report.label}</Badge>
                    <Link
                      href={`/app/report/${report.id}`}
                      className="inline-flex rounded-xl border border-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/5"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No reports generated yet."
                body="Upload your data and generate analysis to see report quality and summaries here."
                ctaLabel="Upload data"
                ctaHref="/app/upload"
              />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
