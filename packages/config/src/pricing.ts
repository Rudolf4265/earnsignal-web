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
    description: "Upload exports, validate your data, and preview key signals. No full report included.",
    features: ["Upload creator earnings data", "CSV validation and ingestion checks", "Signal teaser preview", "No paid report access"],
    ctaLabel: "Start free",
    emphasis: "default",
  },
  {
    key: "report",
    name: "Report",
    price: "$79",
    cadence: "one_time",
    badge: "One-time",
    description: "One complete creator business report for one upload. Full diagnosis, PDF included.",
    features: [
      "Executive summary and biggest opportunity",
      "Platform mix and concentration analysis",
      "Subscriber momentum and churn signals",
      "Strengths, risks, and next 3 actions",
      "Downloadable PDF report",
    ],
    ctaLabel: "Buy report",
    emphasis: "default",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$59",
    cadence: "monthly",
    description: "Everything in Report, plus ongoing tracking, period comparisons, and monitoring.",
    features: [
      "All Report features included",
      "Recurring report history across uploads",
      "Period-over-period comparisons",
      "Dashboard intelligence and risk monitoring",
      "Pro-only analysis as it ships",
    ],
    ctaLabel: "Start Pro",
    badge: "Most popular",
    emphasis: "featured",
  },
];
