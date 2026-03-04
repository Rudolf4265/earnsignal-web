import Link from "next/link";

import type { DashboardReportItem } from "@/src/lib/dashboard/model";
import { panelClassName } from "./dashboardStyles";

type RecentReportsCardProps = {
  reports: DashboardReportItem[];
  loading: boolean;
};

function statusClassName(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "ready") return "bg-emerald-500/15 text-emerald-200";
  if (normalized === "failed") return "bg-rose-500/15 text-rose-200";
  if (normalized === "processing" || normalized === "running" || normalized === "queued") return "bg-amber-500/15 text-amber-200";
  return "bg-slate-300/15 text-slate-100";
}

export function RecentReportsCard({ reports, loading }: RecentReportsCardProps) {
  const hasReports = reports.length > 0;

  return (
    <section className={panelClassName}>
      <h2 className="text-2xl font-semibold text-white">Recent Reports</h2>
      <div className="mt-4 space-y-2">
        {loading ? (
          <>
            <div className="h-10 animate-pulse rounded-xl border border-white/10 bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl border border-white/10 bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl border border-white/10 bg-white/10" />
          </>
        ) : hasReports ? (
          reports.slice(0, 3).map((report) => (
              <div key={report.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-sm text-white/80">{report.createdAt}</p>
                <span className={`rounded-full px-2 py-1 text-xs ${statusClassName(report.status)}`}>{report.status}</span>
                {report.externalHref ? (
                  <a
                    href={report.externalHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/90"
                  >
                    View
                  </a>
                ) : report.internalHref ? (
                  <Link href={report.internalHref} className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/90">
                    View
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    aria-label="Report not available yet"
                    title="Report not available yet"
                    className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/50 disabled:cursor-not-allowed"
                  >
                    Unavailable
                  </button>
                )}
              </div>
            ))
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/70">No reports yet — upload data to generate your first report.</p>
        )}
      </div>
    </section>
  );
}
