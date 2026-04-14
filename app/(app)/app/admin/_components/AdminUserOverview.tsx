"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAdminUserOverview } from "@/src/lib/api/admin";
import type { AdminUserOverview as AdminUserOverviewData, AdminUserOverviewWindow } from "@/src/lib/api/admin";
import { isApiError } from "@/src/lib/api/client";
import { ErrorBanner } from "@/src/components/ui/error-banner";

const WINDOWS: AdminUserOverviewWindow[] = ["24h", "7d", "30d"];

type AdminUserOverviewProps = {
  includeArchived: boolean;
};

type OverviewError = {
  message: string;
  requestId?: string;
};

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function csvEscape(value: string | number | boolean): string {
  const raw = String(value);
  if (!/[",\n\r]/.test(raw)) {
    return raw;
  }
  return `"${raw.replace(/"/g, '""')}"`;
}

function buildOverviewCsv(data: AdminUserOverviewData): string {
  const rows: Array<Array<string | number | boolean>> = [
    ["metric_group", "metric", "value", "window", "classification_mode"],
    ["totals", "total_users", data.totals.totalUsers, "current", data.classificationMode],
    ["totals", "free", data.totals.free, "current", data.classificationMode],
    ["totals", "report", data.totals.report, "current", data.classificationMode],
    ["totals", "pro", data.totals.pro, "current", data.classificationMode],
    ["totals", "non_paying", data.totals.nonPaying, "current", data.classificationMode],
    ["trends", "new_signups", data.trends.newSignups, data.window, data.classificationMode],
    ["trends", "report_upgrades", data.trends.reportUpgrades, data.window, data.classificationMode],
    ["trends", "pro_upgrades", data.trends.proUpgrades, data.window, data.classificationMode],
    ["trends", "non_paying_grants", data.trends.nonPayingGrants, data.window, data.classificationMode],
  ];

  if (typeof data.trends.downgradesToFree === "number") {
    rows.push(["trends", "downgrades_to_free", data.trends.downgradesToFree, data.window, data.classificationMode]);
  }

  return `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
}

function downloadOverviewCsv(data: AdminUserOverviewData): void {
  const csv = buildOverviewCsv(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `admin-user-overview-${data.window}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function OverviewTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | null;
  helper?: string;
}) {
  return (
    <div className="min-h-[92px] rounded-lg border border-white/10 bg-black/15 p-3">
      <p className="text-xs font-medium text-gray-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value === null ? "-" : formatCount(value)}</p>
      {helper ? <p className="mt-1 text-[11px] leading-4 text-gray-400">{helper}</p> : null}
    </div>
  );
}

function OverviewLoadingTiles() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {["Total users", "Free", "Report", "Pro", "Non-Paying"].map((label) => (
        <div key={label} className="min-h-[92px] rounded-lg border border-white/10 bg-black/15 p-3">
          <p className="text-xs font-medium text-gray-300">{label}</p>
          <div className="mt-3 h-7 w-16 rounded bg-white/10" />
          <div className="mt-3 h-3 w-24 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function AdminUserOverview({ includeArchived }: AdminUserOverviewProps) {
  const [windowValue, setWindowValue] = useState<AdminUserOverviewWindow>("7d");
  const [data, setData] = useState<AdminUserOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<OverviewError | null>(null);

  useEffect(() => {
    let canceled = false;

    async function loadOverview() {
      setIsLoading(true);
      try {
        const result = await fetchAdminUserOverview(windowValue, { includeArchived });
        if (canceled) {
          return;
        }
        setData(result);
        setError(null);
      } catch (err) {
        if (canceled) {
          return;
        }
        setError({
          message: err instanceof Error ? err.message : "Failed to load user overview.",
          requestId: isApiError(err) ? err.requestId : undefined,
        });
      } finally {
        if (!canceled) {
          setIsLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      canceled = true;
    };
  }, [includeArchived, windowValue]);

  const trendText = useMemo(() => {
    if (!data) {
      return "In selected period: - signups · - Report upgrades · - Pro upgrades · - Non-Paying grants";
    }
    const parts = [
      `${formatCount(data.trends.newSignups)} signups`,
      `${formatCount(data.trends.reportUpgrades)} Report upgrades`,
      `${formatCount(data.trends.proUpgrades)} Pro upgrades`,
      `${formatCount(data.trends.nonPayingGrants)} Non-Paying grants`,
    ];
    if (typeof data.trends.downgradesToFree === "number") {
      parts.push(`${formatCount(data.trends.downgradesToFree)} downgrades to Free`);
    }
    return `In selected period: ${parts.join(" · ")}`;
  }, [data]);

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4" aria-labelledby="admin-user-overview-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 id="admin-user-overview-title" className="text-lg font-medium text-white">
            User overview
          </h2>
          <p className="text-sm text-gray-300">Tier totals and recent account activity.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-white/10 bg-black/20 p-1" aria-label="Trend window">
            {WINDOWS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setWindowValue(option)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  windowValue === option ? "bg-white/20 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
                aria-pressed={windowValue === option}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => data && downloadOverviewCsv(data)}
            disabled={!data || isLoading}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading && !data ? (
          <OverviewLoadingTiles />
        ) : data ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <OverviewTile label="Total users" value={data.totals.totalUsers} />
            <OverviewTile label="Free" value={data.totals.free} />
            <OverviewTile label="Report" value={data.totals.report} />
            <OverviewTile label="Pro" value={data.totals.pro} />
            <OverviewTile
              label="Non-Paying"
              value={data.totals.nonPaying}
              helper="Manual/admin-granted access not tied to a current paid plan."
            />
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/15 p-3 text-sm text-gray-300">No overview metrics available.</div>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-xs text-gray-300">{trendText}</div>

      {data?.metadata.notes.length ? (
        <p className="mt-2 text-[11px] leading-4 text-gray-400">{data.metadata.notes[0]}</p>
      ) : null}

      {error ? (
        <div className="mt-3">
          <ErrorBanner title="Could not load user overview" message={error.message} requestId={error.requestId} />
        </div>
      ) : null}
    </section>
  );
}
