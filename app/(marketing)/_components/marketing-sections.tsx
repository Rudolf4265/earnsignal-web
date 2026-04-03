import Image from "next/image";
import { Card, Container, Section, cn } from "@earnsigma/ui";

export type InsightIconKey =
  | "churn"
  | "dependence"
  | "supporters"
  | "migration"
  | "stability"
  | "platform"
  | "opportunity";

type InsightBucket = "revenue-risk" | "monetization" | "growth";

type DiscoverInsight = {
  title: string;
  description: string;
  signal: string;
  indicator: string;
  bars: [number, number, number, number, number, number];
  icon: InsightIconKey;
  bucket: InsightBucket;
};

type SupportedPlatformCard = {
  platform: string;
  description: string;
  format: string;
  icon: string;
  note?: string;
  comingSoon?: boolean;
};

const discoverInsights: DiscoverInsight[] = [
  {
    title: "Where Your Subscribers Are Leaving",
    description: "Identify which tiers drive cancellations and when subscriber churn accelerates.",
    signal: "42% churn in your $8 tier",
    indicator: "Loss Concentration",
    bars: [92, 70, 46, 34, 28, 20],
    icon: "churn",
    bucket: "revenue-risk",
  },
  {
    title: "How Dependent You Are On Top Fans",
    description: "Measure whether your revenue is stable or concentrated among a small number of supporters.",
    signal: "Top 12 supporters drive 58% of monthly revenue",
    indicator: "Concentration",
    bars: [26, 34, 43, 57, 70, 88],
    icon: "dependence",
    bucket: "revenue-risk",
  },
  {
    title: "Your Top 5% of Supporters",
    description: "See whether a small group of supporters contributes a disproportionate share of revenue.",
    signal: "Top 5% currently contribute 46% of earnings",
    indicator: "High Value Segment",
    bars: [20, 24, 29, 36, 56, 76],
    icon: "supporters",
    bucket: "monetization",
  },
  {
    title: "How Fans Move Between Tiers",
    description: "Track whether fans upgrade, downgrade, or remain stuck in lower-value tiers.",
    signal: "Upgrade flow improves after day 14 retention",
    indicator: "Tier Migration",
    bars: [24, 28, 34, 45, 56, 72],
    icon: "migration",
    bucket: "monetization",
  },
  {
    title: "Income Stability",
    description: "Understand how predictable your income is over time, and where volatility is highest.",
    signal: "74/100 with moderate week-to-week variance",
    indicator: "Stability",
    bars: [42, 48, 56, 66, 74, 78],
    icon: "stability",
    bucket: "growth",
  },
  {
    title: "Platform Risk",
    description: "See how exposed your income is to a single platform, and what that means for your business.",
    signal: "71% of revenue is currently tied to Patreon",
    indicator: "Platform Risk",
    bars: [78, 72, 67, 55, 40, 28],
    icon: "platform",
    bucket: "growth",
  },
];

const supportedPlatforms: SupportedPlatformCard[] = [
  {
    platform: "Patreon",
    description: "Membership revenue",
    format: "CSV",
    icon: "/platforms/patreon.svg",
  },
  {
    platform: "Substack",
    description: "Subscriber data",
    format: "CSV",
    icon: "/platforms/substack.svg",
  },
  {
    platform: "YouTube",
    description: "Analytics data",
    format: "CSV / ZIP",
    icon: "/platforms/youtube.png",
  },
  {
    platform: "Instagram",
    description: "Performance data",
    format: "ZIP",
    icon: "/platforms/instagram.svg",
  },
  {
    platform: "TikTok",
    description: "Performance data",
    format: "ZIP",
    icon: "/platforms/tiktok.svg",
  },
  {
    platform: "Snapchat",
    description: "Audience & performance data",
    format: "Coming soon",
    icon: "/platforms/snapchat.svg",
    note: "Expanding platform support",
    comingSoon: true,
  },
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function InsightGlyph({ icon, className }: { icon: InsightIconKey; className?: string }) {
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

function InsightCard({ insight }: { insight: DiscoverInsight }) {
  return (
    <Card className="relative flex h-full flex-col overflow-hidden border-brand-border/75 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-5 sm:p-6">
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
              key={`${insight.title}-bar-${index}`}
              className="w-full rounded-sm bg-brand-accent-blue/65"
              style={{ height: `${height}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

export function MarketingSupportedTodaySection() {
  return (
    <Section
      id="supported-today"
      className="relative border-t border-brand-border/60 pb-16 pt-16 sm:pb-20 sm:pt-20"
      data-testid="marketing-supported-today"
    >
      <Container>
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">SUPPORTED TODAY</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
            Built around the platforms your business runs on
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
            No new tools. No new workflows. Just your existing data.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supportedPlatforms.map((item) => {
            const slug = slugify(item.platform);
            const isComingSoon = item.comingSoon === true;

            return (
              <Card
                key={item.platform}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-5",
                  isComingSoon
                    ? "border-brand-border/55 bg-[linear-gradient(165deg,rgba(16,29,56,0.72),rgba(10,20,40,0.78))] opacity-[0.92]"
                    : "border-brand-border/65 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))]",
                )}
                data-testid={`marketing-platform-card-${slug}`}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_42%)]",
                    isComingSoon && "opacity-50",
                  )}
                  aria-hidden="true"
                />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-brand-panel-muted/65",
                        isComingSoon ? "border-brand-border/65" : "border-brand-border-strong/70",
                      )}
                    >
                      <Image src={item.icon} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-white">{item.platform}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">{item.description}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.11em]",
                      isComingSoon
                        ? "border-brand-accent-blue/35 bg-brand-panel/85 text-brand-text-secondary"
                        : "border-brand-border-strong/60 bg-brand-panel px-2.5 py-1 text-brand-text-secondary",
                    )}
                  >
                    {isComingSoon ? "Coming Soon" : item.format}
                  </span>
                </div>

                <div className="relative mt-5 flex items-center justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-brand-text-muted">
                    {isComingSoon ? (item.note ?? "Expanding platform support") : item.format}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="mt-5 text-xs text-brand-text-muted">
          Support is currently limited to specific export formats by platform.
        </p>
      </Container>
    </Section>
  );
}

export function MarketingDataRevealsSection() {
  return (
    <Section
      className="relative border-t border-brand-border/55 pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24"
      data-testid="marketing-features-reveals"
    >
      <Container>
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">WHAT YOUR DATA REVEALS</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
            What your data reveals about your business
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
            Use your platform data. See the patterns public tools cannot surface.
          </p>
        </div>

        <div className="mt-12 space-y-10">
          <div>
            <div className="mb-5 flex items-center gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">Revenue Risk</span>
              <span className="h-px flex-1 bg-brand-border/55" aria-hidden="true" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {discoverInsights
                .filter((insight) => insight.bucket === "revenue-risk")
                .map((insight) => (
                  <InsightCard key={insight.title} insight={insight} />
                ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">Monetization Opportunity</span>
              <span className="h-px flex-1 bg-brand-border/55" aria-hidden="true" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {discoverInsights
                .filter((insight) => insight.bucket === "monetization")
                .map((insight) => (
                  <InsightCard key={insight.title} insight={insight} />
                ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">Growth Quality</span>
              <span className="h-px flex-1 bg-brand-border/55" aria-hidden="true" />
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-brand-text-muted/65">Revenue sustainability metrics</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {discoverInsights
                .filter((insight) => insight.bucket === "growth")
                .map((insight) => (
                  <InsightCard key={insight.title} insight={insight} />
                ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function MarketingTwoLensesSection() {
  return (
    <Section
      className="relative border-t border-brand-border/55 pb-16 pt-16 sm:pb-20 sm:pt-20"
      data-testid="marketing-features-lenses"
    >
      <Container>
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">TWO LENSES</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
            One workspace. Two lenses.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Card className="relative overflow-hidden border-brand-border/75 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-6 sm:p-7">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-accent-blue/15 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <span className="inline-flex rounded-full border border-brand-accent-blue/50 bg-brand-accent-blue/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-accent-blue">
                Earn
              </span>
            </div>
            <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-white">Revenue health</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-brand-text-secondary">
              Understand income stability, subscriber loss, concentration risk, and monetization health.
            </p>
            <ul className="relative mt-5 space-y-2.5">
              {[
                "Income concentration and stability",
                "Subscriber loss by tier and timeline",
                "Monetization health score",
                "Tier migration flow analysis",
                "Platform income risk",
              ].map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-sm text-brand-text-secondary">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-accent-blue/80" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="relative overflow-hidden border-brand-border/75 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-6 sm:p-7">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-accent-teal/12 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <span className="inline-flex rounded-full border border-brand-accent-teal/50 bg-brand-accent-teal/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-accent-teal">
                Grow
              </span>
              <span className="inline-flex rounded-full border border-brand-border-strong/60 bg-brand-panel px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.11em] text-brand-text-muted">
                Early access
              </span>
            </div>
            <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-white">Audience health</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-brand-text-secondary">
              See audience momentum, engagement patterns, and how growth signals connect back to the business.
            </p>
            <ul className="relative mt-5 space-y-2.5">
              {[
                "Audience momentum and growth signals",
                "Engagement and content performance",
                "Follower-to-subscriber conversion",
                "Available as supported analytics expand",
              ].map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-sm text-brand-text-secondary">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-accent-teal/70" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
