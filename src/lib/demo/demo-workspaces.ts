import type { DashboardMode } from "../dashboard/mode";
import { DASHBOARD_MODE_QUERY_PARAM, DEFAULT_DASHBOARD_MODE, parseDashboardMode } from "../dashboard/mode";
import {
  createActionCards,
  createDiagnosisModel,
  createEarnModel,
  createGrowModel,
  createInsightCard,
  createLatestReportRow,
  createProvisionalStability,
  createRevenueTrend,
  createSampleReport,
  createUtilityModel,
  formatDemoDate,
} from "./demo-dashboard-fixtures";
import type { DemoWorkspaceFixture } from "./demo-types";

export const DEMO_WORKSPACE_QUERY_PARAM = "persona";

function reportHref(anchorId: string): string {
  return `#${anchorId}`;
}

const youtubeHeavyReport = createLatestReportRow("demo-youtube-heavy-rpt", "2026-03-12T14:30:00Z");
const youtubeHeavyAnchor = "sample-report-youtube-heavy";
const membershipLedReport = createLatestReportRow("demo-membership-led-rpt", "2026-03-09T16:10:00Z");
const membershipLedAnchor = "sample-report-membership-led";
const balancedBusinessReport = createLatestReportRow("demo-balanced-business-rpt", "2026-03-13T10:15:00Z");
const balancedBusinessAnchor = "sample-report-balanced-business";
const audienceFirstReport = createLatestReportRow("demo-audience-first-rpt", "2026-03-11T11:00:00Z");
const audienceFirstAnchor = "sample-report-audience-first";
const partialWorkspaceReport = createLatestReportRow("demo-partial-workspace-rpt", "2026-03-08T09:25:00Z");
const partialWorkspaceAnchor = "sample-report-partial-workspace";
const churnRiskReport = createLatestReportRow("demo-churn-risk-rpt", "2026-03-10T13:20:00Z");
const churnRiskAnchor = "sample-report-churn-risk";
const momentumDownReport = createLatestReportRow("demo-momentum-down-rpt", "2026-03-12T08:45:00Z");
const momentumDownAnchor = "sample-report-momentum-down";

export const DEMO_WORKSPACES: DemoWorkspaceFixture[] = [
  {
    id: "youtube-heavy",
    shortLabel: "Monetized video creator",
    label: "YouTube-heavy monetized creator",
    focusLabel: "Earn-heavy",
    stateLabel: "Healthy",
    scenario: "Ads, sponsors, and memberships are all contributing, but the revenue base still leans heavily on YouTube.",
    description: "Strong Earn, moderate Grow, and a believable channel concentration story for manual QA and stakeholder walkthroughs.",
    defaultMode: "earn",
    dashboard: {
      primaryCtaLabel: "Refresh supported data",
      primaryCtaHref: "/app/data",
      hasUpload: true,
      hasReports: true,
      earn: {
        model: createEarnModel({
          netRevenue: 48200,
          subscribers: 18450,
          stabilityIndex: 87,
          revenueDeltaText: "Up 7.4% vs the prior report.",
          subscriberDeltaText: "Up 2.1% since the prior report.",
        }),
        diagnosis: createDiagnosisModel({
          heading: "Concentration pressure",
          summary:
            "Revenue is growing, but one platform still carries enough weight that a weak upload cycle could pull the month off target.",
          supportingMetrics: [
            {
              id: "youtube-heavy-platform-mix",
              label: "Platform mix",
              value: "68% from YouTube",
              detail: "Sponsor, ads, and membership revenue are still concentrated around one channel.",
            },
            {
              id: "youtube-heavy-sponsor-fill",
              label: "Sponsor fill",
              value: "82%",
              detail: "Demand is healthy, but inventory is clustering around the same mid-roll topics.",
            },
            {
              id: "youtube-heavy-member-net-adds",
              label: "Member net adds",
              value: "+190",
              detail: "Memberships are still growing, which helps cushion month-to-month swings.",
            },
          ],
          comparisonContext: {
            label: "What changed",
            body: "Recent sponsor recovery offset a softer ad RPM week, so the business still finished ahead of the last report.",
            detail: "Healthy demand is masking a concentration issue that will matter more if sponsor pacing slows.",
          },
        }),
        actionCards: createActionCards("unlocked", [
          {
            id: "youtube-heavy-action-1",
            label: "Recommended action",
            body: "Package the strongest sponsor-safe topics into a repeatable mini-series before platform dependence widens further.",
            detail: "This keeps sponsor inventory growing without relying on one breakout upload pattern.",
          },
          {
            id: "youtube-heavy-action-2",
            label: "Watch next cycle",
            body: "Track whether memberships keep offsetting ad volatility when RPM softens.",
            detail: "If member growth cools at the same time, channel concentration becomes a sharper risk.",
            stateLabel: "Watch next cycle",
            stateTone: "neutral",
          },
        ]),
        insights: [
          createInsightCard({
            id: "youtube-heavy-insight-1",
            variant: "warning",
            title: "Platform Risk",
            body: "YouTube still carries most monetization, even though the broader business is improving.",
            implication: "Diversifying a little more now lowers the chance that one weak upload week drags the full month.",
          }),
          createInsightCard({
            id: "youtube-heavy-insight-2",
            variant: "positive",
            title: "Revenue Momentum",
            body: "Three consecutive sample periods show higher net revenue with sponsor demand holding.",
            implication: "The current format is working, so the best move is to widen supply without breaking what converts.",
          }),
          createInsightCard({
            id: "youtube-heavy-insight-3",
            variant: "positive",
            title: "Creator Stability",
            body: "Membership support is helping the business stay steadier between sponsor cycles.",
            implication: "A steadier base gives more room to experiment on content packaging and pricing.",
          }),
        ],
        revenueTrend: createRevenueTrend([
          { label: "Aug", value: 37100 },
          { label: "Sep", value: 38900 },
          { label: "Oct", value: 40200 },
          { label: "Nov", value: 41850 },
          { label: "Dec", value: 44100 },
          { label: "Jan", value: 46500 },
          { label: "Feb", value: 48200 },
        ]),
        trendPreview: "Net revenue rose for a third straight cycle, led by steadier sponsor pacing and improving membership support.",
      },
      grow: {
        model: createGrowModel({
          hasStructuredGrowthEvidence: true,
          creatorScore: 74,
          growthVelocityPercent: 3.6,
          engagementRate: 6.9,
          audienceValueScore: 71,
          diagnosisSummary:
            "Audience demand is healthy, but the next growth step depends on widening interest beyond the top-performing video cluster.",
          trendSummary: "Reach is still improving, though returning viewers are concentrating around a narrow topic set.",
          bestPostingWindow: {
            primaryWindow: "Wed-Thu 1 PM to 4 PM",
            secondaryWindow: "Sun 10 AM to noon",
            rationale: "Midweek uploads still carry the strongest watch-through rate in this sample workspace.",
          },
          topOpportunity: {
            title: "Turn the strongest sponsor-safe topics into a repeatable mini-series",
            summary: "Use the formats already converting well to broaden inventory without leaning harder on one breakout video.",
            estimatedImpact: "Could widen sponsor-ready supply while keeping audience quality stable.",
          },
          nextActions: [
            {
              title: "Standardize the mid-roll-friendly topic cadence",
              impact: "Reduce reliance on one-off spikes while keeping sponsor demand easier to fulfill.",
            },
            {
              title: "Test one adjacent topic every week",
              impact: "Find formats that can carry watch-through without increasing concentration risk.",
            },
            {
              title: "Protect the membership CTA on high-retention uploads",
              impact: "Keep recurring support growing even when ad RPM moves around.",
            },
          ],
          sourceUpdatedAt: "2026-03-12T14:30:00Z",
        }),
      },
      utility: createUtilityModel({
        entitled: true,
        planTier: "Pro",
        planStatusLabel: "Active",
        planStatusVariant: "good",
        workspaceReadiness: "Sample uploads are connected and the latest demo report is ready to review.",
        platformsConnectedLabel: "2 connected",
        coverageLabel: "8 months",
        lastUploadLabel: formatDemoDate("2026-03-12T14:30:00Z"),
        latestReportRow: youtubeHeavyReport,
        latestReportHref: reportHref(youtubeHeavyAnchor),
        latestReportStatusLabel: "Ready",
        latestReportStatusVariant: "good",
      }),
    },
    sampleReport: createSampleReport({
      anchorId: youtubeHeavyAnchor,
      title: "Latest sample report",
      generatedAt: "2026-03-12T14:30:00Z",
      summary: "Revenue expanded again, but the business still needs more diversity outside its dominant video cluster.",
      highlights: [
        "Sponsor pacing improved without hurting audience retention.",
        "Membership growth is cushioning normal ad volatility.",
        "Channel concentration remains the clearest medium-term risk.",
      ],
      nextSteps: [
        "Widen the repeatable topic set that keeps sponsor inventory healthy.",
        "Track whether membership net adds still offset weaker ad RPM weeks.",
      ],
    }),
  },
  {
    id: "membership-led",
    shortLabel: "Membership-led creator business",
    label: "Patreon and Substack recurring-revenue creator",
    focusLabel: "Earn-heavy",
    stateLabel: "Recurring",
    scenario: "Recurring support is healthy overall, but retention is doing more work than acquisition.",
    description: "Strong Earn, limited Grow, and a useful locked-state walkthrough because premium next actions remain gated in this sample.",
    defaultMode: "earn",
    dashboard: {
      primaryCtaLabel: "Open help guide",
      primaryCtaHref: "/app/help#upload-guide",
      hasUpload: true,
      hasReports: true,
      earn: {
        model: createEarnModel({
          netRevenue: 31400,
          subscribers: 4910,
          stabilityIndex: 82,
          revenueDeltaText: "Up 3.1% vs the prior report.",
          subscriberDeltaText: "Flat vs the prior report.",
        }),
        diagnosis: createDiagnosisModel({
          heading: "Churn pressure",
          summary:
            "Recurring support is still good, but the newest cohort is renewing more slowly than the base that built the business.",
          supportingMetrics: [
            {
              id: "membership-led-renewal",
              label: "30-day renewal",
              value: "72%",
              detail: "Recent cohorts are renewing below the older baseline, which makes retention the key lever.",
            },
            {
              id: "membership-led-concentration",
              label: "Top tier share",
              value: "41%",
              detail: "Higher-priced supporters remain loyal, but concentration means churn hits harder if this slips.",
            },
            {
              id: "membership-led-newsletter",
              label: "Newsletter-led conversion",
              value: "63%",
              detail: "Email is still the biggest conversion source for new recurring support.",
            },
          ],
          comparisonContext: {
            label: "What changed",
            body: "Gross support held up, but slower renewals in the newest cohort are limiting how much recurring revenue can compound.",
            detail: "Retention is still positive enough to stabilize the business, but it is no longer the effortless growth engine.",
          },
        }),
        actionCards: createActionCards("locked"),
        insights: [
          createInsightCard({
            id: "membership-led-insight-1",
            variant: "warning",
            title: "Subscriber Churn Risk",
            body: "The newest supporters are renewing more slowly than the established base.",
            implication: "If that pattern continues, recurring revenue becomes less predictable even if gross support still looks solid.",
          }),
          createInsightCard({
            id: "membership-led-insight-2",
            variant: "positive",
            title: "Revenue Momentum",
            body: "Recurring revenue still grew modestly, helped by steady email-driven conversion.",
            implication: "The funnel is intact, so sharper retention work can still raise the next cycle quickly.",
          }),
          createInsightCard({
            id: "membership-led-insight-3",
            variant: "neutral",
            title: "Business Signal",
            body: "Growth evidence is mostly monetization-side in this sample workspace.",
            implication: "This is a good scenario for testing limited Grow guidance without overstating live analytics coverage.",
          }),
        ],
        revenueTrend: createRevenueTrend([
          { label: "Sep", value: 28600 },
          { label: "Oct", value: 29250 },
          { label: "Nov", value: 30100 },
          { label: "Dec", value: 30550 },
          { label: "Jan", value: 31100 },
          { label: "Feb", value: 31400 },
        ]),
        trendPreview: "Recurring revenue is still climbing, but the newest membership cohort is not renewing at the same pace as the older base.",
      },
      grow: {
        model: createGrowModel({
          hasStructuredGrowthEvidence: false,
          creatorScore: null,
          growthVelocityPercent: null,
          engagementRate: null,
          audienceValueScore: null,
          diagnosisSummary:
            "Community touchpoints are working, but richer audience analytics are still missing from this sample workspace.",
          trendSummary: "Open-rate and pledge stability look healthy; measured Grow scorecards would need more audience-side evidence.",
          bestPostingWindow: null,
          topOpportunity: {
            title: "Document the referral loop behind the best-renewing cohort",
            summary: "Capture which newsletter and community touchpoints lead to the longest renewal arcs.",
            estimatedImpact: "Sharper retention experiments next cycle.",
          },
          nextActions: [
            {
              title: "Map the newsletter sequence that drives the longest renewals",
              impact: "Clarify where retention lift is really coming from.",
            },
            {
              title: "Tighten onboarding for the newest supporters",
              impact: "Reduce the renewal gap between fresh and mature cohorts.",
            },
          ],
          sourceUpdatedAt: "2026-03-09T16:10:00Z",
        }),
      },
      utility: createUtilityModel({
        entitled: true,
        planTier: "Report",
        planStatusLabel: "Active",
        planStatusVariant: "good",
        workspaceReadiness: "Sample recurring-revenue inputs are connected and the latest demo report is available.",
        platformsConnectedLabel: "2 connected",
        coverageLabel: "6 months",
        lastUploadLabel: formatDemoDate("2026-03-09T16:10:00Z"),
        latestReportRow: membershipLedReport,
        latestReportHref: reportHref(membershipLedAnchor),
        latestReportStatusLabel: "Ready",
        latestReportStatusVariant: "good",
      }),
    },
    sampleReport: createSampleReport({
      anchorId: membershipLedAnchor,
      title: "Latest sample report",
      generatedAt: "2026-03-09T16:10:00Z",
      summary: "Recurring support is strong enough to keep revenue moving up, but slower renewal in the newest cohort is the clearest risk.",
      highlights: [
        "Newsletter-led conversion is still efficient.",
        "Top-tier supporters remain durable, which helps overall stability.",
        "Renewal softness is appearing first in the newest supporter cohort.",
      ],
      nextSteps: [
        "Tighten the onboarding sequence for new supporters.",
        "Track whether the renewal gap narrows after the next cohort update.",
      ],
    }),
  },
  {
    id: "balanced-business",
    shortLabel: "Balanced creator business",
    label: "Mixed creator business",
    focusLabel: "Balanced",
    stateLabel: "Ideal mix",
    scenario: "Revenue is diversified across memberships, sponsorships, and direct offers, with audience momentum still building.",
    description: "A polished mixed workspace that feels like the strongest end-to-end demo without overstating current live ingestion coverage.",
    defaultMode: "earn",
    dashboard: {
      primaryCtaLabel: "Go to data",
      primaryCtaHref: "/app/data",
      hasUpload: true,
      hasReports: true,
      earn: {
        model: createEarnModel({
          netRevenue: 54600,
          subscribers: 9850,
          stabilityIndex: 91,
          revenueDeltaText: "Up 6.2% vs the prior report.",
          subscriberDeltaText: "Up 4.8% since the prior report.",
        }),
        diagnosis: createDiagnosisModel({
          heading: "Acquisition pressure",
          summary:
            "The business is healthy overall. The next ceiling is turning rising audience interest into more consistent top-of-funnel conversion.",
          supportingMetrics: [
            {
              id: "balanced-business-paid-conversion",
              label: "Offer conversion",
              value: "3.8%",
              detail: "Conversion is steady, but audience growth is moving faster than the paid funnel.",
            },
            {
              id: "balanced-business-recurring-share",
              label: "Recurring share",
              value: "44%",
              detail: "The revenue base is diversified enough to keep the business stable while acquisition improves.",
            },
            {
              id: "balanced-business-returning-audience",
              label: "Returning audience",
              value: "61%",
              detail: "Repeat engagement is strong, which gives acquisition tests a reliable base.",
            },
          ],
          comparisonContext: {
            label: "What changed",
            body: "Audience quality improved faster than conversion, so acquisition efficiency is now the cleanest lever.",
            detail: "This is a healthy constraint, not a crisis signal.",
          },
        }),
        actionCards: createActionCards("unlocked", [
          {
            id: "balanced-business-action-1",
            label: "Recommended action",
            body: "Promote the highest-retention lead magnet across the content formats already driving repeat engagement.",
            detail: "The audience base is healthy enough that a tighter top-of-funnel offer should compound quickly.",
          },
          {
            id: "balanced-business-action-2",
            label: "Recommended action",
            body: "Bundle one recurring offer with the best-performing direct product launch window.",
            detail: "This keeps monetization diversified while lifting conversion on audience peaks.",
          },
        ]),
        insights: [
          createInsightCard({
            id: "balanced-business-insight-1",
            variant: "positive",
            title: "Revenue Momentum",
            body: "Multiple revenue streams are contributing, so the latest cycle did not depend on one launch or sponsor push.",
            implication: "A diversified base gives room to push harder on acquisition without making the business brittle.",
          }),
          createInsightCard({
            id: "balanced-business-insight-2",
            variant: "positive",
            title: "Creator Stability",
            body: "The workspace looks stable across monetization and audience signals in this sample scenario.",
            implication: "This is the strongest all-around persona for demos that need both Earn and Grow to feel mature.",
          }),
          createInsightCard({
            id: "balanced-business-insight-3",
            variant: "neutral",
            title: "Business Signal",
            body: "Audience interest is outpacing funnel conversion, which is a healthy constraint for the next cycle.",
            implication: "Tighter acquisition experiments should produce cleaner lift than major revenue-side changes right now.",
          }),
        ],
        revenueTrend: createRevenueTrend([
          { label: "Jul", value: 41200 },
          { label: "Aug", value: 42900 },
          { label: "Sep", value: 44650 },
          { label: "Oct", value: 47100 },
          { label: "Nov", value: 49800 },
          { label: "Dec", value: 52150 },
          { label: "Jan", value: 53300 },
          { label: "Feb", value: 54600 },
        ]),
        trendPreview: "Both monetization and audience quality improved in the latest cycle, leaving acquisition efficiency as the clearest growth lever.",
      },
      grow: {
        model: createGrowModel({
          hasStructuredGrowthEvidence: true,
          creatorScore: 88,
          growthVelocityPercent: 6.4,
          engagementRate: 8.1,
          audienceValueScore: 79,
          diagnosisSummary:
            "Audience quality is strong. The next step is turning healthy discovery into more consistent conversion across offers.",
          trendSummary: "Comparable audience-growth evidence is improving alongside stable repeat engagement.",
          bestPostingWindow: {
            primaryWindow: "Tue-Thu 11 AM to 2 PM",
            secondaryWindow: "Sun 5 PM to 7 PM",
            rationale: "Midday weekday publishing is still the cleanest blend of reach and conversion intent in this sample.",
          },
          topOpportunity: {
            title: "Pair the strongest acquisition offer with the formats already driving repeat engagement",
            summary: "The audience base is qualified enough that a tighter acquisition sequence should convert better without sacrificing retention.",
            estimatedImpact: "Could raise new lead flow while preserving audience quality.",
          },
          nextActions: [
            {
              title: "Test one sharper lead magnet on the highest-retention format",
              impact: "Improve top-of-funnel conversion while the audience base is healthy.",
            },
            {
              title: "Keep the recurring offer visible in the best weekday publishing window",
              impact: "Lift conversion on audience peaks without overloading launch weeks.",
            },
            {
              title: "Review audience segments that engage but do not buy yet",
              impact: "Find the easiest conversion gap to close next.",
            },
          ],
          sourceUpdatedAt: "2026-03-13T10:15:00Z",
        }),
      },
      utility: createUtilityModel({
        entitled: true,
        planTier: "Pro",
        planStatusLabel: "Active",
        planStatusVariant: "good",
        workspaceReadiness: "Sample uploads, reports, and structured growth evidence are all present in this demo workspace.",
        platformsConnectedLabel: "3 connected",
        coverageLabel: "9 months",
        lastUploadLabel: formatDemoDate("2026-03-13T10:15:00Z"),
        latestReportRow: balancedBusinessReport,
        latestReportHref: reportHref(balancedBusinessAnchor),
        latestReportStatusLabel: "Ready",
        latestReportStatusVariant: "good",
      }),
    },
    sampleReport: createSampleReport({
      anchorId: balancedBusinessAnchor,
      title: "Latest sample report",
      generatedAt: "2026-03-13T10:15:00Z",
      summary: "The business is in a strong position overall, with acquisition efficiency now the cleanest lever for the next lift.",
      highlights: [
        "Revenue streams are diversified enough to keep the workspace stable.",
        "Audience quality is improving alongside repeat engagement.",
        "The clearest gap is conversion, not demand.",
      ],
      nextSteps: [
        "Use the strongest acquisition offer in the best weekday publishing window.",
        "Keep recurring offers attached to high-retention content clusters.",
      ],
    }),
  },
  {
    id: "new-workspace",
    shortLabel: "New creator workspace",
    label: "Early-stage creator",
    focusLabel: "Sparse",
    stateLabel: "Empty",
    scenario: "No completed report is available yet, which makes this a clean empty-state and onboarding walkthrough.",
    description: "Best used for first-run QA, onboarding copy review, and user-testing sessions that need a truthful empty workspace.",
    defaultMode: "earn",
    dashboard: {
      primaryCtaLabel: "Upload supported data",
      primaryCtaHref: "/app/data",
      hasUpload: false,
      hasReports: false,
      earn: {
        model: createEarnModel({
          netRevenue: null,
          subscribers: null,
          stabilityIndex: null,
        }),
        diagnosis: createDiagnosisModel({
          heading: "Diagnosis unavailable",
          hasTypedDiagnosis: false,
          unavailableBody: "Diagnosis will appear after the first completed sample report is available.",
        }),
        actionCards: createActionCards("locked"),
        insights: [],
        revenueTrend: createRevenueTrend([]),
        trendPreview: null,
      },
      grow: {
        model: null,
      },
      utility: createUtilityModel({
        entitled: false,
        planTier: "Free",
        planStatusLabel: "Inactive",
        planStatusVariant: "warn",
        workspaceReadiness: "This sample workspace is still empty. Upload a supported revenue export to start Earn.",
        platformsConnectedLabel: "No connected platforms yet",
        coverageLabel: "Coverage appears after reporting starts",
        lastUploadLabel: "--",
        latestReportRow: null,
        latestReportHref: "/app/help#upload-guide",
        latestReportStatusLabel: "Unavailable",
        latestReportStatusVariant: "neutral",
      }),
    },
    sampleReport: null,
  },
  {
    id: "audience-first",
    shortLabel: "Audience momentum, weak monetization",
    label: "Audience-heavy, monetization-light creator",
    focusLabel: "Grow-first",
    stateLabel: "Momentum",
    scenario: "Audience demand is climbing faster than monetization depth, so Grow tells the stronger story than Earn.",
    description: "A strong Grow-first sample that still keeps real upload support boundaries truthful because the route is clearly labeled as demo data.",
    defaultMode: "grow",
    dashboard: {
      primaryCtaLabel: "Open help guide",
      primaryCtaHref: "/app/help#upload-guide",
      hasUpload: true,
      hasReports: true,
      earn: {
        model: createEarnModel({
          netRevenue: 8900,
          subscribers: 1350,
          stabilityIndex: 58,
          revenueDeltaText: "Up 1.4% vs the prior report.",
          subscriberDeltaText: "Up 6.8% since the prior report.",
        }),
        diagnosis: createDiagnosisModel({
          heading: "Monetization pressure",
          summary:
            "Audience demand is arriving faster than the current offer stack can convert it into repeatable revenue.",
          supportingMetrics: [
            {
              id: "audience-first-revenue-depth",
              label: "Revenue depth",
              value: "$8.9K",
              detail: "Revenue is improving, but it still lags the pace of audience expansion.",
            },
            {
              id: "audience-first-conversion-gap",
              label: "Offer conversion",
              value: "1.3%",
              detail: "High engagement is not yet translating into enough monetization depth.",
            },
            {
              id: "audience-first-repeat-support",
              label: "Repeat support",
              value: "Developing",
              detail: "Recurring support is present but still too small to stabilize the business.",
            },
          ],
          comparisonContext: {
            label: "What changed",
            body: "Audience growth accelerated again, but monetization efficiency barely moved in the same period.",
            detail: "This is a constructive tension: demand is present, but monetization has not caught up yet.",
          },
        }),
        actionCards: createActionCards("unlocked", [
          {
            id: "audience-first-action-1",
            label: "Recommended action",
            body: "Turn the most-saved content cluster into a clearer email or membership entry point.",
            detail: "The audience is already responding; the gap is converting that attention into a repeatable offer.",
          },
          {
            id: "audience-first-action-2",
            label: "Validate first",
            body: "Check whether the highest-engagement audience segment overlaps with the current buyer segment.",
            detail: "If it does not, the next offer test should change packaging before it changes price.",
            stateLabel: "Validate first",
            stateTone: "neutral",
          },
        ]),
        insights: [
          createInsightCard({
            id: "audience-first-insight-1",
            variant: "positive",
            title: "Business Signal",
            body: "Audience demand is clearly improving in this sample workspace.",
            implication: "That gives the creator room to sharpen monetization without needing to manufacture more top-of-funnel demand first.",
          }),
          createInsightCard({
            id: "audience-first-insight-2",
            variant: "warning",
            title: "Revenue Momentum",
            body: "Monetization is not keeping up with reach, so revenue depth is still thin.",
            implication: "The next win should come from offer conversion, not simply chasing more attention.",
          }),
          createInsightCard({
            id: "audience-first-insight-3",
            variant: "positive",
            title: "Creator Stability",
            body: "Engagement quality is good enough to support bigger monetization tests.",
            implication: "This is a strong Grow-first story for manual demos and user-testing sessions.",
          }),
        ],
        revenueTrend: createRevenueTrend([
          { label: "Oct", value: 7100 },
          { label: "Nov", value: 7520 },
          { label: "Dec", value: 7890 },
          { label: "Jan", value: 8420 },
          { label: "Feb", value: 8900 },
        ]),
        trendPreview: "Audience momentum keeps improving, but monetization depth is still early relative to the size of demand.",
      },
      grow: {
        model: createGrowModel({
          hasStructuredGrowthEvidence: true,
          creatorScore: 83,
          growthVelocityPercent: 9.1,
          engagementRate: 11.2,
          audienceValueScore: 84,
          diagnosisSummary:
            "Audience momentum is strong enough that the clearest next move is monetization packaging, not demand generation.",
          trendSummary: "Comparable audience-growth evidence and save behavior are both moving in the right direction.",
          bestPostingWindow: {
            primaryWindow: "Tue-Thu 6 PM to 9 PM",
            secondaryWindow: "Sat 10 AM to noon",
            rationale: "Save rate and repeat view quality cluster around evening publishing in this sample workspace.",
          },
          topOpportunity: {
            title: "Turn the highest-save content cluster into a clearer email signup path",
            summary: "The audience is already showing intent. The biggest lift is packaging that attention into a repeatable relationship.",
            estimatedImpact: "Could deepen monetization without slowing audience growth.",
          },
          nextActions: [
            {
              title: "Build one explicit lead capture path from the highest-save content format",
              impact: "Convert attention into a repeatable owned audience channel.",
            },
            {
              title: "Test a lighter-weight paid entry offer for the most engaged segment",
              impact: "Improve revenue depth without disrupting reach.",
            },
            {
              title: "Review which audience segments engage most but still do not buy",
              impact: "Clarify whether the gap is packaging, timing, or fit.",
            },
          ],
          sourceUpdatedAt: "2026-03-11T11:00:00Z",
        }),
      },
      utility: createUtilityModel({
        entitled: true,
        planTier: "Pro",
        planStatusLabel: "Active",
        planStatusVariant: "good",
        workspaceReadiness: "Sample reports are available and Grow includes structured audience evidence in this demo workspace.",
        platformsConnectedLabel: "2 connected",
        coverageLabel: "5 months",
        lastUploadLabel: formatDemoDate("2026-03-11T11:00:00Z"),
        latestReportRow: audienceFirstReport,
        latestReportHref: reportHref(audienceFirstAnchor),
        latestReportStatusLabel: "Ready",
        latestReportStatusVariant: "good",
      }),
    },
    sampleReport: createSampleReport({
      anchorId: audienceFirstAnchor,
      title: "Latest sample report",
      generatedAt: "2026-03-11T11:00:00Z",
      summary: "Audience demand is strong. The next major lift should come from better monetization packaging rather than more reach.",
      highlights: [
        "Growth velocity and engagement health are both strong.",
        "Revenue depth is still light relative to audience demand.",
        "The clearest conversion opportunity sits inside the highest-save content cluster.",
      ],
      nextSteps: [
        "Package the highest-intent content into a stronger owned-audience path.",
        "Test one entry-level offer for the most engaged segment.",
      ],
    }),
  },
  {
    id: "partial-workspace",
    shortLabel: "Partial data workspace",
    label: "Partial workspace",
    focusLabel: "Partial",
    stateLabel: "Limited evidence",
    scenario: "Some monetization data is present, but coverage is thin and Grow is still limited.",
    description: "A good partial-state persona for QA because the workspace feels real without pretending the evidence is complete.",
    defaultMode: "earn",
    dashboard: {
      primaryCtaLabel: "Go to data",
      primaryCtaHref: "/app/data",
      hasUpload: true,
      hasReports: true,
      earn: {
        model: createEarnModel({
          netRevenue: 12600,
          subscribers: 2140,
          stabilityIndex: 67,
          revenueDeltaText: "Up 2.3% vs the prior report.",
          subscriberDeltaText: "Comparison is still thin for subscriber movement.",
          stability: createProvisionalStability(
            67,
            "Reduced confidence because only two months of comparable revenue history are available in this sample workspace.",
          ),
        }),
        diagnosis: createDiagnosisModel({
          heading: "Mixed pressure",
          summary:
            "Revenue is stabilizing, but the evidence window is still short enough that the dashboard should be read as directional rather than settled.",
          notice: {
            label: "Reduced confidence",
            body: "This sample report is useful for direction, but the evidence window is still thin.",
            tone: "warn",
          },
          supportingMetrics: [
            {
              id: "partial-workspace-history",
              label: "Comparable history",
              value: "2 months",
              detail: "Enough to show direction, not enough to treat the score as fully settled.",
            },
            {
              id: "partial-workspace-platforms",
              label: "Connected sources",
              value: "1 source",
              detail: "Audience-side evidence is still incomplete in this sample workspace.",
            },
          ],
          comparisonContext: {
            label: "What changed",
            body: "The latest cycle improved slightly, but the sample still lacks enough history to separate trend from noise with full confidence.",
            detail: "This is the persona to use when checking provisional wording and partial guidance.",
          },
        }),
        actionCards: createActionCards("unlocked", [
          {
            id: "partial-workspace-action-1",
            label: "Recommended action",
            body: "Reconnect the missing source so the next report can compare monetization and audience shifts side by side.",
            detail: "That is the cleanest way to reduce ambiguity in the current workspace.",
          },
          {
            id: "partial-workspace-action-2",
            label: "Watch next cycle",
            body: "Do not overreact to one modest improvement while the evidence window is still short.",
            detail: "Use the next report to confirm whether the stabilization is real.",
            stateLabel: "Reduced confidence",
            stateTone: "warn",
          },
        ]),
        insights: [
          createInsightCard({
            id: "partial-workspace-insight-1",
            variant: "neutral",
            title: "Business Signal",
            body: "The workspace has enough evidence to feel usable, but not enough to feel fully settled.",
            implication: "This is the right persona for reviewing partial guidance, provisional copy, and next-step messaging.",
          }),
          createInsightCard({
            id: "partial-workspace-insight-2",
            variant: "warning",
            title: "Creator Stability",
            body: "The latest sample report is directionally encouraging, but the evidence window is still short.",
            implication: "Wait for one more cycle before treating the trajectory as confirmed.",
          }),
        ],
        revenueTrend: createRevenueTrend([
          { label: "Jan", value: 11850 },
          { label: "Feb", value: 12320 },
          { label: "Mar", value: 12600 },
        ]),
        trendPreview: "Revenue is stabilizing, but the workspace still needs a fuller evidence window before the trend feels settled.",
      },
      grow: {
        model: createGrowModel({
          hasStructuredGrowthEvidence: false,
          creatorScore: null,
          growthVelocityPercent: null,
          engagementRate: null,
          audienceValueScore: null,
          diagnosisSummary:
            "Grow can show limited guidance here, but structured scorecards still need supported audience evidence in this sample workspace.",
          trendSummary: "A fuller source mix is required before the growth story becomes truly comparable.",
          bestPostingWindow: null,
          topOpportunity: {
            title: "Reconnect the missing audience source before judging momentum",
            summary: "The monetization side is usable, but the growth picture is still too partial to prioritize confidently.",
            estimatedImpact: "Sharper cross-functional guidance on the next cycle.",
          },
          nextActions: [
            {
              title: "Reconnect the missing audience export",
              impact: "Unlock more complete Grow scorecards next cycle.",
            },
            {
              title: "Review whether the latest stabilization survives one more report",
              impact: "Confirm trend direction before making larger changes.",
            },
          ],
          sourceUpdatedAt: "2026-03-08T09:25:00Z",
        }),
      },
      utility: createUtilityModel({
        entitled: true,
        planTier: "Pro",
        planStatusLabel: "Active",
        planStatusVariant: "good",
        workspaceReadiness: "Sample revenue evidence is connected, but one source still needs a fresh export before the workspace is fully comparable.",
        reportsCheckError: "The newest demo report is usable, but some evidence remains intentionally incomplete for QA.",
        platformsConnectedLabel: "1 connected",
        coverageLabel: "2 months",
        lastUploadLabel: formatDemoDate("2026-03-08T09:25:00Z"),
        latestReportRow: partialWorkspaceReport,
        latestReportHref: reportHref(partialWorkspaceAnchor),
        latestReportStatusLabel: "Ready",
        latestReportStatusVariant: "good",
      }),
    },
    sampleReport: createSampleReport({
      anchorId: partialWorkspaceAnchor,
      title: "Latest sample report",
      generatedAt: "2026-03-08T09:25:00Z",
      summary: "The workspace is stabilizing, but the evidence window is still too short to treat the current direction as confirmed.",
      highlights: [
        "Comparable history is still limited to two months.",
        "Only one source is fully connected in this sample workspace.",
        "Guidance should stay provisional until a fuller report lands.",
      ],
      nextSteps: [
        "Reconnect the missing source before drawing stronger conclusions.",
        "Use the next report to validate whether stabilization is real.",
      ],
    }),
  },
  {
    id: "churn-risk",
    shortLabel: "Churn-risk creator business",
    label: "Churn-risk and declining revenue creator",
    focusLabel: "Earn-heavy",
    stateLabel: "At risk",
    scenario: "Recurring revenue has softened for two cycles and the business is now less predictable.",
    description: "A realistic downside persona for validating warning states, decline messaging, and higher-priority next actions.",
    defaultMode: "earn",
    dashboard: {
      primaryCtaLabel: "Open help guide",
      primaryCtaHref: "/app/help#upload-guide",
      hasUpload: true,
      hasReports: true,
      earn: {
        model: createEarnModel({
          netRevenue: 19800,
          subscribers: 3650,
          stabilityIndex: 46,
          revenueDeltaText: "Down 8.9% vs the prior report.",
          subscriberDeltaText: "Down 4.3% since the prior report.",
        }),
        diagnosis: createDiagnosisModel({
          heading: "Churn pressure",
          summary:
            "Renewal softness is now larger than new member growth, which makes the business less predictable even before revenue falls further.",
          supportingMetrics: [
            {
              id: "churn-risk-renewal",
              label: "Renewal rate",
              value: "64%",
              detail: "Renewal weakened again in the latest sample period.",
            },
            {
              id: "churn-risk-net-adds",
              label: "Net subscriber change",
              value: "-165",
              detail: "New support is not fully replacing churn in this sample workspace.",
            },
            {
              id: "churn-risk-arpu",
              label: "ARPU",
              value: "$5.42",
              detail: "Pricing is stable, so the main problem is retention rather than value per supporter.",
            },
          ],
          comparisonContext: {
            label: "What changed",
            body: "The latest cycle showed another drop in renewals, pushing net subscriber change negative for the first time in this demo sequence.",
            detail: "This is the persona to use when testing warning-heavy diagnosis and action cards.",
          },
        }),
        actionCards: createActionCards("unlocked", [
          {
            id: "churn-risk-action-1",
            label: "Recommended action",
            body: "Rebuild the first-30-day retention sequence before testing broader acquisition moves.",
            detail: "The fastest lift is protecting recent supporters, not filling the top of the funnel faster.",
          },
          {
            id: "churn-risk-action-2",
            label: "Recommended action",
            body: "Review which benefits are used most by members who stay beyond the first renewal.",
            detail: "That should narrow the gap between new and established cohorts.",
          },
        ]),
        insights: [
          createInsightCard({
            id: "churn-risk-insight-1",
            variant: "warning",
            title: "Subscriber Churn Risk",
            body: "Renewal softness is now strong enough to overwhelm new support in this sample workspace.",
            implication: "Protecting early retention is the clearest near-term move because acquisition alone will not solve the drop.",
          }),
          createInsightCard({
            id: "churn-risk-insight-2",
            variant: "warning",
            title: "Revenue Momentum",
            body: "Net revenue has declined for two consecutive sample periods.",
            implication: "If this trend continues, planning gets harder quickly because the revenue base becomes less predictable.",
          }),
          createInsightCard({
            id: "churn-risk-insight-3",
            variant: "neutral",
            title: "Business Signal",
            body: "Pricing is stable, so this is primarily a retention problem rather than a pricing problem.",
            implication: "That keeps the response focused and makes this a strong diagnostic test case.",
          }),
        ],
        revenueTrend: createRevenueTrend([
          { label: "Aug", value: 25700 },
          { label: "Sep", value: 24900 },
          { label: "Oct", value: 23850 },
          { label: "Nov", value: 22900 },
          { label: "Dec", value: 21650 },
          { label: "Jan", value: 20850 },
          { label: "Feb", value: 19800 },
        ]),
        trendPreview: "Recurring revenue has stepped down for two cycles as renewal softness outruns new support.",
      },
      grow: {
        model: createGrowModel({
          hasStructuredGrowthEvidence: true,
          creatorScore: 61,
          growthVelocityPercent: -1.3,
          engagementRate: 4.6,
          audienceValueScore: 63,
          diagnosisSummary:
            "Audience demand is not collapsing, but retention-side pressure is making the business feel weaker than the top of funnel suggests.",
          trendSummary: "Growth signals are mixed while monetization-side churn remains the more urgent constraint.",
          bestPostingWindow: {
            primaryWindow: "Tue and Thu 12 PM to 2 PM",
            secondaryWindow: "Sun 4 PM to 6 PM",
            rationale: "Posting windows are still workable; the sharper issue is what happens after support begins.",
          },
          topOpportunity: {
            title: "Rebuild the early supporter onboarding sequence",
            summary: "The biggest business lift still comes from better retention, even though audience demand is only mildly softening.",
            estimatedImpact: "Could stabilize net subscriber change faster than broad acquisition tests.",
          },
          nextActions: [
            {
              title: "Review where the newest supporters disengage first",
              impact: "Pinpoint the quickest retention fix.",
            },
            {
              title: "Keep publishing in the windows that still hold repeat engagement",
              impact: "Prevent the top of funnel from softening while churn is addressed.",
            },
            {
              title: "Reframe the first paid offer around the most-used benefits",
              impact: "Improve the odds that new supporters renew.",
            },
          ],
          sourceUpdatedAt: "2026-03-10T13:20:00Z",
        }),
      },
      utility: createUtilityModel({
        entitled: true,
        planTier: "Pro",
        planStatusLabel: "Active",
        planStatusVariant: "good",
        workspaceReadiness: "Sample reports are ready, and the latest demo workspace shows clear retention-side pressure.",
        platformsConnectedLabel: "2 connected",
        coverageLabel: "7 months",
        lastUploadLabel: formatDemoDate("2026-03-10T13:20:00Z"),
        latestReportRow: churnRiskReport,
        latestReportHref: reportHref(churnRiskAnchor),
        latestReportStatusLabel: "Ready",
        latestReportStatusVariant: "good",
      }),
    },
    sampleReport: createSampleReport({
      anchorId: churnRiskAnchor,
      title: "Latest sample report",
      generatedAt: "2026-03-10T13:20:00Z",
      summary: "Retention pressure is now the dominant business problem in this sample workspace.",
      highlights: [
        "Renewal softened again in the most recent cycle.",
        "Net subscriber change turned negative for the first time in this sequence.",
        "Pricing is stable, so the core issue is churn rather than monetization efficiency.",
      ],
      nextSteps: [
        "Fix early retention before widening acquisition.",
        "Review the benefits used most by supporters who stay beyond the first renewal.",
      ],
    }),
  },
  {
    id: "momentum-down",
    shortLabel: "Momentum down, engagement softening",
    label: "Momentum down and engagement softening creator",
    focusLabel: "Grow-first",
    stateLabel: "Softening",
    scenario: "Audience analytics are present, but the newest cycle shows slower reach and weaker engagement.",
    description: "A good warning-oriented Grow persona for validating softer momentum without forcing a dramatic collapse.",
    defaultMode: "grow",
    dashboard: {
      primaryCtaLabel: "Go to data",
      primaryCtaHref: "/app/data",
      hasUpload: true,
      hasReports: true,
      earn: {
        model: createEarnModel({
          netRevenue: 24300,
          subscribers: 5200,
          stabilityIndex: 63,
          revenueDeltaText: "Down 2.7% vs the prior report.",
          subscriberDeltaText: "Up 0.8% since the prior report.",
        }),
        diagnosis: createDiagnosisModel({
          heading: "Acquisition pressure",
          summary:
            "The business is still stable enough to work from, but slower discovery and softer engagement are starting to limit the next step up.",
          supportingMetrics: [
            {
              id: "momentum-down-growth-rate",
              label: "Audience growth",
              value: "-2.4%",
              detail: "Comparable audience-growth evidence softened in the latest sample cycle.",
            },
            {
              id: "momentum-down-engagement",
              label: "Engagement rate",
              value: "3.8%",
              detail: "Engagement is still serviceable, but it no longer looks comfortably healthy.",
            },
            {
              id: "momentum-down-revenue",
              label: "Net revenue",
              value: "$24.3K",
              detail: "Monetization has not fallen sharply, which keeps this from becoming an Earn-side crisis.",
            },
          ],
          comparisonContext: {
            label: "What changed",
            body: "The latest cycle showed slower discovery and weaker engagement before those shifts produced a bigger revenue problem.",
            detail: "This is a useful early-warning persona for Grow-first review sessions.",
          },
        }),
        actionCards: createActionCards("unlocked", [
          {
            id: "momentum-down-action-1",
            label: "Recommended action",
            body: "Refresh the format that used to drive repeat engagement before reach softens any further.",
            detail: "The business still has room to act before the slowdown compounds on the monetization side.",
          },
          {
            id: "momentum-down-action-2",
            label: "Watch next cycle",
            body: "Confirm whether weaker engagement is concentrated in one format or across the full content mix.",
            detail: "That determines whether the next move should be creative, schedule-based, or offer-based.",
            stateLabel: "Watch next cycle",
            stateTone: "neutral",
          },
        ]),
        insights: [
          createInsightCard({
            id: "momentum-down-insight-1",
            variant: "warning",
            title: "Business Signal",
            body: "Discovery is softening before the revenue side has fully reacted.",
            implication: "That gives the team a window to respond while the business is still relatively stable.",
          }),
          createInsightCard({
            id: "momentum-down-insight-2",
            variant: "neutral",
            title: "Revenue Momentum",
            body: "Revenue is down modestly, but not enough to dominate the story yet.",
            implication: "This keeps the focus on audience-side correction rather than emergency monetization changes.",
          }),
          createInsightCard({
            id: "momentum-down-insight-3",
            variant: "warning",
            title: "Creator Stability",
            body: "Engagement quality no longer looks comfortably healthy in this sample workspace.",
            implication: "Grow warning states should feel credible here without looking catastrophic.",
          }),
        ],
        revenueTrend: createRevenueTrend([
          { label: "Jul", value: 25100 },
          { label: "Aug", value: 25850 },
          { label: "Sep", value: 26200 },
          { label: "Oct", value: 25900 },
          { label: "Nov", value: 25550 },
          { label: "Dec", value: 24900 },
          { label: "Jan", value: 24300 },
        ]),
        trendPreview: "Audience discovery softened before monetization fell meaningfully, which makes this a useful early-warning Grow scenario.",
      },
      grow: {
        model: createGrowModel({
          hasStructuredGrowthEvidence: true,
          creatorScore: 59,
          growthVelocityPercent: -2.4,
          engagementRate: 3.8,
          audienceValueScore: 66,
          diagnosisSummary:
            "Discovery is cooling and repeat engagement has softened enough that Grow should be watched closely in the next cycle.",
          trendSummary: "The sample workspace still has structure, but the momentum story has clearly cooled.",
          bestPostingWindow: {
            primaryWindow: "Wed 5 PM to 7 PM",
            secondaryWindow: "Sat 11 AM to 1 PM",
            rationale: "These windows are still performing best, but the gap versus the rest of the week narrowed in the latest sample.",
          },
          topOpportunity: {
            title: "Refresh the repeatable format before reach decays further",
            summary: "The audience base is still usable, but the content engine needs a sharper hook before the slowdown compounds.",
            estimatedImpact: "Could stabilize discovery before monetization feels the full effect.",
          },
          nextActions: [
            {
              title: "Audit which format lost the most repeat engagement first",
              impact: "Clarify whether the slowdown is creative or schedule-based.",
            },
            {
              title: "Re-test the highest-retention hook in the best-performing window",
              impact: "Give the content engine a cleaner baseline again.",
            },
            {
              title: "Keep monetization changes small until engagement direction is clearer",
              impact: "Avoid solving the wrong problem too early.",
            },
          ],
          sourceUpdatedAt: "2026-03-12T08:45:00Z",
        }),
      },
      utility: createUtilityModel({
        entitled: true,
        planTier: "Pro",
        planStatusLabel: "Active",
        planStatusVariant: "good",
        workspaceReadiness: "Sample reports are ready, and the latest demo workspace includes measured audience signals with softening momentum.",
        platformsConnectedLabel: "3 connected",
        coverageLabel: "6 months",
        lastUploadLabel: formatDemoDate("2026-03-12T08:45:00Z"),
        latestReportRow: momentumDownReport,
        latestReportHref: reportHref(momentumDownAnchor),
        latestReportStatusLabel: "Ready",
        latestReportStatusVariant: "good",
      }),
    },
    sampleReport: createSampleReport({
      anchorId: momentumDownAnchor,
      title: "Latest sample report",
      generatedAt: "2026-03-12T08:45:00Z",
      summary: "Discovery and engagement softened before revenue fully reacted, making this a good early-warning Grow persona.",
      highlights: [
        "Comparable audience growth turned negative in the latest cycle.",
        "Engagement is still workable, but no longer looks comfortably healthy.",
        "Revenue has only softened modestly so far.",
      ],
      nextSteps: [
        "Refresh the strongest repeatable format before the slowdown compounds.",
        "Use the next cycle to confirm whether the issue is broad or format-specific.",
      ],
    }),
  },
];

export function listDemoWorkspaces(): DemoWorkspaceFixture[] {
  return DEMO_WORKSPACES;
}

export function getDemoWorkspaceFixture(id: string | null | undefined): DemoWorkspaceFixture {
  const match = DEMO_WORKSPACES.find((workspace) => workspace.id === id);
  return match ?? DEMO_WORKSPACES[0];
}

export function resolveDemoWorkspaceMode(value: string | null | undefined, workspace: DemoWorkspaceFixture): DashboardMode {
  if (typeof value !== "string" || value.trim().length === 0) {
    return workspace.defaultMode;
  }

  return parseDashboardMode(value);
}

export function buildDemoWorkspaceSearch(
  searchParams: { toString(): string },
  workspaceId: string,
  explicitMode?: DashboardMode | null,
): string {
  const workspace = getDemoWorkspaceFixture(workspaceId);
  const params = new URLSearchParams(searchParams.toString());
  params.set(DEMO_WORKSPACE_QUERY_PARAM, workspace.id);

  const nextMode = explicitMode ?? workspace.defaultMode;
  if (nextMode === DEFAULT_DASHBOARD_MODE) {
    params.delete(DASHBOARD_MODE_QUERY_PARAM);
  } else {
    params.set(DASHBOARD_MODE_QUERY_PARAM, nextMode);
  }

  return params.toString();
}
