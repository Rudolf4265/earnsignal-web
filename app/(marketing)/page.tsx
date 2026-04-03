"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BRAND } from "@earnsigma/brand";
import { marketingCtas, publicUrls } from "@earnsigma/config";
import { Badge, Card, Container, Section, buttonClassName, cn } from "@earnsigma/ui";
import { MarketingShell } from "./_components/marketing-shell";
import { InsightGlyph, MarketingSupportedTodaySection, type InsightIconKey } from "./_components/marketing-sections";
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
    label: "Income Stability",
    value: "74 / 100",
    detail: "Healthy baseline with moderate volatility in weekly earnings.",
    meterWidth: "74%",
    meterColor: "var(--es-color-accent-emerald)",
    icon: "stability",
    badge: "Stable",
    tone: "positive",
  },
  {
    label: "Platform Risk",
    value: "71% of revenue depends on Patreon",
    detail: "Concentration above target leaves monthly revenue exposed.",
    meterWidth: "71%",
    meterColor: "var(--es-color-accent-blue)",
    icon: "platform",
    badge: "Risk",
    tone: "warning",
  },
  {
    label: "Subscriber Loss Risk",
    value: "42% of subscriber churn comes from your $8 tier",
    detail: "Most cancellations happen in the first 21 days after join.",
    meterWidth: "42%",
    meterColor: "var(--es-color-accent-emerald)",
    icon: "churn",
    badge: "Alert",
    tone: "critical",
  },
];

const reportSectionPillars = [
  "Executive Summary",
  "Biggest Opportunity",
  "Platform Mix",
  "Subscriber Momentum",
  "Strengths & Risks",
  "Next 3 Actions",
];

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
      <Section className="relative overflow-hidden pb-20 pt-16 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24">
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
                className="relative border-brand-border-strong/65 bg-brand-panel/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-brand-accent-blue"
              >
                PRIVATE CREATOR BUSINESS INTELLIGENCE
              </Badge>

              <h1 className="relative mt-7 max-w-[22ch] text-4xl font-semibold leading-[1.06] tracking-[-0.025em] text-white sm:mt-8 sm:text-5xl lg:max-w-[20ch] lg:text-[3.45rem] xl:text-[3.85rem]">
                <span className="block">Know what&apos;s driving your income,</span>
                <span className="block">what&apos;s hurting it — and what to do next.</span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-brand-text-secondary sm:text-lg sm:leading-8">
                Upload your creator data from{" "}
                <strong className="font-semibold text-white">Patreon, Substack, YouTube, Instagram, and TikTok</strong>.{" "}
                EarnSigma turns it into a{" "}
                <strong className="font-semibold text-white">clear, private business diagnosis</strong> — not just charts.
              </p>
              <p className="mt-5 text-sm font-medium text-white/90">Stop guessing what&apos;s driving your income.</p>

              <div className="mt-11 flex flex-wrap items-center gap-3.5 sm:gap-4">
                <a
                  href={primaryCtaHref}
                  className={buttonClassName({
                    variant: "primary",
                    className:
                      "rounded-xl border-brand-accent-emerald/50 bg-[linear-gradient(120deg,rgba(29,78,216,0.98),rgba(47,217,197,0.9))] px-6 py-3 text-sm font-semibold text-white shadow-brand-glow hover:border-brand-accent-emerald/70 hover:brightness-110 sm:px-7 sm:py-3.5",
                  })}
                >
                  Generate My Private Report
                </a>
                <a
                  href={secondaryCtaHref}
                  className={buttonClassName({
                    variant: "secondary",
                    className:
                      "rounded-xl border-brand-border-strong/70 bg-brand-panel/70 px-5 py-3 text-sm text-brand-text-secondary hover:bg-brand-panel hover:text-white sm:px-6",
                  })}
                >
                  See Sample Diagnostics
                </a>
              </div>

              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-accent-teal/90">
                Free validation • $79 Report • $59/month Pro
              </p>
              <p className="mt-2.5 text-[11px] tracking-[0.06em] text-brand-text-muted/60">
                No spreadsheet stitching · No public estimates · Your data stays private
              </p>
              <TrustMicrocopy
                body={MARKETING_TRUST_MICROCOPY_BODY}
                className="mt-5 max-w-2xl"
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

              <Card className="relative overflow-hidden rounded-2xl border border-brand-border-strong/65 bg-[linear-gradient(162deg,rgba(11,24,49,0.97),rgba(15,31,64,0.95),rgba(9,21,43,0.98))] p-0 shadow-[0_34px_75px_-42px_rgba(13,57,142,0.95)]">
                <div className="border-b border-brand-border/70 bg-brand-panel-muted/35 px-6 py-5 sm:px-7">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">Private Business Report</p>
                    <span className="inline-flex rounded-full border border-brand-border-strong/60 bg-brand-panel px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-brand-text-secondary">
                      Sample Output
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">Business Diagnostics Snapshot</h2>
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
                        <p className="text-sm font-semibold text-white">Next best action</p>
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

      {/* ── 2. SUPPORTED TODAY ──────────────────────────────────────────────── */}
      <MarketingSupportedTodaySection />

      <Section className="relative border-t border-brand-border/60 pb-16 pt-16 sm:pb-20 sm:pt-20">
        <div
          className="pointer-events-none absolute inset-x-0 -top-px h-24 bg-[linear-gradient(to_bottom,rgba(25,72,171,0.15),rgba(10,22,44,0))]"
          aria-hidden="true"
        />
        <Container>
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">THE DIFFERENCE</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
              Not another public stats dashboard
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-brand-border/50 bg-brand-panel-muted/15 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">Public Trackers</p>
              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-2.5 text-sm text-brand-text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  Follower counts and estimated reach
                </li>
                <li className="flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  Public growth rankings
                </li>
                <li className="flex items-start gap-2.5 text-sm text-brand-text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  Rough revenue guesses from public data
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-border/50 bg-brand-panel-muted/15 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">Native Dashboards</p>
              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  Siloed per-platform metrics
                </li>
                <li className="flex items-start gap-2.5 text-sm text-brand-text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  No cross-platform revenue view
                </li>
                <li className="flex items-start gap-2.5 text-sm text-brand-text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                  Raw numbers without diagnosis
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-accent-blue/40 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-6">
              <div className="flex items-center gap-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">EarnSigma</p>
                <span className="inline-flex rounded-full border border-brand-accent-emerald/45 bg-brand-accent-emerald/12 px-2 py-0.5 text-[10px] font-medium text-brand-accent-teal">
                  Private
                </span>
              </div>
              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-accent-teal" aria-hidden="true" />
                  <span><strong className="font-semibold text-white">Built from your real data</strong>, not public estimates</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-accent-teal" aria-hidden="true" />
                  Income risk, subscriber loss, and monetization health
                </li>
                <li className="flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-accent-teal" aria-hidden="true" />
                  <span><strong className="font-semibold text-white">Next-action guidance</strong> — not just charts</span>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── 3. INSIGHTS — "What your business data reveals" ─────────────────── */}
      <Section className="relative border-t border-brand-border/55 pb-16 pt-16 sm:pb-20 sm:pt-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">HOW IT WORKS</p>
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
                body: <>EarnSigma confirms your data is usable at no cost. When you&apos;re ready, a <strong className="font-medium text-brand-text-primary">$79 one-time Report</strong> gives you a full diagnosis — or start Pro for ongoing access.</>,
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
                className="relative flex h-full flex-col overflow-hidden border-brand-border/75 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-5 sm:p-6"
              >
                <div className="pointer-events-none absolute -right-9 -top-10 h-24 w-24 rounded-full bg-brand-accent-blue/12 blur-2xl" />
                <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border-strong/65 bg-brand-panel text-brand-accent-blue">
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
      <Section className="relative border-t border-brand-border/55 pb-20 pt-16 sm:pb-24 sm:pt-20 lg:pb-28">
        <Container>
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
            <div className="relative">
              <div className="pointer-events-none absolute -left-10 -top-2 h-36 w-36 rounded-full bg-brand-accent-blue/12 blur-3xl" />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">SAMPLE OUTPUT</p>
              <h2 className="relative mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
                What a real EarnSigma report sounds like
              </h2>
              <p className="relative mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
                Not just charts. Clear business findings based on your data.
              </p>

              <div className="mt-6 rounded-2xl border border-brand-border/65 bg-[linear-gradient(165deg,rgba(16,31,61,0.74),rgba(10,22,46,0.82))] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">Example Findings</p>
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
                      Private Revenue Diagnostics Report
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
                        <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Churn &amp; Concentration Risk</p>
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
                        <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Platform Risk</p>
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

      {/* ── 7. WHO IT'S FOR ──────────────────────────────────────────────────── */}
      <Section className="relative border-t border-brand-border/55 pb-20 pt-16 sm:pb-24 sm:pt-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">BUILT FOR</p>
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
                className="rounded-2xl border border-brand-border/65 bg-brand-panel-muted/20 p-6"
              >
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-brand-text-secondary">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <p className="text-lg font-semibold text-white">Understand your creator business like a business.</p>
            <p className="mt-1.5 text-sm text-brand-text-secondary">No guesswork. No public estimates. Just your data — clearly explained.</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href={primaryCtaHref}
                className={buttonClassName({
                  variant: "primary",
                  className:
                    "rounded-xl border-brand-accent-emerald/50 bg-[linear-gradient(120deg,rgba(29,78,216,0.98),rgba(47,217,197,0.9))] px-6 py-3 text-sm font-semibold text-white shadow-brand-glow hover:border-brand-accent-emerald/70 hover:brightness-110 sm:px-7 sm:py-3.5",
                })}
              >
                Generate My Private Report
              </a>
              <a
                href={secondaryCtaHref}
                className={buttonClassName({
                  variant: "secondary",
                  className:
                    "rounded-xl border-brand-border-strong/70 bg-brand-panel/70 px-5 py-3 text-sm text-brand-text-secondary hover:bg-brand-panel hover:text-white sm:px-6",
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
