"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BRAND } from "@earnsigma/brand";
import { marketingCtas, publicUrls } from "@earnsigma/config";
import { Badge, Card, Container, Section, buttonClassName, cn } from "@earnsigma/ui";
import { MarketingShell } from "./_components/marketing-shell";
import { appBaseUrl } from "@/src/lib/urls";

type InsightIconKey = "churn" | "dependence" | "supporters" | "migration" | "stability" | "platform" | "opportunity";

type ReportSignal = {
  label: string;
  value: string;
  detail: string;
  meterWidth: string;
  meterColor: string;
  icon: InsightIconKey;
  badge: string;
  tone: "positive" | "warning" | "critical";
};

type DiscoverInsight = {
  title: string;
  description: string;
  signal: string;
  indicator: string;
  bars: [number, number, number, number, number, number];
  icon: InsightIconKey;
};

const reportSignals: ReportSignal[] = [
  {
    label: "Revenue Stability Score",
    value: "74 / 100",
    detail: "Healthy baseline with moderate volatility in weekly earnings.",
    meterWidth: "74%",
    meterColor: "var(--es-color-accent-emerald)",
    icon: "stability",
    badge: "Stable",
    tone: "positive",
  },
  {
    label: "Platform Dependence",
    value: "71% of revenue depends on Patreon",
    detail: "Concentration above target leaves monthly revenue exposed.",
    meterWidth: "71%",
    meterColor: "var(--es-color-accent-blue)",
    icon: "platform",
    badge: "Risk",
    tone: "warning",
  },
  {
    label: "Churn Risk",
    value: "42% of subscriber churn comes from your $8 tier",
    detail: "Most cancellations happen in the first 21 days after join.",
    meterWidth: "42%",
    meterColor: "var(--es-color-accent-emerald)",
    icon: "churn",
    badge: "Alert",
    tone: "critical",
  },
];

const discoverInsights: DiscoverInsight[] = [
  {
    title: "Where Your Subscribers Are Leaving",
    description: "Identify which tiers drive cancellations and when subscriber churn accelerates.",
    signal: "42% churn in your $8 tier",
    indicator: "Loss Concentration",
    bars: [92, 70, 46, 34, 28, 20],
    icon: "churn",
  },
  {
    title: "How Dependent You Are On Top Fans",
    description: "Measure whether your revenue is stable or concentrated among a small number of supporters.",
    signal: "Top 12 supporters drive 58% of monthly revenue",
    indicator: "Concentration",
    bars: [26, 34, 43, 57, 70, 88],
    icon: "dependence",
  },
  {
    title: "Your Top 5% of Supporters",
    description: "See whether a small group of supporters contributes a disproportionate share of revenue.",
    signal: "Top 5% currently contribute 46% of earnings",
    indicator: "High Value Segment",
    bars: [20, 24, 29, 36, 56, 76],
    icon: "supporters",
  },
  {
    title: "How Fans Move Between Tiers",
    description: "Track whether fans upgrade, downgrade, or remain stuck in lower-value tiers.",
    signal: "Upgrade flow improves after day 14 retention",
    indicator: "Tier Migration",
    bars: [24, 28, 34, 45, 56, 72],
    icon: "migration",
  },
  {
    title: "Revenue Stability Score",
    description: "Understand how resilient your revenue is over time and how volatile it may be.",
    signal: "74/100 with moderate week-to-week variance",
    indicator: "Stability",
    bars: [42, 48, 56, 66, 74, 78],
    icon: "stability",
  },
  {
    title: "Platform Dependence",
    description: "See whether your revenue relies too heavily on a single platform.",
    signal: "71% of revenue is currently tied to Patreon",
    indicator: "Platform Risk",
    bars: [78, 72, 67, 55, 40, 28],
    icon: "platform",
  },
];

const reportSectionPillars = [
  "Churn Risk Map",
  "Revenue Concentration",
  "Tier Migration Flow",
  "Revenue Stability Score",
  "Platform Risk",
];

const primaryCtaHref = `${appBaseUrl}${marketingCtas.startTrial.appPath}?plan=report`;
const secondaryCtaHref = `${appBaseUrl}${marketingCtas.startTrial.appPath}?plan=free`;

function InsightGlyph({ icon, className }: { icon: InsightIconKey; className?: string }) {
  const classes = cn("h-4 w-4", className);

  switch (icon) {
    case "churn":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={classes} aria-hidden="true">
          <path d="M12 4 3 20h18L12 4Z" />
          <path d="M12 9.5v4.5" />
          <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "dependence":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={classes} aria-hidden="true">
          <path d="M4 19V9" />
          <path d="M10 19V5" />
          <path d="M16 19v-7" />
          <path d="M22 19v-4" />
          <path d="M3 19h19" />
        </svg>
      );
    case "supporters":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={classes} aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <circle cx="18" cy="9" r="2.2" />
          <path d="M14.8 19a4.1 4.1 0 0 1 7.2 0" />
        </svg>
      );
    case "migration":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={classes} aria-hidden="true">
          <path d="M3 8h13" />
          <path d="m13 4 4 4-4 4" />
          <path d="M21 16H8" />
          <path d="m11 20-4-4 4-4" />
        </svg>
      );
    case "stability":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={classes} aria-hidden="true">
          <path d="M3 18h18" />
          <path d="M4 15.5 8.2 11l3.2 2.8 4.1-6 4.5 4.2" />
          <circle cx="8.2" cy="11" r="1" />
          <circle cx="15.5" cy="7.8" r="1" />
        </svg>
      );
    case "platform":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={classes} aria-hidden="true">
          <ellipse cx="12" cy="12" rx="8.5" ry="4.5" />
          <path d="M3.5 12v4c0 2.5 3.8 4.5 8.5 4.5s8.5-2 8.5-4.5v-4" />
          <path d="M12 7.5v13" />
        </svg>
      );
    case "opportunity":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={classes} aria-hidden="true">
          <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" />
          <path d="m18.5 14.5.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3Z" />
        </svg>
      );
    default:
      return null;
  }
}

function signalToneBadgeClass(tone: ReportSignal["tone"]): string {
  if (tone === "positive") {
    return "border-brand-accent-emerald/45 bg-brand-accent-emerald/12 text-brand-accent-teal";
  }

  if (tone === "warning") {
    return "border-brand-accent-blue/45 bg-brand-accent-blue/12 text-brand-accent-blue";
  }

  return "border-brand-border-strong/65 bg-brand-panel/90 text-brand-text-primary";
}

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

              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-accent-teal/90">Free validation • $79 Report • $59/month Pro</p>
            </div>

            <div className="relative mx-auto w-full max-w-[33rem] lg:max-w-none lg:pl-4">
              <div className="pointer-events-none absolute inset-x-2 -top-8 bottom-3 rounded-[2rem] bg-[radial-gradient(circle_at_24%_18%,rgba(29,78,216,0.3),rgba(9,18,35,0))] blur-2xl" />
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
                style={{ backgroundImage: BRAND.gradientPrimary }}
              />
              <div className="pointer-events-none absolute -left-12 bottom-2 h-44 w-44 rounded-full bg-brand-accent-teal/10 blur-3xl" />

              <Card className="relative overflow-hidden rounded-2xl border border-brand-border-strong/65 bg-[linear-gradient(162deg,rgba(11,24,49,0.97),rgba(15,31,64,0.95),rgba(9,21,43,0.98))] p-0 shadow-[0_34px_75px_-42px_rgba(13,57,142,0.95)]">
                <div className="border-b border-brand-border/70 bg-brand-panel-muted/35 px-6 py-5 sm:px-7">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">Creator Revenue Report</p>
                    <span className="inline-flex rounded-full border border-brand-border-strong/60 bg-brand-panel px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-brand-text-secondary">
                      Sample Output
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">Revenue Diagnostics Snapshot</h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                    Generated from the past 90 days of creator earnings activity.
                  </p>
                </div>

                <div className="space-y-3.5 p-5 sm:p-6">
                  {reportSignals.map((signal) => (
                    <div
                      key={signal.label}
                      className="rounded-xl border border-brand-border/70 bg-[linear-gradient(165deg,rgba(17,34,69,0.9),rgba(12,26,55,0.84))] p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-brand-border-strong/65 bg-brand-panel text-brand-accent-blue">
                              <InsightGlyph icon={signal.icon} />
                            </span>
                            <p className="text-[11px] uppercase tracking-[0.12em] text-brand-text-muted">{signal.label}</p>
                          </div>
                          <p className="mt-2 text-base font-semibold leading-relaxed text-white">{signal.value}</p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-medium uppercase tracking-[0.11em]",
                            signalToneBadgeClass(signal.tone),
                          )}
                        >
                          {signal.badge}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{signal.detail}</p>
                      <div className="mt-3.5 h-1.5 rounded-full bg-brand-panel-muted/80">
                        <div
                          className="h-full rounded-full"
                          style={{ width: signal.meterWidth, backgroundColor: signal.meterColor }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="rounded-xl border border-brand-accent-emerald/35 bg-[linear-gradient(160deg,rgba(20,56,70,0.5),rgba(13,36,63,0.35))] p-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-brand-accent-emerald/45 bg-brand-accent-emerald/12 text-brand-accent-teal">
                        <InsightGlyph icon="opportunity" className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">Opportunity detected</p>
                        <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
                          Adding a $15 tier could increase revenue by ~18%.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-border/65 bg-brand-panel/70 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">
                      Projected Impact Simulation
                    </p>
                    <div className="mt-3 grid h-12 grid-cols-12 items-end gap-1.5">
                      {[22, 30, 28, 40, 46, 43, 52, 61, 65, 74, 82, 88].map((height, index) => (
                        <span
                          // Index is stable for this static sequence used only for styling bars.
                          key={`projection-${index}`}
                          className="rounded-sm bg-brand-accent-blue/65"
                          style={{ height: `${height}%` }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">Pattern Intelligence</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">Real Insights Creators Discover</h2>
            <p className="mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
              These are the kinds of patterns EarnSigma uncovers from your earnings data.
            </p>
          </div>

          <div className="mt-10 grid auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {discoverInsights.map((insight) => (
              <Card
                key={insight.title}
                className="relative flex h-full flex-col overflow-hidden border-brand-border/75 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-5 sm:p-6"
              >
                <div className="pointer-events-none absolute -right-9 -top-10 h-24 w-24 rounded-full bg-brand-accent-blue/14 blur-2xl" />
                <div className="relative flex items-center justify-between gap-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border-strong/65 bg-brand-panel text-brand-accent-blue">
                    <InsightGlyph icon={insight.icon} className="h-4 w-4" />
                  </span>
                  <span className="inline-flex rounded-full border border-brand-border-strong/60 bg-brand-panel px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.11em] text-brand-text-secondary">
                    {insight.indicator}
                  </span>
                </div>
                <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-white">{insight.title}</h3>
                <p className="relative mt-2.5 text-sm leading-relaxed text-brand-text-secondary">{insight.description}</p>

                <div className="relative mt-5 rounded-lg border border-brand-border/65 bg-brand-panel/70 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">{insight.signal}</p>
                  <div className="mt-3 flex h-9 items-end gap-1.5">
                    {insight.bars.map((height, index) => (
                      <span
                        // Index is stable for this static series that only controls bar visual state.
                        key={`${insight.title}-bar-${index}`}
                        className="w-full rounded-sm bg-brand-accent-blue/65"
                        style={{ height: `${height}%` }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="relative border-t border-brand-border/55 pb-20 pt-16 sm:pb-24 sm:pt-20 lg:pb-28">
        <Container>
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
            <div className="relative">
              <div className="pointer-events-none absolute -left-10 -top-2 h-36 w-36 rounded-full bg-brand-accent-blue/12 blur-3xl" />
              <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
                What Your Creator Optimization Report Reveals
              </h2>
              <p className="relative mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
                Generate a personalized creator revenue report revealing where your income is stable, where subscribers
                churn, and where growth is hiding.
              </p>

              <p className="mt-6 text-sm leading-relaxed text-brand-text-secondary">
                Each report includes multiple pages of diagnostics and clear growth actions tailored to your creator
                business.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {reportSectionPillars.map((item) => (
                  <span
                    key={item}
                    className="inline-flex rounded-full border border-brand-border-strong/65 bg-brand-panel px-3 py-1.5 text-xs text-brand-text-secondary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -left-8 top-12 h-44 w-44 rounded-full bg-brand-accent-teal/10 blur-3xl" />
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full opacity-35 blur-3xl"
                style={{ backgroundImage: BRAND.gradientPrimary }}
              />

              <Card className="relative overflow-hidden rounded-2xl border border-brand-border-strong/65 bg-[linear-gradient(164deg,rgba(12,26,54,0.96),rgba(15,31,64,0.94),rgba(9,21,44,0.97))] p-4 shadow-brand-card sm:p-5">
                <div className="rounded-xl border border-brand-border/70 bg-brand-panel/75 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
                      Creator Revenue Optimization Report
                    </p>
                    <span className="inline-flex rounded-full border border-brand-border-strong/60 bg-brand-panel px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-brand-text-secondary">
                      PDF - 12 pages
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
                    <div className="space-y-3">
                      <div className="rounded-lg border border-brand-border/65 bg-brand-panel-muted/35 p-3">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Revenue Stability Trend</p>
                        <div className="mt-3 grid h-16 grid-cols-10 items-end gap-1.5">
                          {[28, 33, 37, 46, 52, 58, 56, 64, 71, 74].map((height, index) => (
                            <span
                              // Index is stable for this static chart styling data.
                              key={`report-trend-${index}`}
                              className="rounded-sm bg-brand-accent-blue/70"
                              style={{ height: `${height}%` }}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-brand-border/65 bg-brand-panel-muted/35 p-3">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Tier Migration Flow</p>
                        <div className="mt-3 space-y-2">
                          {[
                            { from: "$8", to: "$15", share: "18%" },
                            { from: "$15", to: "$30", share: "9%" },
                            { from: "$8", to: "Cancel", share: "42%" },
                          ].map((flow) => (
                            <div key={`${flow.from}-${flow.to}`} className="flex items-center justify-between gap-3 text-sm text-brand-text-secondary">
                              <span>{flow.from}</span>
                              <span className="flex-1 border-t border-dashed border-brand-border/80" aria-hidden="true" />
                              <span>{flow.to}</span>
                              <span className="rounded-full border border-brand-border-strong/65 bg-brand-panel px-2 py-0.5 text-xs text-brand-text-primary">
                                {flow.share}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-lg border border-brand-border/65 bg-brand-panel-muted/35 p-3">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Risk Breakdown</p>
                        <div className="mt-3 space-y-2">
                          {[
                            { label: "Platform concentration", width: "71%" },
                            { label: "Mid-tier churn", width: "42%" },
                            { label: "Upgrade friction", width: "31%" },
                          ].map((row) => (
                            <div key={row.label}>
                              <div className="flex items-center justify-between gap-3 text-xs text-brand-text-secondary">
                                <span>{row.label}</span>
                                <span>{row.width}</span>
                              </div>
                              <div className="mt-1.5 h-1.5 rounded-full bg-brand-panel">
                                <div className="h-full rounded-full bg-brand-accent-blue/80" style={{ width: row.width }} aria-hidden="true" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-brand-border/65 bg-brand-panel-muted/35 p-3">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Platform Dependence</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div
                            className="h-16 w-16 rounded-full border border-brand-border-strong/65"
                            style={{
                              background:
                                "conic-gradient(var(--es-color-accent-blue) 0 71%, rgba(31,65,122,0.34) 71% 100%)",
                            }}
                            aria-hidden="true"
                          />
                          <div className="text-xs leading-relaxed text-brand-text-secondary">
                            <p className="font-medium text-brand-text-primary">Patreon: 71%</p>
                            <p>Secondary channels: 29%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </Section>
    </MarketingShell>
  );
}
