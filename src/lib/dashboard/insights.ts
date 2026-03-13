import type { ReportSignalViewModel } from "../report/normalize-artifact-to-report-model";
import { getTruthStateDescription, getTruthStateLabel, getTruthStateTone, type ReportTruthTone } from "../report/truth";

export type DashboardInsightVariant = "positive" | "warning" | "neutral";

export type DashboardInsightCard = {
  id: string;
  variant: DashboardInsightVariant;
  title: string;
  body: string;
  implication: string;
  stateLabel: string | null;
  stateTone: ReportTruthTone | null;
  stateDetail: string | null;
};

type BuildDashboardInsightsInput = {
  keySignals?: string[] | null;
  signals?: ReportSignalViewModel[] | null;
  maxCards?: number;
};

type InsightCategoryId = "platform-risk" | "revenue-momentum" | "subscriber-churn-risk" | "creator-stability" | "business-signal";

type InsightCategory = {
  id: InsightCategoryId;
  title: string;
  keywords: string[];
};

type InsightCandidate = {
  id: string;
  signal: string;
  category: InsightCategory;
  variant: DashboardInsightVariant;
  sourceIndex: number;
  truth: ReportSignalViewModel | null;
};

const DEFAULT_MAX_CARDS = 3;
const MAX_BODY_LENGTH = 220;
const MAX_IMPLICATION_LENGTH = 180;

const INSIGHT_CATEGORIES: InsightCategory[] = [
  {
    id: "platform-risk",
    title: "Platform Risk",
    keywords: ["platform", "channel", "mix", "concentration", "dependency", "dependence", "youtube", "tiktok", "instagram"],
  },
  {
    id: "revenue-momentum",
    title: "Revenue Momentum",
    keywords: ["revenue", "sales", "margin", "pricing", "monetization", "arpu", "income"],
  },
  {
    id: "subscriber-churn-risk",
    title: "Subscriber Churn Risk",
    keywords: ["subscriber", "subscribers", "retention", "churn", "renewal", "cancel", "cohort"],
  },
  {
    id: "creator-stability",
    title: "Creator Stability",
    keywords: ["stability", "volatile", "volatility", "variance", "consistency", "predictable", "predictability"],
  },
  {
    id: "business-signal",
    title: "Business Signal",
    keywords: [],
  },
];

const PRIORITY_CATEGORY_ORDER: InsightCategoryId[] = ["platform-risk", "revenue-momentum", "subscriber-churn-risk"];

const POSITIVE_HINTS = [
  "improved",
  "improving",
  "strong",
  "healthy",
  "growth",
  "growing",
  "upward",
  "expansion",
  "eased",
  "moderating",
  "stabilizing",
  "resilient",
  "opportunity",
];

const WARNING_HINTS = [
  "risk",
  "decline",
  "declining",
  "drop",
  "falling",
  "downside",
  "volatile",
  "volatility",
  "concentration",
  "overdepend",
  "churn",
  "pressure",
  "headwind",
  "slowdown",
  "slowing",
  "stall",
  "warning",
  "exposure",
];

function uniqueNonEmpty(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function countMatches(text: string, hints: string[]): number {
  const normalized = text.toLowerCase();
  let count = 0;
  for (const hint of hints) {
    if (normalized.includes(hint)) {
      count += 1;
    }
  }

  return count;
}

function resolveVariant(signal: string): DashboardInsightVariant {
  const warningMatches = countMatches(signal, WARNING_HINTS);
  const positiveMatches = countMatches(signal, POSITIVE_HINTS);

  if (warningMatches > positiveMatches) {
    return "warning";
  }

  if (positiveMatches > warningMatches) {
    return "positive";
  }

  return "neutral";
}

function resolveCategory(signal: string): InsightCategory {
  const normalized = signal.toLowerCase();
  let winner = INSIGHT_CATEGORIES[INSIGHT_CATEGORIES.length - 1];
  let bestScore = 0;

  for (const category of INSIGHT_CATEGORIES) {
    if (category.keywords.length === 0) {
      continue;
    }

    let score = 0;
    for (const keyword of category.keywords) {
      if (normalized.includes(keyword)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      winner = category;
      bestScore = score;
    }
  }

  return winner;
}

function clampCopy(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function implicationFor(candidate: InsightCandidate): string {
  if (candidate.truth?.recommendationMode === "validate") {
    return "Suggested next check: validate the underlying evidence before acting on this signal.";
  }

  if (candidate.truth?.recommendationMode === "watch") {
    return "Suggested next check: watch this signal next cycle before making a larger move.";
  }

  if (candidate.truth && getTruthStateLabel(candidate.truth)) {
    return getTruthStateDescription(candidate.truth) ?? "Treat this as a limited-evidence signal until the next report confirms it.";
  }

  if (candidate.category.id === "platform-risk") {
    if (candidate.variant === "warning") {
      return "If one platform changes quickly, your revenue can swing quickly too. Diversifying lowers that risk.";
    }

    if (candidate.variant === "positive") {
      return "A healthier channel mix helps protect your business if any single platform shifts.";
    }

    return "Keep an eye on channel concentration so platform changes never catch you off guard.";
  }

  if (candidate.category.id === "revenue-momentum") {
    if (candidate.variant === "warning") {
      return "Revenue momentum may soften if this trend continues, so this is worth addressing early.";
    }

    if (candidate.variant === "positive") {
      return "This is a constructive signal. Keep reinforcing the drivers behind this momentum.";
    }

    return "Track this weekly so you can spot shifts before they affect upcoming plans.";
  }

  if (candidate.category.id === "subscriber-churn-risk") {
    if (candidate.variant === "warning") {
      return "If churn pressure builds, recurring revenue gets less predictable. Retention actions should stay near term.";
    }

    if (candidate.variant === "positive") {
      return "Steadier retention supports more predictable growth and easier planning.";
    }

    return "Monitor subscriber behavior over time to protect recurring revenue quality.";
  }

  if (candidate.category.id === "creator-stability") {
    if (candidate.variant === "warning") {
      return "Higher volatility makes planning harder, so reducing sudden swings can improve confidence in decisions.";
    }

    if (candidate.variant === "positive") {
      return "Improving stability gives you a stronger base for growth decisions.";
    }

    return "Consistency trends are useful to watch as you plan the next quarter.";
  }

  if (candidate.variant === "warning") {
    return "This looks like an early caution signal, so it is worth acting before it compounds.";
  }

  if (candidate.variant === "positive") {
    return "This is a constructive signal. Keep building on what is working.";
  }

  return "Keep this in view as new data arrives so the trend direction stays clear.";
}

function rankCandidates(candidates: InsightCandidate[]): InsightCandidate[] {
  const ordered: InsightCandidate[] = [];
  const used = new Set<number>();

  for (const categoryId of PRIORITY_CATEGORY_ORDER) {
    const match = candidates.find((candidate) => candidate.category.id === categoryId && !used.has(candidate.sourceIndex));
    if (!match) {
      continue;
    }

    ordered.push(match);
    used.add(match.sourceIndex);
  }

  const remaining = candidates
    .filter((candidate) => !used.has(candidate.sourceIndex))
    .sort((left, right) => left.sourceIndex - right.sourceIndex);
  ordered.push(...remaining);
  return ordered;
}

function buildCard(candidate: InsightCandidate, cardIndex: number): DashboardInsightCard {
  const implication = clampCopy(implicationFor(candidate), MAX_IMPLICATION_LENGTH);
  const stateLabel = candidate.truth ? getTruthStateLabel(candidate.truth) : null;

  return {
    id: candidate.id || `insight-${candidate.category.id}-${cardIndex + 1}`,
    variant: candidate.variant,
    title: candidate.category.title,
    body: clampCopy(candidate.signal, MAX_BODY_LENGTH),
    implication,
    stateLabel,
    stateTone: stateLabel && candidate.truth ? getTruthStateTone(candidate.truth) : null,
    stateDetail: candidate.truth ? getTruthStateDescription(candidate.truth) : null,
  };
}

function typedCandidates(signals: ReportSignalViewModel[] | null | undefined): InsightCandidate[] {
  if (!Array.isArray(signals)) {
    return [];
  }

  const candidates = signals
    .map((signal, sourceIndex) => {
      const body = signal.description ?? signal.title;
      const trimmed = body.trim();
      if (!trimmed) {
        return null;
      }

      const analysisText = [signal.title, signal.description, signal.category, signal.signalType].filter(Boolean).join(" ");
      return {
        id: signal.id,
        signal: trimmed,
        category: resolveCategory(analysisText || trimmed),
        variant: resolveVariant(analysisText || trimmed),
        sourceIndex,
        truth: signal,
      };
    })
    .filter((entry) => entry !== null) as InsightCandidate[];

  return candidates;
}

function stringCandidates(keySignals: string[] | null | undefined, offset: number): InsightCandidate[] {
  return uniqueNonEmpty(keySignals).map((signal, index) => ({
    id: `insight-fallback-${index + 1}`,
    signal,
    category: resolveCategory(signal),
    variant: resolveVariant(signal),
    sourceIndex: offset + index,
    truth: null,
  }));
}

export function buildDashboardInsights(input: BuildDashboardInsightsInput): DashboardInsightCard[] {
  const maxCards = Math.max(0, Math.trunc(input.maxCards ?? DEFAULT_MAX_CARDS));
  if (maxCards === 0) {
    return [];
  }

  const typed = typedCandidates(input.signals);
  const typedBodies = new Set(typed.map((candidate) => candidate.signal.toLowerCase()));
  const fallback = stringCandidates(
    uniqueNonEmpty(input.keySignals).filter((signal) => !typedBodies.has(signal.toLowerCase())),
    typed.length,
  );
  const candidates = [...typed, ...fallback];
  if (candidates.length === 0) {
    return [];
  }

  return rankCandidates(candidates)
    .slice(0, maxCards)
    .map((candidate, index) => buildCard(candidate, index));
}
