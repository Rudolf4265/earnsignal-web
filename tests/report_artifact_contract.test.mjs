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
    report: {
      report_id: "rep_contract_001",
      schema_version: "v1",
      sections: {
        executive_summary: {
          summary: "Revenue quality improved and volatility eased.",
        },
        revenue_snapshot: {
          net_revenue: 215000,
          series: [
            { period: "2025-12", net_revenue: 198000 },
            { period: "2026-01", net_revenue: 205500 },
          ],
        },
        stability: {
          stability_index: 87,
          items: ["Churn velocity is moderating."],
        },
        prioritized_insights: {
          items: ["High-retention cohorts are driving margin expansion."],
        },
        ranked_recommendations: {
          items: ["Rebalance spend toward retention loops before acquisition expansion."],
        },
        outlook: {
          summary: "Base case remains growth-positive with lower downside variance.",
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
