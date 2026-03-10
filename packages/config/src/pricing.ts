export type PricingPlanKey = "free" | "founder_creator_report" | "creator_pro";
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
    description: "Start exploring your workspace with baseline access and no subscription.",
    features: ["Workspace access", "Starter onboarding", "Basic account controls"],
    ctaLabel: "Start free",
    emphasis: "default",
  },
  {
    key: "founder_creator_report",
    name: "Founder Creator Report",
    price: "$25",
    cadence: "one_time",
    priceNote: "Launch pricing for the first 60 days",
    badge: "Launch pricing",
    description: "A one-time premium report for founders who need a fast strategic baseline.",
    features: ["One founder-grade creator report", "Revenue structure summary", "Recommended next actions"],
    ctaLabel: "Unlock founder report",
    emphasis: "default",
    anchorPrice: "$49",
    footnote: "Normally $49. Launch pricing available for the first 60 days.",
  },
  {
    key: "creator_pro",
    name: "Creator Pro",
    price: "$39",
    cadence: "monthly",
    description: "Continuous reporting and deeper signals for teams operating at production pace.",
    features: ["Monthly creator intelligence reports", "Advanced trend and churn visibility", "Priority product updates"],
    ctaLabel: "Start Creator Pro",
    badge: "Most popular",
    emphasis: "featured",
  },
];
