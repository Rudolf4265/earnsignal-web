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

function toBadge(stateLabel: string | null | undefined): string | null {
  return stateLabel ?? null;
}

type Props = {
  model: SubscriberHealth;
};

export function ReportSubscriberHealthSection({ model }: Props) {
  if (model.metrics.length === 0) return null;

  return (
    <section className="space-y-4" data-testid="report-subscriber-health">
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">
          Subscriber &amp; Retention Health
        </p>
        <p className="text-sm leading-relaxed text-brand-text-secondary">
          Subscriber signals, retention context, and revenue-per-subscriber where the evidence supports it.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {model.metrics.map((metric) => (
          <ReportStatTile
            key={metric.id}
            label={metric.label}
            value={metric.value}
            badge={toBadge(metric.stateLabel)}
            tone={toTileTone(metric.stateTone)}
            detail={metric.detail}
            testId={`subscriber-health-tile-${metric.id}`}
          />
        ))}
      </div>
      {model.highlights.length > 0 ? (
        <PanelCard className="border-brand-border/60 bg-[linear-gradient(165deg,rgba(16,32,67,0.82),rgba(19,41,80,0.7),rgba(13,28,57,0.88))]">
          <ul className="space-y-2">
            {model.highlights.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-brand-accent-blue/70" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-brand-text-secondary">{line}</p>
              </li>
            ))}
          </ul>
        </PanelCard>
      ) : null}
    </section>
  );
}
