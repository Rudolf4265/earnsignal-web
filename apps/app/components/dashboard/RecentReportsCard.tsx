import Link from "next/link";

import type { DashboardReportItem } from "@/src/lib/dashboard/model";
import { panelClassName } from "./dashboardStyles";

type RecentReportsCardProps = {
  reports: DashboardReportItem[];
};

const fallbackReports = [
  { id: "placeholder-1", createdAt: "2026-01-18", status: "Neutral" },
  { id: "placeholder-2", createdAt: "2026-01-11", status: "Warn" },
  { id: "placeholder-3", createdAt: "2026-01-05", status: "Good" },
] as const;

function statusClassName(status: "Neutral" | "Warn" | "Good") {
  if (status === "Good") return "bg-emerald-500/15 text-emerald-200";
  if (status === "Warn") return "bg-amber-500/15 text-amber-200";
  return "bg-slate-300/15 text-slate-100";
}

export function RecentReportsCard({ reports }: RecentReportsCardProps) {
  const hasReports = reports.length > 0;

  return (
    <section className={panelClassName}>
      <h2 className="text-2xl font-semibold text-white">Recent Reports</h2>
      <div className="mt-4 space-y-2">
        {hasReports
          ? reports.slice(0, 3).map((report) => (
              <div key={report.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-sm text-white/80">{report.createdAt}</p>
                <span className={`rounded-full px-2 py-1 text-xs ${statusClassName("Good")}`}>Good</span>
                <Link href={report.canView ? report.href : "/app/report"} className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/90">
                  View
                </Link>
              </div>
            ))
          : fallbackReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-sm text-white/80">{report.createdAt}</p>
                <span className={`rounded-full px-2 py-1 text-xs ${statusClassName(report.status)}`}>{report.status}</span>
                <Link href="/app/report" className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/90">
                  View
                </Link>
              </div>
            ))}
      </div>
    </section>
  );
}
