import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const hydrationModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/artifact-hydration.ts")).href;

async function loadHydrator() {
  return import(hydrationModuleUrl);
}

function createProductionArtifactShape() {
  return {
    schema_version: "v1",
    report: {
      report_id: "rep_prod_dashboard_001",
      created_at: "2026-03-09T12:00:00Z",
      sections: {
        executive_summary: {
          summary: "Revenue quality improved while volatility eased.",
        },
        revenue_snapshot: {
          series: [
            { period: "2025-12", net_revenue: 198000 },
            { period: "2026-01", net_revenue: 205500 },
            { period: "2026-02", net_revenue: 215000 },
          ],
          delta: {
            period_over_period: 9500,
            month_over_month_pct: 0.046,
          },
        },
        subscribers_retention: {
          items: ["Retention stayed above target for the quarter."],
        },
        tier_health: {
          items: ["Mid-tier conversion improved month over month."],
        },
        platform_mix: {
          items: ["YouTube remains largest channel with steady diversification."],
        },
        clustered_themes: {
          items: ["Audience quality and pricing discipline are compounding."],
        },
        stability: {
          stability_index: 87,
          items: ["Churn velocity is moderating."],
        },
        prioritized_insights: ["High-retention cohorts are driving margin expansion."],
        ranked_recommendations: ["Shift spend toward retention experiments before scaling acquisition."],
        outlook: {
          revenue_projection: {
            summary: "Base case remains growth-positive with lower downside variance.",
          },
          churn_outlook: {
            summary: "Churn risk is flat to slightly improving.",
          },
          platform_risk_outlook: {
            summary: "No near-term platform concentration shock expected.",
          },
        },
        plan: {
          items: ["Run annual plan sensitivity tests in Q2."],
        },
        appendix: {
          paragraphs: ["Method notes and assumptions."],
        },
      },
    },
  };
}

test("dashboard artifact hydrator maps production report.sections shape", async () => {
  const { hydrateDashboardFromArtifact } = await loadHydrator();
  const result = hydrateDashboardFromArtifact(createProductionArtifactShape());

  assert.equal(result.contractValid, true);
  assert.deepEqual(result.contractErrors, []);
  assert.equal(result.kpis.netRevenue, 215000);
  assert.equal(result.kpis.stabilityIndex, 87);
  assert.equal(result.keySignals.length > 0, true);
  assert.equal(result.keySignals.some((entry) => entry.includes("High-retention cohorts")), true);
  assert.equal(result.recommendedActions.length > 0, true);
  assert.equal(result.recommendedActions.some((entry) => entry.includes("retention experiments")), true);
  assert.equal(result.trendPreview?.includes("growth-positive"), true);
  assert.equal(result.revenueTrend.length, 3);
  assert.deepEqual(result.revenueTrend.map((point) => point.value), [198000, 205500, 215000]);
  assert.deepEqual(result.revenueTrend.map((point) => point.label), ["Dec 2025", "Jan 2026", "Feb 2026"]);
});

test("dashboard artifact hydrator surfaces contract drift errors for malformed payloads", async () => {
  const { hydrateDashboardFromArtifact } = await loadHydrator();
  const result = hydrateDashboardFromArtifact({
    report: {
      schema_version: "v2",
      sections: {
        executive_summary: {},
      },
    },
  });

  assert.equal(result.contractValid, false);
  assert.equal(result.contractErrors.length > 0, true);
  assert.deepEqual(result.keySignals, []);
  assert.deepEqual(result.recommendedActions, []);
  assert.equal(result.trendPreview, null);
  assert.deepEqual(result.revenueTrend, []);
  assert.equal(result.kpis.netRevenue, null);
  assert.equal(result.kpis.stabilityIndex, null);
});
