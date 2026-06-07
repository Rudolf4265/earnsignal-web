"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAppGate } from "../../../_components/app-gate-provider";
import { GateLoadingShell, NotAuthorizedCallout } from "../../../_components/gate-callouts";
import { deriveAdminRenderState } from "@/src/lib/gating/admin-guard";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import {
  fetchAdminFeedback,
  fetchAdminFeedbackStats,
  type AdminFeedbackListResponse,
  type AdminFeedbackStatsResponse,
  type FeedbackTypeFilter,
} from "@/src/lib/api/admin-feedback";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function fmtType(t: string): string {
  return t === "build_screen" ? "Build screen" : t.charAt(0).toUpperCase() + t.slice(1);
}

function TypeBadge({ type }: { type: string }) {
  const color =
    type === "review"
      ? "border-brand-accent-blue/50 text-brand-accent-blue"
      : type === "build_screen"
        ? "border-brand-accent-teal/50 text-brand-accent-teal"
        : "border-brand-border-strong text-brand-text-muted";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${color}`}>
      {fmtType(type)}
    </span>
  );
}

function RatingBar({ distribution }: { distribution: Record<string, number> }) {
  const max = Math.max(...Object.values(distribution), 1);
  return (
    <div className="space-y-1">
      {[5, 4, 3, 2, 1].map((n) => {
        const count = distribution[String(n)] ?? 0;
        const pct = Math.round((count / max) * 100);
        return (
          <div key={n} className="flex items-center gap-2">
            <span className="w-3 text-right text-xs text-brand-text-muted">{n}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-brand-accent-teal/70 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-5 text-right text-xs text-brand-text-muted">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

const TYPE_FILTERS: { label: string; value: FeedbackTypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "General", value: "general" },
  { label: "Build screen", value: "build_screen" },
  { label: "Review", value: "review" },
];

export default function AdminFeedbackPage() {
  const { isLoading: isGateLoading, adminStatus } = useAppGate();
  const adminRenderState = deriveAdminRenderState({ isGateLoading, adminStatus });

  const [stats, setStats] = useState<AdminFeedbackStatsResponse | null>(null);
  const [list, setList] = useState<AdminFeedbackListResponse | null>(null);
  const [typeFilter, setTypeFilter] = useState<FeedbackTypeFilter>("all");
  const [page, setPage] = useState(1);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 50;

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const s = await fetchAdminFeedbackStats();
      setStats(s);
    } catch {
      setError("Failed to load feedback stats.");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadList = useCallback(async (filter: FeedbackTypeFilter, p: number) => {
    setLoadingList(true);
    try {
      const l = await fetchAdminFeedback({ feedback_type: filter, page: p, page_size: PAGE_SIZE });
      setList(l);
      setError(null);
    } catch {
      setError("Failed to load feedback list.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (adminRenderState !== "authorized") return;
    void loadStats();
  }, [adminRenderState, loadStats]);

  useEffect(() => {
    if (adminRenderState !== "authorized") return;
    void loadList(typeFilter, page);
  }, [adminRenderState, loadList, typeFilter, page]);

  if (adminRenderState === "loading") return <GateLoadingShell />;
  if (adminRenderState === "not_authorized") return <NotAuthorizedCallout />;

  const totalPages = list ? Math.ceil(list.total / PAGE_SIZE) : 1;

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
          <h1 className="mt-1 text-2xl font-semibold text-brand-text-primary">Feedback</h1>
        </div>
        <button
          type="button"
          onClick={() => { void loadStats(); void loadList(typeFilter, page); }}
          className="rounded-xl border border-brand-border px-3 py-1.5 text-xs text-brand-text-secondary transition hover:bg-brand-panel-muted/60 hover:text-brand-text-primary"
        >
          Refresh
        </button>
      </div>

      {error ? <ErrorBanner title="Error" message={error} /> : null}

      {/* Stats row */}
      {!loadingStats && stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total */}
          <div className="rounded-2xl border border-brand-border/70 bg-brand-panel/60 p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">Total responses</p>
            <p className="text-3xl font-semibold text-brand-text-primary">{stats.total_count}</p>
            <p className="text-xs text-brand-text-muted">
              {stats.by_type.general} general · {stats.by_type.build_screen} build · {stats.by_type.review} review
            </p>
          </div>

          {/* Avg rating */}
          <div className="rounded-2xl border border-brand-border/70 bg-brand-panel/60 p-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">Avg rating</p>
            <p className="text-3xl font-semibold text-brand-text-primary">
              {stats.avg_rating !== null ? stats.avg_rating.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-brand-text-muted">{stats.rated_count} rated responses</p>
          </div>

          {/* Rating distribution */}
          <div className="rounded-2xl border border-brand-border/70 bg-brand-panel/60 p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">Rating distribution</p>
            <RatingBar distribution={stats.rating_distribution} />
          </div>

          {/* Top platform requests */}
          <div className="rounded-2xl border border-brand-border/70 bg-brand-panel/60 p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">Top platform requests</p>
            {stats.top_platform_requests.length === 0 ? (
              <p className="text-xs text-brand-text-muted">None yet</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {stats.top_platform_requests.slice(0, 8).map(({ platform, count }) => (
                  <span
                    key={platform}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-border/60 bg-brand-panel/40 px-2 py-0.5 text-[11px] text-brand-text-secondary"
                  >
                    {platform}
                    <span className="font-semibold text-brand-accent-teal">{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-32 animate-pulse rounded-2xl border border-brand-border/60 bg-brand-panel/40" />
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => { setTypeFilter(value); setPage(1); }}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              typeFilter === value
                ? "border-brand-accent-teal/60 bg-brand-accent-teal/12 text-brand-accent-teal"
                : "border-brand-border text-brand-text-muted hover:border-brand-border-strong hover:text-brand-text-secondary",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
        {list ? (
          <span className="ml-auto self-center text-xs text-brand-text-muted">
            {list.total} {list.total === 1 ? "result" : "results"}
          </span>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-brand-border/70 bg-brand-panel/40">
        {loadingList ? (
          <div className="flex items-center justify-center py-16 text-sm text-brand-text-muted">Loading…</div>
        ) : !list || list.items.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-brand-text-muted">No feedback yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border/60 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-text-muted">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Platforms</th>
                <th className="px-4 py-3">Creator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {list.items.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-text-muted">
                    {fmtDate(item.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={item.feedback_type} />
                  </td>
                  <td className="px-4 py-3 text-brand-text-secondary">
                    {item.rating !== null ? (
                      <span className="font-semibold text-brand-accent-teal">{item.rating}</span>
                    ) : (
                      <span className="text-brand-text-muted">—</span>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-brand-text-secondary">
                    {item.message ? (
                      <p className="line-clamp-2 text-xs leading-relaxed">{item.message}</p>
                    ) : (
                      <span className="text-brand-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.platform_requests && item.platform_requests.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.platform_requests.map((p) => (
                          <span
                            key={p}
                            className="rounded-full border border-brand-border/50 bg-brand-panel/30 px-1.5 py-0.5 text-[10px] text-brand-text-muted"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-brand-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-text-muted font-mono">
                    {item.creator_id.slice(0, 8)}…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-brand-border px-4 py-2 text-xs text-brand-text-secondary transition hover:bg-brand-panel-muted/60 disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-xs text-brand-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-brand-border px-4 py-2 text-xs text-brand-text-secondary transition hover:bg-brand-panel-muted/60 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
