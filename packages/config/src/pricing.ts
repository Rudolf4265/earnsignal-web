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
    description: "Upload data, validate exports, and preview limited signals before you buy.",
    features: ["Upload creator earnings data", "CSV validation and teaser preview", "Limited dashboard context"],
    ctaLabel: "Start free",
    emphasis: "default",
  },
  {
    key: "report",
    name: "Report",
    price: "$79",
    cadence: "one_time",
    badge: "One-time",
    description: "Buy a single report for one upload and keep access to that owned report.",
    features: ["One purchased report", "View and download the owned PDF", "Report detail context tied to that purchase"],
    ctaLabel: "Buy report",
    emphasis: "default",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$59",
    cadence: "monthly",
    description: "Recurring access for report history, dashboard intelligence, and monitoring-oriented surfaces.",
    features: ["Recurring report history", "Dashboard intelligence access", "Monitoring-oriented Pro surfaces"],
    ctaLabel: "Start Pro",
    badge: "Most popular",
    emphasis: "featured",
  },
];
