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
    price: "$79",
    cadence: "one_time",
    badge: "One-time",
    description: "One complete business diagnosis from your workspace data — full report, downloadable PDF, yours to keep.",
    features: [
      "One complete report from your workspace data",
      "Focused 3-month analysis window",
      "Biggest opportunity and platform risk",
      "Strengths, risks, and next 3 actions",
      "Owned access and downloadable PDF",
    ],
    ctaLabel: "Buy report",
    emphasis: "default",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$59",
    cadence: "monthly",
    description: "Everything in Report, plus ongoing access to track how your business changes — full history, period comparisons, and continuous monitoring.",
    features: [
      "All Report features included",
      "Full-history analysis across eligible uploads",
      "Report history and period comparisons",
      "Ongoing dashboard monitoring",
      "Track how your business evolves over time",
    ],
    ctaLabel: "Start Pro",
    badge: "Most popular",
    emphasis: "featured",
  },
];
