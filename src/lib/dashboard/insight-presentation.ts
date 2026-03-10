import type { DashboardInsightVariant } from "./insights";

export type InsightCardPresentation = {
  badgeLabel: string;
  badgeVariant: "good" | "warn" | "neutral";
  badgeClassName: string;
  accentClassName: string;
  cardClassName: string;
  implicationPanelClassName: string;
};

const INSIGHT_PRESENTATION: Record<DashboardInsightVariant, InsightCardPresentation> = {
  positive: {
    badgeLabel: "Positive",
    badgeVariant: "good",
    badgeClassName: "border-emerald-300/45 bg-emerald-500/16 text-emerald-100",
    accentClassName: "bg-gradient-to-r from-emerald-300/75 via-emerald-300/35 to-transparent",
    cardClassName: "border-emerald-300/35 bg-[linear-gradient(160deg,rgba(16,32,67,0.92),rgba(20,83,76,0.36))]",
    implicationPanelClassName: "border-emerald-300/30 bg-emerald-500/[0.08]",
  },
  warning: {
    badgeLabel: "Warning",
    badgeVariant: "warn",
    badgeClassName: "border-amber-300/45 bg-amber-500/15 text-amber-100",
    accentClassName: "bg-gradient-to-r from-amber-300/75 via-amber-300/35 to-transparent",
    cardClassName: "border-amber-300/35 bg-[linear-gradient(160deg,rgba(16,32,67,0.92),rgba(113,63,18,0.28))]",
    implicationPanelClassName: "border-amber-300/30 bg-amber-500/[0.09]",
  },
  neutral: {
    badgeLabel: "Neutral",
    badgeVariant: "neutral",
    badgeClassName: "border-brand-border-strong/75 bg-brand-panel/80 text-brand-text-secondary",
    accentClassName: "bg-gradient-to-r from-brand-accent-blue/55 via-brand-accent-teal/30 to-transparent",
    cardClassName: "border-brand-border/75 bg-[linear-gradient(160deg,rgba(16,32,67,0.92),rgba(23,49,117,0.26))]",
    implicationPanelClassName: "border-brand-border-strong/70 bg-brand-panel/72",
  },
};

export function getInsightCardPresentation(variant: DashboardInsightVariant): InsightCardPresentation {
  return INSIGHT_PRESENTATION[variant];
}
