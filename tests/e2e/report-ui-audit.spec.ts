import fs from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

type AuditScenario = {
  slug: string;
  label: string;
  reportId: string;
  report: Record<string, unknown>;
  artifactUrl: string;
  artifact: Record<string, unknown>;
};

const phase = process.env.AUDIT_PHASE?.trim() || "before";
const outputRoot = path.resolve(__dirname, "../../artifacts/report-ui-audit", phase);

function makeReportDetail({
  id,
  title,
  summary,
  sourceCount = 1,
  platformsIncluded = ["Patreon"],
  artifactJsonUrl,
  metrics = {},
}: {
  id: string;
  title: string;
  summary: string;
  sourceCount?: number;
  platformsIncluded?: string[];
  artifactJsonUrl: string;
  metrics?: {
    netRevenue?: number | null;
    subscribers?: number | null;
    stabilityIndex?: number | null;
  };
}) {
  return {
    id,
    title,
    status: "ready",
    summary,
    created_at: "2026-03-01T10:00:00Z",
    artifact_url: `/v1/reports/${id}/artifact`,
    artifact_json_url: artifactJsonUrl,
    source_count: sourceCount,
    platforms_included: platformsIncluded,
    report: {
      report_id: id,
      metrics: {
        net_revenue: metrics.netRevenue ?? null,
        subscribers: metrics.subscribers ?? null,
        stability_index: metrics.stabilityIndex ?? null,
      },
    },
  };
}

function buildBaseArtifact({
  id,
  executiveSummary,
  netRevenueSeries,
  diagnosis,
  recommendations,
  platformMixItems,
  audienceGrowthSignals = null,
  metricProvenance = {},
  analysisMode = null,
  dataQualityLevel = null,
  kpis = {},
}: {
  id: string;
  executiveSummary: string;
  netRevenueSeries: Array<{ period: string; net_revenue: number }>;
  diagnosis: Record<string, unknown>;
  recommendations: string[];
  platformMixItems: string[];
  audienceGrowthSignals?: Record<string, unknown> | null;
  metricProvenance?: Record<string, unknown>;
  analysisMode?: string | null;
  dataQualityLevel?: string | null;
  kpis?: {
    netRevenue?: number | null;
    subscribers?: number | null;
    stabilityIndex?: number | null;
    churnVelocity?: number | null;
  };
}) {
  return {
    schema_version: "v1",
    report: {
      report_id: id,
      created_at: "2026-03-01T10:00:00Z",
      analysis_mode: analysisMode,
      data_quality_level: dataQualityLevel,
      metric_provenance: metricProvenance,
      diagnosis,
      sections: {
        executive_summary: {
          summary: executiveSummary,
        },
        revenue_snapshot: {
          net_revenue: netRevenueSeries.at(-1)?.net_revenue ?? null,
          series: netRevenueSeries,
        },
        platform_mix: {
          items: platformMixItems,
        },
        prioritized_insights: {
          items: [executiveSummary],
        },
        ranked_recommendations: {
          items: recommendations,
        },
        stability: {
          stability_index: kpis.stabilityIndex ?? null,
          items: ["Business stability is being tracked against the current available report data."],
        },
        outlook: {
          summary: "Use the latest trend as directional guidance for the next period.",
        },
        ...(audienceGrowthSignals ? { audience_growth_signals: audienceGrowthSignals } : {}),
      },
      audience_growth_signals: audienceGrowthSignals,
      metrics: {
        net_revenue: kpis.netRevenue ?? null,
        subscribers: kpis.subscribers ?? null,
        stability_index: kpis.stabilityIndex ?? null,
        churn_velocity: kpis.churnVelocity ?? null,
      },
    },
  };
}

const scenarios: AuditScenario[] = [
  {
    slug: "high-concentration-risk",
    label: "High concentration / high risk",
    reportId: "rep_audit_concentration",
    report: makeReportDetail({
      id: "rep_audit_concentration",
      title: "Combined Report - Patreon + YouTube",
      summary: "Most income is tied to one platform and recent growth is slowing.",
      sourceCount: 2,
      platformsIncluded: ["Patreon", "YouTube"],
      artifactJsonUrl: "https://artifacts.test/rep_audit_concentration.json",
      metrics: { netRevenue: 18400, subscribers: 930, stabilityIndex: 58 },
    }),
    artifactUrl: "https://artifacts.test/rep_audit_concentration.json",
    artifact: buildBaseArtifact({
      id: "rep_audit_concentration",
      executiveSummary:
        "Your business is still generating income, but most of it is coming from one platform while audience momentum slows.",
      netRevenueSeries: [
        { period: "2026-01", net_revenue: 20100 },
        { period: "2026-02", net_revenue: 19300 },
        { period: "2026-03", net_revenue: 18400 },
      ],
      diagnosis: {
        diagnosis_type: "concentration_pressure",
        summary_text: "Revenue concentration is the clearest business risk right now.",
        confidence: "medium",
        evidence_strength: "moderate",
        supporting_metrics: [],
        primitives: {
          revenue_trend_direction: "down",
          active_subscribers_direction: "flat",
          churn_pressure_level: "medium",
          concentration_pressure_level: "high",
          monetization_efficiency_level: "medium",
          stability_direction: "down",
        },
      },
      recommendations: [
        "Build a simple email or member path from your highest-performing platform within the next 2 weeks.",
        "Use your next three posts to move part of your audience into an owned channel.",
      ],
      platformMixItems: [
        "82% of revenue comes from Patreon.",
        "YouTube contributes reach, but not enough direct income yet.",
      ],
      kpis: { netRevenue: 18400, subscribers: 930, stabilityIndex: 58, churnVelocity: 9 },
    }),
  },
  {
    slug: "revenue-decline-weak-momentum",
    label: "Revenue decline + weak momentum",
    reportId: "rep_audit_decline",
    report: makeReportDetail({
      id: "rep_audit_decline",
      title: "Creator Report - Monthly Review",
      summary: "Revenue and subscriber momentum both softened this period.",
      artifactJsonUrl: "https://artifacts.test/rep_audit_decline.json",
      metrics: { netRevenue: 9100, subscribers: 510, stabilityIndex: 49 },
    }),
    artifactUrl: "https://artifacts.test/rep_audit_decline.json",
    artifact: buildBaseArtifact({
      id: "rep_audit_decline",
      executiveSummary:
        "Revenue fell again this period and audience momentum is not replacing what the business is losing.",
      netRevenueSeries: [
        { period: "2026-01", net_revenue: 11200 },
        { period: "2026-02", net_revenue: 10100 },
        { period: "2026-03", net_revenue: 9100 },
      ],
      diagnosis: {
        diagnosis_type: "churn_pressure",
        summary_text: "The business is losing stability because people are not staying engaged long enough.",
        confidence: "medium",
        evidence_strength: "moderate",
        supporting_metrics: [],
        primitives: {
          revenue_trend_direction: "down",
          active_subscribers_direction: "down",
          churn_pressure_level: "high",
          concentration_pressure_level: "medium",
          monetization_efficiency_level: "low",
          stability_direction: "down",
        },
      },
      recommendations: [
        "Refresh your offer and publishing cadence over the next 2 weeks to re-engage existing buyers.",
        "Find the recent drop-off point in your funnel and fix that before pushing more top-of-funnel traffic.",
      ],
      platformMixItems: [
        "Income is spread across a few sources, but each one is softening at the same time.",
      ],
      kpis: { netRevenue: 9100, subscribers: 510, stabilityIndex: 49, churnVelocity: 14 },
    }),
  },
  {
    slug: "healthy-stable",
    label: "Healthy / stable creator",
    reportId: "rep_audit_healthy",
    report: makeReportDetail({
      id: "rep_audit_healthy",
      title: "Combined Report - Patreon + Substack",
      summary: "Revenue is steady, and the business looks broadly stable.",
      sourceCount: 2,
      platformsIncluded: ["Patreon", "Substack"],
      artifactJsonUrl: "https://artifacts.test/rep_audit_healthy.json",
      metrics: { netRevenue: 26800, subscribers: 1620, stabilityIndex: 84 },
    }),
    artifactUrl: "https://artifacts.test/rep_audit_healthy.json",
    artifact: buildBaseArtifact({
      id: "rep_audit_healthy",
      executiveSummary:
        "Your business looks steady this period, with stable revenue, healthy retention, and no immediate signs of income pressure.",
      netRevenueSeries: [
        { period: "2026-01", net_revenue: 25400 },
        { period: "2026-02", net_revenue: 26100 },
        { period: "2026-03", net_revenue: 26800 },
      ],
      diagnosis: {
        diagnosis_type: "growth",
        summary_text: "The business is stable enough to keep compounding what already works.",
        confidence: "medium",
        evidence_strength: "moderate",
        supporting_metrics: [],
        primitives: {
          revenue_trend_direction: "up",
          active_subscribers_direction: "up",
          churn_pressure_level: "low",
          concentration_pressure_level: "low",
          monetization_efficiency_level: "medium",
          stability_direction: "up",
        },
      },
      recommendations: [
        "Protect the formats and offers already driving repeat revenue over the next month.",
        "Use this stable period to test one new owned-channel growth path without disrupting your core engine.",
      ],
      platformMixItems: [
        "Revenue is more balanced across Patreon and Substack than it was last period.",
      ],
      kpis: { netRevenue: 26800, subscribers: 1620, stabilityIndex: 84, churnVelocity: 4 },
    }),
  },
  {
    slug: "audience-heavy-growth",
    label: "Audience-heavy / strong Grow signals",
    reportId: "rep_audit_audience",
    report: makeReportDetail({
      id: "rep_audit_audience",
      title: "Creator Report - Audience Growth Review",
      summary: "Audience growth is strongest on short-form channels right now.",
      sourceCount: 3,
      platformsIncluded: ["Instagram", "TikTok", "YouTube"],
      artifactJsonUrl: "https://artifacts.test/rep_audit_audience.json",
      metrics: { netRevenue: 6400, subscribers: 220, stabilityIndex: 67 },
    }),
    artifactUrl: "https://artifacts.test/rep_audit_audience.json",
    artifact: buildBaseArtifact({
      id: "rep_audit_audience",
      executiveSummary:
        "Audience growth is strongest on TikTok right now, but that attention has not fully turned into owned demand yet.",
      netRevenueSeries: [
        { period: "2026-01", net_revenue: 5400 },
        { period: "2026-02", net_revenue: 5900 },
        { period: "2026-03", net_revenue: 6400 },
      ],
      diagnosis: {
        diagnosis_type: "acquisition_pressure",
        summary_text: "Attention is growing faster than monetization, which creates a conversion opportunity.",
        confidence: "medium",
        evidence_strength: "moderate",
        supporting_metrics: [],
        primitives: {
          revenue_trend_direction: "up",
          active_subscribers_direction: "flat",
          churn_pressure_level: "low",
          concentration_pressure_level: "medium",
          monetization_efficiency_level: "low",
          stability_direction: "flat",
        },
      },
      recommendations: [
        "Add one owned capture path to your highest-growth channel this week so audience growth turns into repeatable demand.",
        "Package your best-performing short-form topic into a simple lead magnet or low-ticket offer.",
      ],
      platformMixItems: [
        "Most direct income still comes from one source even though audience growth is happening elsewhere.",
      ],
      audienceGrowthSignals: {
        title: "Audience & Growth Signals",
        subtitle: "Based on your available Instagram, TikTok, and YouTube audience data.",
        summary: {
          creator_score: 81,
          source_coverage: 88,
          audience_momentum: 84,
          engagement_signal: 71,
        },
        included_sources: [
          { platform: "tiktok", label: "TikTok", included: true, latest_period_label: "Mar 2026", data_type: "audience" },
          { platform: "instagram", label: "Instagram", included: true, latest_period_label: "Mar 2026", data_type: "audience" },
          { platform: "youtube", label: "YouTube", included: true, latest_period_label: "Mar 2026", data_type: "audience" },
        ],
        platform_cards: [
          {
            platform: "tiktok",
            label: "TikTok",
            included: true,
            metrics: {
              followers_trend: "+14.8%",
              reach_trend: "+21.2%",
              interaction_trend: "+11.3%",
            },
            insight: "TikTok is driving the strongest audience growth right now.",
          },
          {
            platform: "instagram",
            label: "Instagram",
            included: true,
            metrics: {
              followers_trend: "+6.4%",
              reach_trend: "+8.1%",
              interaction_trend: "+4.2%",
            },
            insight: "Instagram remains positive, but is not accelerating as fast as TikTok.",
          },
        ],
        diagnosis: {
          strongest_signal: "TikTok is your strongest audience growth channel right now.",
          watchout: "Most of that attention is still rented, so growth can fade if you do not capture it.",
          next_best_move: "Use your fastest-growing content to push viewers into email, community, or a paid entry offer.",
        },
        trust_note: "Audience growth helps show where attention is building, but it does not guarantee income on its own.",
      },
      kpis: { netRevenue: 6400, subscribers: 220, stabilityIndex: 67, churnVelocity: 7 },
    }),
  },
  {
    slug: "partial-limited-data",
    label: "Partial / limited data",
    reportId: "rep_audit_partial",
    report: makeReportDetail({
      id: "rep_audit_partial",
      title: "Combined Report - Patreon + Instagram",
      summary: "This report only has a partial business snapshot for the latest period.",
      sourceCount: 2,
      platformsIncluded: ["Patreon", "Instagram"],
      artifactJsonUrl: "https://artifacts.test/rep_audit_partial.json",
      metrics: { netRevenue: 7300, subscribers: 480, stabilityIndex: 61 },
    }),
    artifactUrl: "https://artifacts.test/rep_audit_partial.json",
    artifact: buildBaseArtifact({
      id: "rep_audit_partial",
      executiveSummary:
        "This month looks softer, but the latest business snapshot only reflects part of your sources, so treat it as directional rather than complete.",
      netRevenueSeries: [
        { period: "2026-01", net_revenue: 8200 },
        { period: "2026-02", net_revenue: 7900 },
        { period: "2026-03", net_revenue: 7300 },
      ],
      diagnosis: {
        diagnosis_type: "concentration_pressure",
        summary_text: "The business may be leaning too heavily on one source, but this period is only partially represented.",
        confidence: "low",
        evidence_strength: "weak",
        supporting_metrics: [],
        primitives: {
          revenue_trend_direction: "down",
          active_subscribers_direction: "flat",
          churn_pressure_level: "medium",
          concentration_pressure_level: "high",
          monetization_efficiency_level: "medium",
          stability_direction: "flat",
          analysis_mode: "reduced",
          data_quality_level: "limited",
        },
      },
      recommendations: [
        "Before making a big strategy shift, confirm the missing source data and then decide whether the slowdown is real.",
        "In the meantime, keep building one owned path so your business is less exposed if this trend holds.",
      ],
      platformMixItems: [
        "Current income snapshot is mainly represented by Patreon.",
      ],
      metricProvenance: {
        net_revenue: { source: "Patreon", availability: "available", confidence: "high", evidence_strength: "strong" },
        active_subscribers: { source: "Patreon", availability: "available", confidence: "high", evidence_strength: "strong" },
      },
      analysisMode: "reduced",
      dataQualityLevel: "limited",
      kpis: { netRevenue: 7300, subscribers: 480, stabilityIndex: 61, churnVelocity: null },
    }),
  },
];

async function writeAuditArtifacts(page: Page, scenario: AuditScenario) {
  const scenarioDir = path.join(outputRoot, scenario.slug);
  await fs.mkdir(scenarioDir, { recursive: true });

  await page.screenshot({
    path: path.join(scenarioDir, "page.png"),
    fullPage: true,
  });

  const visibleText = await page.evaluate(() => {
    const main = document.querySelector("main");
    return (main?.innerText ?? document.body.innerText)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");
  });

  const renderSnapshot = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-testid]"))
      .map((node) => ({
        testId: node.getAttribute("data-testid"),
        text: node.textContent?.replace(/\s+/g, " ").trim() ?? "",
      }))
      .filter((entry) => entry.text.length > 0),
  );

  await fs.writeFile(path.join(scenarioDir, "visible-text.txt"), visibleText, "utf8");
  await fs.writeFile(path.join(scenarioDir, "render-snapshot.json"), JSON.stringify(renderSnapshot, null, 2), "utf8");
}

test.describe("Report UI audit capture", () => {
  for (const scenario of scenarios) {
    test(`captures ${scenario.label}`, async ({ page }) => {
      await stubAuthenticatedSession(page);
      await stubUnhandledApiRoutes(page);
      await stubEntitlements(page, "entitled");

      await page.route(`**/v1/reports/${scenario.reportId}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(scenario.report),
        });
      });

      await page.route(scenario.artifactUrl, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(scenario.artifact),
        });
      });

      await page.goto(`/app/report/${scenario.reportId}`);
      await expect(page.getByTestId("report-content")).toBeVisible();
      await expect(page.getByText("Executive Summary")).toBeVisible();

      await writeAuditArtifacts(page, scenario);
    });
  }
});
