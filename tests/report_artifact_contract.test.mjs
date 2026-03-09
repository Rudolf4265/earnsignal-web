import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const contractModuleUrl = pathToFileURL(path.resolve("src/lib/report/artifact-contract.ts")).href;

async function loadContractModule() {
  return import(contractModuleUrl);
}

function createCurrentProductionArtifact() {
  return {
    schema_version: "v1",
    report: {
      report_id: "rep_contract_001",
      sections: {
        executive_summary: {
          summary: "Revenue quality improved and volatility eased.",
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
        stability: {
          stability_index: 87,
          items: ["Churn velocity is moderating."],
        },
        prioritized_insights: ["High-retention cohorts are driving margin expansion."],
        ranked_recommendations: ["Rebalance spend toward retention loops before acquisition expansion."],
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
      },
    },
  };
}

test("report artifact contract accepts current v1 production shape", async () => {
  const { validateReportArtifactContract } = await loadContractModule();
  const result = validateReportArtifactContract(createCurrentProductionArtifact());

  assert.equal(result.valid, true);
  assert.equal(result.schemaVersion, "v1");
  assert.deepEqual(result.errors, []);
});

test("report artifact contract rejects schema drift and missing required sections", async () => {
  const { validateReportArtifactContract } = await loadContractModule();
  const result = validateReportArtifactContract({
    report: {
      schema_version: "v2",
      sections: {
        executive_summary: {
          summary: "Invalid payload.",
        },
        revenue_snapshot: {},
      },
    },
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.length > 0, true);
  assert.equal(result.errors.some((error) => error.includes("Unsupported schema_version")), true);
  assert.equal(result.errors.some((error) => error.includes("Missing required report.sections.stability object")), true);
});

test("report artifact contract rejects malformed v1 section content", async () => {
  const { validateReportArtifactContract } = await loadContractModule();
  const result = validateReportArtifactContract({
    schema_version: "v1",
    report: {
      report_id: "rep_contract_bad_001",
      sections: {
        executive_summary: {},
        revenue_snapshot: {
          series: [],
        },
        stability: {
          stability_index: null,
        },
        prioritized_insights: [],
        ranked_recommendations: {
          items: [],
        },
        outlook: {
          revenue_projection: {},
          churn_outlook: {},
          platform_risk_outlook: {},
        },
      },
    },
  });

  assert.equal(result.valid, false);
  assert.equal(
    result.errors.some((error) => error.includes("revenue_snapshot") && error.includes("series/trend")),
    true,
  );
  assert.equal(result.errors.some((error) => error.includes("stability") && error.includes("stability_index")), true);
  assert.equal(result.errors.some((error) => error.includes("prioritized_insights")), true);
  assert.equal(result.errors.some((error) => error.includes("ranked_recommendations")), true);
  assert.equal(result.errors.some((error) => error.includes("outlook")), true);
});
