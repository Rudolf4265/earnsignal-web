import type { Metadata } from "next";
import { marketingCtas, publicUrls } from "@earnsigma/config";
import { Badge, Container, Section, buttonClassName } from "@earnsigma/ui";
import { MarketingDataRevealsSection, MarketingTwoLensesSection } from "../_components/marketing-sections";
import { MarketingShell } from "../_components/marketing-shell";
import { appBaseUrl } from "@/src/lib/urls";

export const metadata: Metadata = {
  title: "Features - EarnSigma",
  description:
    "See what EarnSigma helps creators understand, from subscriber loss and income concentration to audience momentum and next actions.",
};

const reportCtaHref = `${appBaseUrl}${marketingCtas.startTrial.appPath}?plan=report`;

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <Section className="relative overflow-hidden pb-16 pt-16 sm:pb-20 sm:pt-20" data-testid="marketing-features-page">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_50%_0%,rgba(29,78,216,0.18),rgba(9,18,35,0))]"
          aria-hidden="true"
        />
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="accent"
              className="border-brand-border-strong/65 bg-brand-panel/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-brand-accent-blue"
            >
              FEATURES
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-[2.5rem] sm:leading-[1.1]">
              See what EarnSigma actually helps you understand
            </h1>
            <p className="mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
              From subscriber loss and income concentration to growth signals and next actions &mdash; this is your
              business, clearly explained.
            </p>
          </div>
        </Container>
      </Section>

      <MarketingDataRevealsSection />

      <Section className="border-t border-brand-border/55 py-10 sm:py-12" data-testid="marketing-features-mid-cta">
        <Container>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              Start with your own data and see where the business is strongest, where it is exposed, and what to do next.
            </p>
            <a
              href={reportCtaHref}
              className={buttonClassName({
                variant: "primary",
                className:
                  "rounded-xl border-brand-accent-emerald/50 bg-[linear-gradient(120deg,rgba(29,78,216,0.98),rgba(47,217,197,0.9))] px-6 py-3 text-sm font-semibold text-white shadow-brand-glow hover:border-brand-accent-emerald/70 hover:brightness-110 sm:px-7 sm:py-3.5",
              })}
            >
              Start with your first report
            </a>
          </div>
        </Container>
      </Section>

      <MarketingTwoLensesSection />

      <Section className="border-t border-brand-border/55 pb-20 pt-16 sm:pb-24 sm:pt-20">
        <Container>
          <div className="mx-auto max-w-3xl rounded-2xl border border-brand-border/65 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-7 text-center sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">NEXT STEP</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
              Turn your data into a private business diagnosis
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary sm:text-base">
              Start with your own platform data, then choose the report or plan that fits how deeply you want to track the business.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
              <a
                href={reportCtaHref}
                className={buttonClassName({
                  variant: "primary",
                  className:
                    "rounded-xl border-brand-accent-emerald/50 bg-[linear-gradient(120deg,rgba(29,78,216,0.98),rgba(47,217,197,0.9))] px-6 py-3 text-sm font-semibold text-white shadow-brand-glow hover:border-brand-accent-emerald/70 hover:brightness-110 sm:px-7 sm:py-3.5",
                })}
              >
                Generate My Private Report
              </a>
              <a
                href={publicUrls.pricing}
                className={buttonClassName({
                  variant: "secondary",
                  className:
                    "rounded-xl border-brand-border-strong/70 bg-brand-panel/70 px-5 py-3 text-sm text-brand-text-secondary hover:bg-brand-panel hover:text-white sm:px-6",
                })}
              >
                See Pricing
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </MarketingShell>
  );
}
