import type { ReportDetailPresentationModel } from "./detail-presentation";
import type { ReportDetail } from "./normalize-report-detail";
import type { ReportDiagnosisType, ReportViewModel } from "./normalize-artifact-to-report-model";

export type WowKpiCard = {
  id: string;
  label: string;
  value: string;
  detail: string | null;
};

export type WowOpportunityViewModel = {
  available: boolean;
  finding: string;
  upsideLabel: string | null;
  action: string;
};

export type WowPlatformMixViewModel = {
  concentrationScore: number | null;
  topPlatformLabel: string | null;
  interpretationText: string;
  highlights: string[];
  available: boolean;
};

export type WowTrendDirection = "up" | "down" | "flat" | "unknown";

export type WowMomentumViewModel = {
  revenueTrend: WowTrendDirection;
  subscriberTrend: WowTrendDirection;
  headline: string;
  summaryText: string;
  hasPoints: boolean;
};

export type WowStrengthRiskItem = {
  id: string;
  text: string;
};

export type WowStrengthsRisksViewModel = {
  strengths: WowStrengthRiskItem[];
  risks: WowStrengthRiskItem[];
  available: boolean;
};

export type WowNextActionViewModel = {
  id: string;
  title: string;
  detail: string | null;
  timeframe: string | null;
};

export type WowBiggestRiskViewModel = {
  available: boolean;
  headline: string;
  body: string;
};

export type ReportWowSummaryViewModel = {
  kpiCards: [WowKpiCard, WowKpiCard, WowKpiCard, WowKpiCard];
  summarySentence: string | null;
  kpiContext: string | null;
  coverage: {
    snapshotCoverageNote: string | null;
    reportHasBusinessMetrics: boolean;
    sectionStrength: ReportDetail["sectionStrength"];
  };
  opportunity: WowOpportunityViewModel;
  biggestRisk: WowBiggestRiskViewModel;
  platformMix: WowPlatformMixViewModel;
  momentum: WowMomentumViewModel;
  strengthsRisks: WowStrengthsRisksViewModel;
  nextActions: WowNextActionViewModel[];
};

export type BuildReportWowSummaryOptions = {
  includeContinuitySignals?: boolean;
};

const KNOWN_PLATFORMS = ["Patreon", "Substack", "YouTube", "Instagram", "TikTok"];
const GENERIC_ACTION_LABELS = new Set(["recommended action", "action", "recommendation"]);

type PlatformRiskContext = {
  concentrationScore: number | null;
  topPlatform: string | null;
  partialRead: boolean;
  balancedRead: boolean;
};

function extractTopPlatformFromHighlights(highlights: string[]): string | null {
  for (const line of highlights) {
    for (const platform of KNOWN_PLATFORMS) {
      if (line.toLowerCase().includes(platform.toLowerCase())) {
        return platform;
      }
    }
  }

  return null;
}

function extractConcentrationScoreFromHighlights(highlights: string[]): number | null {
  for (const line of highlights) {
    const match = line.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
    if (!match) {
      continue;
    }

    const value = Number.parseFloat(match[1] ?? "");
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function resolvePlatformRiskContext(presentation: ReportDetailPresentationModel): PlatformRiskContext {
  const combinedHighlights = presentation.platformMix.highlights.join(" ").toLowerCase();

  return {
    concentrationScore: presentation.platformMix.concentrationScore ?? extractConcentrationScoreFromHighlights(presentation.platformMix.highlights),
    topPlatform: extractTopPlatformFromHighlights(presentation.platformMix.highlights),
    partialRead:
      /mainly represented|partially represented|only reflects part|partial|leans heavily on one source|one source right now/.test(
        combinedHighlights,
      ),
    balancedRead: /balanced|spread across|more than one|not heavily concentrated|diversified|few sources/.test(combinedHighlights),
  };
}

function toWowDirection(raw: string | null | undefined): WowTrendDirection {
  if (!raw) return "unknown";

  const normalized = raw.toLowerCase();
  if (normalized === "up") return "up";
  if (normalized === "down") return "down";
  if (normalized === "flat") return "flat";
  return "unknown";
}

function cleanSentence(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/[_]+/g, " ")
    .replace(/\bcurrent profile (shows|looks)\b/i, "")
    .replace(/\bthe evidence does not support a single dominant constraint\b/i, "no single issue stands out above the rest")
    .trim()
    .replace(/^[,;:\- ]+/, "");

  if (!cleaned) {
    return null;
  }

  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function lowerFirstCharacter(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toLowerCase() + value.slice(1);
}

function buildKpiContext(snapshotCoverageNote: string | null): string {
  if (snapshotCoverageNote) {
    return "These numbers reflect the latest business read. One or more sources are still missing from the newest period.";
  }

  return "Use these numbers to sanity-check revenue, subscriber health, growth, and concentration at a glance.";
}

function buildCoverageSummary(snapshotCoverageNote: string | null): string | null {
  if (!snapshotCoverageNote) {
    return null;
  }

  return "The latest view only covers part of your source mix, so treat sharp swings as directional until the full picture catches up.";
}

function buildPlatformRiskHeadline(context: PlatformRiskContext): string {
  const { concentrationScore, partialRead, balancedRead } = context;

  if (concentrationScore === null) {
    if (partialRead) {
      return "This income read mostly reflects one source right now.";
    }
    if (balancedRead) {
      return "Your income is coming from more than one place.";
    }
    return "Income mix is still forming in this report.";
  }
  if (concentrationScore >= 80) {
    return "Your income is currently dependent on one platform.";
  }
  if (concentrationScore >= 60) {
    return "Most of your income still comes from one platform.";
  }
  if (concentrationScore >= 40) {
    return "Your income is starting to spread beyond one main platform.";
  }
  return "Your income is not riding on one place right now.";
}

function buildPlatformRiskImplication(context: PlatformRiskContext): string {
  const { concentrationScore, topPlatform, partialRead, balancedRead } = context;
  const platformLabel = topPlatform ?? "that platform";

  if (concentrationScore === null) {
    if (partialRead) {
      return `${platformLabel} is doing most of the work in this latest read, so avoid treating it like the full business just yet.`;
    }
    if (balancedRead) {
      return "No single source appears to be carrying the whole business right now.";
    }
    return "Use this as a directional read, not a final verdict on your income mix.";
  }
  if (concentrationScore >= 80) {
    return `${platformLabel} is carrying most of the business right now, so a dip there would hit income quickly.`;
  }
  if (concentrationScore >= 60) {
    return `${platformLabel} is still doing most of the heavy lifting, which keeps your income more fragile than it needs to be.`;
  }
  if (concentrationScore >= 40) {
    return "You have more than one source working, but one platform still leads the business.";
  }
  return "No single platform is dominating the business right now.";
}

function buildMomentumHeadline(revenue: WowTrendDirection, subscribers: WowTrendDirection): string {
  if (revenue === "down" || subscribers === "down") {
    return "Your growth slowed this period.";
  }
  if (revenue === "up" && subscribers === "up") {
    return "Your business is building momentum this period.";
  }
  if (revenue === "flat" && subscribers === "flat") {
    return "Your business held steady this period.";
  }
  if (revenue === "up") {
    return "Revenue improved, but momentum is still uneven.";
  }
  if (subscribers === "up") {
    return "Audience momentum improved, but revenue has not fully followed yet.";
  }
  return "Momentum is hard to read from this snapshot alone.";
}

function buildMomentumImplication(revenue: WowTrendDirection, subscribers: WowTrendDirection): string {
  if (revenue === "down" && subscribers === "down") {
    return "When both income and subscribers soften together, the business usually needs a sharper offer or a steadier publishing rhythm.";
  }
  if (revenue === "down") {
    return "Income is softening, which usually means conversion or retention needs attention before volatility grows.";
  }
  if (subscribers === "down") {
    return "Audience pullback often shows up in revenue after a delay, so this is worth addressing early.";
  }
  if (revenue === "up" && subscribers === "up") {
    return "More of your audience and income are moving in the same direction, which is a healthy sign.";
  }
  if (revenue === "flat" && subscribers === "flat") {
    return "Steady is better than a drop, but it can also mean the business needs a fresh growth lever.";
  }
  if (revenue === "up") {
    return "Revenue is moving, but the growth engine is not fully broad-based yet.";
  }
  if (subscribers === "up") {
    return "Audience growth is showing up, and the next step is turning more of that attention into income.";
  }
  return "There is not enough trend data here to call momentum with confidence.";
}

function toActionDetail(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  if (/confidence|evidence|heuristic|technical|schema|quality\s+flag/i.test(cleaned)) {
    return null;
  }

  return cleanSentence(cleaned);
}

function buildOpportunityFromDiagnosisType(
  diagnosisType: ReportDiagnosisType | null,
  concentrationScore: number | null,
  topPlatform: string | null,
): WowOpportunityViewModel {
  const platformLabel = topPlatform ?? "your top platform";

  if (diagnosisType === "concentration_pressure") {
    return {
      available: true,
      finding: "Start building a second income stream this month.",
      upsideLabel: "Even one meaningful secondary stream makes the business feel less fragile.",
      action: `Right now, most of your income depends on ${platformLabel}. The fastest way to reduce that risk is to move part of your audience into an owned channel like email, membership, or direct sales.`,
    };
  }

  if (diagnosisType === "churn_pressure") {
    return {
      available: true,
      finding: "Give your existing supporters a better reason to stay.",
      upsideLabel: "Small retention wins usually improve revenue stability faster than chasing brand-new customers.",
      action: "Within the next 2 weeks, pick the segment that is dropping off fastest and test a simple re-engagement offer, perk, or check-in before they leave.",
    };
  }

  if (diagnosisType === "monetization_pressure") {
    return {
      available: true,
      finding: "Turn more audience attention into a direct offer.",
      upsideLabel: "You may not need a bigger audience first. A clearer paid path can unlock more value from the audience you already have.",
      action: "This month, add one stronger paid conversion path for your warmest audience, such as a membership, paid product, or upgrade prompt tied to your highest-interest content.",
    };
  }

  if (diagnosisType === "acquisition_pressure") {
    return {
      available: true,
      finding: "Rebuild audience momentum on the channel that is still moving.",
      upsideLabel: "When audience growth restarts, revenue usually becomes easier to stabilize and grow.",
      action: "This month, commit to a more consistent publishing rhythm or repeatable format on the channel showing the best audience response.",
    };
  }

  if (concentrationScore !== null && concentrationScore >= 70) {
    return {
      available: true,
      finding: "Start widening the business beyond one main platform.",
      upsideLabel: "A broader income base gives you more room to experiment without putting the whole business at risk.",
      action: `Most of the business is still tied to ${platformLabel}. Build one owned path that gives your audience a way to support you outside that platform.`,
    };
  }

  return {
    available: false,
    finding: "No single opportunity stands out strongly enough to overstate from this report.",
    upsideLabel: null,
    action: "Use the audience and revenue sections below to choose the clearest next lever.",
  };
}

function formatSignedPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const normalized = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${rounded > 0 ? "+" : ""}${normalized}%`;
}

function buildKpiCards(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
  reportDetail?: Pick<ReportDetail, "snapshotCoverageNote"> | null,
  options?: BuildReportWowSummaryOptions,
): [WowKpiCard, WowKpiCard, WowKpiCard, WowKpiCard] {
  const revenueMetric = presentation.heroMetrics.find((metric) => metric.id === "net_revenue");
  const revenueCard: WowKpiCard = {
    id: "total_revenue",
    label: "Total Revenue",
    value: revenueMetric?.value ?? "$--",
    detail: null,
  };

  const subscriberMetric = presentation.subscriberHealth.metrics.find((metric) => metric.id === "subscribers");
  const subscribersCard: WowKpiCard = {
    id: "active_subscribers",
    label: "Paid Subscribers",
    value: subscriberMetric?.value ?? "--",
    detail: null,
  };

  let growthValue = "--";
  const includeContinuitySignals = options?.includeContinuitySignals ?? true;
  const subsDelta =
    includeContinuitySignals && !reportDetail?.snapshotCoverageNote
      ? artifactModel?.whatChanged?.deltas?.active_subscribers ?? artifactModel?.whatChanged?.deltas?.subscribers ?? null
      : null;

  if (subsDelta?.percentDelta !== null && subsDelta?.percentDelta !== undefined) {
    growthValue = formatSignedPercent(subsDelta.percentDelta);
  } else {
    const trendPrimitive = presentation.diagnosis.primitives.find((entry) => entry.label === "Subscriber trend");
    if (trendPrimitive?.value) {
      growthValue = trendPrimitive.value;
    }
  }

  const growthCard: WowKpiCard = {
    id: "net_growth",
    label: "Net Growth",
    value: growthValue,
    detail: null,
  };

  const topPlatform = extractTopPlatformFromHighlights(presentation.platformMix.highlights);
  const concentrationScore = presentation.platformMix.concentrationScore;
  let topPlatformValue = "--";

  if (topPlatform) {
    topPlatformValue = concentrationScore !== null ? `${topPlatform} ${Math.round(concentrationScore)}%` : topPlatform;
  } else if (concentrationScore !== null) {
    topPlatformValue = `${Math.round(concentrationScore)}% concentration`;
  }

  const topPlatformCard: WowKpiCard = {
    id: "top_platform",
    label: "Top Platform",
    value: topPlatformValue,
    detail: null,
  };

  return [revenueCard, subscribersCard, growthCard, topPlatformCard];
}

function buildSummarySentence(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
  reportDetail?: Pick<ReportDetail, "snapshotCoverageNote"> | null,
): string | null {
  const diagnosisType = artifactModel?.diagnosis?.diagnosisType ?? null;
  const primitives = artifactModel?.diagnosis?.primitives;
  const platformRisk = resolvePlatformRiskContext(presentation);
  const concentrationScore = platformRisk.concentrationScore;
  const topPlatform = platformRisk.topPlatform;
  const coverageSummary = buildCoverageSummary(reportDetail?.snapshotCoverageNote ?? null);
  const revenueTrend = toWowDirection(primitives?.revenueTrendDirection);
  const subscriberTrend = toWowDirection(primitives?.activeSubscribersDirection);

  let happening: string | null = null;
  if (diagnosisType === "concentration_pressure" || (concentrationScore !== null && concentrationScore >= 70)) {
    happening =
      revenueTrend === "down"
        ? "Your business slowed this period and is leaning heavily on a single platform."
        : "Your business is still leaning heavily on a single platform.";
  } else if (diagnosisType === "churn_pressure") {
    happening = "Supporters are leaving faster than they are being replaced right now.";
  } else if (diagnosisType === "monetization_pressure") {
    happening = "Your audience is showing up, but not enough of that attention is turning into revenue.";
  } else if (diagnosisType === "acquisition_pressure") {
    happening =
      revenueTrend === "down"
        ? "Audience momentum cooled this period, which makes the business harder to expand."
        : "Audience growth is showing up, but it has not turned into enough owned demand yet.";
  } else if (revenueTrend === "down" || subscriberTrend === "down") {
    happening = "Your business softened this period.";
  } else if (revenueTrend === "up" && subscriberTrend === "up") {
    happening = "Your business is moving in a healthier direction this period.";
  }

  const fallbackSummary = cleanSentence(presentation.executiveSummary[0]);
  const opening = happening ?? fallbackSummary;

  if (!opening) {
    return coverageSummary ?? null;
  }

  let why = coverageSummary;
  if (!why) {
    if (concentrationScore !== null && concentrationScore >= 70) {
      why = `That leaves your income exposed if ${topPlatform ?? "that platform"} slows down again.`;
    } else if (platformRisk.partialRead) {
      why = "This latest read mostly reflects one source, so avoid treating it like the full business just yet.";
    } else if (diagnosisType === "churn_pressure") {
      why = "That usually puts revenue under pressure even when audience growth is still happening elsewhere.";
    } else if (diagnosisType === "monetization_pressure") {
      why = "That gap makes it harder to turn growth into a business that feels reliable.";
    } else if (diagnosisType === "acquisition_pressure") {
      why =
        revenueTrend === "down"
          ? "Without fresh audience energy, revenue momentum usually becomes harder to maintain."
          : "That creates an opening to turn attention into something you can keep and monetize more predictably.";
    } else if (revenueTrend === "down") {
      why = "When income starts slipping, small problems tend to feel bigger very quickly.";
    } else if (revenueTrend === "up" && subscriberTrend === "up") {
      why = "That usually means your audience and income are moving together instead of fighting each other.";
    }
  }

  const nextActions = buildNextActions(presentation, artifactModel);
  const nextStep =
    nextActions[0]?.title != null
      ? `Next, ${lowerFirstCharacter(nextActions[0].title.replace(/[.!?]+$/, ""))}.`
      : null;

  return [opening, why, nextStep].filter((line): line is string => Boolean(line)).join(" ");
}

function buildOpportunity(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
): WowOpportunityViewModel {
  const diagnosisType = artifactModel?.diagnosis?.diagnosisType ?? null;
  const platformRisk = resolvePlatformRiskContext(presentation);
  const topRecommendation = presentation.recommendations[0];
  if (topRecommendation && topRecommendation.body.length > 12) {
    const cleanedTitle = cleanSentence(topRecommendation.body);
    const cleanedDetail = toActionDetail(topRecommendation.detail);
    const usableLabel =
      topRecommendation.label &&
      topRecommendation.label.length > 20 &&
      !GENERIC_ACTION_LABELS.has(topRecommendation.label.toLowerCase().trim())
        ? cleanSentence(topRecommendation.label)
        : null;

    return {
      available: true,
      finding: cleanedTitle ?? "The clearest next move is already visible in this report.",
      upsideLabel: cleanedDetail,
      action:
        usableLabel ??
        cleanedDetail ??
        buildOpportunityFromDiagnosisType(diagnosisType, platformRisk.concentrationScore, platformRisk.topPlatform).upsideLabel ??
        "This should make the business easier to grow without adding more fragility.",
    };
  }

  const fromDiagnosis = buildOpportunityFromDiagnosisType(diagnosisType, platformRisk.concentrationScore, platformRisk.topPlatform);
  if (fromDiagnosis.available) {
    return fromDiagnosis;
  }

  const topSignal = [...presentation.signals].sort((left, right) => (right.severity ?? 0) - (left.severity ?? 0))[0];
  if (topSignal?.title) {
    return {
      available: true,
      finding: cleanSentence(topSignal.title) ?? "There is a useful next move in the report.",
      upsideLabel: cleanSentence(topSignal.description),
      action: "Use this signal as the next place to tighten the business instead of trying to fix everything at once.",
    };
  }

  return {
    available: false,
    finding: "No single opportunity stands out strongly enough to overstate from this snapshot.",
    upsideLabel: null,
    action: "Use the strongest audience or revenue signal below to pick one focused next step.",
  };
}

function buildPlatformMix(presentation: ReportDetailPresentationModel): WowPlatformMixViewModel {
  const context = resolvePlatformRiskContext(presentation);
  const implicationLine = buildPlatformRiskImplication(context);

  return {
    concentrationScore: context.concentrationScore,
    topPlatformLabel: context.topPlatform,
    interpretationText: buildPlatformRiskHeadline(context),
    highlights: implicationLine ? [implicationLine] : [],
    available: context.concentrationScore !== null || presentation.platformMix.highlights.length > 0,
  };
}

function buildMomentum(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
): WowMomentumViewModel {
  const primitives = artifactModel?.diagnosis?.primitives;
  const revenueTrend = toWowDirection(primitives?.revenueTrendDirection);
  const subscriberTrend = toWowDirection(primitives?.activeSubscribersDirection);

  return {
    revenueTrend,
    subscriberTrend,
    headline: buildMomentumHeadline(revenueTrend, subscriberTrend),
    summaryText: buildMomentumImplication(revenueTrend, subscriberTrend),
    hasPoints: presentation.revenueTrend.points.length >= 3,
  };
}

function buildStrengthsRisks(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
  options?: BuildReportWowSummaryOptions,
): WowStrengthsRisksViewModel {
  const comparisonAvailable = (options?.includeContinuitySignals ?? true) && presentation.whatChanged.comparisonAvailable;

  if (comparisonAvailable) {
    const strengths = presentation.whatChanged.improved.slice(0, 3).map((item) => ({ id: item.id, text: item.body }));
    const risks = [...presentation.whatChanged.worsened.slice(0, 2), ...presentation.whatChanged.watchNext.slice(0, 1)].map((item) => ({
      id: item.id,
      text: item.body,
    }));

    return { strengths, risks, available: strengths.length > 0 || risks.length > 0 };
  }

  const strengths: WowStrengthRiskItem[] = [];
  const risks: WowStrengthRiskItem[] = [];
  const primitives = artifactModel?.diagnosis?.primitives;

  if (primitives) {
    if (primitives.revenueTrendDirection === "up") {
      strengths.push({ id: "revenue_up", text: "Revenue is moving up." });
    }
    if (primitives.activeSubscribersDirection === "up") {
      strengths.push({ id: "subscribers_up", text: "Subscriber growth is still working in your favor." });
    }
    if (primitives.churnPressureLevel === "low") {
      strengths.push({ id: "churn_low", text: "Retention pressure looks manageable right now." });
    }
    if (primitives.churnPressureLevel === "high") {
      risks.push({ id: "churn_high", text: "Retention pressure is building." });
    }
    if (primitives.monetizationEfficiencyLevel === "high") {
      risks.push({ id: "monetization_high", text: "Audience attention is not converting into enough revenue yet." });
    }
    if (primitives.revenueTrendDirection === "down") {
      risks.push({ id: "revenue_down", text: "Revenue is trending down." });
    }
  }

  const highSeveritySignals = presentation.signals.filter((signal) => (signal.severity ?? 0) >= 4).slice(0, 2);
  for (const signal of highSeveritySignals) {
    if (!risks.some((risk) => risk.id === signal.id)) {
      risks.push({ id: signal.id, text: signal.title });
    }
  }

  return {
    strengths: strengths.slice(0, 3),
    risks: risks.slice(0, 3),
    available: strengths.length > 0 || risks.length > 0,
  };
}

function buildBiggestRisk(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
): WowBiggestRiskViewModel {
  const platformRisk = resolvePlatformRiskContext(presentation);
  const concentrationScore = platformRisk.concentrationScore;
  const platformLabel = platformRisk.topPlatform ?? "that platform";

  if (concentrationScore !== null && concentrationScore >= 80) {
    return {
      available: true,
      headline: "Most of your income is coming from one place.",
      body: `${platformLabel} is carrying almost all of the business right now, so any slowdown there would hit your income fast.`,
    };
  }

  const primitives = artifactModel?.diagnosis?.primitives;
  if (primitives?.churnPressureLevel === "high") {
    return {
      available: true,
      headline: "You are losing supporters faster than you want to be.",
      body: "When retention slips, revenue usually gets tighter even before other parts of the business change.",
    };
  }

  if (concentrationScore !== null && concentrationScore >= 60) {
    return {
      available: true,
      headline: "Too much of the business still depends on one platform.",
      body: `${platformLabel} is still doing most of the work, which makes the income side of the business more fragile than it looks.`,
    };
  }

  const firstRisk = presentation.signals.find((signal) => (signal.severity ?? 0) >= 4);
  if (firstRisk) {
    return {
      available: true,
      headline: cleanSentence(firstRisk.title) ?? "There is a meaningful risk to pay attention to.",
      body: cleanSentence(firstRisk.description) ?? "This is the clearest risk surfaced in the current report.",
    };
  }

  return { available: false, headline: "", body: "" };
}

function buildDiagnosisBasedActions(
  diagnosisType: ReportDiagnosisType | null,
  topPlatform: string | null,
): WowNextActionViewModel[] {
  if (diagnosisType === "concentration_pressure") {
    return [
      {
        id: "owned-channel",
        title: "Start capturing your audience into an owned channel",
        detail: `Within the next 2 weeks, give your audience a way to follow you outside ${topPlatform ?? "your main platform"}, such as email, membership, or direct checkout.`,
        timeframe: "Next 2 weeks",
      },
      {
        id: "second-income-stream",
        title: "Build one secondary income path",
        detail: "Pick a simple offer you can launch quickly so the business is not relying on one platform alone.",
        timeframe: "This month",
      },
    ];
  }

  if (diagnosisType === "churn_pressure") {
    return [
      {
        id: "retention-fix",
        title: "Fix the point where supporters are dropping off",
        detail: "Review the segment with the highest cancellations and test one retention offer, perk, or message for that group first.",
        timeframe: "Next 2 weeks",
      },
      {
        id: "member-value",
        title: "Refresh the value supporters get after joining",
        detail: "A clearer member experience usually stabilizes income faster than pushing harder on acquisition alone.",
        timeframe: "This month",
      },
    ];
  }

  if (diagnosisType === "monetization_pressure") {
    return [
      {
        id: "direct-offer",
        title: "Add one clearer paid offer to your warm audience",
        detail: "Use the channel with the strongest engagement to drive one direct membership, product, or upgrade ask.",
        timeframe: "This month",
      },
      {
        id: "conversion-path",
        title: "Make the path from attention to purchase simpler",
        detail: "Reduce friction between your content and the offer so more of the audience can act when interest is highest.",
        timeframe: "Next 2 weeks",
      },
    ];
  }

  if (diagnosisType === "acquisition_pressure") {
    return [
      {
        id: "cadence",
        title: "Rebuild momentum with a steadier publishing rhythm",
        detail: "Pick the format or channel that is still moving and make it consistent enough for the audience to notice.",
        timeframe: "This month",
      },
      {
        id: "repeatable-format",
        title: "Double down on the format that is already getting traction",
        detail: "A repeatable growth format is usually more effective than spreading effort across too many experiments at once.",
        timeframe: "Next 2 weeks",
      },
    ];
  }

  return [];
}

function buildNextActions(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
): WowNextActionViewModel[] {
  const actions: WowNextActionViewModel[] = presentation.recommendations.slice(0, 2).map((recommendation, index) => ({
    id: recommendation.id,
    title: recommendation.body,
    detail: toActionDetail(recommendation.detail) ?? null,
    timeframe: index === 0 ? "Next 2 weeks" : "This month",
  }));

  if (actions.length >= 2) {
    return actions;
  }

  const fallbackActions = buildDiagnosisBasedActions(
    artifactModel?.diagnosis?.diagnosisType ?? null,
    extractTopPlatformFromHighlights(presentation.platformMix.highlights),
  );

  for (const fallbackAction of fallbackActions) {
    if (actions.some((action) => action.title.toLowerCase() === fallbackAction.title.toLowerCase())) {
      continue;
    }

    actions.push(fallbackAction);
    if (actions.length >= 2) {
      break;
    }
  }

  return actions.slice(0, 2);
}

export function buildReportWowSummaryViewModel(
  presentation: ReportDetailPresentationModel,
  artifactModel: ReportViewModel | null,
  reportDetail?: Pick<ReportDetail, "snapshotCoverageNote" | "reportHasBusinessMetrics" | "sectionStrength"> | null,
  options?: BuildReportWowSummaryOptions,
): ReportWowSummaryViewModel {
  return {
    kpiCards: buildKpiCards(presentation, artifactModel, reportDetail, options),
    summarySentence: buildSummarySentence(presentation, artifactModel, reportDetail),
    kpiContext: buildKpiContext(reportDetail?.snapshotCoverageNote ?? null),
    coverage: {
      snapshotCoverageNote: reportDetail?.snapshotCoverageNote ?? null,
      reportHasBusinessMetrics: reportDetail?.reportHasBusinessMetrics ?? true,
      sectionStrength: reportDetail?.sectionStrength ?? [],
    },
    opportunity: buildOpportunity(presentation, artifactModel),
    biggestRisk: buildBiggestRisk(presentation, artifactModel),
    platformMix: buildPlatformMix(presentation),
    momentum: buildMomentum(presentation, artifactModel),
    strengthsRisks: buildStrengthsRisks(presentation, artifactModel, options),
    nextActions: buildNextActions(presentation, artifactModel),
  };
}
