import { marketingCtas, pricingPlans } from "@earnsigma/config";
import { Badge, Card, CardContent, CardFooter, CardHeader, Container, Section, buttonClassName } from "@earnsigma/ui";
import { MarketingShell } from "../_components/marketing-shell";
import { appBaseUrl, stripeCancelUrl, stripeSuccessUrl } from "@/src/lib/urls";

function cadenceLabel(cadence: "forever" | "one_time" | "monthly"): string {
  if (cadence === "monthly") {
    return "/month";
  }

  if (cadence === "one_time") {
    return " one-time";
  }

  return "";
}

export default function PricingPage() {
  return (
    <MarketingShell>
      <Section>
        <Container>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Pricing</h1>
          <p className="mt-4 text-brand-text-secondary">Launch plans for founders and creator teams.</p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => {
              const isFeatured = plan.emphasis === "featured";

              return (
                <Card key={plan.key} className={isFeatured ? "border-brand-border-strong bg-brand-panel-muted/80 shadow-brand-glow" : undefined}>
                  <CardHeader>
                    <div>
                      <h2 className="text-2xl font-semibold">{plan.name}</h2>
                      <p className="mt-2 text-3xl font-bold tracking-tight">
                        {plan.price}
                        <span className="text-base font-medium text-brand-text-secondary">{cadenceLabel(plan.cadence)}</span>
                      </p>
                    </div>
                    {plan.badge ? <Badge variant={isFeatured ? "accent" : "neutral"}>{plan.badge}</Badge> : null}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-sm text-brand-text-secondary">{plan.description}</p>
                    {plan.anchorPrice ? (
                      <p className="text-xs text-brand-text-muted">
                        Normally {plan.anchorPrice}. {plan.priceNote}
                      </p>
                    ) : null}
                    <ul className="space-y-2 text-sm text-brand-text-secondary">
                      {plan.features.map((detail) => (
                        <li key={detail}>- {detail}</li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <a
                      href={`${appBaseUrl}${marketingCtas.startTrial.appPath}`}
                      className={buttonClassName({ variant: "primary" })}
                    >
                      {plan.ctaLabel}
                    </a>
                    {plan.footnote ? <p className="mt-3 text-xs text-brand-text-muted">{plan.footnote}</p> : null}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <p className="mt-10 text-xs text-brand-text-muted">
            Checkout return URLs are configured for this environment: success {stripeSuccessUrl} and cancel {stripeCancelUrl}
          </p>
        </Container>
      </Section>
    </MarketingShell>
  );
}
