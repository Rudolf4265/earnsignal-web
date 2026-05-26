export type PricingPlanKey = "free" | "report" | "pro";
export type PricingCadence = "forever" | "one_time" | "monthly";
export type PricingEmphasis = "default" | "featured";

export type PricingPlan = {
  key: PricingPlanKey;
  name: string;
  price: string;
  cadence: PricingCadence;
  priceNote?: string;
  badge?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  emphasis?: PricingEmphasis;
  anchorPrice?: string;
  footnote?: string;
};

export const pricingPlans: PricingPlan[] = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Confirm your data is usable and see whether your workspace is report-ready. No report included.",
    features: ["Upload creator data", "Validate data format and readiness", "Signal teaser preview", "No paid report access"],
    ctaLabel: "Start free",
    emphasis: "default",
  },
  {
    key: "report",
    name: "Report",
    price: "$25",
    cadence: "one_time",
    badge: "Launch pricing",
    anchorPrice: "$79",
    priceNote: "one-time",
    footnote: "Launch pricing while we improve EarnSigma with creator feedback.",
    description: "One complete business diagnosis from your data — full report, health scores, downloadable PDF, yours to keep.",
    features: [
      "One complete business diagnosis from your data",
      "Revenue concentration and health scores",
      "Owned access and downloadable PDF",
      "Preview of your biggest opportunity and top risk",
    ],
    ctaLabel: "Buy report",
    emphasis: "default",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$59",
    cadence: "monthly",
    description: "Everything in Report — plus your full advisor analysis, unlimited report runs, and ongoing visibility as your business evolves.",
    features: [
      "Everything in Report",
      "Biggest opportunity + top risk, fully unlocked",
      "Strengths, risks, and next 3 recommended actions",
      "Unlimited fresh report runs",
      "Platform income monitoring (TikTok, IG, and more)",
      "Full history, trend tracking, period comparisons",
      "Ongoing dashboard monitoring",
    ],
    ctaLabel: "Start Pro",
    badge: "Most popular",
    emphasis: "featured",
  },
];

export function getPricingPlan(planKey: PricingPlanKey): PricingPlan {
  const plan = pricingPlans.find((entry) => entry.key === planKey);

  if (!plan) {
    throw new Error(`Unknown pricing plan: ${planKey}`);
  }

  return plan;
}

export function formatPricingPlanPrice(plan: PricingPlan): string {
  if (plan.cadence === "one_time") {
    return `${plan.price} one-time`;
  }

  if (plan.cadence === "monthly") {
    return `${plan.price} / month`;
  }

  return plan.price;
}
