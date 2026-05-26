export type FindingTone = "positive" | "warning" | "critical" | "opportunity";

export type SampleFinding = {
  id: string;
  headline: string;
  body: string;
  metric: string;
  metricLabel: string;
  tone: FindingTone;
};

export type SampleTier = {
  name: string;
  price: string;
  activeSubs: number;
  revenuePct: number;
  churnPct: number;
  status: "healthy" | "problem" | "strong";
};

export type SampleOpportunity = {
  n: string;
  title: string;
  projectedMonthly: number;
  difficulty: 1 | 2 | 3;
  timelineDays: number;
  rationale: string;
};

export type SampleAction = {
  n: string;
  title: string;
  body: string;
  expectedImpact: string;
};


export type SampleAdvisorCard = {
  headline: string;
  summary: string;
  bullets: readonly string[];
  actionLabel: string;
  confidence?: "high" | "medium" | "directional";
};

export type SampleYouTubeGrowth = {
  subscriberCount: number;
  subscriberGained: number;
  totalViews: number;
  avgWatchTimeMins: number;
  topVideoTitle: string;
  topVideoViews: number;
};

export const ANNA_REYES_FIXTURE = {
  creatorName: "Anna Reyes",
  creatorType: "Fiction writer",
  platformLabels: "Patreon + Substack + YouTube",
  reportPeriod: "90 days ending Mar 31, 2026",
  generatedDate: "Apr 2, 2026",

  // Headline metrics — these numbers are promised by the landing page and must not drift
  avgMonthlyRevenue: 4280,
  totalRevenue90d: 12843,
  incomeStabilityScore: 74,
  patreonConcentrationPct: 71,   // 71%
  supporterTierChurnPct: 42,     // 42% churn from $8 tier
  projectedUpsidePct: 18,        // +18% from tier restructure
  projectedUpsideMonthly: 770,

  // 12-month revenue trend
  monthlyRevenueBars: [920, 1080, 1140, 1210, 1340, 1380, 1420, 1460, 1510, 1540, 1620, 1683],

  // Platform breakdown
  platforms: [
    { name: "Patreon",        revenue: 9119, pct: 71, trend: "Stable upward"          },
    { name: "Substack",       revenue: 2690, pct: 21, trend: "Sharp growth last 30d"  },
    { name: "YouTube (ads)",  revenue: 1034, pct: 8,  trend: "Flat"                   },
  ],

  // Income stability sub-scores
  stabilitySubScores: [
    { label: "Revenue consistency",     score: 82, note: "Low month-to-month variance"                },
    { label: "Recurring revenue share", score: 89, note: "Strong — most income is subscription-based" },
    { label: "Payer diversity",         score: 54, note: "Concentrated in top tier supporters"        },
    { label: "Platform balance",        score: 41, note: "Over-reliant on Patreon"                    },
  ],

  // Patreon tiers
  tiers: [
    { name: "Reader",    price: "$5",  activeSubs: 412, revenuePct: 23, churnPct: 18, status: "healthy" },
    { name: "Supporter", price: "$8",  activeSubs: 287, revenuePct: 32, churnPct: 42, status: "problem" },
    { name: "Insider",   price: "$15", activeSubs: 94,  revenuePct: 22, churnPct: 12, status: "healthy" },
    { name: "Patron",    price: "$25", activeSubs: 58,  revenuePct: 23, churnPct: 7,  status: "strong"  },
  ] satisfies SampleTier[],

  // $8 tier churn timing — cancellations by month of membership (months 1–12+)
  churnTimingBars: [8, 34, 41, 22, 14, 9, 6, 4, 3, 2, 2, 1],

  // Revenue concentration
  totalSupporters: 851,
  topPctSupporters: 5,
  topPctCount: 27,
  topPctRevenuePct: 46,        // 46% of revenue from top 5%
  topPctRevenueLoss: 5907,

  // Lorenz curve points: [cumulative supporters %, cumulative revenue %]
  lorenzPoints: [
    [0, 0], [5, 46], [10, 58], [20, 74], [30, 83],
    [40, 88], [50, 91], [65, 95], [80, 98], [100, 100],
  ] as Array<[number, number]>,

  // 6-8 screenshot-ready findings cards
  findings: [
    {
      id: "churn-tier",
      headline: "42% of your churn is coming from one tier.",
      body: "The $8 Supporter tier drives nearly half of all cancellations. Most subscribers leave within 60 days of joining.",
      metric: "42%",
      metricLabel: "of all churn",
      tone: "critical",
    },
    {
      id: "top-supporters",
      headline: "Your top 5% of supporters drive 46% of revenue.",
      body: "27 people out of 851 are responsible for almost half your income. They should be treated like clients, not fans.",
      metric: "46%",
      metricLabel: "from top 5%",
      tone: "warning",
    },
    {
      id: "platform-concentration",
      headline: "71% of income depends on one platform.",
      body: "Patreon concentration is above the 65% risk threshold. One fee structure change could materially impact monthly revenue.",
      metric: "71%",
      metricLabel: "Patreon share",
      tone: "warning",
    },
    {
      id: "tier-restructure",
      headline: "A tier restructure could lift revenue by 18%.",
      body: "Replacing the $8 tier with a $12 tier — with one clearly defined benefit — is projected to add ~$520/month within 90 days.",
      metric: "+18%",
      metricLabel: "projected uplift",
      tone: "opportunity",
    },
    {
      id: "top-27",
      headline: "27 supporters account for nearly half the business.",
      body: "If Anna's top 5% disappeared tomorrow, she'd lose $5,907/month. This is the number most creators never calculate.",
      metric: "27",
      metricLabel: "key supporters",
      tone: "warning",
    },
    {
      id: "youtube-gap",
      headline: "YouTube is the largest audience, smallest revenue.",
      body: "28,000 subscribers, $1,034 in revenue. A 0.5% conversion to Substack would add roughly 140 new paying subscribers.",
      metric: "28k",
      metricLabel: "YouTube subs",
      tone: "opportunity",
    },
    {
      id: "stability",
      headline: "EarnScore: 74 / 100 — Strong.",
      body: "89% of revenue is recurring with low variance. The foundation is solid — the risk is in distribution, not volume.",
      metric: "74",
      metricLabel: "EarnScore",
      tone: "positive",
    },
    {
      id: "recurring",
      headline: "89% of revenue is recurring subscription income.",
      body: "A strong recurring base means the business isn't fragile by nature. Platform concentration and one bad tier put it at risk.",
      metric: "89%",
      metricLabel: "recurring",
      tone: "positive",
    },
  ] satisfies SampleFinding[],

  // Opportunities (quantified)
  opportunities: [
    {
      n: "01",
      title: "Restructure the $8 tier",
      projectedMonthly: 520,
      difficulty: 1 as const,
      timelineDays: 30,
      rationale:
        "Replace the $8 tier with a $12 tier offering one defined benefit. Retention at the $12 price point in peer creators averages 74% vs 58% at $8.",
    },
    {
      n: "02",
      title: "Add a $40 top tier",
      projectedMonthly: 250,
      difficulty: 2 as const,
      timelineDays: 45,
      rationale:
        "Top 5% already drives 46% of revenue. A small portion of the $25 tier (estimated 8–12 supporters) would upgrade for even modest added value.",
    },
    {
      n: "03",
      title: "YouTube → Substack funnel",
      projectedMonthly: 180,
      difficulty: 2 as const,
      timelineDays: 60,
      rationale:
        "Even a 0.5% conversion rate from YouTube subscribers would deliver ~140 new Substack subscribers. Current rate is effectively 0%.",
    },
  ] satisfies SampleOpportunity[],

  // Next 3 actions
  nextActions: [
    {
      n: "01",
      title: "Close signups to the $8 tier this week.",
      body: "Keep existing supporters grandfathered. Open a new $12 tier with a clearly defined benefit — monthly mailbag, early chapter access.",
      expectedImpact: "+$520/month within 90 days",
    },
    {
      n: "02",
      title: "Identify and contact your top 27 supporters individually.",
      body: "Not a mass email — personalized. Ask what they want more of. This is market research and loyalty-building in one move.",
      expectedImpact: "3–5 upgrades worth $150+/month",
    },
    {
      n: "03",
      title: "Add one Substack signup link to every YouTube video description and pinned comment.",
      body: "Simplest possible funnel. Revisit in 60 days.",
      expectedImpact: "80–140 new Substack subscribers",
    },
  ] satisfies SampleAction[],

  // Advisor insight cards — mirrors the LLM-generated output format from creator_insight_engine.py
  advisorInsight: {
    businessSnapshot: {
      headline: "Substack growth is accelerating while Patreon holds — your foundation is stronger than any single dashboard shows.",
      summary: "Anna runs a three-platform fiction business at $4,280/month with a 74 EarnScore, putting her in the upper third of creators at this revenue tier. The income is recurring, predictable, and growing. The risk isn't the total — it's distribution: 71% concentrated on one platform, and one tier driving 42% of all cancellations.",
      bullets: [
        "Recurring revenue share is 89% — unusually strong for this revenue tier",
        "Substack posted its sharpest 30-day growth of the period",
        "The $8 Supporter tier carries the highest churn and the most fixable leverage",
      ] as const,
      actionLabel: "Jump to subscriber health",
      confidence: "high" as const,
    } satisfies SampleAdvisorCard,
    biggestOpportunity: {
      headline: "Restructuring the $8 tier is worth +$770/month without acquiring a single new subscriber.",
      summary: "287 subscribers sit at 42% annual churn — nearly double the healthy threshold. Most cancel within 60 days. The price point is caught between risk-free and essential. A targeted restructure is projected to recover $770/month in net revenue within 90 days.",
      bullets: [
        "287 active subscribers currently at the highest-risk price point",
        "$8 tier churn is 2.3× higher than the $5 Reader tier",
        "+18% revenue recovery modeled from merge-up or a clearly defined perk refresh",
      ] as const,
      actionLabel: "See the restructure projection",
    } satisfies Omit<SampleAdvisorCard, "confidence">,
    topRisk: {
      headline: "Patreon at 71% concentration is above the threshold where a single policy change becomes a business event.",
      summary: "At 71% revenue concentration, a Patreon fee increase, policy shift, or outage directly affects 71 cents of every dollar. Substack's growth is the natural hedge — accelerating it is the most important strategic move in the next 6 months.",
    },
  },

  // YouTube channel growth (audience data — separate from ad revenue)
  youtubeGrowth: {
    subscriberCount: 28400,
    subscriberGained: 340,
    totalViews: 48200,
    avgWatchTimeMins: 6.2,
    topVideoTitle: "Writing a Novel in 30 Days — Real Talk",
    topVideoViews: 8900,
  } satisfies SampleYouTubeGrowth,
} as const;

export type AnnaReyesFixture = typeof ANNA_REYES_FIXTURE;
