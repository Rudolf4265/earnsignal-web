"use client";

import Link from "next/link";

type NudgeSuggestion = {
  id: string;
  label: string;
  description: string;
  href: string;
};

type ReportSourceNudgeProps = {
  platformsIncluded: string[];
  sourceCount: number | null;
  netRevenueSource: string | null;
};

/**
 * Shown on single-source reports to encourage uploading a complementary data source.
 * Only renders when sourceCount <= 1 and we can identify a specific actionable suggestion.
 *
 * Suggestions:
 * - Patreon snapshot only → prompt for Patreon earnings CSV (unlocks revenue history + churn trends)
 * - No YouTube → prompt for YouTube analytics (unlocks audience health section)
 */
export function ReportSourceNudge({ platformsIncluded, sourceCount, netRevenueSource }: ReportSourceNudgeProps) {
  if ((sourceCount ?? 0) > 1) return null;

  const normalizedPlatforms = platformsIncluded.map((p) => p.toLowerCase());
  const hasPatreon = normalizedPlatforms.includes("patreon");
  const hasYouTube = normalizedPlatforms.some((p) => p === "youtube" || p === "yt");

  // Detect snapshot-only Patreon: net revenue came from a point-in-time snapshot, not earnings CSV
  const isPatreonSnapshotOnly =
    hasPatreon &&
    netRevenueSource != null &&
    (netRevenueSource.includes("snapshot") || netRevenueSource === "patreon_member_snapshot");

  const suggestions: NudgeSuggestion[] = [];

  if (isPatreonSnapshotOnly) {
    suggestions.push({
      id: "patreon-earnings",
      label: "Add Patreon earnings CSV",
      description: "Unlocks revenue history, MoM trends, and churn rate tracking over time.",
      href: "/app/data",
    });
  }

  if (!hasYouTube) {
    suggestions.push({
      id: "youtube",
      label: "Add YouTube analytics",
      description: "Surfaces audience growth, watch time trends, and platform concentration risk.",
      href: "/app/data",
    });
  }

  if (suggestions.length === 0) return null;

  return (
    <div
      className="mt-6 rounded-2xl border border-brand-accent-blue/25 bg-[linear-gradient(155deg,rgba(14,28,60,0.72),rgba(18,40,90,0.60))] px-5 py-4"
      data-testid="report-source-nudge"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex rounded-full border border-brand-accent-blue/40 bg-brand-accent-blue/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent-blue">
          Improve this report
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
        {suggestions.length === 1
          ? "This report is based on a single source. Adding one more data source will give you a fuller, more accurate read."
          : "This report is based on a single source. Adding more data will unlock deeper insights and cross-platform analysis."}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {suggestions.map((suggestion) => (
          <Link
            key={suggestion.id}
            href={suggestion.href}
            data-testid={`report-source-nudge-${suggestion.id}`}
            className="group flex min-w-[200px] flex-1 flex-col gap-1 rounded-xl border border-brand-border/60 bg-brand-panel/50 px-4 py-3 transition hover:border-brand-accent-blue/40 hover:bg-brand-panel/80"
          >
            <span className="text-sm font-semibold text-brand-text-primary group-hover:text-brand-accent-blue transition-colors">
              {suggestion.label} →
            </span>
            <span className="text-xs leading-relaxed text-brand-text-muted">{suggestion.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
