import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const artifactModuleUrl = pathToFileURL(path.resolve("src/lib/report/normalize-artifact-to-report-model.ts")).href;

async function loadArtifactNormalizer(seed = Date.now()) {
  return import(`${artifactModuleUrl}?t=${seed}`);
}

test("normalizeArtifactToReportModel supports executive_summary paragraphs and sections", async () => {
  const { normalizeArtifactToReportModel } = await loadArtifactNormalizer(Date.now() + 1);
  const result = normalizeArtifactToReportModel({
    report_id: "rep_abc",
    schema_version: "2026-03-01",
    created_at: "2026-03-01T10:00:00Z",
    executive_summary: {
      paragraphs: ["Revenue quality is improving.", "Subscriber retention is stable."],
      kpis: {
        net_revenue: 42000,
        subscribers: 1300,
      },
    },
    sections: [
      {
        title: "Revenue Mix",
        bullets: ["Paid subscriptions are up 8%."],
        paragraphs: ["Merchandise remains flat over the prior month."],
      },
    ],
  });

  assert.equal(result.model.reportId, "rep_abc");
  assert.equal(result.model.schemaVersion, "2026-03-01");
  assert.equal(result.model.createdAt, "2026-03-01T10:00:00Z");
  assert.deepEqual(result.model.executiveSummaryParagraphs, ["Revenue quality is improving.", "Subscriber retention is stable."]);
  assert.equal(result.model.kpis.netRevenue, 42000);
  assert.equal(result.model.kpis.subscribers, 1300);
  assert.equal(result.model.sections.length, 1);
  assert.equal(result.model.sections[0].title, "Revenue Mix");
  assert.deepEqual(result.warnings, []);
});

test("normalizeArtifactToReportModel supports production report.sections object shape", async () => {
  const { normalizeArtifactToReportModel } = await loadArtifactNormalizer(Date.now() + 11);
  const result = normalizeArtifactToReportModel({
    report: {
      report_id: "rep_prod_shape_001",
      schema_version: "v1",
      created_at: "2026-03-09T12:00:00Z",
      sections: {
        executive_summary: {
          summary: "Revenue quality improved and volatility eased.",
        },
        revenue_snapshot: {
          net_revenue: 215000,
          series: [
            { period: "2025-12", net_revenue: 198000 },
            { period: "2026-01", net_revenue: 205500 },
            { period: "2026-02", net_revenue: 215000 },
          ],
        },
        subscribers_retention: {
          bullets: ["Retention remained above plan for three straight months."],
        },
        tier_health: {
          bullets: ["Mid-tier conversions increased 6% month over month."],
        },
        platform_mix: {
          items: ["YouTube remains primary, with Spotify growing."],
        },
        clustered_themes: {
          items: ["Pricing discipline and audience quality drove margin expansion."],
        },
        stability: {
          stability_index: 87,
          bullets: ["Churn velocity is moderating."],
        },
        prioritized_insights: {
          items: ["Revenue momentum remains positive in high-retention cohorts."],
        },
        ranked_recommendations: {
          items: ["Reallocate spend toward retention loops before top-of-funnel expansion."],
        },
        outlook: {
          summary: "Base case implies steady growth with lower downside variance.",
        },
        plan: {
          items: ["Run annual plan sensitivity experiments in Q2."],
        },
        appendix: {
          paragraphs: ["Method notes and data caveats."],
        },
      },
    },
  });

  assert.equal(result.model.reportId, "rep_prod_shape_001");
  assert.equal(result.model.schemaVersion, "v1");
  assert.equal(result.model.createdAt, "2026-03-09T12:00:00Z");
  assert.deepEqual(result.model.executiveSummaryParagraphs, ["Revenue quality improved and volatility eased."]);
  assert.equal(result.model.kpis.netRevenue, 215000);
  assert.equal(result.model.kpis.stabilityIndex, 87);

  const sectionTitles = result.model.sections.map((section) => section.title);
  assert.equal(sectionTitles.includes("Revenue Snapshot"), true);
  assert.equal(sectionTitles.includes("Key Signals"), true);
  assert.equal(sectionTitles.includes("Recommended Actions"), true);
  assert.equal(sectionTitles.includes("Outlook"), true);

  const revenueSnapshot = result.model.sections.find((section) => section.title === "Revenue Snapshot");
  assert.equal(Boolean(revenueSnapshot), true);
  assert.equal(revenueSnapshot.bullets.some((bullet) => bullet.includes("2025-12")), true);

  const hasRenderableBody =
    result.model.executiveSummaryParagraphs.length > 0 ||
    Object.values(result.model.kpis).some((value) => value !== null) ||
    result.model.sections.length > 0;
  assert.equal(hasRenderableBody, true);
});

test("normalizeArtifactToReportModel extracts KPI values from top-level and nested sources", async () => {
  const { normalizeArtifactToReportModel } = await loadArtifactNormalizer(Date.now() + 2);

  const topLevel = normalizeArtifactToReportModel({
    kpis: {
      net_revenue: "1400",
      subscribers: 20,
      stability_index: 88,
      churn_velocity: "4",
    },
  });

  const nested = normalizeArtifactToReportModel({
    executive_summary: {
      kpis: {
        net_revenue: 900,
        subscribers: 15,
        stability_index: 70,
        churn_velocity: 9,
      },
    },
  });

  assert.deepEqual(topLevel.model.kpis, {
    netRevenue: 1400,
    subscribers: 20,
    stabilityIndex: 88,
    churnVelocity: 4,
  });
  assert.deepEqual(nested.model.kpis, {
    netRevenue: 900,
    subscribers: 15,
    stabilityIndex: 70,
    churnVelocity: 9,
  });
});

test("normalizeArtifactToReportModel is tolerant when fields are missing or malformed", async () => {
  const { normalizeArtifactToReportModel } = await loadArtifactNormalizer(Date.now() + 3);
  const result = normalizeArtifactToReportModel({
    report_id: 123,
    executive_summary: "invalid",
    sections: ["bad", { title: "", bullets: "invalid" }, { paragraphs: [null, "Renderable paragraph"] }],
  });

  assert.equal(result.model.reportId, null);
  assert.equal(result.model.executiveSummaryParagraphs.length, 0);
  assert.equal(result.model.sections.length, 1);
  assert.deepEqual(result.model.sections[0].paragraphs, ["Renderable paragraph"]);
  assert.equal(result.warnings.length > 0, true);
});

test("report debug accordion stays collapsed by default", async () => {
  const page = await readFile("app/(app)/app/report/[id]/page.tsx", "utf8");

  assert.equal(page.includes('data-testid="report-debug-accordion"'), true);
  assert.equal(/<details[^>]*data-testid="report-debug-accordion"[^>]*\bopen\b/.test(page), false);
});

test("report debug JSON serialization is gated behind accordion open state", async () => {
  const page = await readFile("app/(app)/app/report/[id]/page.tsx", "utf8");

  assert.equal(page.includes("const [debugOpen, setDebugOpen] = useState(false);"), true);
  assert.equal(page.includes("if (!debugOpen || !state.artifactRaw)"), true);
  assert.equal(page.includes("onToggle={(event) => setDebugOpen(event.currentTarget.open)}"), true);
});
