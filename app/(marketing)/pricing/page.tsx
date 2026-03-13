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
  features: string[];
  ctaLabel: string;
  footnote?: string;
};

type ComparisonAvailability = Record<PricingPlanKey, boolean>;

const orderedPlanKeys: PricingPlanKey[] = ["free", "report", "pro"];

const pricingCardCopy: Record<PricingPlanKey, PricingCardCopy> = {
  free: {
    title: "Free",
    description: "Validate data before you buy",
    features: [
      "Upload creator earnings data",
      "CSV validation and ingestion checks",
      "Teaser dashboard preview",
      "No recurring monitoring access",
    ],
    ctaLabel: "Start Free",
  },
  report: {
    title: "Report",
    description: "One-time access for one owned report",
    helperText: "Best when you need a single creator revenue report without a subscription.",
    badge: "One-time",
    features: [
      "One purchased report for one upload",
      "View and download the owned PDF",
      "Report detail context tied to that purchase",
      "Not equivalent to Pro monitoring access",
    ],
    ctaLabel: "Buy Report",
  },
  pro: {
    title: "Pro",
    description: "Recurring access for ongoing analysis",
    badge: "Most popular",
    features: [
      "Recurring report history",
      "Dashboard intelligence access",
      "Recurring monitoring-oriented surfaces",
      "Pro-only comparisons as they ship",
    ],
    ctaLabel: "Start Pro",
  },
};

const workflowSteps = ["Upload Data", "Validate for Free", "Buy Report or Start Pro", "Review Signals"] as const;

const comparisonRows: Array<{ feature: string; availability: ComparisonAvailability }> = [
  { feature: "Upload data", availability: { free: true, report: true, pro: true } },
  { feature: "Validate upload", availability: { free: true, report: true, pro: true } },
  { feature: "Teaser dashboard preview", availability: { free: true, report: true, pro: true } },
  { feature: "View purchased report", availability: { free: false, report: true, pro: true } },
  { feature: "Download purchased PDF", availability: { free: false, report: true, pro: true } },
  { feature: "Recurring monitoring access", availability: { free: false, report: false, pro: true } },
  { feature: "Pro-only comparisons", availability: { free: false, report: false, pro: true } },
];

function cadenceSuffix(planKey: PricingPlanKey): string {
  if (planKey === "pro") {
    return " / month";
  }

  if (planKey === "report") {
    return " one time";
  }

  return "";
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
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Free, Report, and Pro</h1>
              <p className="mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
                EarnSigma now follows one commercial ladder: Free for upload validation, a $79 one-time Report, and $59/month Pro for recurring access.
              </p>
              <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-brand-accent-teal">
                Free validation • $79 Report • $59/month Pro
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="py-6 sm:py-8">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {orderedPlans.map((plan) => {
              const isFeatured = plan.key === "report";

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
          <h2 className="text-2xl font-semibold tracking-tight">Capability Matrix</h2>
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
                <h2 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">Start With The Right Level of Access</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={planCtaHref("report")}
                  className={buttonClassName({
                    variant: "primary",
                    className:
                      "justify-center border-brand-accent-emerald/45 bg-[linear-gradient(120deg,rgba(29,78,216,0.96),rgba(47,217,197,0.88))] px-5 shadow-brand-glow hover:border-brand-accent-emerald/65 hover:brightness-110",
                  })}
                >
                  Buy Report
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
