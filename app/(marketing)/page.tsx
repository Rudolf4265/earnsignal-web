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
      <Section className="pb-20 pt-16 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24">
        <Container>
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16 xl:gap-20">
            <div className="relative">
              <div className="pointer-events-none absolute -left-12 top-10 h-44 w-44 rounded-full bg-brand-accent-blue/16 blur-3xl" />
              <Badge
                variant="accent"
                className="relative border-brand-border-strong/65 bg-brand-panel/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-brand-accent-blue"
              >
                CREATOR OPTIMIZATION REPORT
              </Badge>

              <h1 className="relative mt-7 max-w-[17ch] text-4xl font-semibold leading-[1.06] tracking-[-0.025em] text-white sm:mt-8 sm:text-5xl lg:max-w-[16ch] lg:text-[3.45rem] xl:text-[3.85rem]">
                <span className="block lg:whitespace-nowrap">See What&apos;s Really Driving</span>
                <span className="block lg:whitespace-nowrap">Your Creator Revenue</span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-brand-text-secondary sm:text-lg sm:leading-8">
                Upload your creator earnings data and generate a revenue optimization report in minutes &mdash;
                revealing churn risk, tier migration, and platform dependence.
              </p>

              <div className="mt-11 flex flex-wrap items-center gap-3.5 sm:gap-4">
                <a
                  href={primaryCtaHref}
                  className={buttonClassName({
                    variant: "primary",
                    className:
                      "rounded-xl border-brand-accent-emerald/50 bg-[linear-gradient(120deg,rgba(29,78,216,0.98),rgba(47,217,197,0.9))] px-6 py-3 text-sm font-semibold text-white shadow-brand-glow hover:border-brand-accent-emerald/70 hover:brightness-110 sm:px-7 sm:py-3.5",
                  })}
                >
                  Generate My Revenue Report
                </a>
                <a
                  href={secondaryCtaHref}
                  className={buttonClassName({
                    variant: "secondary",
                    className:
                      "rounded-xl border-brand-border-strong/70 bg-brand-panel/70 px-5 py-3 text-sm text-brand-text-secondary hover:bg-brand-panel hover:text-white sm:px-6",
                  })}
                >
                  See Free Dashboard
                </a>
              </div>

              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-accent-teal/90">
                Founding creator report &mdash; $25 launch pricing
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[33rem] lg:max-w-none lg:pl-4">
              <div className="pointer-events-none absolute inset-x-2 -top-8 bottom-3 rounded-[2rem] bg-[radial-gradient(circle_at_24%_18%,rgba(29,78,216,0.28),rgba(9,18,35,0))] blur-2xl" />
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
                style={{ backgroundImage: BRAND.gradientPrimary }}
              />
              <div className="pointer-events-none absolute -left-12 bottom-2 h-44 w-44 rounded-full bg-brand-accent-teal/10 blur-3xl" />

              <Card className="relative overflow-hidden rounded-2xl border border-brand-border-strong/65 bg-[linear-gradient(162deg,rgba(12,25,51,0.96),rgba(16,32,67,0.94),rgba(10,22,44,0.97))] p-0 shadow-[0_30px_70px_-38px_rgba(13,57,142,0.92)]">
                <div className="border-b border-brand-border/70 bg-brand-panel-muted/30 px-6 py-5 sm:px-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">Report Preview</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">Revenue Diagnostics Snapshot</h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                    Preview of the insight output delivered after upload.
                  </p>
                </div>

                <div className="space-y-3.5 p-5 sm:p-6">
                  {reportSignals.map((signal) => (
                    <div
                      key={signal.label}
                      className="rounded-xl border border-brand-border/70 bg-[linear-gradient(165deg,rgba(18,36,74,0.86),rgba(14,30,62,0.78))] p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.12em] text-brand-text-muted">{signal.label}</p>
                          <p className="mt-1.5 text-base font-semibold text-white">{signal.value}</p>
                        </div>
                        <span className="inline-flex h-6 items-center rounded-full border border-brand-border-strong/55 bg-brand-panel px-2.5 text-[10px] font-medium uppercase tracking-[0.11em] text-brand-text-secondary">
                          Live
                        </span>
                      </div>
                      <p className="mt-2.5 text-sm leading-relaxed text-brand-text-secondary">{signal.detail}</p>
                      <div className="mt-3.5 h-1.5 rounded-full bg-brand-panel-muted/80">
                        <div
                          className="h-full rounded-full"
                          style={{ width: signal.meterWidth, backgroundColor: signal.meterColor }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-brand-border/65 bg-brand-panel-muted/25 px-5 py-3.5 text-xs text-brand-text-muted sm:px-6">
                  Initial analysis window: under 2 minutes
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      <Section id="features" className="relative border-t border-brand-border/60 pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
        <div
          className="pointer-events-none absolute inset-x-0 -top-px h-24 bg-[linear-gradient(to_bottom,rgba(25,72,171,0.2),rgba(10,22,44,0))]"
          aria-hidden="true"
        />
        <Container>
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">What Your Creator Optimization Report Reveals</h2>
            <p className="mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
              Unlock a personalized PDF with multiple pages of actionable insights to grow your creator revenue.
            </p>
          </div>

          <div className="mt-10 grid auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {insightCards.map((feature) => (
              <Card key={feature.title} className="flex h-full flex-col border-brand-border/75 bg-brand-panel/80 p-5 sm:p-6">
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border-strong/65 bg-brand-panel">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-accent-blue" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-white">{feature.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-brand-text-secondary">{feature.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </MarketingShell>
  );
}
