"use client";

import { PanelCard } from "@/src/components/ui/panel-card";
import type { ReportDetailPresentationModel } from "@/src/lib/report/detail-presentation";
import { ReportStatTile, type StatTileTone } from "./ReportStatTile";

type SubscriberHealth = ReportDetailPresentationModel["subscriberHealth"];

function toTileTone(stateTone: "good" | "warn" | "neutral" | null | undefined): StatTileTone {
  if (stateTone === "good") return "positive";
  if (stateTone === "warn") return "warning";
  return "neutral";
}

function toBadge(stateLabel: string | null | undefined, stateTone: "good" | "warn" | "neutral" | null | undefined): string | null {
  if (!stateLabel) return null;
  return stateLabel;
}

type Props = {
  model: SubscriberHealth;
};

export function ReportSubscriberHealthSection({ model }: Props) {
  if (model.metrics.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="report-subscriber-health">
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
          Subscriber &amp; Retention Health
        </p>
        <p className="text-xs text-brand-text-muted">
          Retention signals, churn pressure, and revenue-per-subscriber at a glance.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {model.metrics.map((metric) => (
          <ReportStatTile
            key={metric.id}
            label={metric.label}
            value={metric.value}
            badge={toBadge(metric.stateLabel, metric.stateTone)}
            tone={toTileTone(metric.stateTone)}
            detail={metric.detail}
            testId={`subscriber-health-tile-${metric.id}`}
          />
        ))}
      </div>
      {model.highlights.length > 0 ? (
        <PanelCard className="border-brand-border/60 bg-brand-panel/50">
          <ul className="space-y-1.5">
            {model.highlights.map((line, i) => (
              <li key={i} className="text-sm leading-relaxed text-brand-text-secondary">
                {line}
              </li>
            ))}
          </ul>
        </PanelCard>
      ) : null}
    </section>
  );
}
