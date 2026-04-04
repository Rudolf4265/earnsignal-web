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
    schema_version: "v1",
    report: {
      report_id: "rep_prod_shape_001",
      created_at: "2026-03-09T12:00:00Z",
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
        prioritized_insights: ["Revenue momentum remains positive in high-retention cohorts."],
        ranked_recommendations: ["Reallocate spend toward retention loops before top-of-funnel expansion."],
        outlook: {
          revenue_projection: {
            summary: "Base case implies steady growth with lower downside variance.",
          },
          churn_outlook: {
            summary: "Churn risk is flat to slightly improving.",
          },
          platform_risk_outlook: {
            summary: "No near-term platform concentration shock expected.",
          },
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

  const outlook = result.model.sections.find((section) => section.title === "Outlook");
  assert.equal(Boolean(outlook), true);
  assert.equal(outlook.bullets.some((bullet) => bullet.includes("growth with lower downside variance")), true);

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

test("normalizeArtifactToReportModel preserves typed uncertainty and recommendation metadata", async () => {
  const { normalizeArtifactToReportModel } = await loadArtifactNormalizer(Date.now() + 4);
  const result = normalizeArtifactToReportModel({
    schema_version: "v1",
    report: {
      report_id: "rep_truth_001",
      analysis_mode: "reduced",
      data_quality_level: "limited",
      metric_snapshot: {
        churn_risk: 50,
        churn_risk_confidence: "low",
        churn_risk_availability: "unavailable",
        churn_risk_reason_codes: ["missing_subscriber_evidence"],
        active_subscribers_source: "derived",
      },
      metric_provenance: {
        active_subscribers: {
          value: 1200,
          source: "derived",
          confidence: "low",
          insufficient_reason: "missing_subscriber_snapshot",
        },
        arpu: {
          value: 42,
          source: "derived",
          confidence: "medium",
        },
      },
      sections: {
        executive_summary: {
          narrative_text: "Reduced confidence due to limited subscriber evidence.",
        },
        revenue_snapshot: {
          series: [{ period: "2026-02", net_revenue: 10000 }],
        },
        stability: {
          stability_index: 61,
          confidence: 0.52,
          confidence_adjusted: true,
          evidence_strength: "weak",
          insufficient_reason: "missing_subscriber_snapshot",
        },
        prioritized_insights: [
          {
            id: "sig_1",
            title: "Churn pressure needs validation",
            description: "Subscriber evidence is incomplete this cycle.",
            confidence_adjusted: true,
            evidence_strength: "weak",
            recommendation_mode: "watch",
          },
        ],
        ranked_recommendations: [
          {
            id: "rec_1",
            title: "Validate churn visibility before a retention sprint",
            recommendation_mode: "validate",
            confidence_adjusted: true,
            evidence_strength: "weak",
            insufficient_reason: "missing_subscriber_snapshot",
            steps_30d: ["Verify subscriber snapshot coverage."],
          },
        ],
        outlook: {
          churn_outlook: {
            explanation: "Unavailable for this report because subscriber evidence is missing.",
            availability: "unavailable",
            confidence_adjusted: true,
            insufficient_reason: "missing_subscriber_evidence",
          },
        },
      },
    },
  });

  assert.equal(result.model.analysisMode, "reduced");
  assert.equal(result.model.dataQualityLevel, "limited");
  assert.equal(result.model.metricSnapshot?.churnRiskAvailability, "unavailable");
  assert.equal(result.model.metricSnapshot?.activeSubscribersSource, "derived");
  assert.equal(result.model.metricProvenance.active_subscribers?.source, "derived");
  assert.equal(result.model.metricProvenance.active_subscribers?.confidence, "low");
  assert.equal(result.model.stability?.confidenceAdjusted, true);
  assert.equal(result.model.stability?.insufficientReason, "missing_subscriber_snapshot");
  assert.equal(result.model.signals[0]?.recommendationMode, "watch");
  assert.equal(result.model.signals[0]?.confidenceAdjusted, true);
  assert.equal(result.model.recommendations[0]?.recommendationMode, "validate");
  assert.equal(result.model.recommendations[0]?.steps[0], "Verify subscriber snapshot coverage.");
  assert.equal(result.model.outlook?.items[0]?.id, "churn_outlook");
  assert.equal(result.model.outlook?.items[0]?.availability, "unavailable");
});

test("normalizeArtifactToReportModel extracts typed diagnosis and what-changed models without flattening them into generic sections", async () => {
  const { normalizeArtifactToReportModel } = await loadArtifactNormalizer(Date.now() + 41);
  const diagnosis = {
    diagnosis_type: "churn_pressure",
    confidence: "medium",
    evidence_strength: "moderate",
    confidence_adjusted: true,
    reason_codes: ["churn_pressure_primary", "analysis_mode_full"],
    summary_text: "Current profile looks more churn-limited based on elevated churn pressure.",
    supporting_metrics: [
      {
        metric: "churn_rate",
        current_value: 0.12,
        prior_value: 0.08,
        direction: "up",
        source: "observed",
        confidence: "medium",
        evidence_strength: "moderate",
        reason_codes: ["churn_pressure_high"],
      },
    ],
    primitives: {
      revenue_trend_direction: "down",
      active_subscribers_direction: "down",
      churn_pressure_level: "high",
      concentration_pressure_level: "low",
      monetization_efficiency_level: "low",
      stability_direction: "down",
      evidence_strength: "moderate",
      data_quality_level: "good",
      analysis_mode: "full",
    },
  };
  const whatChanged = {
    comparison_available: true,
    prior_report_id: "rep_prior_001",
    prior_period_start: "2026-01-01",
    prior_period_end: "2026-01-31",
    comparable_metric_count: 4,
    comparison_basis_metrics: ["latest_net_revenue", "active_subscribers"],
    confidence: "medium",
    evidence_strength: "moderate",
    comparison_reason_codes: ["comparison_basis_available", "churn_rate_worsened"],
    deltas: {
      latest_net_revenue: {
        metric: "latest_net_revenue",
        current_value: 9400,
        prior_value: 10000,
        absolute_delta: -600,
        percent_delta: -0.06,
        direction: "down",
        comparable: true,
        confidence: "medium",
        evidence_strength: "moderate",
      },
    },
    what_improved: [
      {
        category: "platform",
        metric: "concentration_risk",
        change_type: "improved",
        direction: "down",
        materiality: "medium",
        confidence: "medium",
        evidence_strength: "moderate",
        summary_text: "Platform concentration eased versus the prior report.",
      },
    ],
    what_worsened: [
      {
        category: "churn",
        metric: "churn_rate",
        change_type: "worsened",
        direction: "up",
        materiality: "high",
        confidence: "medium",
        evidence_strength: "moderate",
        reason_codes: ["churn_rate_worsened"],
        summary_text: "Churn worsened relative to the prior report.",
      },
    ],
    watch_next: [
      {
        category: "revenue",
        metric: "latest_net_revenue",
        change_type: "watch",
        direction: "down",
        materiality: "medium",
        confidence: "low",
        evidence_strength: "weak",
        summary_text: "Revenue softened and should be watched next cycle.",
      },
    ],
  };

  const result = normalizeArtifactToReportModel({
    schema_version: "v1",
    report: {
      report_id: "rep_diag_cmp_001",
      sections: {
        executive_summary: {
          summary: "Current report shows pressure that needs validation.",
        },
        revenue_snapshot: {
          series: [{ period: "2026-02", net_revenue: 9400 }],
        },
        stability: {
          stability_index: 57,
        },
        prioritized_insights: ["Retention pressure remains elevated."],
        ranked_recommendations: [
          {
            id: "rec_1",
            title: "Audit churn drivers before expanding acquisition spend",
            recommendation_mode: "validate",
            supporting_context_reason_codes: ["churn_pressure_primary", "churn_rate_worsened"],
          },
        ],
        outlook: {
          summary: "Outlook remains cautious while churn is elevated.",
        },
        diagnosis,
        what_changed: whatChanged,
      },
      diagnosis,
      what_changed: whatChanged,
    },
  });

  assert.equal(result.model.diagnosis?.diagnosisType, "churn_pressure");
  assert.equal(result.model.diagnosis?.supportingMetrics[0]?.metric, "churn_rate");
  assert.equal(result.model.whatChanged?.comparisonAvailable, true);
  assert.equal(result.model.whatChanged?.whatWorsened[0]?.summaryText, "Churn worsened relative to the prior report.");
  assert.deepEqual(result.model.recommendations[0]?.supportingContextReasonCodes, ["churn_pressure_primary", "churn_rate_worsened"]);
  assert.equal(result.model.sections.some((section) => section.title === "Diagnosis"), false);
  assert.equal(result.model.sections.some((section) => section.title === "What Changed"), false);
});

test("normalizeArtifactToReportModel keeps older artifacts conservative when typed fields are absent", async () => {
  const { normalizeArtifactToReportModel } = await loadArtifactNormalizer(Date.now() + 5);
  const result = normalizeArtifactToReportModel({
    report_id: "rep_legacy_001",
    sections: {
      executive_summary: {
        summary: "Limited monthly history is available.",
      },
      revenue_snapshot: {
        series: [{ period: "2026-02", net_revenue: 12000 }],
      },
      stability: {
        stability_index: 58,
      },
      prioritized_insights: ["Revenue momentum appears stable."],
      ranked_recommendations: ["Watch this metric next cycle."],
      outlook: {
        summary: "Outlook remains limited without additional history.",
      },
    },
  });

  assert.equal(result.model.analysisMode, null);
  assert.equal(result.model.metricSnapshot, null);
  assert.equal(result.model.metricProvenance.active_subscribers, undefined);
  assert.equal(result.model.diagnosis, null);
  assert.equal(result.model.whatChanged, null);
  assert.equal(result.model.signals[0]?.title, "Revenue momentum appears stable.");
  assert.equal(result.model.recommendations[0]?.recommendationMode, null);
  assert.equal(result.model.outlook?.items.length, 0);
  assert.equal(result.model.outlook?.summary[0], "Outlook remains limited without additional history.");
});

test("normalizeArtifactToReportModel extracts audience growth signals as a typed section without flattening into appendix content", async () => {
  const { normalizeArtifactToReportModel } = await loadArtifactNormalizer(Date.now() + 51);
  const audienceGrowth = {
    title: "Audience & Growth Signals",
    subtitle: "Based on your available Instagram, TikTok, and YouTube audience data.",
    summary: {
      creator_score: 78,
      source_coverage: 66,
      audience_momentum: 72,
      engagement_signal: 64,
    },
    included_sources: [
      {
        platform: "instagram",
        label: "Instagram",
        included: true,
        latest_period_label: "Mar 2026",
        data_type: "audience",
      },
    ],
    platform_cards: [
      {
        platform: "instagram",
        label: "Instagram",
        included: true,
        metrics: {
          followers_trend: "+8.4%",
          reach_trend: "+12.1%",
          interaction_trend: "+6.7%",
        },
        insight: "Audience growth is positive and supported by improving reach.",
      },
    ],
    diagnosis: {
      strongest_signal: "Instagram has the strongest improving audience momentum.",
      watchout: "Shallow engagement is trailing reach growth on Instagram.",
      next_best_move: "Double down on formats that are increasing reach while improving repeat engagement.",
    },
    trust_note: "Growth signals are based on available audience and engagement data and do not change your revenue totals.",
  };

  const result = normalizeArtifactToReportModel({
    schema_version: "v1",
    report: {
      report_id: "rep_growth_typed_001",
      sections: {
        executive_summary: {
          summary: "Revenue quality improved while volatility eased.",
        },
        revenue_snapshot: {
          series: [{ period: "2026-02", net_revenue: 9400 }],
        },
        stability: {
          stability_index: 57,
        },
        prioritized_insights: ["Retention pressure remains elevated."],
        ranked_recommendations: ["Audit churn drivers before expanding acquisition spend."],
        outlook: {
          summary: "Outlook remains cautious while churn is elevated.",
        },
        audience_growth_signals: audienceGrowth,
      },
      audience_growth_signals: audienceGrowth,
    },
  });

  assert.equal(result.model.audienceGrowthSignals?.title, "Audience & Growth Signals");
  assert.equal(result.model.audienceGrowthSignals?.summary.creatorScore, 78);
  assert.equal(result.model.audienceGrowthSignals?.includedSources[0]?.label, "Instagram");
  assert.equal(result.model.audienceGrowthSignals?.platformCards[0]?.metrics[0]?.label, "Followers Trend");
  assert.equal(result.model.audienceGrowthSignals?.diagnosis?.nextBestMove, "Double down on formats that are increasing reach while improving repeat engagement.");
  assert.equal(result.model.sections.some((section) => section.title === "Audience & Growth Signals"), false);
});

test("report creator page no longer renders the debug accordion", async () => {
  const page = await readFile("app/(app)/app/report/[id]/page.tsx", "utf8");

  assert.equal(page.includes('data-testid="report-debug-accordion"'), false);
});

test("report creator page no longer keeps debug-open state locally", async () => {
  const page = await readFile("app/(app)/app/report/[id]/page.tsx", "utf8");

  assert.equal(page.includes("const [debugOpen, setDebugOpen] = useState(false);"), false);
  assert.equal(page.includes("if (!debugOpen || !state.artifactRaw)"), false);
  assert.equal(page.includes("onToggle={(event) => setDebugOpen(event.currentTarget.open)}"), false);
});

test("report detail keeps PDF actions visible in the page UI", async () => {
  const page = await readFile("app/(app)/app/report/[id]/page.tsx", "utf8");

  assert.equal(page.includes('"Open PDF"'), true);
  assert.equal(page.includes('"Download PDF"'), true);
  assert.equal(page.includes("const openPdf = async () => {"), true);
  assert.equal(page.includes("const downloadPdf = async () => {"), true);
});
