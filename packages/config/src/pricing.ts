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
    description: "One focused 3-month creator business diagnostic from your staged workspace sources. Full diagnosis, owned report access, and PDF download.",
    features: [
      "One combined report from staged workspace sources",
      "Focused 3-month analysis window",
      "Biggest opportunity and platform risk",
      "Strengths, risks, and next 3 actions",
      "Owned report access and downloadable PDF",
    ],
    ctaLabel: "Buy report",
    emphasis: "default",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$59",
    cadence: "monthly",
    description: "Everything in Report, plus full-history analysis, report history, comparisons, and ongoing intelligence across fresh workspace runs.",
    features: [
      "All Report features included",
      "Full-history analysis across eligible uploads",
      "Report history and period comparisons",
      "Dashboard intelligence and monitoring",
      "Continuous creator business tracking",
    ],
    ctaLabel: "Start Pro",
    badge: "Most popular",
    emphasis: "featured",
  },
];
