import Link from "next/link";
import { marketingCtas, publicUrls } from "@earnsigma/config";
import { Card, Container, buttonClassName, cn } from "@earnsigma/ui";
import { appBaseUrl } from "@/src/lib/urls";
import { ANNA_REYES_FIXTURE } from "@/src/lib/sample-report/anna-reyes-fixture";
import { SampleFindingCard } from "./SampleFindingCard";
import { SampleStatTile } from "./SampleStatTile";
import {
  RevenueBarChart,
  Sparkline,
  PlatformDonutRing,
  ChurnTimingChart,
  LorenzCurve,
  SubScoreBar,
  DifficultyDots,
} from "./SampleChartPrimitives";
import {
  SampleReportSection,
  SectionLabel,
  SectionHeading,
} from "./SampleReportSection";

const F = ANNA_REYES_FIXTURE;
const primaryCtaHref = `${appBaseUrl}${marketingCtas.startTrial.appPath}?plan=report`;

/* ── Shared card style ─────────────────────────────────────────── */
const CARD_CLASS =
  "sample-report-card rounded-2xl border border-brand-border/70 bg-[linear-gradient(165deg,rgba(17,34,69,0.9),rgba(11,24,50,0.84))] p-5 sm:p-6";

/* ── Tier status badge ─────────────────────────────────────────── */
function TierStatusBadge({ status }: { status: "healthy" | "problem" | "strong" }) {
  const cls = {
    healthy: "border-brand-accent-emerald/40 bg-brand-accent-emerald/8 text-brand-accent-emerald",
    problem: "border-[#f87171]/40 bg-[#f87171]/8 text-[#f87171]",
    strong:  "border-brand-accent-teal/40 bg-brand-accent-teal/8 text-brand-accent-teal",
  }[status];
  const label = { healthy: "Healthy", problem: "Problem", strong: "Strong" }[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]", cls)}>
      {label}
    </span>
  );
}

/* ── Callout card (left-border accent) ─────────────────────────── */
function CalloutCard({ children, accentColor = "var(--es-color-accent-teal)", className }: { children: React.ReactNode; accentColor?: string; className?: string }) {
  return (
    <div
      className={cn("rounded-xl border border-brand-border/50 bg-[linear-gradient(165deg,rgba(16,32,67,0.55),rgba(10,22,46,0.65))] p-5", className)}
      style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
    >
      <p className="text-sm leading-relaxed text-brand-text-secondary">{children}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 1 — COVER
══════════════════════════════════════════════════════════════════ */
function CoverSection() {
  return (
    <section
      className="sample-report-section relative overflow-hidden pb-16 pt-16 sm:pb-20 sm:pt-20"
      style={{
        background:
          "radial-gradient(circle at 18% 0%, rgba(59,130,246,0.13) 0%, transparent 50%), var(--es-color-bg)",
      }}
    >
      <Container>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-accent-teal">
          Private Business Report
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {F.creatorName}
        </h1>
        <p className="mt-3 text-lg text-brand-text-secondary">
          {F.creatorType} · {F.platformLabels}
        </p>

        <div className={cn(CARD_CLASS, "mt-10 max-w-xl")}>
          <div className="grid grid-cols-2 gap-5">
            {[
              { label: "Report period",    value: F.reportPeriod   },
              { label: "Generated",        value: F.generatedDate  },
              { label: "Sources included", value: F.platformLabels },
              { label: "Report type",      value: "Combined business diagnostics" },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
                  {m.label}
                </p>
                <p className="mt-1 text-sm font-medium text-white">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-xs italic text-brand-text-muted">Sample — anonymized fictional creator profile</p>
      </Container>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 2 — EXECUTIVE SUMMARY
══════════════════════════════════════════════════════════════════ */
function ExecutiveSummarySection() {
  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Executive Summary</SectionLabel>
        <SectionHeading className="mb-10">The shape of your business</SectionHeading>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          {/* Prose summary */}
          <div className="space-y-5 text-[0.95rem] leading-relaxed text-brand-text-secondary">
            <p>
              {F.creatorName} runs a three-platform fiction business generating{" "}
              <strong className="font-semibold text-white">${F.avgMonthlyRevenue.toLocaleString()}/month</strong> on
              average over the last 90 days. Her income is{" "}
              <strong className="font-semibold text-white">healthier than it looks from any single dashboard</strong> —
              but it is{" "}
              <strong className="font-semibold text-white">
                heavily concentrated on Patreon ({F.patreonConcentrationPct}%)
              </strong>{" "}
              with{" "}
              <strong className="font-semibold text-white">
                {F.supporterTierChurnPct}% of its churn coming from a single tier
              </strong>
              .
            </p>
            <p>
              Her top {F.topPctSupporters}% of supporters drive{" "}
              <strong className="font-semibold text-white">{F.topPctRevenuePct}% of her revenue</strong>, which is both
              her biggest strength and her biggest fragility. A targeted tier restructure is projected to add{" "}
              <strong className="font-semibold text-white">~${F.projectedUpsideMonthly}/month</strong> without acquiring
              a single new subscriber.
            </p>
            <p>
              This report identifies three actions {F.creatorName.split(" ")[0]} can take in the next 30 days and
              quantifies what each is worth.
            </p>
          </div>

          {/* Report at a glance */}
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-text-muted">
              Report at a glance
            </p>
            <div className="grid grid-cols-2 gap-3">
              <SampleStatTile
                label="EarnScore"
                value={`${F.incomeStabilityScore} / 100`}
                badge="Strong"
                tone="positive"
                meterPct={F.incomeStabilityScore}
              />
              <SampleStatTile
                label="Platform Concentration"
                value={`${F.patreonConcentrationPct}% on Patreon`}
                badge="Watch"
                tone="warning"
                meterPct={F.patreonConcentrationPct}
              />
              <SampleStatTile
                label="Subscriber Churn"
                value={`${F.supporterTierChurnPct}% from $8 tier`}
                badge="Watch"
                tone="warning"
                meterPct={F.supporterTierChurnPct}
              />
              <SampleStatTile
                label="Projected Upside"
                value={`+${F.projectedUpsidePct}% from tier restructure`}
                badge="Opportunity"
                tone="opportunity"
                meterPct={F.projectedUpsidePct * 3}
              />
            </div>
          </div>
        </div>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 3 — REVENUE OVERVIEW
══════════════════════════════════════════════════════════════════ */
function RevenueOverviewSection() {
  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Revenue Overview</SectionLabel>
        <SectionHeading className="mb-10">Where your money is coming from</SectionHeading>

        <Card className="rounded-2xl border-brand-border-strong/50 bg-[linear-gradient(162deg,rgba(11,24,49,0.97),rgba(15,31,64,0.95),rgba(9,21,43,0.98))] p-0 shadow-brand-card">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-brand-border/70 bg-brand-panel-muted/30 px-6 py-5 sm:px-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
                Total revenue, last 90 days
              </p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-white">
                ${F.totalRevenue90d.toLocaleString()}
              </p>
            </div>
            <RevenueBarChart bars={F.monthlyRevenueBars} className="h-14 w-52 shrink-0" />
          </div>

          {/* Platform breakdown */}
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
            {F.platforms.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-brand-border/60 bg-brand-panel-muted/30 p-4"
              >
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  ${p.revenue.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-brand-accent-teal">{p.pct}% of total</p>
                <p className="mt-1 text-xs text-brand-text-muted">{p.trend}</p>
              </div>
            ))}
          </div>
        </Card>

        <CalloutCard className="mt-5">
          <em>What this means: </em>Revenue is growing steadily (~14% over the period) but the growth is almost
          entirely from Substack. Patreon is flat. YouTube ad revenue is negligible and unlikely to matter as an
          income lever.
        </CalloutCard>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 4 — INCOME STABILITY
══════════════════════════════════════════════════════════════════ */
function IncomeStabilitySection() {
  const score = F.incomeStabilityScore;
  const r = 52;
  const circ = 2 * Math.PI * r;

  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>EarnScore</SectionLabel>
        <SectionHeading className="mb-10">How strong is your earning foundation?</SectionHeading>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Score ring */}
          <div className={cn(CARD_CLASS, "flex flex-col items-center text-center")}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-text-muted">
              EarnScore
            </p>
            <svg
              width="140"
              height="140"
              viewBox="0 0 140 140"
              className="mt-5"
              role="img"
              aria-label={`EarnScore: ${score} out of 100. Rating: Strong.`}
            >
              <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(52,211,153,0.12)" strokeWidth="14" />
              <circle
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke="var(--es-color-accent-emerald)"
                strokeWidth="14"
                strokeDasharray={`${(score / 100) * circ} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
              <text x="70" y="64" textAnchor="middle" fill="var(--es-color-text-primary)" fontSize="30" fontWeight="700" fontFamily="inherit">
                {score}
              </text>
              <text x="70" y="82" textAnchor="middle" fill="var(--es-color-accent-emerald)" fontSize="11" fontFamily="inherit">
                Strong
              </text>
            </svg>
            <p className="mt-4 max-w-[22ch] text-sm text-brand-text-secondary">
              Above average for creators at this revenue tier.
            </p>
          </div>

          {/* Sub-scores */}
          <div className={CARD_CLASS}>
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-text-muted">
              What&apos;s driving the score
            </p>
            <div className="space-y-5">
              {F.stabilitySubScores.map((s) => (
                <SubScoreBar key={s.label} label={s.label} score={s.score} note={s.note} />
              ))}
            </div>
          </div>
        </div>

        <CalloutCard className="mt-5">
          <em>What this means: </em>Anna has the core of a resilient business — predictable, recurring income. The
          weakness is not the income itself; it&apos;s how narrowly it is distributed across platforms and tiers.
        </CalloutCard>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 5 — PLATFORM MIX & CONCENTRATION RISK
══════════════════════════════════════════════════════════════════ */
function PlatformMixSection() {
  const donutSlices = [
    { pct: 71, color: "var(--es-color-accent-blue)", label: "Patreon 71%" },
    { pct: 21, color: "var(--es-color-accent-teal)", label: "Substack 21%" },
    { pct: 8,  color: "#fbbf24",                     label: "YouTube 8%"  },
  ];

  const riskLadder = [
    { label: "Under 50% on any one platform",  status: "Safe",        color: "text-brand-accent-emerald", highlight: false },
    { label: "50–65% on one platform",         status: "Watch",       color: "text-[#fbbf24]",            highlight: false },
    { label: "Over 65% on one platform",       status: "You are here",color: "text-[#fbbf24]",            highlight: true  },
    { label: "Over 80% on one platform",       status: "High risk",   color: "text-[#f87171]",            highlight: false },
  ];

  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Platform Concentration</SectionLabel>
        <SectionHeading className="mb-10">The platform concentration problem</SectionHeading>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Donut + legend */}
          <div className="flex flex-col items-center gap-5">
            <PlatformDonutRing
              slices={donutSlices}
              centerLabel="71%"
              centerSublabel="Patreon"
              className="max-w-[220px]"
            />
            <div className="flex flex-wrap justify-center gap-4">
              {donutSlices.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                  <span className="text-xs text-brand-text-secondary">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk ladder */}
          <div className="space-y-2.5">
            {riskLadder.map((row) => (
              <div
                key={row.label}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-xl border px-4 py-3",
                  row.highlight
                    ? "border-[#fbbf24]/30 bg-[#fbbf24]/6"
                    : "border-brand-border/60 bg-brand-panel-muted/20",
                )}
              >
                <p className={cn("text-sm", row.highlight ? "text-[#fbbf24]" : "text-brand-text-secondary")}>
                  {row.label}
                </p>
                <span className={cn("shrink-0 text-xs font-semibold", row.color)}>{row.status}</span>
              </div>
            ))}
          </div>
        </div>

        <CalloutCard className="mt-8">
          <em>Why this matters: </em>Patreon has changed its fee structure three times in the last four years. A creator
          with 71% of income on one platform doesn&apos;t have a business — they have a tenant relationship. Anna&apos;s
          most important growth goal isn&apos;t &ldquo;more revenue&rdquo; — it&apos;s{" "}
          <strong className="font-medium text-white">moving the concentration number below 60%</strong>.
        </CalloutCard>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 6 — SUBSCRIBER HEALTH
══════════════════════════════════════════════════════════════════ */
function SubscriberHealthSection() {
  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Subscriber Health</SectionLabel>
        <SectionHeading className="mb-10">Who is actually paying you?</SectionHeading>

        {/* Tier table */}
        <div className="space-y-2.5">
          {/* Column headers */}
          <div className="hidden grid-cols-[1fr_60px_80px_70px_80px_80px] gap-3 px-5 sm:grid">
            {["Tier", "Price", "Subs", "Revenue", "Churn", "Status"].map((h) => (
              <p key={h} className="text-[9px] font-semibold uppercase tracking-[0.13em] text-brand-text-muted">
                {h}
              </p>
            ))}
          </div>

          {F.tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "sample-report-card rounded-xl border p-4 sm:grid sm:grid-cols-[1fr_60px_80px_70px_80px_80px] sm:items-center sm:gap-3 sm:px-5 sm:py-4",
                tier.status === "problem"
                  ? "border-[#fbbf24]/30 bg-[rgba(251,191,36,0.04)]"
                  : "border-brand-border/65 bg-[linear-gradient(165deg,rgba(17,34,69,0.78),rgba(11,24,50,0.68))]",
              )}
              style={
                tier.status === "problem"
                  ? { borderLeftColor: "#fbbf24", borderLeftWidth: 3 }
                  : undefined
              }
            >
              <p className="font-semibold text-white">{tier.name}</p>
              <p className="mt-0.5 text-sm text-brand-text-secondary sm:mt-0">{tier.price}</p>
              <p className="text-sm text-brand-text-secondary">{tier.activeSubs.toLocaleString()}</p>
              <p className="text-sm text-brand-text-secondary">{tier.revenuePct}%</p>
              <p
                className={cn(
                  "text-sm font-medium",
                  tier.status === "problem" ? "text-[#fbbf24]" : "text-brand-text-secondary",
                )}
              >
                {tier.churnPct}%
              </p>
              <TierStatusBadge status={tier.status} />
            </div>
          ))}
        </div>

        {/* Churn timing */}
        <div className={cn(CARD_CLASS, "mt-6")}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
            Churn timing — $8 Supporter tier
          </p>
          <p className="mt-1 text-xs text-brand-text-muted">Month of membership when cancellation occurs</p>
          <ChurnTimingChart bars={F.churnTimingBars} className="mt-4 h-16" />
        </div>

        <CalloutCard className="mt-5">
          <em>What this means: </em>The $8 tier attracts people who aren&apos;t quite sure what they&apos;re buying.
          They sign up, stay two months, and leave. The tier is doing volume but not holding retention. The fix is almost
          never &ldquo;reduce churn&rdquo; — it&apos;s &ldquo;change who the tier attracts.&rdquo;
        </CalloutCard>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 7 — REVENUE CONCENTRATION
══════════════════════════════════════════════════════════════════ */
function RevenueConcentrationSection() {
  const annotated: Array<[number, number, string]> = [
    [5,  46, "Top 5%: 46%"],
    [20, 74, "Top 20%: 74%"],
    [50, 91, "Top 50%: 91%"],
  ];

  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Revenue Concentration</SectionLabel>
        <SectionHeading className="mb-6">The 5% that matters</SectionHeading>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <p className="text-6xl font-bold tracking-tight text-[#fbbf24]">
            {F.topPctRevenuePct}%
          </p>
          <p className="max-w-[38ch] text-base text-brand-text-secondary">
            of revenue comes from the top {F.topPctSupporters}% of supporters —{" "}
            <strong className="font-semibold text-white">just {F.topPctCount} people</strong> out of{" "}
            {F.totalSupporters.toLocaleString()} total.
          </p>
        </div>

        <div className={CARD_CLASS}>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
            Revenue distribution (Lorenz curve)
          </p>
          <LorenzCurve points={F.lorenzPoints} annotated={annotated} />
        </div>

        <CalloutCard className="mt-5">
          <em>What this means: </em>If the {F.topPctCount} people in Anna&apos;s top {F.topPctSupporters}% disappeared
          tomorrow, she would lose ${F.topPctRevenueLoss.toLocaleString()}/month. This is the number most creators never
          calculate. It isn&apos;t a reason to panic — it&apos;s a reason to{" "}
          <strong className="font-medium text-white">treat those {F.topPctCount} people like clients, not fans</strong>.
        </CalloutCard>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 8 — GROWTH MOMENTUM
══════════════════════════════════════════════════════════════════ */
function GrowthMomentumSection() {
  const channels = [
    {
      badge: "Fastest-growing channel",
      name: "Substack",
      stat: "+48% MoM over last 60 days",
      statColor: "text-brand-accent-emerald",
      sparkColor: "var(--es-color-accent-emerald)",
      bars: [12, 14, 13, 18, 22, 28, 36, 48],
      analysis:
        "Substack growth is being driven by a single essay that crossed over to a new audience. Investigate whether the topic is replicable.",
    },
    {
      badge: "Stagnant channel",
      name: "Patreon",
      stat: "Flat ±2% for 90 days",
      statColor: "text-[#fbbf24]",
      sparkColor: "#fbbf24",
      bars: [60, 61, 59, 62, 60, 61, 60, 62],
      analysis:
        "Patreon's top of funnel has stopped delivering new Reader-tier supporters. This is the leading indicator of future revenue decline — worth addressing before revenue actually drops.",
    },
    {
      badge: "Underused asset",
      name: "YouTube",
      stat: "28k subscribers · $1,034 revenue",
      statColor: "text-brand-text-muted",
      sparkColor: "var(--es-color-text-muted)",
      bars: [28, 28, 29, 27, 28, 28, 29, 28],
      analysis:
        "YouTube is Anna's largest audience but smallest revenue source. The platform isn't the problem — the lack of a conversion path from YouTube to Substack or Patreon is.",
    },
  ];

  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Growth Momentum</SectionLabel>
        <SectionHeading className="mb-10">What&apos;s actually working right now</SectionHeading>

        <div className="space-y-4">
          {channels.map((ch) => (
            <div key={ch.name} className={cn(CARD_CLASS, "grid grid-cols-[1fr_auto] items-center gap-6")}>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-brand-text-muted">
                  {ch.badge}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">{ch.name}</h3>
                <p className={cn("mt-0.5 text-sm font-medium", ch.statColor)}>{ch.stat}</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{ch.analysis}</p>
              </div>
              <Sparkline
                bars={ch.bars}
                accentColor={ch.sparkColor}
                className="h-12 w-16 shrink-0"
                ariaLabel={`${ch.name} sparkline`}
              />
            </div>
          ))}
        </div>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 9 — STRENGTHS & RISKS
══════════════════════════════════════════════════════════════════ */
function StrengthsRisksSection() {
  const strengths = [
    { title: "Recurring revenue base",     body: "89/100 recurring share — most income is subscription-based and predictable month over month."   },
    { title: "Retention at higher tiers",  body: "$15 and $25 tiers have under 12% churn. Anna has a loyal core that already sees the value."      },
    { title: "Substack growth trajectory", body: "Doubling roughly every 90 days. The newsletter is becoming a real second income pillar."          },
  ];
  const risks = [
    { title: "Platform concentration at 71% Patreon", body: "One platform policy change, fee hike, or algorithm shift can materially damage revenue overnight." },
    { title: "$8 tier churn cliff at 42%",            body: "The tier does volume but destroys value. It accounts for a disproportionate share of all cancellations." },
    { title: "No conversion path from YouTube",        body: "Largest audience, smallest revenue. Zero funnel from 28k subscribers to any paid product."            },
  ];

  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Assessment</SectionLabel>
        <SectionHeading className="mb-10">What&apos;s solid and what&apos;s fragile</SectionHeading>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-accent-emerald">
              Strengths
            </p>
            <div className="space-y-3">
              {strengths.map((s) => (
                <div
                  key={s.title}
                  className="sample-report-card rounded-xl border border-brand-accent-emerald/25 bg-[linear-gradient(165deg,rgba(17,34,69,0.88),rgba(11,24,50,0.8))] p-4"
                  style={{ borderLeftColor: "var(--es-color-accent-emerald)", borderLeftWidth: 3 }}
                >
                  <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#fbbf24]">
              Risks
            </p>
            <div className="space-y-3">
              {risks.map((r) => (
                <div
                  key={r.title}
                  className="sample-report-card rounded-xl border border-[#fbbf24]/25 bg-[linear-gradient(165deg,rgba(17,34,69,0.88),rgba(11,24,50,0.8))] p-4"
                  style={{ borderLeftColor: "#fbbf24", borderLeftWidth: 3 }}
                >
                  <h3 className="text-sm font-semibold text-white">{r.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 10 — OPPORTUNITIES
══════════════════════════════════════════════════════════════════ */
function OpportunitiesSection() {
  const totalMonthly = F.opportunities.reduce((sum, o) => sum + o.projectedMonthly, 0);

  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Opportunities</SectionLabel>
        <SectionHeading className="mb-3">What you could be earning</SectionHeading>
        <p className="mb-10 text-base text-brand-text-secondary">
          Total projected upside:{" "}
          <strong className="font-semibold text-white">
            +${totalMonthly.toLocaleString()}/month (+{Math.round((totalMonthly / F.avgMonthlyRevenue) * 100)}%)
          </strong>{" "}
          — with only the first being low-effort.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {F.opportunities.map((o) => (
            <div key={o.n} className={CARD_CLASS}>
              <p className="text-4xl font-bold tracking-tight text-brand-accent-teal opacity-25">
                {o.n}
              </p>
              <h3 className="mt-3 text-base font-semibold text-white">{o.title}</h3>
              <p className="mt-2 text-2xl font-bold tracking-tight text-brand-accent-emerald">
                +${o.projectedMonthly}/mo
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">
                    Difficulty
                  </p>
                  <DifficultyDots level={o.difficulty} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">
                    Timeline
                  </p>
                  <div className="mt-1 h-1.5 rounded-full bg-brand-panel-muted/80">
                    <div
                      className="h-full rounded-full bg-brand-accent-teal"
                      style={{ width: `${(o.timelineDays / 60) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-1 text-xs text-brand-text-secondary">{o.timelineDays} days</p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-brand-text-secondary">{o.rationale}</p>
            </div>
          ))}
        </div>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 11 — NEXT 3 ACTIONS
══════════════════════════════════════════════════════════════════ */
function NextActionsSection() {
  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Action Plan</SectionLabel>
        <SectionHeading className="mb-10">What to do in the next 30 days</SectionHeading>

        <div className="space-y-5">
          {F.nextActions.map((a) => (
            <div
              key={a.n}
              className={cn(CARD_CLASS, "grid grid-cols-[auto_1fr] items-start gap-6")}
            >
              <p className="text-5xl font-bold tracking-tight text-brand-accent-teal opacity-[0.22] leading-none">
                {a.n}
              </p>
              <div>
                <h3 className="text-base font-semibold leading-snug text-white">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{a.body}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-accent-emerald/30 bg-brand-accent-emerald/8 px-3 py-1">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-brand-accent-emerald">
                    Expected impact
                  </span>
                  <span className="text-xs font-medium text-white">{a.expectedImpact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PAGE 12 — METHODOLOGY
══════════════════════════════════════════════════════════════════ */
function MethodologySection() {
  const methodCards = [
    {
      title: "Data sources",
      items: [
        "Patreon export (CSV, members + earnings)",
        "Substack export (CSV, subscribers)",
        "YouTube Studio export (CSV, revenue + subscribers)",
        `Report period: ${F.reportPeriod}`,
      ],
    },
    {
      title: "What we calculate",
      items: [
        "Revenue stability from month-over-month variance",
        "Churn segmented by tier, cohort, and timing",
        "Concentration using Gini-style supporter distribution",
        "Platform mix from normalized net revenue",
      ],
    },
    {
      title: "Privacy",
      items: [
        "Your data is encrypted at rest",
        "No data is shared with third parties",
        "You can delete all data from your workspace at any time",
      ],
    },
  ];

  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Methodology &amp; Data</SectionLabel>
        <SectionHeading className="mb-10">How this report was built</SectionHeading>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {methodCards.map((c) => (
            <div key={c.title} className={CARD_CLASS}>
              <h3 className="text-sm font-semibold text-white">{c.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {c.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-brand-text-secondary">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent-teal" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs italic text-brand-text-muted">
          This sample report uses a fictional creator profile. Real reports are built exclusively from your own uploaded
          data.
        </p>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   KEY FINDINGS CARDS
   Screenshot-ready, reusable from the fixture
══════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════
   ADVISOR INSIGHT CARDS  (LLM-generated intelligence layer)
══════════════════════════════════════════════════════════════════ */
function AdvisorInsightSection() {
  const ai = F.advisorInsight;

  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Advisor Intelligence</SectionLabel>
        <SectionHeading className="mb-3">What the AI found in your data</SectionHeading>
        <p className="mb-10 text-base text-brand-text-secondary">
          These cards are generated fresh for every report — synthesised directly from your uploaded numbers,
          not pulled from a template.
        </p>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Business Snapshot */}
          <div
            className={CARD_CLASS + " flex flex-col gap-4"}
            style={{ borderLeftColor: "var(--es-color-accent-teal)", borderLeftWidth: 3 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{
                  borderColor: "color-mix(in srgb, var(--es-color-accent-teal) 40%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--es-color-accent-teal) 8%, transparent)",
                  color: "var(--es-color-accent-teal)",
                }}
              >
                Business Snapshot
              </span>
              {ai.businessSnapshot.confidence && (
                <span
                  className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]"
                  style={{
                    borderColor: "color-mix(in srgb, var(--es-color-accent-emerald) 35%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--es-color-accent-emerald) 8%, transparent)",
                    color: "var(--es-color-accent-emerald)",
                  }}
                >
                  {ai.businessSnapshot.confidence} confidence
                </span>
              )}
            </div>

            <h3 className="text-base font-semibold leading-snug text-white">
              {ai.businessSnapshot.headline}
            </h3>

            <p className="text-sm leading-relaxed text-brand-text-secondary">
              {ai.businessSnapshot.summary}
            </p>

            <ul className="space-y-2">
              {ai.businessSnapshot.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: "var(--es-color-accent-teal)" }}
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8l3.5 3.5L13 4.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-1">
              <span
                className="inline-flex cursor-default items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  borderColor: "color-mix(in srgb, var(--es-color-accent-teal) 30%, transparent)",
                  color: "var(--es-color-accent-teal)",
                }}
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 1v4.5M6 7v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {ai.businessSnapshot.actionLabel}
              </span>
            </div>
          </div>

          {/* Biggest Opportunity */}
          <div
            className={CARD_CLASS + " flex flex-col gap-4"}
            style={{ borderLeftColor: "var(--es-color-accent-emerald)", borderLeftWidth: 3 }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{
                  borderColor: "color-mix(in srgb, var(--es-color-accent-emerald) 40%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--es-color-accent-emerald) 8%, transparent)",
                  color: "var(--es-color-accent-emerald)",
                }}
              >
                Biggest Opportunity
              </span>
            </div>

            <h3 className="text-base font-semibold leading-snug text-white">
              {ai.biggestOpportunity.headline}
            </h3>

            <p className="text-sm leading-relaxed text-brand-text-secondary">
              {ai.biggestOpportunity.summary}
            </p>

            <ul className="space-y-2">
              {ai.biggestOpportunity.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-brand-text-secondary">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: "var(--es-color-accent-emerald)" }}
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8l3.5 3.5L13 4.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-1">
              <span
                className="inline-flex cursor-default items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  borderColor: "color-mix(in srgb, var(--es-color-accent-emerald) 30%, transparent)",
                  color: "var(--es-color-accent-emerald)",
                }}
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M7 3.5L9.5 6 7 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {ai.biggestOpportunity.actionLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Top Risk — full width */}
        <div
          className={CARD_CLASS + " mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6"}
          style={{ borderLeftColor: "#f87171", borderLeftWidth: 3 }}
        >
          <div className="shrink-0">
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{
                borderColor: "rgba(248,113,113,0.4)",
                backgroundColor: "rgba(248,113,113,0.08)",
                color: "#f87171",
              }}
            >
              Top Risk
            </span>
          </div>
          <div>
            <h3 className="text-base font-semibold leading-snug text-white">
              {ai.topRisk.headline}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
              {ai.topRisk.summary}
            </p>
          </div>
        </div>
      </Container>
    </SampleReportSection>
  );
}

function FindingsCardsSection() {
  return (
    <SampleReportSection>
      <Container>
        <SectionLabel>Key Findings</SectionLabel>
        <SectionHeading className="mb-3">The findings that matter most</SectionHeading>
        <p className="mb-10 text-base text-brand-text-secondary">
          These are the specific numbers your report surfaces — not estimates, your real data.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {F.findings.map((finding) => (
            <SampleFindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      </Container>
    </SampleReportSection>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FOOTER CTA  (hidden in print)
══════════════════════════════════════════════════════════════════ */
function SampleReportFooterCta() {
  return (
    <section
      id="sample-report-cta"
      className="sample-report-footer-cta border-t border-brand-border/60 py-20 text-center"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 52%), var(--es-color-bg)",
      }}
    >
      <Container>
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Get this clarity for your own business.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-text-secondary">
            Upload your data. We validate it free. You only pay when you generate a report.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <a
              href={primaryCtaHref}
              className={buttonClassName({
                variant: "primary",
                className:
                  "rounded-xl border-brand-accent-emerald/50 bg-[linear-gradient(120deg,rgba(29,78,216,0.98),rgba(47,217,197,0.9))] px-7 py-3.5 text-sm font-semibold text-white shadow-brand-glow hover:brightness-110",
              })}
            >
              Generate my private report — $25
            </a>
            <Link
              href={publicUrls.pricing}
              className={buttonClassName({
                variant: "secondary",
                className:
                  "rounded-xl border-brand-border-strong/70 bg-brand-panel/70 px-5 py-3.5 text-sm text-brand-text-secondary hover:bg-brand-panel hover:text-white",
              })}
            >
              See pricing
            </Link>
          </div>

          <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-accent-teal/80">
            Free validation · Your data stays private · No public estimates
          </p>
        </div>
      </Container>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT PAGE COMPONENT
══════════════════════════════════════════════════════════════════ */
export function SampleReportPage() {
  return (
    <div className="sample-report-root">
      <CoverSection />
      <ExecutiveSummarySection />
      <AdvisorInsightSection />
      <FindingsCardsSection />
      <RevenueOverviewSection />
      <IncomeStabilitySection />
      <PlatformMixSection />
      <SubscriberHealthSection />
      <RevenueConcentrationSection />
      <GrowthMomentumSection />
      <StrengthsRisksSection />
      <OpportunitiesSection />
      <NextActionsSection />
      <MethodologySection />
      <SampleReportFooterCta />
    </div>
  );
}
