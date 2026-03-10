import { BRAND } from "@earnsigma/brand";
import { marketingCtas, pricingPlans, type PricingPlanKey } from "@earnsigma/config";
import { Badge, Card, CardContent, CardFooter, CardHeader, Container, Section, buttonClassName } from "@earnsigma/ui";
import { MarketingShell } from "../_components/marketing-shell";
import { appBaseUrl } from "@/src/lib/urls";

type PricingCardCopy = {
  title: string;
  description: string;
  helperText?: string;
  badge?: string;
  anchorPrice?: string;
  features: string[];
  ctaLabel: string;
  footnote?: string;
};

type ComparisonAvailability = Record<PricingPlanKey, boolean>;

const orderedPlanKeys: PricingPlanKey[] = ["free", "founder_creator_report", "creator_pro"];

const pricingCardCopy: Record<PricingPlanKey, PricingCardCopy> = {
  free: {
    title: "Free",
    description: "Best for exploring your data",
    features: [
      "Upload creator earnings data",
      "Basic dashboard insights",
      "Revenue trends",
      "Platform breakdown",
      "Preview optimization signals",
    ],
    ctaLabel: "Start Free",
  },
  founder_creator_report: {
    title: "Founder Creator Report",
    description: "Limited launch pricing",
    helperText: "Used by early creators to identify new revenue opportunities",
    badge: "Most Popular",
    anchorPrice: "$49",
    features: [
      "Full Creator Optimization PDF",
      "Revenue growth opportunities",
      "Churn risk analysis",
      "Platform dependence insights",
      "Tier pricing optimization",
      "Narrative insights & strategy",
    ],
    ctaLabel: "Generate My Report",
    footnote: "Launch price for first 60 days",
  },
  creator_pro: {
    title: "Creator Pro",
    description: "For creators who want continuous optimization",
    features: [
      "Unlimited optimization reports",
      "Multi-platform insights",
      "Migration detection",
      "Dependence tracking",
      "Priority processing",
      "Monthly revenue monitoring",
    ],
    ctaLabel: "Start Pro",
  },
};

const workflowSteps = [
  "Upload Data",
  "See Free Dashboard",
  "Unlock Optimization Report",
  "Grow Revenue",
] as const;

const comparisonRows: Array<{ feature: string; availability: ComparisonAvailability }> = [
  { feature: "Upload data", availability: { free: true, founder_creator_report: true, creator_pro: true } },
  { feature: "Dashboard insights", availability: { free: true, founder_creator_report: true, creator_pro: true } },
  { feature: "Optimization report", availability: { free: false, founder_creator_report: true, creator_pro: true } },
  { feature: "Revenue recommendations", availability: { free: false, founder_creator_report: true, creator_pro: true } },
  { feature: "Multi-platform insights", availability: { free: false, founder_creator_report: true, creator_pro: true } },
  { feature: "Unlimited reports", availability: { free: false, founder_creator_report: false, creator_pro: true } },
];

function cadenceSuffix(planKey: PricingPlanKey): string {
  return planKey === "creator_pro" ? " / month" : "";
}

function planCtaHref(planKey: PricingPlanKey): string {
  return `${appBaseUrl}${marketingCtas.startTrial.appPath}?plan=${planKey}`;
}

function availabilityCellLabel(enabled: boolean): string {
  return enabled ? "Included" : "Not included";
}

export default function PricingPage() {
  const planMap = new Map(pricingPlans.map((plan) => [plan.key, plan]));
  const orderedPlans = orderedPlanKeys
    .map((planKey) => {
      const basePlan = planMap.get(planKey);
      if (!basePlan) {
        return null;
      }

      return {
        ...basePlan,
        ...pricingCardCopy[planKey],
      };
    })
    .filter((plan): plan is NonNullable<typeof plan> => plan !== null);

  return (
    <MarketingShell>
      <Section className="pb-8 pt-14 sm:pb-10 sm:pt-16">
        <Container>
          <div className="relative overflow-hidden rounded-[1.75rem] border border-brand-border-strong/70 bg-[linear-gradient(160deg,rgba(12,25,51,0.96),rgba(16,32,67,0.92),rgba(12,25,51,0.95))] px-6 py-8 shadow-brand-card sm:px-10 sm:py-10">
            <div
              className="pointer-events-none absolute -right-24 -top-28 h-56 w-56 rounded-full opacity-35 blur-3xl"
              style={{ backgroundImage: BRAND.gradientPrimary }}
            />
            <div className="relative max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Optimize Your Creator Revenue</h1>
              <p className="mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
                Upload your earnings data and get a full creator revenue analysis &mdash; including churn risks, platform dependence, and growth opportunities.
              </p>
              <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-brand-accent-teal">
                Free dashboard &bull; Founding creator pricing available
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-6 sm:py-8">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {orderedPlans.map((plan) => {
              const isFeatured = plan.key === "founder_creator_report";

              return (
                <Card
                  key={plan.key}
                  className={
                    isFeatured
                      ? "relative border-brand-accent-emerald/45 bg-[linear-gradient(165deg,rgba(16,32,67,0.96),rgba(23,49,117,0.78),rgba(5,150,105,0.16))] shadow-brand-glow md:scale-[1.02] xl:-mt-1"
                      : "border-brand-border bg-brand-panel"
                  }
                >
                  {isFeatured ? <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-accent-emerald/14 blur-3xl" /> : null}

                  <CardHeader className="relative">
                    <div>
                      <h2 className="text-2xl font-semibold">{plan.title}</h2>
                      <p className="mt-2 text-3xl font-bold tracking-tight">
                        {plan.price}
                        <span className="text-base font-medium text-brand-text-secondary">{cadenceSuffix(plan.key)}</span>
                      </p>
                      {plan.anchorPrice ? (
                        <p className="mt-1 text-sm text-brand-text-muted">
                          <span className="line-through">{plan.anchorPrice}</span>
                        </p>
                      ) : null}
                    </div>
                    {plan.badge ? <Badge variant={isFeatured ? "success" : "neutral"}>{plan.badge}</Badge> : null}
                  </CardHeader>

                  <CardContent className="relative space-y-4">
                    <p className="text-sm text-brand-text-secondary">{plan.description}</p>
                    {plan.helperText ? (
                      <p className="rounded-xl border border-brand-accent-emerald/35 bg-brand-panel/65 px-3 py-2 text-xs text-brand-text-secondary">
                        {plan.helperText}
                      </p>
                    ) : null}
                    <ul className="space-y-2 text-sm text-brand-text-secondary">
                      {plan.features.map((detail) => (
                        <li key={detail} className="flex items-start gap-2">
                          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-brand-border-strong/80 bg-brand-panel text-[11px] text-brand-accent-teal">
                            &#10003;
                          </span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="relative">
                    <a
                      href={planCtaHref(plan.key)}
                      className={buttonClassName({
                        variant: isFeatured ? "primary" : "secondary",
                        className: isFeatured
                          ? "w-full border-brand-accent-emerald/45 bg-[linear-gradient(120deg,rgba(29,78,216,0.96),rgba(47,217,197,0.88))] text-white shadow-brand-glow hover:border-brand-accent-emerald/65 hover:brightness-110"
                          : "w-full",
                      })}
                    >
                      {plan.ctaLabel}
                    </a>
                    {plan.footnote ? <p className="mt-3 text-xs text-brand-text-muted">{plan.footnote}</p> : null}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="py-8 sm:py-10">
        <Container>
          <Card className="border-brand-border-strong/70 bg-brand-panel/78">
            <h2 className="text-2xl font-semibold tracking-tight">How EarnSigma Works</h2>
            <ol className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {workflowSteps.map((step, index) => (
                <li key={step} className="contents">
                  <div className="flex flex-1 items-center gap-3 rounded-xl border border-brand-border/70 bg-brand-panel-muted/40 px-4 py-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-brand-border-strong/80 bg-brand-panel text-xs font-semibold text-brand-accent-teal">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-brand-text-secondary">{step}</span>
                  </div>
                  {index < workflowSteps.length - 1 ? <span className="hidden text-lg text-brand-text-muted md:block">&rarr;</span> : null}
                </li>
              ))}
            </ol>
          </Card>
        </Container>
      </Section>

      <Section className="py-8 sm:py-10">
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight">What&apos;s Inside the Creator Optimization Report</h2>
          <Card className="mt-6 overflow-hidden border-brand-border-strong/70 bg-brand-panel/78 p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-panel-muted/40 text-xs uppercase tracking-[0.12em] text-brand-text-muted">
                    <th className="px-4 py-3 font-semibold sm:px-6">Feature</th>
                    <th className="px-4 py-3 font-semibold sm:px-6">Free</th>
                    <th className="px-4 py-3 font-semibold sm:px-6">Report</th>
                    <th className="px-4 py-3 font-semibold sm:px-6">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.feature} className="border-b border-brand-border/70 last:border-b-0">
                      <th className="px-4 py-3 text-sm font-medium text-brand-text-secondary sm:px-6">{row.feature}</th>
                      {orderedPlanKeys.map((planKey) => {
                        const enabled = row.availability[planKey];
                        return (
                          <td key={`${row.feature}-${planKey}`} className="px-4 py-3 text-sm sm:px-6">
                            <span
                              aria-label={availabilityCellLabel(enabled)}
                              className={
                                enabled
                                  ? "inline-flex h-6 w-6 items-center justify-center rounded-full border border-brand-accent-emerald/45 bg-brand-accent-emerald/12 text-brand-accent-teal"
                                  : "inline-flex h-6 w-6 items-center justify-center rounded-full border border-brand-border/80 bg-brand-panel-muted/30 text-brand-text-muted"
                              }
                            >
                              {enabled ? <>&#10003;</> : <>&mdash;</>}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Container>
      </Section>

      <Section className="pb-16 pt-8 sm:pb-20 sm:pt-10">
        <Container>
          <Card className="relative overflow-hidden border-brand-border-strong/80 bg-[linear-gradient(160deg,rgba(16,32,67,0.95),rgba(23,49,117,0.78),rgba(16,32,67,0.95))]">
            <div
              className="pointer-events-none absolute -left-24 top-[-5.5rem] h-64 w-64 rounded-full opacity-30 blur-3xl"
              style={{ backgroundImage: BRAND.gradientPrimary }}
            />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">Start Optimizing Your Creator Revenue Today</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={planCtaHref("founder_creator_report")}
                  className={buttonClassName({
                    variant: "primary",
                    className:
                      "justify-center border-brand-accent-emerald/45 bg-[linear-gradient(120deg,rgba(29,78,216,0.96),rgba(47,217,197,0.88))] px-5 shadow-brand-glow hover:border-brand-accent-emerald/65 hover:brightness-110",
                  })}
                >
                  Generate Report
                </a>
                <a href={planCtaHref("free")} className={buttonClassName({ variant: "secondary", className: "justify-center px-5" })}>
                  Start Free
                </a>
              </div>
            </div>
          </Card>
        </Container>
      </Section>
    </MarketingShell>
  );
}
