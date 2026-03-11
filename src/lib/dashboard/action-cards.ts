import type { EntitlementsResponse } from "../api/entitlements";
import type { AppGateState } from "../gating/app-gate";
import { hasProEquivalentEntitlement, isProEquivalentPlanTier, resolveEffectivePlanTier } from "../entitlements/model";

export type DashboardActionCardsMode = "unlocked" | "locked" | "loading";

export type DashboardActionCard = {
  id: string;
  body: string;
};

export type DashboardActionCardsViewModel = {
  mode: DashboardActionCardsMode;
  cards: DashboardActionCard[];
};

export type BuildDashboardActionCardsViewModelInput = {
  gateState: AppGateState;
  entitlements: EntitlementsResponse | null;
  recommendedActions: string[] | null | undefined;
  fallbackActions?: string[] | null;
  maxCards?: number;
};

const DEFAULT_MAX_CARDS = 2;
const DEFAULT_PRO_ACTIONS = [
  "Prioritize one retention experiment this week and track the weekly net revenue impact.",
  "Review subscriber behavior by cohort and tune lifecycle messaging for the highest-churn segment.",
];

export function isProPlan(entitlements: EntitlementsResponse | null): boolean {
  if (!entitlements) {
    return false;
  }

  return isProEquivalentPlanTier(resolveEffectivePlanTier(entitlements));
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

export function buildDashboardActionCardsViewModel(input: BuildDashboardActionCardsViewModelInput): DashboardActionCardsViewModel {
  const mode = resolveMode(input.gateState, input.entitlements);
  if (mode !== "unlocked") {
    return {
      mode,
      cards: [],
    };
  }

  const maxCards = resolveMaxCards(input.maxCards);
  const recommended = normalizeCards(input.recommendedActions);
  const fallback = normalizeCards(input.fallbackActions ?? DEFAULT_PRO_ACTIONS);
  const selected = (recommended.length > 0 ? recommended : fallback).slice(0, maxCards);

  return {
    mode,
    cards: selected.map((body, index) => ({
      id: `action-card-${index + 1}`,
      body,
    })),
  };
}
