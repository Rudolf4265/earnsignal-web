"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@earnsigma/brand";
import { formatPricingPlanPrice, getPricingPlan, marketingCtas, publicUrls } from "@earnsigma/config";
import { Badge, Container, Section, buttonClassName, cn } from "@earnsigma/ui";
import { MarketingShell } from "./_components/marketing-shell";
import {
  MarketingSupportedTodaySection,
} from "./_components/marketing-sections";
import { HeroCards } from "./_components/HeroCards";
import { PainFlipCards } from "./_components/PainFlipCards";
import { SampleReportTabs } from "./_components/SampleReportTabs";
import { ReviewsCarousel } from "./_components/ReviewsCarousel";
import {
  marketingEyebrowClass,
  marketingHeroSectionClass,
  marketingPillClass,
  marketingPremiumCardClass,
  marketingPremiumCardOverlayClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass,
  marketingSectionClass,
  marketingTopShineClass,
} from "./_components/marketing-visuals";
import { appBaseUrl } from "@/src/lib/urls";

const reportPlan = getPricingPlan("report");
const proPlan = getPricingPlan("pro");

const primaryCtaHref = `${appBaseUrl}${marketingCtas.startTrial.appPath}?plan=report`;
const secondaryCtaHref = marketingCtas.viewExampleReport.href;

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".sr-hidden");
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove("sr-hidden");
            e.target.classList.add("sr-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
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

  useScrollReveal();

  if (token) {
    return null;
  }

  return (
    <MarketingShell>

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <Section className={marketingHeroSectionClass}>
        <div
          className="pointer-events-none absolute -left-8 -top-16 select-none font-light leading-none text-brand-accent-blue opacity-[0.082] blur-[3px]"
          style={{ fontSize: "clamp(20rem, 38vw, 50rem)" }}
          aria-hidden="true"
        >
          &#x3A3;
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

              {/* Trust pills — single row of 4, no duplication */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                {[
                  "Free validation",
                  "Private uploads",
                  "No public estimates",
                  "Never used to train AI models",
                ].map((pill) => (
                  <span
                    key={pill}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-text-secondary"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[9px] text-brand-accent-teal" style={{ borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)' }}>&#10003;</span>
                    {pill}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-accent-teal/90">
                Launch pricing: {reportPlan.price} Report - {formatPricingPlanPrice(proPlan)}
              </p>
            </div>

            {/* Hero right column — animated floating cards */}
            <div className="relative mx-auto w-full max-w-[33rem] flex items-center justify-center lg:max-w-none lg:pl-4">
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
                style={{ backgroundImage: BRAND.gradientPrimary }}
              />
              <HeroCards />
            </div>
          </div>
        </Container>
      </Section>

      {/* ── 2. PAIN FLIP CARDS ──────────────────────────────────────────────── */}
      <PainFlipCards />

      {/* ── 3. SAMPLE REPORT TABS ───────────────────────────────────────────── */}
      <SampleReportTabs />

      {/* ── 4. SUPPORTED TODAY ──────────────────────────────────────────────── */}
      <div className="sr-hidden">
        <MarketingSupportedTodaySection />
      </div>

      {/* ── 5. DIAGNOSIS, NOT DASHBOARD ─────────────────────────────────────── */}
      <Section className={cn(marketingSectionClass, "sr-hidden")}>
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
                {["Follower counts and estimated reach", "Public growth rankings", "Rough revenue guesses from public data"].map(item => (
                  <li key={item} className="relative flex items-start gap-2.5 text-sm text-brand-text-secondary">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn(marketingPremiumCardClass, "p-6")}>
              <div className={marketingPremiumCardOverlayClass} />
              <div className={marketingTopShineClass} />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-text-secondary">Native Dashboards</p>
              <ul className="mt-5 space-y-3">
                {["Siloed per-platform metrics", "No cross-platform revenue view", "Raw numbers without diagnosis"].map(item => (
                  <li key={item} className="relative flex items-start gap-2.5 text-sm text-brand-text-secondary">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-text-muted/50" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn(marketingPremiumCardClass, "p-6")}>
              <div className={marketingPremiumCardOverlayClass} />
              <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-brand-accent-teal/14 blur-3xl" />
              <div className={marketingTopShineClass} />
              <div className="relative flex items-center gap-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">EarnSigma</p>
                <span className={cn(marketingPillClass, "border-brand-accent-emerald/35 bg-brand-accent-emerald/10 text-brand-accent-teal")}>Private</span>
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

      {/* ── 6. REVIEWS CAROUSEL ─────────────────────────────────────────────── */}
      <ReviewsCarousel />

      {/* ── 7. HOW IT WORKS ─────────────────────────────────────────────────── */}
      <Section className={cn(marketingSectionClass, "sr-hidden")}>
        <Container>
          <div className="max-w-2xl mb-12">
            <p className={marketingEyebrowClass}>HOW IT WORKS</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
              Built from your real data &mdash; not public guesses
            </h2>
            <p className="mt-4 text-base text-brand-text-secondary">Three steps. No integrations. No API keys.</p>
          </div>

          <div className="grid items-start gap-0" style={{ gridTemplateColumns: '1fr auto 1fr auto 1fr' }}>
            {/* Step 1 */}
            <div>
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-extrabold text-brand-accent-teal mb-4" style={{ background: 'linear-gradient(135deg,rgba(37,99,235,.3),rgba(52,211,153,.2))', borderColor: 'rgba(52,211,153,0.28)' }}>1</div>
              <h3 className="text-base font-bold text-white mb-2 tracking-tight">Upload your exports</h3>
              <p className="text-sm text-brand-text-secondary leading-relaxed mb-4">Export your data from Patreon, Substack, YouTube, Instagram, or TikTok — the same files you already download from each platform&apos;s dashboard.</p>
              <div className="rounded-xl border p-3.5" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="text-[9px] font-bold uppercase tracking-[1px] text-brand-text-muted mb-1.5">What you upload</p>
                <p className="text-[12.5px] text-brand-accent-teal font-semibold leading-relaxed">patreon_members.csv<br />substack_subscribers.csv<br />YouTube Studio ZIP</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-start pt-14 px-4 text-brand-text-muted text-xl">&#8594;</div>

            {/* Step 2 */}
            <div>
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-extrabold text-brand-accent-teal mb-4" style={{ background: 'linear-gradient(135deg,rgba(37,99,235,.3),rgba(52,211,153,.2))', borderColor: 'rgba(52,211,153,0.28)' }}>2</div>
              <h3 className="text-base font-bold text-white mb-2 tracking-tight">Validate free, pay when ready</h3>
              <p className="text-sm text-brand-text-secondary leading-relaxed mb-4">EarnSigma checks your uploads are usable at no cost. You see exactly which datasets are staged and ready. Pay $25 when you&apos;re ready to run the full report.</p>
              <div className="rounded-xl border p-3.5" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="text-[9px] font-bold uppercase tracking-[1px] text-brand-text-muted mb-1.5">What you see</p>
                <p className="text-[12.5px] text-brand-accent-teal font-semibold leading-relaxed">&#10003; 3 datasets staged<br />&#10003; Run Report enabled<br />Revenue sources: Patreon, Substack</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-start pt-14 px-4 text-brand-text-muted text-xl">&#8594;</div>

            {/* Step 3 */}
            <div>
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-extrabold text-brand-accent-teal mb-4" style={{ background: 'linear-gradient(135deg,rgba(37,99,235,.3),rgba(52,211,153,.2))', borderColor: 'rgba(52,211,153,0.28)' }}>3</div>
              <h3 className="text-base font-bold text-white mb-2 tracking-tight">Get your business diagnosis</h3>
              <p className="text-sm text-brand-text-secondary leading-relaxed mb-4">One combined report covering income health, churn, platform concentration, subscriber momentum, and three specific next actions — generated from your data alone.</p>
              <div className="rounded-xl border p-3.5" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <p className="text-[9px] font-bold uppercase tracking-[1px] text-brand-text-muted mb-1.5">What you get</p>
                <p className="text-[12.5px] text-brand-accent-teal font-semibold leading-relaxed">Income Stability Score: 74/100<br />Biggest Opportunity identified<br />Next 3 Actions &middot; PDF download</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── 8. FINAL CTA ────────────────────────────────────────────────────── */}
      <Section className={cn(marketingSectionClass, "sr-hidden text-center")}>
        <Container>
          <div className={cn(marketingPremiumCardClass, "p-8 sm:p-10")}>
            <div className={marketingPremiumCardOverlayClass} />
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-accent-teal/12 blur-3xl" />
            <div className={marketingTopShineClass} />
            <p className="relative text-xl font-semibold text-white">Understand your creator business like a business.</p>
            <p className="relative mt-2 text-sm text-brand-text-secondary">No guesswork. No public estimates. Just your data — clearly explained.</p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
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
