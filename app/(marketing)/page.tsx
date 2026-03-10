"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BRAND } from "@earnsigma/brand";
import { marketingCtas, publicUrls } from "@earnsigma/config";
import { Badge, Card, Container, Section, buttonClassName } from "@earnsigma/ui";
import { MarketingShell } from "./_components/marketing-shell";
import { appBaseUrl } from "@/src/lib/urls";

type ReportSignal = {
  label: string;
  value: string;
  detail: string;
  meterWidth: string;
  meterColor: string;
};

type InsightCard = {
  title: string;
  description: string;
};

const reportSignals: ReportSignal[] = [
  {
    label: "Revenue Stability Score",
    value: "74 / 100",
    detail: "Resilient with moderate weekly variance.",
    meterWidth: "74%",
    meterColor: "var(--es-color-accent-emerald)",
  },
  {
    label: "Churn Risk",
    value: "Elevated in 2 tiers",
    detail: "Loss acceleration detected in mid-priced plans.",
    meterWidth: "62%",
    meterColor: "var(--es-color-accent-blue)",
  },
  {
    label: "Platform Dependence",
    value: "61% single-platform",
    detail: "Diversification opportunity identified.",
    meterWidth: "61%",
    meterColor: "var(--es-color-accent-teal)",
  },
];

const insightCards: InsightCard[] = [
  {
    title: "Churn Risk Map",
    description: "See where subscriber loss is accelerating and which tiers are vulnerable.",
  },
  {
    title: "Revenue Concentration",
    description: "Identify whether your income is stable or dependent on a few high-value supporters.",
  },
  {
    title: "Tier Migration Flow",
    description: "Understand how users move between pricing tiers and where growth stalls.",
  },
  {
    title: "Revenue Stability Score",
    description: "Measure how resilient your revenue is over time.",
  },
  {
    title: "Platform Risk",
    description: "See whether your revenue is too dependent on a single platform.",
  },
];

const primaryCtaHref = `${appBaseUrl}${marketingCtas.startTrial.appPath}?plan=founder_creator_report`;
const secondaryCtaHref = `${appBaseUrl}${marketingCtas.startTrial.appPath}?plan=free`;

export default function MarketingHomePage() {
  const router = useRouter();
  const token =
    typeof window === "undefined" ? null : localStorage.getItem("supabase.auth.token");

  useEffect(() => {
    if (token) {
      router.replace(publicUrls.appDashboardPath);
    }
  }, [router, token]);

  if (token) {
    return null;
  }

  return (
    <MarketingShell>
      <Section className="pb-16 pt-14 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-14">
            <div className="relative">
              <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-brand-accent-blue/14 blur-3xl" />
              <Badge variant="accent" className="relative border-brand-border-strong/70 bg-brand-panel/80 text-brand-text-primary">
                Creator Optimization Report
              </Badge>

              <h1 className="relative mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                <span className="block">See What&apos;s Really Driving</span>
                <span className="block">Your Creator Revenue</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-brand-text-secondary sm:text-lg">
                Upload your creator earnings data and generate a revenue optimization report in minutes &mdash;
                revealing churn risk, tier migration, and platform dependence.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
                <a
                  href={primaryCtaHref}
                  className={buttonClassName({
                    variant: "primary",
                    className:
                      "rounded-xl border-brand-accent-emerald/45 bg-[linear-gradient(120deg,rgba(29,78,216,0.96),rgba(47,217,197,0.88))] px-5 py-2.5 text-sm text-white shadow-brand-glow hover:border-brand-accent-emerald/65 hover:brightness-110 sm:px-6 sm:py-3",
                  })}
                >
                  Generate My Revenue Report
                </a>
                <a href={secondaryCtaHref} className={buttonClassName({ variant: "secondary", className: "px-5 py-2.5 sm:px-6 sm:py-3" })}>
                  See Free Dashboard
                </a>
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-[0.11em] text-brand-accent-teal">
                Founding creator report &mdash; $25 launch pricing
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div
                className="pointer-events-none absolute -right-14 -top-16 h-56 w-56 rounded-full opacity-35 blur-3xl"
                style={{ backgroundImage: BRAND.gradientPrimary }}
              />
              <Card className="relative overflow-hidden border-brand-border-strong/70 bg-[linear-gradient(162deg,rgba(12,25,51,0.95),rgba(16,32,67,0.92),rgba(10,22,44,0.96))] p-0 shadow-brand-card">
                <div className="border-b border-brand-border/65 bg-brand-panel-muted/25 px-5 py-4 sm:px-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">Report Preview</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Revenue Diagnostics Snapshot</h2>
                  <p className="mt-2 text-sm text-brand-text-secondary">Preview of the insight output delivered after upload.</p>
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  {reportSignals.map((signal) => (
                    <div key={signal.label} className="rounded-xl border border-brand-border/75 bg-brand-panel/70 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.11em] text-brand-text-muted">{signal.label}</p>
                          <p className="mt-1 text-base font-semibold text-white">{signal.value}</p>
                        </div>
                        <span className="inline-flex h-6 items-center rounded-full border border-brand-border-strong/60 bg-brand-panel px-2.5 text-[11px] font-medium uppercase tracking-[0.09em] text-brand-text-secondary">
                          Live
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-brand-text-secondary">{signal.detail}</p>
                      <div className="mt-3 h-1.5 rounded-full bg-brand-panel-muted/80">
                        <div
                          className="h-full rounded-full"
                          style={{ width: signal.meterWidth, backgroundColor: signal.meterColor }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-brand-border/65 bg-brand-panel-muted/20 px-5 py-3 text-xs text-brand-text-muted sm:px-6">
                  Initial analysis window: under 2 minutes
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      <Section id="features" className="border-t border-brand-border/60 py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">What Your Creator Optimization Report Reveals</h2>
            <p className="mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
              Unlock a personalized PDF with multiple pages of actionable insights to grow your creator revenue.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {insightCards.map((feature) => (
              <Card key={feature.title} className="border-brand-border/75 bg-brand-panel/80 p-5 sm:p-6">
                <h3 className="text-lg font-semibold tracking-tight text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">{feature.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </MarketingShell>
  );
}
