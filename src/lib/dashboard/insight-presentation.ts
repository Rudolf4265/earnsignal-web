import type { DashboardInsightVariant } from "./insights";

export type InsightCardPresentation = {
  badgeLabel: string;
  badgeVariant: "good" | "warn" | "neutral";
  cardClassName: string;
  implicationPanelClassName: string;
};

const INSIGHT_PRESENTATION: Record<DashboardInsightVariant, InsightCardPresentation> = {
  positive: {
    badgeLabel: "Positive",
    badgeVariant: "good",
    cardClassName: "border-emerald-400/35 bg-emerald-500/[0.07]",
    implicationPanelClassName: "border-emerald-400/30 bg-emerald-500/[0.08]",
  },
  warning: {
    badgeLabel: "Warning",
    badgeVariant: "warn",
    cardClassName: "border-amber-400/35 bg-amber-500/[0.07]",
    implicationPanelClassName: "border-amber-400/30 bg-amber-500/[0.08]",
  },
  neutral: {
    badgeLabel: "Neutral",
    badgeVariant: "neutral",
    cardClassName: "border-brand-border bg-brand-panel-muted/70",
    implicationPanelClassName: "border-brand-border-strong bg-brand-panel/70",
  },
};

export function getInsightCardPresentation(variant: DashboardInsightVariant): InsightCardPresentation {
  return INSIGHT_PRESENTATION[variant];
}
