import type { EntitlementsResponse } from "../api/entitlements";
import type { AppGateState } from "../gating/app-gate";
import { hasProEquivalentEntitlement } from "../entitlements/model.ts";
import type {
  ReportDiagnosisViewModel,
  ReportRecommendationViewModel,
  ReportWhatChangedViewModel,
} from "../report/normalize-artifact-to-report-model";
import { prioritizeRecommendations } from "../report/recommendation-prioritization";
import { getTruthStateDescription, getTruthStateLabel, getTruthStateTone, type ReportTruthTone } from "../report/truth.ts";

export type DashboardActionCardsMode = "unlocked" | "locked" | "loading";

export type DashboardActionCard = {
  id: string;
  label: string;
  body: string;
  detail: string | null;
  stateLabel: string | null;
  stateTone: ReportTruthTone | null;
};

export type DashboardActionCardsViewModel = {
  mode: DashboardActionCardsMode;
  cards: DashboardActionCard[];
};

export type BuildDashboardActionCardsViewModelInput = {
  gateState: AppGateState;
  entitlements: EntitlementsResponse | null;
  recommendedActions: string[] | null | undefined;
  recommendationItems?: ReportRecommendationViewModel[] | null;
  diagnosis?: ReportDiagnosisViewModel | null;
  whatChanged?: ReportWhatChangedViewModel | null;
  fallbackActions?: string[] | null;
  maxCards?: number;
};

const DEFAULT_MAX_CARDS = 2;
const DEFAULT_PRO_ACTIONS = [
  "Prioritize one retention experiment this week and track the weekly net revenue impact.",
  "Review subscriber behavior by cohort and tune lifecycle messaging for the highest-churn segment.",
];

export function isProPlan(entitlements: EntitlementsResponse | null): boolean {
  return hasProEquivalentEntitlement(entitlements);
}

function resolveMode(gateState: AppGateState, entitlements: EntitlementsResponse | null): DashboardActionCardsMode {
  if (
    gateState === "session_loading" ||
    gateState === "authed_loading_entitlements" ||
    gateState === "anon" ||
    gateState === "session_expired" ||
    gateState === "entitlements_error" ||
    entitlements === null
  ) {
    return "loading";
  }

  const hasProRecommendationsAccess = hasProEquivalentEntitlement(entitlements);
  return hasProRecommendationsAccess ? "unlocked" : "locked";
}

function normalizeCards(values: string[] | null | undefined): string[] {
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

    const dedupeKey = trimmed.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    result.push(trimmed);
  }

  return result;
}

function resolveMaxCards(maxCards: number | null | undefined): number {
  if (typeof maxCards !== "number" || !Number.isFinite(maxCards)) {
    return DEFAULT_MAX_CARDS;
  }

  return Math.max(1, Math.min(DEFAULT_MAX_CARDS, Math.trunc(maxCards)));
}

function toTypedCards(recommendationItems: ReportRecommendationViewModel[], maxCards: number): DashboardActionCard[] {
  return recommendationItems.slice(0, maxCards).map((recommendation, index) => {
    const label =
      recommendation.recommendationMode === "validate"
        ? "Validate first"
        : recommendation.recommendationMode === "watch"
          ? "Watch next cycle"
          : "Recommended action";
    const stateLabel =
      recommendation.recommendationMode === "action"
        ? getTruthStateLabel(recommendation)
        : getTruthStateLabel(recommendation) && getTruthStateLabel(recommendation) !== label
          ? getTruthStateLabel(recommendation)
          : null;

    return {
      id: recommendation.id || `action-card-${index + 1}`,
      label,
      body: recommendation.title,
      detail: getTruthStateDescription(recommendation) ?? recommendation.description ?? recommendation.steps[0] ?? null,
      stateLabel,
      stateTone: stateLabel ? getTruthStateTone(recommendation) : null,
    };
  });
}

export function buildDashboardActionCardsViewModel(input: BuildDashboardActionCardsViewModelInput): DashboardActionCardsViewModel {
  const mode = resolveMode(input.gateState, input.entitlements);
  if (mode !== "unlocked") {
    return {
      mode,
      cards: [],
    };
  }

  const maxCards = resolveMaxCards(input.maxCards);
  const typedItems = Array.isArray(input.recommendationItems)
    ? input.recommendationItems.filter((item) => typeof item?.title === "string" && item.title.trim().length > 0)
    : [];
  if (typedItems.length > 0) {
    const prioritizedItems = prioritizeRecommendations(typedItems, {
      diagnosis: input.diagnosis ?? null,
      whatChanged: input.whatChanged ?? null,
    });
    return {
      mode,
      cards: toTypedCards(prioritizedItems, maxCards),
    };
  }

  const recommended = normalizeCards(input.recommendedActions);
  const fallback = normalizeCards(input.fallbackActions ?? DEFAULT_PRO_ACTIONS);
  const selected = (recommended.length > 0 ? recommended : fallback).slice(0, maxCards);

  return {
    mode,
    cards: selected.map((body, index) => ({
      id: `action-card-${index + 1}`,
      label: `Recommendation ${index + 1}`,
      body,
      detail: null,
      stateLabel: null,
      stateTone: null,
    })),
  };
}
