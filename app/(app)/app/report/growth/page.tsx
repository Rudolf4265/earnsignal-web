"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "../../_components/dashboard/Badge";
import { DashboardSectionHeader } from "../../_components/dashboard/DashboardSectionHeader";
import { useAppGate } from "../../../_components/app-gate-provider";
import { buttonClassName } from "@/src/components/ui/button";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { PanelCard } from "@/src/components/ui/panel-card";
import { isApiError } from "@/src/lib/api/client";
import { fetchGrowthReport, type GrowthReport, type GrowthReportConstraint, type GrowthReportAction, type GrowthReportUnlockItem } from "@/src/lib/api/reports";
import {
  buildGrowthReportSectionGatingModel,
  isGrowthSectionUnlocked,
} from "@/src/lib/report/growth-gating";

type GrowthPageState =
  | { view: "loading" }
  | { view: "error"; message: string }
  | { view: "success"; report: GrowthReport };

function SectionLockedCard({ testId }: { testId: string }) {
  return (
    <div
      className="relative flex flex-wrap items-end justify-between gap-4 overflow-hidden rounded-2xl border border-brand-border-strong/80 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(23,49,117,0.78),rgba(15,118,110,0.32))] p-5 shadow-brand-card"
      data-testid={testId}
    >
      <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-brand-accent-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-14 bottom-[-4.5rem] h-36 w-36 rounded-full bg-brand-accent-emerald/16 blur-3xl" />
      <div className="relative space-y-2">
        <p className="inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel/72 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
          Report Access
        </p>
        <p className="text-sm leading-relaxed text-brand-text-secondary">Report or Pro access is required for this section.</p>
      </div>
      <Link href="/app/billing" className={buttonClassName({ variant: "primary", size: "sm", className: "relative z-10 px-4 shadow-brand-glow" })}>
        View plans
      </Link>
    </div>
  );
}

function SectionLoadingCard({ testId }: { testId: string }) {
  return (
    <div className="rounded-2xl border border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.74),rgba(16,32,67,0.86))] p-4" data-testid={testId}>
      <div className="space-y-2">
        <div className="h-2.5 w-full animate-pulse rounded-full bg-brand-border/70" />
        <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-brand-border/55" />
        <div className="h-2.5 w-3/5 animate-pulse rounded-full bg-brand-border/40" />
      </div>
    </div>
  );
}

function GrowthSnapshotSection({ report }: { report: GrowthReport }) {
  const { growth_snapshot } = report;

  return (
    <section data-testid="growth-snapshot-section">
      <DashboardSectionHeader title="Growth Snapshot" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <PanelCard>
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Coverage Score</p>
          <p className="mt-1 text-2xl font-bold text-brand-text-primary">{growth_snapshot.coverage_score}%</p>
          <p className="text-xs text-brand-text-muted">of growth signals connected</p>
        </PanelCard>
        <PanelCard>
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Sources</p>
          <p className="mt-1 text-2xl font-bold text-brand-text-primary">{growth_snapshot.sources_available.length}</p>
          <p className="text-xs text-brand-text-muted">platforms with data</p>
        </PanelCard>
        <PanelCard>
          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Latest Period</p>
          <p className="mt-1 text-lg font-semibold text-brand-text-primary">{growth_snapshot.latest_period ?? "—"}</p>
          <p className="text-xs text-brand-text-muted">most recent data month</p>
        </PanelCard>
      </div>
      {growth_snapshot.sources_available.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {growth_snapshot.sources_available.map((src) => (
            <Badge key={src} variant="neutral">
              {src.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}

function WhatWeCanMeasureSection({ report }: { report: GrowthReport }) {
  const { what_we_can_measure } = report;

  const items: Array<{ label: string; available: boolean }> = [
    { label: "Audience reach & impressions", available: what_we_can_measure.audience_reach },
    { label: "Content performance (views, CTR)", available: what_we_can_measure.content_performance },
    { label: "Subscriber trends (YouTube)", available: what_we_can_measure.subscriber_trends },
    { label: "Business metrics (revenue, paid subs)", available: what_we_can_measure.business_metrics },
  ];

  return (
    <section data-testid="what-we-can-measure-section">
      <DashboardSectionHeader title="What We Can Measure Now" />
      <PanelCard className="mt-3">
        <ul className="space-y-2">
          {items.map(({ label, available }) => (
            <li key={label} className="flex items-center gap-3">
              <span className={`h-2 w-2 rounded-full ${available ? "bg-emerald-400" : "bg-brand-border"}`} />
              <span className={`text-sm ${available ? "text-brand-text-primary" : "text-brand-text-muted line-through"}`}>
                {label}
              </span>
              {available ? (
                <Badge variant="good">available</Badge>
              ) : (
                <Badge variant="neutral">not connected</Badge>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-brand-text-muted">{what_we_can_measure.note}</p>
      </PanelCard>
    </section>
  );
}

function AudienceSignalsSection({ report }: { report: GrowthReport }) {
  const { audience_signals } = report;
  const hasInstagram = audience_signals.instagram.length > 0;
  const hasTikTok = audience_signals.tiktok.length > 0;

  if (!hasInstagram && !hasTikTok) {
    return (
      <section data-testid="audience-signals-section">
        <DashboardSectionHeader title="Audience Signals" />
        <PanelCard className="mt-3">
          <p className="text-sm text-brand-text-secondary">No audience data is connected yet. Upload Instagram or TikTok performance exports to see follower trends here.</p>
        </PanelCard>
      </section>
    );
  }

  return (
    <section data-testid="audience-signals-section">
      <DashboardSectionHeader title="Audience Signals" />
      <div className="mt-3 space-y-4">
        {hasInstagram && (
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Instagram</p>
            <div className="overflow-x-auto rounded-xl border border-brand-border/70 bg-brand-panel/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border/60 text-brand-text-muted">
                    <th className="px-3 py-2 text-left">Month</th>
                    <th className="px-3 py-2 text-right">Followers +</th>
                    <th className="px-3 py-2 text-right">Followers −</th>
                    <th className="px-3 py-2 text-right">Impressions</th>
                    <th className="px-3 py-2 text-right">Engagements</th>
                  </tr>
                </thead>
                <tbody>
                  {audience_signals.instagram.map((row) => (
                    <tr key={row.month} className="border-b border-brand-border/40 last:border-0">
                      <td className="px-3 py-2 font-medium text-brand-text-primary">{row.month}</td>
                      <td className="px-3 py-2 text-right text-emerald-400">+{(row.followers_gained ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-red-400">−{(row.followers_lost ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-brand-text-secondary">{(row.impressions ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-brand-text-secondary">{(row.engagements ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {hasTikTok && (
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">TikTok</p>
            <div className="overflow-x-auto rounded-xl border border-brand-border/70 bg-brand-panel/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border/60 text-brand-text-muted">
                    <th className="px-3 py-2 text-left">Month</th>
                    <th className="px-3 py-2 text-right">Followers +</th>
                    <th className="px-3 py-2 text-right">Video Views</th>
                    <th className="px-3 py-2 text-right">Likes</th>
                    <th className="px-3 py-2 text-right">Shares</th>
                  </tr>
                </thead>
                <tbody>
                  {audience_signals.tiktok.map((row) => (
                    <tr key={row.month} className="border-b border-brand-border/40 last:border-0">
                      <td className="px-3 py-2 font-medium text-brand-text-primary">{row.month}</td>
                      <td className="px-3 py-2 text-right text-emerald-400">+{(row.followers_gained ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-brand-text-secondary">{(row.video_views ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-brand-text-secondary">{(row.likes ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-brand-text-secondary">{(row.shares ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ContentPerformanceSection({ report }: { report: GrowthReport }) {
  const { content_performance } = report;
  const { youtube, tiktok } = content_performance;

  if (!youtube && tiktok.length === 0) {
    return (
      <section data-testid="content-performance-section">
        <DashboardSectionHeader title="Content Performance Signals" />
        <PanelCard className="mt-3">
          <p className="text-sm text-brand-text-secondary">No content performance data is connected yet. Upload a YouTube Channel Analytics Export or TikTok performance export to see performance data here.</p>
        </PanelCard>
      </section>
    );
  }

  return (
    <section data-testid="content-performance-section">
      <DashboardSectionHeader title="Content Performance Signals" />
      <div className="mt-3 space-y-4">
        {youtube && (
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">YouTube</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <PanelCard>
                <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Total Views</p>
                <p className="mt-1 text-xl font-bold text-brand-text-primary">{(youtube.total_views ?? 0).toLocaleString()}</p>
              </PanelCard>
              <PanelCard>
                <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Watch Time</p>
                <p className="mt-1 text-xl font-bold text-brand-text-primary">{youtube.total_watch_time_hours.toLocaleString(undefined, { maximumFractionDigits: 1 })}h</p>
              </PanelCard>
              {youtube.has_impressions_data && youtube.avg_impressions_ctr_pct !== null && (
                <PanelCard>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Avg CTR</p>
                  <p className="mt-1 text-xl font-bold text-brand-text-primary">{youtube.avg_impressions_ctr_pct.toFixed(1)}%</p>
                </PanelCard>
              )}
              {youtube.has_subscriber_data && youtube.net_subscribers_change !== null && (
                <PanelCard>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Net Subscriber Change</p>
                  <p className={`mt-1 text-xl font-bold ${(youtube.net_subscribers_change ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {(youtube.net_subscribers_change ?? 0) >= 0 ? "+" : ""}
                    {(youtube.net_subscribers_change ?? 0).toLocaleString()}
                  </p>
                </PanelCard>
              )}
            </div>
            {youtube.date_range_start && youtube.date_range_end && (
              <p className="mt-2 text-xs text-brand-text-muted">
                Data range: {youtube.date_range_start} → {youtube.date_range_end}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function GrowthConstraintsSection({ constraints }: { constraints: GrowthReportConstraint[] }) {
  if (constraints.length === 0) {
    return (
      <section data-testid="growth-constraints-section">
        <DashboardSectionHeader title="Growth Constraints" />
        <PanelCard className="mt-3">
          <p className="text-sm text-brand-text-secondary">No significant constraints detected with current data. Connect more sources for a fuller picture.</p>
        </PanelCard>
      </section>
    );
  }

  return (
    <section data-testid="growth-constraints-section">
      <DashboardSectionHeader title="Growth Constraints" />
      <ul className="mt-3 space-y-3">
        {constraints.map((c) => (
          <li
            key={c.constraint_type}
            className="rounded-xl border border-brand-border/70 bg-brand-panel/60 p-4"
            data-testid={`constraint-${c.constraint_type}`}
          >
            <div className="flex items-center gap-2">
              <Badge variant={c.severity === "high" ? "warn" : c.severity === "medium" ? "neutral" : "neutral"}>
                {c.severity}
              </Badge>
              <p className="text-sm font-medium text-brand-text-primary">{c.description}</p>
            </div>
            <p className="mt-2 text-xs text-brand-text-muted">
              <span className="font-semibold text-brand-text-secondary">Unlock: </span>
              {c.unlock_action}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WhatUnlocksNextSection({ items }: { items: GrowthReportUnlockItem[] }) {
  if (items.length === 0) {
    return (
      <section data-testid="what-unlocks-next-section">
        <DashboardSectionHeader title="What Unlocks Next" />
        <PanelCard className="mt-3">
          <p className="text-sm text-brand-text-secondary">All key growth analytics sources are connected.</p>
        </PanelCard>
      </section>
    );
  }

  return (
    <section data-testid="what-unlocks-next-section">
      <DashboardSectionHeader title="What Unlocks Next" />
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li
            key={item.platform}
            className="rounded-xl border border-brand-border/70 bg-brand-panel/60 p-4"
            data-testid={`unlock-${item.platform}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={item.priority === "high" ? "warn" : "neutral"}>{item.priority} priority</Badge>
              <p className="text-sm font-semibold text-brand-text-primary">{item.action}</p>
            </div>
            <p className="mt-1.5 text-xs text-brand-text-secondary">{item.value_unlocked}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecommendedActionsSection({ actions }: { actions: GrowthReportAction[] }) {
  return (
    <section data-testid="recommended-actions-section">
      <DashboardSectionHeader title="Recommended Actions" />
      <ul className="mt-3 space-y-3">
        {actions.map((action, idx) => (
          <li key={idx} className="rounded-xl border border-brand-border/70 bg-brand-panel/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={action.confidence === "high" ? "good" : action.confidence === "medium" ? "neutral" : "neutral"}>
                {action.confidence} confidence
              </Badge>
              {action.evidence_source !== "none" && (
                <Badge variant="neutral">{action.evidence_source}</Badge>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-brand-text-primary">{action.action}</p>
            <p className="mt-1 text-xs text-brand-text-muted">{action.reason}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ConfidenceNoteSection({ report }: { report: GrowthReport }) {
  const { confidence_note } = report;

  return (
    <section data-testid="confidence-note-section">
      <div className="rounded-2xl border border-brand-border-strong/70 bg-brand-panel/72 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">Coverage Note</Badge>
          <span className="text-xs text-brand-text-muted">
            {confidence_note.sources_used.length} source{confidence_note.sources_used.length !== 1 ? "s" : ""} · {confidence_note.months_coverage} month{confidence_note.months_coverage !== 1 ? "s" : ""} of data
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{confidence_note.honesty_statement}</p>
      </div>
    </section>
  );
}


export default function GrowthReportPage() {
  const { state: gateState, entitlements } = useAppGate();
  const [pageState, setPageState] = useState<GrowthPageState>({ view: "loading" });

  const gating = useMemo(
    () => buildGrowthReportSectionGatingModel(gateState, entitlements),
    [gateState, entitlements],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const report = await fetchGrowthReport();
        if (!cancelled) {
          setPageState({ view: "success", report });
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          isApiError(err) ? err.message : err instanceof Error ? err.message : "Unable to load Growth Report.";
        setPageState({ view: "error", message });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (pageState.view === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <ErrorBanner message={pageState.message} />
      </div>
    );
  }

  if (pageState.view === "loading") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10" data-testid="growth-report-loading">
        <SectionLoadingCard testId="loading-snapshot" />
        <SectionLoadingCard testId="loading-coverage" />
        <SectionLoadingCard testId="loading-audience" />
      </div>
    );
  }

  const { report } = pageState;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10" data-testid="growth-report-page">
      <div>
        <h1 className="text-2xl font-bold text-brand-text-primary">Growth Report</h1>
        <p className="mt-1 text-sm text-brand-text-secondary">
          Audience reach and content performance from your connected analytics sources.
        </p>
      </div>

      {/* Always visible */}
      <GrowthSnapshotSection report={report} />

      {/* Always visible */}
      <WhatWeCanMeasureSection report={report} />

      {/* Report+ sections */}
      {gating.audienceSignals === "loading-safe" ? (
        <SectionLoadingCard testId="loading-audience-signals" />
      ) : isGrowthSectionUnlocked(gating.audienceSignals) ? (
        <AudienceSignalsSection report={report} />
      ) : (
        <SectionLockedCard testId="audience-signals-locked" />
      )}

      {gating.contentPerformance === "loading-safe" ? (
        <SectionLoadingCard testId="loading-content-performance" />
      ) : isGrowthSectionUnlocked(gating.contentPerformance) ? (
        <ContentPerformanceSection report={report} />
      ) : (
        <SectionLockedCard testId="content-performance-locked" />
      )}

      {gating.growthConstraints === "loading-safe" ? (
        <SectionLoadingCard testId="loading-constraints" />
      ) : isGrowthSectionUnlocked(gating.growthConstraints) ? (
        <GrowthConstraintsSection constraints={report.growth_constraints} />
      ) : (
        <SectionLockedCard testId="growth-constraints-locked" />
      )}

      {/* Always visible */}
      <WhatUnlocksNextSection items={report.what_unlocks_next} />

      {/* Report+ (same as all other sections at MVP) */}
      {gating.recommendedActions === "loading-safe" ? (
        <SectionLoadingCard testId="loading-recommended-actions" />
      ) : isGrowthSectionUnlocked(gating.recommendedActions) ? (
        <RecommendedActionsSection actions={report.recommended_actions} />
      ) : (
        <SectionLockedCard testId="recommended-actions-locked" />
      )}

      {/* Report+ */}
      {gating.confidenceNote === "loading-safe" ? (
        <SectionLoadingCard testId="loading-confidence-note" />
      ) : isGrowthSectionUnlocked(gating.confidenceNote) ? (
        <ConfidenceNoteSection report={report} />
      ) : null}
    </div>
  );
}
