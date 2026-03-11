export type BillingPlanId = "basic" | "pro";

export const BASIC_PLAN_ALIASES = new Set(["basic", "plan_a", "free", "starter"]);
export const PRO_PLAN_ALIASES = new Set(["pro", "plan_b", "creator_pro", "founder_creator_report", "founder", "protected_paid", "paid_equivalent"]);

export type BillingPlanCardVariant =
  | "basic_selectable"
  | "pro_selectable"
  | "basic_current"
  | "pro_current_active"
  | "pro_current_inactive";

export type BillingPlanCardViewModel = {
  isCurrent: boolean;
  variant: BillingPlanCardVariant;
  cardClassName: string;
  titleClassName: string;
  bodyClassName: string;
  highlightsClassName: string;
  badgeClassName: string;
  ctaLabel: string;
  ctaVariant: "primary" | "secondary";
  ctaClassName: string;
  checkoutDisabled: boolean;
};

type BuildBillingPlanCardViewModelInput = {
  planId: BillingPlanId;
  planLabel: string;
  activePlanTier: string | null | undefined;
  isActive: boolean;
  allowCheckout: boolean;
};

type BillingPlanCardStyle = {
  cardClassName: string;
  titleClassName: string;
  bodyClassName: string;
  highlightsClassName: string;
  badgeClassName: string;
};

const CARD_BASE_CLASS_NAME = "space-y-4 rounded-2xl border p-6 transition duration-200";

const CURRENT_PLAN_BUTTON_CLASS_NAME =
  "border-emerald-300/45 bg-emerald-500/15 text-emerald-100 hover:border-emerald-300/45 hover:bg-emerald-500/15 disabled:opacity-100";
const BASIC_BUTTON_CLASS_NAME = "disabled:opacity-70";
const PRO_BUTTON_CLASS_NAME = "shadow-brand-glow disabled:opacity-70";

const CARD_STYLE_BY_VARIANT: Record<BillingPlanCardVariant, BillingPlanCardStyle> = {
  basic_selectable: {
    cardClassName: "border-brand-border bg-brand-panel shadow-brand-card",
    titleClassName: "text-brand-text-primary",
    bodyClassName: "text-brand-text-secondary",
    highlightsClassName: "text-brand-text-secondary",
    badgeClassName: "rounded-full border border-brand-border bg-brand-panel-muted px-2 py-0.5 text-[11px] font-medium text-brand-text-secondary",
  },
  pro_selectable: {
    cardClassName: "border-brand-border bg-[linear-gradient(160deg,rgba(59,130,246,0.14)_0%,rgba(16,32,67,0.98)_52%,rgba(12,25,51,0.99)_100%)] shadow-brand-card",
    titleClassName: "text-brand-text-primary",
    bodyClassName: "text-brand-text-secondary",
    highlightsClassName: "text-brand-text-secondary",
    badgeClassName: "rounded-full border border-brand-border bg-brand-panel-muted px-2 py-0.5 text-[11px] font-medium text-brand-text-secondary",
  },
  basic_current: {
    cardClassName: "border-brand-border-strong bg-brand-panel-muted shadow-brand-card ring-1 ring-brand-border-strong",
    titleClassName: "text-brand-text-primary",
    bodyClassName: "text-brand-text-secondary",
    highlightsClassName: "text-brand-text-secondary",
    badgeClassName: "rounded-full border border-brand-border-strong bg-brand-panel px-2 py-0.5 text-[11px] font-medium text-brand-text-primary",
  },
  pro_current_active: {
    cardClassName:
      "border-brand-accent-blue bg-[linear-gradient(165deg,rgba(59,130,246,0.38)_0%,rgba(29,78,216,0.22)_34%,rgba(16,32,67,0.98)_66%,rgba(7,18,37,0.99)_100%)] shadow-brand-glow ring-1 ring-brand-accent-blue",
    titleClassName: "text-white",
    bodyClassName: "text-brand-text-primary",
    highlightsClassName: "text-brand-text-primary",
    badgeClassName: "rounded-full border border-emerald-300/45 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-100",
  },
  pro_current_inactive: {
    cardClassName:
      "border-amber-300/40 bg-[linear-gradient(165deg,rgba(217,119,6,0.22)_0%,rgba(16,32,67,0.99)_58%,rgba(7,18,37,0.99)_100%)] shadow-brand-card ring-1 ring-amber-300/40",
    titleClassName: "text-brand-text-primary",
    bodyClassName: "text-brand-text-secondary",
    highlightsClassName: "text-brand-text-secondary",
    badgeClassName: "rounded-full border border-amber-300/50 bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-amber-100",
  },
};

function normalizePlanTier(planTier: string | null | undefined): string {
  return String(planTier ?? "").trim().toLowerCase();
}

export function formatPlanLabel(planTier: string | null | undefined): string {
  const normalized = normalizePlanTier(planTier);
  if (!normalized || normalized === "none") {
    return "None";
  }

  if (BASIC_PLAN_ALIASES.has(normalized)) {
    return "Basic";
  }

  if (PRO_PLAN_ALIASES.has(normalized)) {
    return "Pro";
  }

  return normalized;
}

export function isCurrentPlan(planId: BillingPlanId, planTier: string | null | undefined): boolean {
  const normalized = normalizePlanTier(planTier);
  if (!normalized) {
    return false;
  }

  if (planId === "basic") {
    return BASIC_PLAN_ALIASES.has(normalized);
  }

  return PRO_PLAN_ALIASES.has(normalized);
}

export function resolveBillingPlanCardVariant({
  planId,
  activePlanTier,
  isActive,
}: {
  planId: BillingPlanId;
  activePlanTier: string | null | undefined;
  isActive: boolean;
}): BillingPlanCardVariant {
  const current = isCurrentPlan(planId, activePlanTier);
  if (!current) {
    return planId === "pro" ? "pro_selectable" : "basic_selectable";
  }

  if (planId === "basic") {
    return "basic_current";
  }

  return isActive ? "pro_current_active" : "pro_current_inactive";
}

export function buildBillingPlanCardViewModel({
  planId,
  planLabel,
  activePlanTier,
  isActive,
  allowCheckout,
}: BuildBillingPlanCardViewModelInput): BillingPlanCardViewModel {
  const isCurrent = isCurrentPlan(planId, activePlanTier);
  const variant = resolveBillingPlanCardVariant({ planId, activePlanTier, isActive });
  const currentPlanActive = isCurrent && isActive;
  const style = CARD_STYLE_BY_VARIANT[variant];

  return {
    isCurrent,
    variant,
    cardClassName: `${CARD_BASE_CLASS_NAME} ${style.cardClassName}`,
    titleClassName: style.titleClassName,
    bodyClassName: style.bodyClassName,
    highlightsClassName: style.highlightsClassName,
    badgeClassName: style.badgeClassName,
    ctaLabel: currentPlanActive ? `${planLabel} active` : `Choose ${planLabel}`,
    ctaVariant: planId === "pro" && !currentPlanActive ? "primary" : "secondary",
    ctaClassName: currentPlanActive ? CURRENT_PLAN_BUTTON_CLASS_NAME : planId === "pro" ? PRO_BUTTON_CLASS_NAME : BASIC_BUTTON_CLASS_NAME,
    checkoutDisabled: !allowCheckout || currentPlanActive,
  };
}
