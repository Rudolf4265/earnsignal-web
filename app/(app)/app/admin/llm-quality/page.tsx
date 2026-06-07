"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAppGate } from "../../../_components/app-gate-provider";
import { GateLoadingShell, NotAuthorizedCallout } from "../../../_components/gate-callouts";
import { deriveAdminRenderState } from "@/src/lib/gating/admin-guard";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import {
  fetchAdminLLMQuality,
  type AdminLLMQualityResponse,
  type LLMQualityWindow,
} from "@/src/lib/api/admin-llm-quality";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtScore(v: number | null): string {
  return v === null ? "—" : v.toFixed(3);
}

function fmtPct(v: number | null): string {
  return v === null ? "—" : `${(v * 100).toFixed(1)}%`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

function compositeColor(v: number | null): string {
  if (v === null) return "text-brand-text-muted";
  if (v >= 0.8) return "text-emerald-400";
  if (v >= 0.6) return "text-brand-accent-teal";
  if (v >= 0.4) return "text-amber-400";
  return "text-red-400";
}

// ── sub-components ────────────────────────────────────────────────────────────

function WindowCard({ label, data }: { label: string; data: LLMQualityWindow }) {
  return (
    <div className="rounded-2xl border border-brand-border/70 bg-brand-panel/60 p-5 space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">{label}</p>
        <p className={`mt-1 text-3xl font-semibold ${compositeColor(data.avg_composite)}`}>
          {fmtPct(data.avg_composite)}
        </p>
        <p className="text-xs text-brand-text-muted">avg composite · {data.run_count} runs</p>
      </div>
      <div className="space-y-1.5 border-t border-brand-border/40 pt-3 text-xs text-brand-text-secondary">
        <div className="flex justify-between">
          <span className="text-brand-text-muted">Grounding</span>
          <span>{fmtPct(data.avg_grounding)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-text-muted">Specificity</span>
          <span>{fmtPct(data.avg_specificity)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-text-muted">Actionability</span>
          <span>{fmtPct(data.avg_actionability)}</span>
        </div>
      </div>
    </div>
  );
}

function DistributionBar({
  data,
  total,
}: {
  data: AdminLLMQualityResponse["score_distribution"];
  total: number;
}) {
  const buckets: { label: string; count: number; color: string }[] = [
    { label: "Excellent ≥ 80%", count: data.excellent, color: "bg-emerald-400/80" },
    { label: "Good 60–80%",     count: data.good,      color: "bg-brand-accent-teal/80" },
    { label: "Fair 40–60%",     count: data.fair,      color: "bg-amber-400/80" },
    { label: "Poor < 40%",      count: data.poor,      color: "bg-red-400/80" },
  ];

  return (
    <div className="rounded-2xl border border-brand-border/70 bg-brand-panel/60 p-5 space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">
        Score distribution
      </p>

      {/* stacked bar */}
      {total > 0 && (
        <div className="flex h-6 overflow-hidden rounded-full">
          {buckets.map(({ label, count, color }) => {
            const pct = (count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={label}
                title={`${label}: ${count}`}
                className={`${color} transition-all`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
      )}

      {/* legend */}
      <div className="space-y-1.5">
        {buckets.map(({ label, count, color }) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
          return (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm ${color}`} />
              <span className="flex-1 text-brand-text-secondary">{label}</span>
              <span className="font-semibold tabular-nums text-brand-text-primary">{count}</span>
              <span className="w-10 text-right text-brand-text-muted">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function AdminLLMQualityPage() {
  const { isLoading: isGateLoading, adminStatus } = useAppGate();
  const adminRenderState = deriveAdminRenderState({ isGateLoading, adminStatus });

  const [data, setData] = useState<AdminLLMQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminLLMQuality();
      setData(result);
    } catch {
      setError("Failed to load LLM quality data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminRenderState !== "authorized") return;
    void load();
  }, [adminRenderState, load]);

  if (adminRenderState === "loading") return <GateLoadingShell />;
  if (adminRenderState === "not_authorized") return <NotAuthorizedCallout />;

  const scoredTotal = data
    ? data.score_distribution.poor +
      data.score_distribution.fair +
      data.score_distribution.good +
      data.score_distribution.excellent
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/app/admin"
            className="text-xs text-brand-text-muted hover:text-brand-text-secondary transition-colors"
          >
            ← Admin
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-brand-text-primary">LLM Quality</h1>
          <p className="mt-0.5 text-sm text-brand-text-muted">
            Insight card grounding, specificity, and actionability scores.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { void load(); }}
          className="rounded-xl border border-brand-border px-3 py-1.5 text-xs text-brand-text-secondary transition hover:bg-brand-panel-muted/60 hover:text-brand-text-primary"
        >
          Refresh
        </button>
      </div>

      {error ? <ErrorBanner title="Error" message={error} /> : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl border border-brand-border/60 bg-brand-panel/40" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Coverage banner */}
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-brand-border/60 bg-brand-panel/40 px-4 py-2.5 text-sm">
              <span className="text-brand-text-muted">Scored runs</span>
              <span className="font-semibold text-brand-text-primary">{data.runs_with_scores}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-brand-border/60 bg-brand-panel/40 px-4 py-2.5 text-sm">
              <span className="text-brand-text-muted">Unscored runs</span>
              <span className={`font-semibold ${data.runs_without_scores > 0 ? "text-amber-400" : "text-brand-text-primary"}`}>
                {data.runs_without_scores}
              </span>
            </div>
          </div>

          {/* Window cards + distribution */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <WindowCard label="Last 7 days" data={data.last_7d} />
            <WindowCard label="Last 30 days" data={data.last_30d} />
            <WindowCard label="All time" data={data.all_time} />
            <DistributionBar data={data.score_distribution} total={scoredTotal} />
          </div>

          {/* Worst runs */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-brand-text-secondary">
              Lowest composite scores — top 10 for triage
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-brand-border/70 bg-brand-panel/40">
              {data.worst_runs.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-brand-text-muted">
                  No scored runs yet.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border/60 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-text-muted">
                      <th className="px-4 py-3">Run ID</th>
                      <th className="px-4 py-3">Creator</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Composite</th>
                      <th className="px-4 py-3">Grounding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40">
                    {data.worst_runs.map((run) => (
                      <tr key={run.run_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-brand-text-muted">
                          {run.run_id.slice(0, 8)}…
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/app/admin/users/${run.creator_id}`}
                            className="font-mono text-xs text-brand-accent-blue hover:underline"
                          >
                            {run.creator_id.slice(0, 8)}…
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-text-muted">
                          {fmtDate(run.finished_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${compositeColor(run.composite)}`}>
                            {fmtScore(run.composite)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-brand-text-secondary">
                          {fmtScore(run.grounding)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
