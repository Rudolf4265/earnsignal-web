"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BRAND } from "@earnsigma/brand";
import { formatPricingPlanPrice, getPricingPlan, marketingCtas, publicUrls } from "@earnsigma/config";
import { Badge, Card, Container, Section, buttonClassName, cn } from "@earnsigma/ui";
import { MarketingShell } from "./_components/marketing-shell";
import {
  InsightGlyph,
  MarketingDataRevealsSection,
  MarketingSupportedTodaySection,
  type InsightIconKey,
} from "./_components/marketing-sections";
import {
  marketingEyebrowClass,
  marketingHeroSectionClass,
  marketingIconTileClass,
  marketingInsetClass,
  marketingPillClass,
  marketingPremiumCardClass,
  marketingPremiumCardOverlayClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass,
  marketingSectionClass,
  marketingTealIconTileClass,
  marketingTopShineClass,
} from "./_components/marketing-visuals";
import { MARKETING_TRUST_MICROCOPY_BODY, TrustMicrocopy } from "@/src/components/ui/trust-microcopy";
import { appBaseUrl } from "@/src/lib/urls";

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

const reportSignals: ReportSignal[] = [
  {
    label: "Income Stability Score",
    value: "74 / 100",
    detail: "Recurring income is healthy, though how it's spread across supporters is worth watching.",
    meterWidth: "74%",
    meterColor: "var(--es-color-accent-emerald)",
    icon: "stability",
    badge: "Stable",
    tone: "positive",
  },
  {
    label: "Platform Exposure",
    value: "71% of revenue depends on Patreon",
    detail: "A strong primary channel is also the clearest exposure point.",
    meterWidth: "71%",
    meterColor: "var(--es-color-accent-blue)",
    icon: "platform",
    badge: "Risk",
    tone: "warning",
  },
  {
    label: "Subscriber Churn",
    value: "42% of subscriber churn comes from your $8 tier",
    detail: "The report shows which tier is losing the most subscribers.",
    meterWidth: "42%",
    meterColor: "var(--es-color-accent-emerald)",
    icon: "churn",
    badge: "Watch",
    tone: "critical",
  },
];

const reportSectionPillars = [
  "Business Summary",
  "Biggest Opportunity",
  "Income Stability Score",
  "Platform Exposure",
  "Projected Upside",
  "Next 3 Actions",
];

const reportPlan = getPricingPlan("report");
const proPlan = getPricingPlan("pro");

const primaryCtaHref = `${appBaseUrl}${marketingCtas.startTrial.appPath}?plan=report`;
const secondaryCtaHref = marketingCtas.viewExampleReport.href;

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

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <Section className={marketingHeroSectionClass}>
        {/* Ghosted Sigma brand mark — decorative background composition element */}
        <div
          className="pointer-events-none absolute -left-8 -top-16 select-none font-light leading-none text-brand-accent-blue opacity-[0.082] blur-[3px]"
          style={{ fontSize: "clamp(20rem, 38vw, 50rem)" }}
          aria-hidden="true"
        >
          Σ
        </div>
        <div
          className="pointer-events-none absolute -left-32 -top-28 h-[44rem] w-[44rem] rounded-full bg-brand-accent-blue/[0.09] blur-[8rem]"
          aria-hidden="true"
        />
        <Container>
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16 xl:gap-20">
            <div className="relative">
              <div className="pointer-events-none absolute -left-12 top-10 h-44 w-44 rounded-full bg-brand-accent-blue/16 blur-3xl" />
              <Badge
                variant="accent"
                className={cn("relative", marketingEyebrowClass)}
              >
                PRIVATE CREATOR BUSINESS INTELLIGENCE
              </Badge>

              <h1 className="relative mt-7 max-w-[22ch] text-4xl font-semibold leading-[1.06] tracking-[-0.025em] text-white sm:mt-8 sm:text-5xl lg:max-w-[20ch] lg:text-[3.45rem] xl:text-[3.85rem]">
                <span className="block">Know exactly what&apos;s driving your income</span>
                <span className="block">and what&apos;s quietly hurting it.</span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-brand-text-secondary sm:text-lg sm:leading-8">
                Upload real creator data from{" "}
                <strong className="font-semibold text-white">Patreon, Substack, YouTube, Instagram, and TikTok</strong>.{" "}
                EarnSigma turns revenue, churn, growth, and platform mix into a{" "}
                <strong className="font-semibold text-white">private business diagnosis with clear next steps</strong>.
              </p>
              <p className="mt-5 text-sm font-medium text-white/90">Diagnosis, not another dashboard.</p>

              <div className="mt-11 flex flex-wrap items-center gap-3.5 sm:gap-4">
                <a
                  href={primaryCtaHref}
                  className={buttonClassName({
                    variant: "primary",
                    className: marketingPrimaryCtaClass,
                  })}
                >
                  Get My Free Preview
                </a>
                <a
                  href={secondaryCtaHref}
                  className={buttonClassName({
                    variant: "secondary",
                    className: marketingSecondaryCtaClass,
                  })}
                >
                  See Sample Diagnostics
                </a>
              </div>

              <div className="mt-5 grid max-w-2xl gap-2.5 sm:grid-cols-3">
                {[
                  ["Free validation", "Confirm your data before payment"],
                  ["Private uploads", "Your data stays private"],
                  ["No public estimates", "Only your own exports are used"],
                ].map(([label, body]) => (
                  <div key={label} className={cn(marketingInsetClass, "px-3.5 py-3")}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-brand-accent-teal">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-brand-text-secondary">{body}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-accent-teal/90">
                Launch pricing: {reportPlan.price} Report - {formatPricingPlanPrice(proPlan)}
              </p>
              <p className="mt-2.5 text-[11px] tracking-[0.06em] text-brand-text-muted/60">
                No spreadsheet stitching. No public estimates. Your data stays private.
              </p>
              <TrustMicrocopy
                body={MARKETING_TRUST_MICROCOPY_BODY}
                className={cn("mt-5 max-w-2xl", marketingInsetClass)}
                testId="marketing-trust-strip"
                variant="marketing"
              />
            </div>

            {/* Hero sample report card */}
            <div className="relative mx-auto w-full max-w-[33rem] lg:max-w-none lg:pl-4">
              <div className="pointer-events-none absolute inset-x-2 -top-8 bottom-3 rounded-[2rem] bg-[radial-gradient(circle_at_24%_18%,rgba(29,78,216,0.3),rgba(9,18,35,0))] blur-2xl" />
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
                style={{ backgroundImage: BRAND.gradientPrimary }}
              />
              <div className="pointer-events-none absolute -left-12 bottom-2 h-44 w-44 rounded-full bg-brand-accent-teal/10 blur-3xl" />

              <Card className={cn(marketingPremiumCardClass, "p-0")}>
                <div className={marketingPremiumCardOverlayClass} />
                <div className={marketingTopShineClass} />
                <div className="relative border-b border-white/[0.07] bg-brand-panel-muted/20 px-6 py-5 sm:px-7">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">Private Business Report</p>
                    <span className={marketingPillClass}>
                      Sample Output
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">Your Business at a Glance</h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                    An anonymized example showing what the report looks like for your business.
                  </p>
                </div>

                <div className="relative space-y-3.5 p-5 sm:p-6">
                  {reportSignals.map((signal) => (
                    <div
                      key={signal.label}
                      className={cn(marketingInsetClass, "p-4 sm:p-5")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(marketingIconTileClass, "h-7 w-7 rounded-lg")}>
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
                      <div className="mt-3.5 h-1.5 rounded-full bg-brand-panel-muted/50">
                        <div
                          className="h-full rounded-full"
                          style={{ width: signal.meterWidth, backgroundColor: signal.meterColor }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  ))}

                  <div className={cn(marketingInsetClass, "p-4")}>
                    <div className="flex items-start gap-3">
                      <span className={cn(marketingTealIconTileClass, "h-8 w-8 rounded-lg")}>
                        <InsightGlyph icon="opportunity" className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">Next best action</p>
                        <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
                          Test a clearer mid-tier offer before buying more audience.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={cn(marketingInsetClass, "p-4")}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">
                      Revenue Projection
                    </p>
                    <div className="mt-3 grid h-12 grid-cols-12 items-end gap-1.5">
                      {[22, 30, 28, 40, 46, 43, 52, 61, 65, 74, 82, 88].map((height, index) => (
                        <span
                          // Index is stable for this static sequence used only for styling bars.
                          key={`projection-${index}`}
                          className="rounded-full bg-gradient-to-t from-brand-accent-blue/35 via-brand-accent-blue/60 to-brand-accent-teal/70"
                          style={{ height: `${height}%` }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative border-t border-white/[0.07] bg-brand-panel-muted/15 px-5 py-3.5 text-xs text-brand-text-muted sm:px-6">
                  Free validation first. Full report when you are ready.
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      <MarketingDataRevealsSection />

      {/* ── 2. SUPPORTED TODAY ──────────────────────────────────────────────── */}
      <MarketingSupportedTodaySection />

      <Section className={marketingSectionClass}>
        <div
          className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[24rem] w-[38rem] -translate-x-1/2 rounded-full bg-brand-accent-blue/[0.055] blur-[7rem]"
          aria-hidden="true"
        />
        <Container>
          <div className="max-w-2xl">
            <p className={marketingEyebrowClass}>DIAGNOSIS, NOT DASHBOARD</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
              EarnSigma tells you what to do next
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
              Dashboards show what happened. EarnSigma turns the same business evidence into a diagnosis, a biggest opportunity, and next actions.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className={cn(marketingPremiumCardClass, "p-6")}>
              <div className={marketingPremiumCardOverlayClass} />
              <div className={marketingTopShineClass} />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-text-secondary">Public Trackers</p>
              <ul className="mt-5 space-y-3">
                <li className="relative flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  Follower counts and estimated reach
                </li>
                <li className="relative flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  Public growth rankings
                </li>
                <li className="relative flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  Rough revenue guesses from public data
                </li>
              </ul>
            </div>

            <div className={cn(marketingPremiumCardClass, "p-6")}>
              <div className={marketingPremiumCardOverlayClass} />
              <div className={marketingTopShineClass} />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-text-secondary">Native Dashboards</p>
              <ul className="mt-5 space-y-3">
                <li className="relative flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  Siloed per-platform metrics
                </li>
                <li className="relative flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  No cross-platform revenue view
                </li>
                <li className="relative flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  Raw numbers without diagnosis
                </li>
              </ul>
            </div>

            <div className={cn(marketingPremiumCardClass, "p-6")}>
              <div className={marketingPremiumCardOverlayClass} />
              <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-brand-accent-teal/14 blur-3xl" />
              <div className={marketingTopShineClass} />
              <div className="relative flex items-center gap-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">EarnSigma</p>
                <span className={cn(marketingPillClass, "border-brand-accent-emerald/35 bg-brand-accent-emerald/10 text-brand-accent-teal")}>
                  Private
                </span>
              </div>
              <ul className="mt-5 space-y-3">
                <li className="relative flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-accent-teal" aria-hidden="true" />
                  <span><strong className="font-semibold text-white">Built from your real data</strong>, not public estimates</span>
                </li>
                <li className="relative flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-accent-teal" aria-hidden="true" />
                  Income Stability Score, platform exposure, subscriber health, and projected upside
                </li>
                <li className="relative flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-accent-teal" aria-hidden="true" />
                  <span><strong className="font-semibold text-white">Biggest Opportunity and Next 3 Actions</strong>, not just charts</span>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── 3. INSIGHTS — "What your business data reveals" ─────────────────── */}
      <Section className={marketingSectionClass}>
        <Container>
          <div className="max-w-2xl">
            <p className={marketingEyebrowClass}>HOW IT WORKS</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
              Built from your real data &mdash; not public guesses
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                title: "Upload your data",
                body: <>Connect your creator data from Patreon, Substack, YouTube, Instagram, and TikTok — <strong className="font-medium text-brand-text-primary">data you already have</strong>, from platforms you already use.</>,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                ),
              },
              {
                title: "Validate free",
                body: <>EarnSigma confirms your data is usable at no cost. When you&apos;re ready, a <strong className="font-medium text-brand-text-primary">{formatPricingPlanPrice(reportPlan)} Report</strong> gives you a full diagnosis — or start Pro for ongoing access.</>,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                    <path d="M11 8v6" />
                    <path d="M8 11h6" />
                  </svg>
                ),
              },
              {
                title: "Get your business diagnosis",
                body: <>Your private report covers <strong className="font-medium text-brand-text-primary">income health, subscriber momentum, platform risk, and what to do next</strong> — built from your data alone.</>,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                ),
              },
            ].map((item) => (
              <Card
                key={item.title}
                className={cn(marketingPremiumCardClass, "flex h-full flex-col p-6 sm:p-7")}
              >
                <div className={marketingPremiumCardOverlayClass} />
                <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-brand-accent-blue/14 blur-3xl" />
                <div className={marketingTopShineClass} />
                <span className={cn(marketingIconTileClass, "relative h-11 w-11")}>
                  {item.icon}
                </span>
                <h3 className="relative mt-5 text-base font-semibold tracking-tight text-white">{item.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-brand-text-secondary">{item.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* SAMPLE OUTPUT */}
      <Section className={cn(marketingSectionClass, "pb-20 sm:pb-24 lg:pb-28")}>
        <Container>
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
            <div className="relative">
              <div className="pointer-events-none absolute -left-10 -top-2 h-36 w-36 rounded-full bg-brand-accent-blue/12 blur-3xl" />
              <p className={cn("relative", marketingEyebrowClass)}>SAMPLE OUTPUT</p>
              <h2 className="relative mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
                What a real EarnSigma report actually shows
              </h2>
              <p className="relative mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
                Plain language. Specific findings. Not just data &mdash; a diagnosis.
              </p>

              <div className={cn(marketingInsetClass, "mt-6 p-5")}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">Anonymized example findings</p>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-brand-text-secondary sm:text-[0.95rem]">
                  <p>&ldquo;You&apos;re losing 42% of churn from your $8 tier.&rdquo;</p>
                  <p>&ldquo;Your top 5% of supporters drive 46% of revenue.&rdquo;</p>
                  <p>&ldquo;Raising a mid-tier offer could increase revenue by +18%.&rdquo;</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {reportSectionPillars.map((item) => (
                  <span
                    key={item}
                    className={cn(marketingPillClass, "px-3 py-1.5 text-xs normal-case tracking-normal")}
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

              <Card className={cn(marketingPremiumCardClass, "p-4 sm:p-5")}>
                <div className={marketingPremiumCardOverlayClass} />
                <div className={marketingTopShineClass} />
                <div className={cn("relative p-4 sm:p-5", marketingInsetClass)}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
                      Private Business Diagnostics Report
                    </p>
                    <span className={marketingPillClass}>
                      Sample report
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
                    <div className="space-y-3">
                      <div className={cn(marketingInsetClass, "p-3")}>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Income Stability Score</p>
                        <div className="mt-3 grid h-16 grid-cols-10 items-end gap-1.5">
                          {[28, 33, 37, 46, 52, 58, 56, 64, 71, 74].map((height, index) => (
                            <span
                              // Index is stable for this static chart styling data.
                              key={`report-trend-${index}`}
                              className="rounded-full bg-gradient-to-t from-brand-accent-blue/35 via-brand-accent-blue/60 to-brand-accent-teal/70"
                              style={{ height: `${height}%` }}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      </div>

                      <div className={cn(marketingInsetClass, "p-3")}>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Subscriber Health</p>
                        <div className="mt-3 space-y-2">
                          {[
                            { from: "$8", to: "$15", share: "18%" },
                            { from: "$15", to: "$30", share: "9%" },
                            { from: "$8", to: "Cancel", share: "42%" },
                          ].map((flow) => (
                            <div key={`${flow.from}-${flow.to}`} className="flex items-center justify-between gap-3 text-sm text-brand-text-secondary">
                              <span>{flow.from}</span>
                              <span className="flex-1 border-t border-dashed border-brand-border/45" aria-hidden="true" />
                              <span>{flow.to}</span>
                              <span className={cn(marketingPillClass, "px-2 py-0.5 text-xs normal-case tracking-normal text-brand-text-primary")}>
                                {flow.share}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className={cn(marketingInsetClass, "p-3")}>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Key Findings</p>
                        <div className="mt-3 space-y-2">
                          {[
                            { label: "Platform exposure", width: "71%" },
                            { label: "Mid-tier churn", width: "42%" },
                            { label: "Upgrade friction", width: "31%" },
                          ].map((row) => (
                            <div key={row.label}>
                              <div className="flex items-center justify-between gap-3 text-xs text-brand-text-secondary">
                                <span>{row.label}</span>
                                <span>{row.width}</span>
                              </div>
                              <div className="mt-1.5 h-1.5 rounded-full bg-brand-panel-muted/45">
                                <div className="h-full rounded-full bg-gradient-to-r from-brand-accent-blue/70 to-brand-accent-teal/70" style={{ width: row.width }} aria-hidden="true" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={cn(marketingInsetClass, "p-3")}>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Platform Concentration</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div
                            className="h-16 w-16 rounded-full border border-brand-border/35 shadow-[0_0_22px_rgba(47,217,197,0.12)]"
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

      {/* ── 7. WHO IT'S FOR ──────────────────────────────────────────────────── */}
      <Section className={cn(marketingSectionClass, "pb-20 sm:pb-24")}>
        <Container>
          <div className="max-w-2xl">
            <p className={marketingEyebrowClass}>BUILT FOR</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
              Built for creators who run a real business
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Membership & subscription revenue",
                body: "You earn from Patreon, memberships, or recurring multi-channel income — and you need to understand that business.",
              },
              {
                title: "Your data, your answers",
                body: "You want insights built from your own data — not estimated from someone else's.",
              },
              {
                title: "Decisions, not just dashboards",
                body: "You need to know what to do next — not just what your numbers are.",
              },
              {
                title: "Revenue and audience health together",
                body: "You want to see your earnings business and your audience growth in one workspace.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={cn(marketingPremiumCardClass, "p-6")}
              >
                <div className={marketingPremiumCardOverlayClass} />
                <div className={marketingTopShineClass} />
                <h3 className="relative text-base font-semibold text-white">{item.title}</h3>
                <p className="relative mt-2.5 text-sm leading-relaxed text-brand-text-secondary">{item.body}</p>
              </div>
            ))}
          </div>

          <div className={cn(marketingPremiumCardClass, "mt-12 p-6 sm:p-7")}>
            <div className={marketingPremiumCardOverlayClass} />
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-accent-teal/12 blur-3xl" />
            <div className={marketingTopShineClass} />
            <p className="relative text-lg font-semibold text-white">Understand your creator business like a business.</p>
            <p className="relative mt-1.5 text-sm text-brand-text-secondary">No guesswork. No public estimates. Just your data — clearly explained.</p>
            <div className="relative mt-6 flex flex-wrap items-center gap-4">
              <a
                href={primaryCtaHref}
                className={buttonClassName({
                  variant: "primary",
                  className: marketingPrimaryCtaClass,
                })}
              >
                Get My Free Preview
              </a>
              <a
                href={secondaryCtaHref}
                className={buttonClassName({
                  variant: "secondary",
                  className: marketingSecondaryCtaClass,
                })}
              >
                See Sample Diagnostics
              </a>
            </div>
          </div>
        </Container>
      </Section>

    </MarketingShell>
  );
}
