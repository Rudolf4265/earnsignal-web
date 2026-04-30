"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatPricingPlanPrice, getPricingPlan } from "@earnsigma/config";
import { useParams } from "next/navigation";
import { Badge } from "../../_components/dashboard/Badge";
import { Panel } from "../../_components/dashboard/Panel";
import { RevenueTrendChart } from "../../_components/dashboard/RevenueTrendChart";
import { useAppGate } from "../../../_components/app-gate-provider";
import { FeatureGuard } from "../../../_components/feature-guard";
import { SessionExpiredCallout } from "../../../_components/gate-callouts";
import { buttonClassName } from "@/src/components/ui/button";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";
import {
  downloadReportArtifactPdf,
  fetchReportArtifactJson,
  fetchReportDetail,
  fetchReportRunStatus,
  fetchReportPdfBlobUrl,
  getReportErrorMessage,
  type ReportDetail,
} from "@/src/lib/api/reports";
import { hydrateDashboardFromArtifact } from "@/src/lib/dashboard/artifact-hydration";
import { buildDashboardRevenueTrendViewModel } from "@/src/lib/dashboard/revenue-trend";
import {
  buildReportDetailSectionGatingModel,
  canAccessFullReportPdf,
  canRenderReportDetailReportContent,
  resolveReportDetailPdfAccessMode,
} from "@/src/lib/report/detail-gating";
import { isFounderFromEntitlement } from "@/src/lib/entitlements/model";
import {
  buildReportDetailPresentationModel,
  type ReportDetailPresentationModel,
  type ReportDetailPresentationNotice,
} from "@/src/lib/report/detail-presentation";
import { getReportViewState, getRequestId, type ReportViewState } from "@/src/lib/report/detail-state";
import { hasUsableReportArtifact } from "@/src/lib/report/artifact-availability";
import { formatReportCreatedAt, isInFlightReportStatus, toReportStatusLabel, toReportStatusVariant } from "@/src/lib/report/list-model";
import { readReportRouteParamId } from "@/src/lib/report/route-id";
import { normalizeArtifactToReportModel, type ReportViewModel } from "@/src/lib/report/normalize-artifact-to-report-model";
import { formatReportArtifactContractErrors, patchSparseArtifact, validateReportArtifactContract } from "@/src/lib/report/artifact-contract";
import { buildReportFraming, formatIncludedSourceCountLabel, normalizePlatformsIncluded } from "@/src/lib/report/source-labeling";
import { buildReportWowSummaryViewModel, type ReportWowSummaryViewModel } from "@/src/lib/report/wow-summary-view-model";
import { buildRevenueExplanation, isDataCompletenessAction } from "@/src/lib/report/premium-narrative";
import { ReportAudienceGrowthSection } from "./_components/ReportAudienceGrowthSection";
import { ReportStrengthsRisksSection } from "./_components/ReportStrengthsRisksSection";
import { buildReportFreeTeaserViewModel, ReportFreeTeaser } from "./_components/ReportFreeTeaser";

type ReportPageState = {
  view: ReportViewState | "invalid_route";
  report: ReportDetail | null;
  artifactModel: ReportViewModel | null;
  artifactWarnings: string[];
  artifactRaw: unknown | null;
  artifactError: string | null;
  artifactJsonMissing: boolean;
  requestId?: string;
};

const initialState: ReportPageState = {
  view: "loading",
  report: null,
  artifactModel: null,
  artifactWarnings: [],
  artifactRaw: null,
  artifactError: null,
  artifactJsonMissing: false,
};
const REPORT_DETAIL_POLL_INTERVAL_MS = 3_000;
const reportPlan = getPricingPlan("report");

function toArtifactErrorMessage(error: unknown): string {
  if (isApiError(error) && error.code === "INVALID_JSON_RESPONSE") {
    const details = error.details;
    const contentType =
      details && typeof details === "object" && typeof (details as Record<string, unknown>).__responseContentType === "string"
        ? ((details as Record<string, unknown>).__responseContentType as string)
        : "unknown";

    return `Artifact JSON returned non-JSON content (HTTP ${error.status}, content-type: ${contentType}).`;
  }

  return getReportErrorMessage(error);
}

function TruthNotice({ notice, testId }: { notice: ReportDetailPresentationNotice; testId?: string }) {
  const toneClassName =
    notice.tone === "warn"
      ? "border-amber-300/40 bg-amber-500/[0.08]"
      : notice.tone === "good"
        ? "border-emerald-300/35 bg-emerald-500/[0.08]"
        : "border-brand-border-strong/70 bg-brand-panel/72";

  return (
    <div className={`rounded-2xl border p-4 ${toneClassName}`} data-testid={testId}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={notice.tone}>{notice.label}</Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{notice.body}</p>
    </div>
  );
}

function PdfExportLockedState() {
  return (
    <div
      className="relative flex max-w-full flex-wrap items-center gap-2 overflow-hidden rounded-2xl border border-brand-border-strong/80 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(23,49,117,0.78),rgba(15,118,110,0.32))] px-3 py-2 shadow-brand-card"
      data-testid="report-pdf-locked"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-brand-accent-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-[-3rem] h-24 w-24 rounded-full bg-brand-accent-emerald/16 blur-3xl" />
      <span className="relative inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel/72 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
        Report Access
      </span>
      <p className="relative text-xs text-brand-text-secondary">
        <span className="font-semibold text-brand-text-primary">Full PDF Export.</span> A {formatPricingPlanPrice(reportPlan)} Report or Pro access is required to open and download this creator earnings report PDF.
      </p>
      <Link
        href="/app/billing"
        className={buttonClassName({ variant: "primary", size: "sm", className: "relative z-10 ml-auto px-3 shadow-brand-glow" })}
      >
        View plans
      </Link>
    </div>
  );
}

function PdfExportLoadingState() {
  return (
    <div
      className="rounded-2xl border border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.74),rgba(16,32,67,0.86))] px-3 py-2"
      data-testid="report-pdf-loading"
    >
      <p className="text-xs text-brand-text-secondary">Checking plan access for full PDF export...</p>
    </div>
  );
}

function expectedImpactLabel(value: string): string {
  if (value === "high") return "High impact";
  if (value === "medium") return "Medium impact";
  if (value === "low") return "Low impact";
  return value;
}

function platformShareBarColor(sharePct: number): string {
  if (sharePct >= 70) return "bg-amber-400";
  if (sharePct >= 45) return "bg-brand-accent-blue";
  return "bg-brand-accent-emerald";
}

function platformShareBandLabel(index: number, sharePct: number): string {
  if (sharePct >= 70) return "Carrying most of revenue";
  if (index === 0) return "Leading source";
  if (sharePct >= 25) return "Meaningful support";
  return "Smaller contribution";
}

function concentrationRiskTone(score: number): { label: string; textClassName: string; pillClassName: string } {
  if (score >= 70) {
    return {
      label: "High",
      textClassName: "text-amber-300",
      pillClassName: "border-amber-400/35 bg-amber-400/12 text-amber-300",
    };
  }

  if (score >= 40) {
    return {
      label: "Medium",
      textClassName: "text-brand-accent-blue",
      pillClassName: "border-brand-accent-blue/35 bg-brand-accent-blue/12 text-brand-accent-blue",
    };
  }

  return {
    label: "Low",
    textClassName: "text-brand-accent-emerald",
    pillClassName: "border-brand-accent-emerald/35 bg-brand-accent-emerald/12 text-brand-accent-emerald",
  };
}

type UnknownRecord = Record<string, unknown>;

type DocumentSectionProps = {
  number: string;
  title: string;
  subtitle?: string | null;
  children: ReactNode;
  className?: string;
  testId?: string;
};

type KeyFinding = {
  id: string;
  value: string;
  label: string;
  headline: string;
  body: string;
};

type SubscriberTierRow = {
  id: string;
  tier: string;
  price: string | null;
  subscribers: string | null;
  revenueShare: string | null;
  churnOrRisk: string | null;
  status: string | null;
};

type SubscriberSignalRow = {
  id: string;
  label: string;
  value: string;
  note: string | null;
};

type SpotlightModel = {
  statement: string;
  details: string[];
};

type OpportunityCardModel = {
  id: string;
  title: string;
  impact: string | null;
  timeframe: string | null;
  rationale: string | null;
};

type ActionPlanItem = {
  id: string;
  title: string;
  rationale: string | null;
  timeframe: string | null;
};

const reportDocumentShellClassName =
  "overflow-hidden rounded-[2rem] border border-brand-border-strong/80 bg-[linear-gradient(180deg,rgba(11,27,61,0.98),rgba(16,31,67,0.96),rgba(10,23,51,0.98))] text-brand-text-primary shadow-brand-card";
const reportDocumentPanelClassName =
  "rounded-[1.5rem] border border-brand-border/75 bg-[linear-gradient(165deg,rgba(16,32,67,0.9),rgba(19,41,80,0.78),rgba(11,24,50,0.92))] shadow-brand-card";
const reportDocumentPanelElevatedClassName =
  "rounded-[1.5rem] border border-brand-border-strong/80 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(23,49,117,0.82),rgba(15,118,110,0.18))] shadow-brand-card";
const reportDocumentTableClassName =
  "overflow-x-auto rounded-[1.5rem] border border-brand-border/75 bg-[linear-gradient(165deg,rgba(16,32,67,0.9),rgba(19,41,80,0.78),rgba(11,24,50,0.92))] shadow-brand-card";

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readNumberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value.replace(/[$,%]/g, "").replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readFromKeys(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return null;
}

function readStringFromKeys(record: UnknownRecord, keys: string[]): string | null {
  return readStringValue(readFromKeys(record, keys));
}

function readNumberFromKeys(record: UnknownRecord, keys: string[]): number | null {
  return readNumberValue(readFromKeys(record, keys));
}

function dedupeLines(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const clean = value?.trim();
    if (!clean) {
      continue;
    }

    const key = clean.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(clean);
  }

  return result;
}

function formatPercentLabel(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return `${normalized % 1 === 0 ? normalized.toFixed(0) : normalized.toFixed(1)}%`;
}

function formatCurrencyLabel(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatCountLabel(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value).toLocaleString("en-US");
}

function humanizeGrowthLabel(value: string | null | undefined): string | null {
  const clean = value?.trim();
  if (!clean) {
    return null;
  }

  if (clean.startsWith("+")) {
    return `up ${clean.slice(1)}`;
  }
  if (clean.startsWith("-")) {
    return `down ${clean.slice(1)}`;
  }

  const normalized = clean.toLowerCase();
  if (normalized.startsWith("up ") || normalized.startsWith("down ") || normalized.startsWith("flat")) {
    return normalized;
  }

  return clean;
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getHeroMetric(model: ReportDetailPresentationModel, id: string) {
  return model.heroMetrics.find((metric) => metric.id === id) ?? null;
}

function getSubscriberMetric(model: ReportDetailPresentationModel, ids: string[]) {
  return model.subscriberHealth.metrics.find((metric) => ids.includes(metric.id)) ?? null;
}

function getArtifactSections(raw: unknown): UnknownRecord | null {
  if (isRecord(raw) && isRecord(raw.report) && isRecord(raw.report.sections)) {
    return raw.report.sections;
  }

  if (isRecord(raw) && isRecord(raw.sections)) {
    return raw.sections;
  }

  return null;
}

function collectArtifactStrings(value: unknown, limit = 80, acc: string[] = []): string[] {
  if (acc.length >= limit) {
    return acc;
  }

  if (typeof value === "string") {
    const clean = value.trim();
    if (clean) {
      acc.push(clean);
    }
    return acc;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectArtifactStrings(entry, limit, acc);
      if (acc.length >= limit) {
        break;
      }
    }
    return acc;
  }

  if (isRecord(value)) {
    for (const entry of Object.values(value)) {
      collectArtifactStrings(entry, limit, acc);
      if (acc.length >= limit) {
        break;
      }
    }
  }

  return acc;
}

function getTopPlatformShare(model: ReportDetailPresentationModel) {
  const topRow = model.platformMix.platformShares?.[0] ?? null;
  if (!topRow) {
    return null;
  }

  return {
    platform: toTitleCase(topRow.platform),
    shareLabel: formatPercentLabel(topRow.share * 100) ?? `${Math.round(topRow.share * 100)}%`,
    revenueLabel: formatCurrencyLabel(topRow.revenue),
  };
}

function isCoverageCaveatLine(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const line = value.trim().toLowerCase();
  if (!line) {
    return false;
  }

  return (
    line.includes("partial business read") ||
    line.includes("missing source") ||
    line.includes("part of your sources") ||
    line.includes("part of your data") ||
    line.includes("directional") ||
    line.includes("full business just yet") ||
    line.includes("partially represented")
  );
}

function DocumentSection({ number, title, subtitle, children, className, testId }: DocumentSectionProps) {
  return (
    <section
      className={`border-t border-brand-border/65 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 ${className ?? ""}`.trim()}
      data-testid={testId}
    >
      <div className="max-w-[1060px]">
        <div className="mb-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text-muted">
            {number}. {title}
          </p>
          {subtitle ? <p className="max-w-3xl text-sm leading-7 text-brand-text-secondary">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function buildHeroHeadline(input: {
  model: ReportDetailPresentationModel;
  wowSummary: ReportWowSummaryViewModel | null;
}): string {
  const topPlatform = getTopPlatformShare(input.model);
  const concentration = input.model.platformMix.concentrationScore;
  const growthLabel = humanizeGrowthLabel(input.wowSummary?.kpiCards[2]?.value);

  if (topPlatform && concentration != null && concentration >= 60) {
    return `${topPlatform.platform} still sets the floor for the business.`;
  }

  if (topPlatform && concentration != null && concentration >= 40) {
    return `${topPlatform.platform} still leads, but the business is starting to widen.`;
  }

  if (growthLabel?.startsWith("down")) {
    return "The revenue base softened and needs a steadier second engine.";
  }

  if (growthLabel?.startsWith("up")) {
    return "The business is moving in the right direction.";
  }

  return "The business has a real paid base to build from.";
}

function buildHeroSubline(input: {
  model: ReportDetailPresentationModel;
  wowSummary: ReportWowSummaryViewModel | null;
}): string | null {
  const revenue = getHeroMetric(input.model, "net_revenue");
  const subscribers = getSubscriberMetric(input.model, ["subscribers"]);
  const growthCard = input.wowSummary?.kpiCards[2] ?? null;
  const parts = dedupeLines([
    revenue ? `${revenue.value} net revenue` : null,
    subscribers ? `${subscribers.value} paying subscribers` : null,
    growthCard ? humanizeGrowthLabel(growthCard.value) : null,
  ]);

  return parts.length > 0 ? parts.join(" · ") : null;
}

function buildKeyFindings(model: ReportDetailPresentationModel, wowSummary: ReportWowSummaryViewModel | null): KeyFinding[] {
  const findings: KeyFinding[] = [];
  const revenueMetric = getHeroMetric(model, "net_revenue");
  const topPlatform = getTopPlatformShare(model);
  const secondPlatformRow = model.platformMix.platformShares?.[1] ?? null;
  const secondPlatform = secondPlatformRow
    ? {
        platform: toTitleCase(secondPlatformRow.platform),
        shareLabel: formatPercentLabel(secondPlatformRow.share * 100) ?? `${Math.round(secondPlatformRow.share * 100)}%`,
      }
    : null;
  const subscribers = getSubscriberMetric(model, ["subscribers"]);
  const churnRisk = getSubscriberMetric(model, ["churn_risk", "churn_rate", "retention"]);
  const arpu = getSubscriberMetric(model, ["arpu"]);
  const growth = wowSummary?.kpiCards[2] ?? null;
  const concentrationScore = model.platformMix.concentrationScore;

  if (revenueMetric) {
    findings.push({
      id: revenueMetric.id,
      value: revenueMetric.value,
      label: revenueMetric.label,
      headline: `${revenueMetric.value} in current tracked revenue`,
      body:
        model.revenueTrend.points.length >= 2
          ? "The business has a real paid base. The next question is whether that revenue holds across another full cycle."
          : "The business has a real paid base. The next unlock is more history, not a louder one-period interpretation.",
    });
  }

  if (topPlatform) {
    findings.push({
      id: "top_platform_share",
      value: topPlatform.shareLabel,
      label: `${topPlatform.platform} share`,
      headline: `${topPlatform.platform} contributes ${topPlatform.shareLabel} of tracked revenue`,
      body: secondPlatform
        ? `${secondPlatform.platform} is contributing ${secondPlatform.shareLabel} in the current mix, which makes it the clearest candidate to reduce dependency over time.`
        : topPlatform.revenueLabel
          ? `${topPlatform.revenueLabel} is still being carried by ${topPlatform.platform} in the current mix.`
          : `${topPlatform.platform} remains the main engine in the tracked mix.`,
    });
  }

  if (concentrationScore != null && !topPlatform) {
    findings.push({
      id: "platform_concentration",
      value: `${Math.round(concentrationScore)}%`,
      label: "Concentration risk",
      headline: `${Math.round(concentrationScore)}% concentration risk`,
      body:
        concentrationScore >= 60
          ? "Too much of the business still depends on one platform. That keeps the revenue base more fragile than it should be."
          : "You have more than one source working, but one platform still leads the business.",
    });
  }

  if (subscribers) {
    findings.push({
      id: subscribers.id,
      value: subscribers.value,
      label: "Paid subscribers",
      headline: `${subscribers.value} paid subscribers`,
      body: churnRisk
        ? "The paid base is large enough to matter. What is still missing is cleaner retention history by segment or tier."
        : "There is enough volume to learn from. Retention history is the missing layer.",
    });
  }

  if (arpu) {
    findings.push({
      id: arpu.id,
      value: arpu.value,
      label: arpu.label,
      headline: `${arpu.value} ARPU`,
      body: "Revenue per subscriber is low enough that pricing, packaging, and tier changes could move the business faster than pure reach growth.",
    });
  }

  if (growth) {
    const normalizedGrowth = growth.value.toLowerCase();
    const growthHeadline =
      normalizedGrowth.includes("down") || growth.value.startsWith("-")
        ? "Revenue trend is down"
        : normalizedGrowth.includes("flat")
          ? "Revenue trend is flat"
          : "Revenue trend is up";

    findings.push({
      id: growth.id,
      value: growth.value,
      label: growth.label,
      headline: growthHeadline,
      body: wowSummary?.momentum.summaryText ?? "Direction is useful, but one snapshot is not enough to call it durable.",
    });
  }

  return findings.slice(0, 6);
}

function parseStructuredTierRows(rawArtifact: unknown): SubscriberTierRow[] {
  const sections = getArtifactSections(rawArtifact);
  if (!sections) {
    return [];
  }

  const candidateSection = [sections.tier_health, sections.subscribers_retention].find((value) => isRecord(value));
  if (!candidateSection || !isRecord(candidateSection)) {
    return [];
  }

  const candidateRows = [
    readFromKeys(candidateSection, ["tiers", "rows", "table", "segments", "breakdown"]),
    readFromKeys(candidateSection, ["items"]),
  ].find((value) => Array.isArray(value));

  if (!Array.isArray(candidateRows)) {
    return [];
  }

  return candidateRows
    .map((entry, index) => {
      if (isRecord(entry)) {
        const tier = readStringFromKeys(entry, ["tier", "name", "label", "title", "bucket", "segment"]);
        if (!tier) {
          return null;
        }

        const churnLabel =
          formatPercentLabel(readNumberFromKeys(entry, ["churn", "churn_pct", "churn_rate"])) ??
          readStringFromKeys(entry, ["risk", "signal", "note"]);
        const status = readStringFromKeys(entry, ["status", "state", "risk"]);

        return {
          id: `tier-${index + 1}`,
          tier,
          price:
            readStringFromKeys(entry, ["price", "price_label"]) ??
            formatCurrencyLabel(readNumberFromKeys(entry, ["monthly_price", "amount"])),
          subscribers:
            readStringFromKeys(entry, ["subscribers_label"]) ??
            formatCountLabel(readNumberFromKeys(entry, ["subscribers", "subs", "active_subscribers", "count"])),
          revenueShare:
            readStringFromKeys(entry, ["revenue_share_label"]) ??
            formatPercentLabel(readNumberFromKeys(entry, ["revenue_share", "share", "revenue_pct", "pct"])),
          churnOrRisk: churnLabel,
          status,
        } satisfies SubscriberTierRow;
      }

      const line = readStringValue(entry);
      if (!line || !line.includes("|")) {
        return null;
      }

      const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
      if (parts.length < 3) {
        return null;
      }

      return {
        id: `tier-${index + 1}`,
        tier: parts[0] ?? `Tier ${index + 1}`,
        price: parts[1] ?? null,
        subscribers: parts[2] ?? null,
        revenueShare: parts[3] ?? null,
        churnOrRisk: parts[4] ?? null,
        status: parts[5] ?? null,
      } satisfies SubscriberTierRow;
    })
    .filter((row): row is SubscriberTierRow => row !== null);
}

function buildSubscriberSignalRows(model: ReportDetailPresentationModel): SubscriberSignalRow[] {
  return model.subscriberHealth.metrics.slice(0, 4).map((metric) => ({
    id: metric.id,
    label: metric.label,
    value: metric.value,
    note: metric.detail ?? metric.stateLabel ?? null,
  }));
}

function buildSpotlightModel(rawArtifact: unknown, model: ReportDetailPresentationModel, wowSummary: ReportWowSummaryViewModel | null): SpotlightModel | null {
  const candidateLines = dedupeLines([
    ...collectArtifactStrings(rawArtifact, 120),
    ...model.keySignals,
    ...model.executiveSummary,
    wowSummary?.biggestRisk.headline ?? null,
    wowSummary?.biggestRisk.body ?? null,
  ]);

  const supporterLine =
    candidateLines.find((line) => /supporters?|people/.test(line.toLowerCase()) && /revenue/i.test(line)) ??
    null;

  if (supporterLine) {
    return {
      statement: supporterLine,
      details: dedupeLines([
        wowSummary?.biggestRisk.body ?? null,
        model.platformMix.highlights[0] ?? null,
      ]).slice(0, 2),
    };
  }

  const topPlatform = getTopPlatformShare(model);
  if (topPlatform) {
    return {
      statement: `${topPlatform.platform} still sets the floor for the business.`,
      details: dedupeLines([
        `${topPlatform.shareLabel} of tracked revenue still comes from ${topPlatform.platform}, so any pricing, cadence, or policy shock there would move the whole business.`,
        model.platformMix.platformShares?.[1]
          ? `${toTitleCase(model.platformMix.platformShares[1].platform)} is the best candidate to reduce that dependency over time.`
          : "The goal is not to replace it; it is to let a second channel carry more of the load over time.",
      ]).slice(0, 2),
    };
  }

  if (wowSummary?.biggestRisk.available) {
    return {
      statement: wowSummary.biggestRisk.headline,
      details: [wowSummary.biggestRisk.body],
    };
  }

  return null;
}

function buildOpportunityCards(
  presentation: ReportDetailPresentationModel,
  wowSummary: ReportWowSummaryViewModel | null,
  report: ReportDetail,
  hasCoverageNotice: boolean,
): OpportunityCardModel[] {
  const cards: OpportunityCardModel[] = [];
  const platformShares = presentation.platformMix.platformShares ?? [];
  const topPlatform = platformShares[0] ?? null;
  const secondPlatform = platformShares.find((row, index) => index > 0 && row.share > 0) ?? null;
  const includedPlatforms = normalizePlatformsIncluded(report.platformsIncluded);
  const hasYouTubeSignal =
    presentation.audienceGrowth?.platformCards.some((card) => card.label.toLowerCase().includes("youtube")) ??
    false;
  const paidDestination =
    includedPlatforms.find((platform) => platform === "Substack" || platform === "Patreon") ?? topPlatform?.platform ?? null;
  const needsMoreHistory = hasCoverageNotice || !presentation.subscriberHealth.metrics.some((metric) => ["churn_risk", "churn_rate", "retention"].includes(metric.id));

  if (topPlatform && topPlatform.share >= 0.4) {
    const topPlatformLabel = toTitleCase(topPlatform.platform);
    cards.push({
      id: `protect-${topPlatform.platform}`,
      title: `Protect the ${topPlatformLabel} revenue base`,
      impact: "Primary benefit: revenue protection",
      timeframe: "This month",
      rationale: `${formatPercentLabel(topPlatform.share * 100) ?? `${Math.round(topPlatform.share * 100)}%`} of tracked revenue still comes from ${topPlatformLabel}. Keep the core offer and delivery steady there while you test the next growth move somewhere else.`,
    });
  }

  if (secondPlatform) {
    const secondPlatformLabel = toTitleCase(secondPlatform.platform);
    cards.push({
      id: `grow-${secondPlatform.platform}`,
      title: `Scale ${secondPlatformLabel} as the second revenue pillar`,
      impact: "Primary benefit: diversification",
      timeframe: "Next 1-2 cycles",
      rationale: `${secondPlatformLabel} already contributes ${formatPercentLabel(secondPlatform.share * 100) ?? `${Math.round(secondPlatform.share * 100)}%`} of tracked revenue. Growing the second source that is already working is the cleanest way to lower platform dependency.`,
    });
  }

  if (hasYouTubeSignal && paidDestination) {
    cards.push({
      id: "youtube-to-paid",
      title: `Use YouTube as the top-of-funnel path into ${paidDestination}`,
      impact: "Primary benefit: conversion",
      timeframe: "This month",
      rationale:
        presentation.audienceGrowth?.platformCards.find((card) => card.label.toLowerCase().includes("youtube"))?.insight ??
        `YouTube is already part of the business picture. The next gain is giving viewers one obvious route into ${paidDestination} instead of leaving that interest unclaimed.`,
    });
  }

  if (needsMoreHistory) {
    cards.push({
      id: "build-history",
      title: "Build enough history for pricing and retention decisions",
      impact: "Primary benefit: confidence",
      timeframe: "Next cycle",
      rationale: "Tier, churn, and retention decisions get sharper once another full cycle is in the data. Use the next pull to confirm which revenue patterns are durable before making a bigger pricing change.",
    });
  }

  if (cards.length > 0) {
    return cards.slice(0, 3);
  }

  const authoredCards = presentation.recommendations
    .filter((recommendation) => !isDataCompletenessAction(`${recommendation.body} ${recommendation.detail ?? ""}`))
    .slice(0, 3)
    .map((recommendation, index) => ({
      id: recommendation.id,
      title: recommendation.body,
      impact: recommendation.expectedImpact ? expectedImpactLabel(recommendation.expectedImpact) : index === 0 ? wowSummary?.opportunity.upsideLabel ?? null : null,
      timeframe: wowSummary?.nextActions[index]?.timeframe ?? null,
      rationale: hasCoverageNotice && isCoverageCaveatLine(recommendation.detail) ? null : recommendation.detail,
    }));

  if (authoredCards.length > 0) {
    return authoredCards;
  }

  if (wowSummary?.opportunity.available) {
    return [
      {
        id: "fallback-opportunity",
        title: wowSummary.opportunity.finding,
        impact: wowSummary.opportunity.upsideLabel,
        timeframe: wowSummary.nextActions[0]?.timeframe ?? null,
        rationale: wowSummary.opportunity.action,
      },
    ];
  }

  return [];
}

function buildActionPlan(model: ReportDetailPresentationModel, wowSummary: ReportWowSummaryViewModel | null, report: ReportDetail): ActionPlanItem[] {
  const actions: ActionPlanItem[] = [];
  const platformShares = model.platformMix.platformShares ?? [];
  const topPlatform = platformShares[0] ?? null;
  const secondPlatform = platformShares.find((row, index) => index > 0 && row.share > 0) ?? null;
  const includedPlatforms = normalizePlatformsIncluded(report.platformsIncluded);
  const hasYouTubeSignal =
    model.audienceGrowth?.platformCards.some((card) => card.label.toLowerCase().includes("youtube")) ??
    false;
  const paidDestination = includedPlatforms.find((platform) => platform === "Substack" || platform === "Patreon") ?? null;

  if (topPlatform && topPlatform.share >= 0.4) {
    const topPlatformLabel = toTitleCase(topPlatform.platform);
    actions.push({
      id: `stabilize-${topPlatform.platform}`,
      title: `Protect the ${topPlatformLabel} base while you test elsewhere.`,
      rationale: `${formatPercentLabel(topPlatform.share * 100) ?? `${Math.round(topPlatform.share * 100)}%`} of tracked revenue still sits on ${topPlatformLabel}. Keep the existing base steady before you change pricing, packaging, or cadence.`,
      timeframe: "This month",
    });
  }

  if (secondPlatform) {
    const secondPlatformLabel = toTitleCase(secondPlatform.platform);
    actions.push({
      id: `test-${secondPlatform.platform}`,
      title: `Grow ${secondPlatformLabel} as the second revenue pillar.`,
      rationale: `${secondPlatformLabel} is already contributing enough to matter. Strengthening the second channel is the cleanest way to reduce dependency on the lead platform.`,
      timeframe: "This month",
    });
  }

  if (hasYouTubeSignal && paidDestination) {
    actions.push({
      id: "youtube-cta",
      title: `Give YouTube viewers one obvious path into ${paidDestination}.`,
      rationale: `YouTube is already in the report. The business only benefits when viewers get a simple next step into ${paidDestination}.`,
      timeframe: "This month",
    });
  }

  actions.push({
    id: "collect-history",
    title: "Upload the next cycle before changing pricing or tiers.",
    rationale: "Retention, churn, and tier decisions need another clean cycle of history before they become precise enough to trust.",
    timeframe: "Next cycle",
  });

  if (actions.length < 3 && wowSummary) {
    for (const action of wowSummary.nextActions) {
      if (actions.some((item) => item.title.toLowerCase() === action.title.toLowerCase())) {
        continue;
      }

      actions.push({
        id: action.id,
        title: action.title,
        rationale: action.detail,
        timeframe: action.timeframe,
      });

      if (actions.length >= 3) {
        break;
      }
    }
  }

  return actions.slice(0, 3);
}

function buildMethodologyLines(input: {
  presentation: ReportDetailPresentationModel;
  report: ReportDetail;
  sourceCountLabel: string | null;
}): string[] {
  const appendixText = input.presentation.appendixSections.flatMap((section) => [...section.paragraphs, ...section.bullets]);
  const sourceNames = input.report.platformsIncluded.join(", ");

  return dedupeLines([
    input.sourceCountLabel ? `Included sources: ${input.sourceCountLabel}${sourceNames ? ` (${sourceNames})` : ""}.` : null,
    input.presentation.displayContext.historyLabel ? `History window: ${input.presentation.displayContext.historyLabel}.` : null,
    input.report.snapshotCoverageNote,
    input.report.youtubeContributionMode === "content_only"
      ? "YouTube contributes content performance only in this report. Revenue from YouTube is not included in business metrics."
      : null,
    input.presentation.audienceGrowth?.trustNote ?? null,
    ...appendixText,
  ]).slice(0, 6);
}

function buildAudienceEmptyState(report: ReportDetail, audienceGrowth: ReportDetailPresentationModel["audienceGrowth"]): string | null {
  if (audienceGrowth && (audienceGrowth.platformCards.length > 0 || audienceGrowth.includedSources.length > 0)) {
    return null;
  }

  const includedPlatforms = normalizePlatformsIncluded(report.platformsIncluded);
  const audienceCapablePlatforms = includedPlatforms.filter((platform) => ["Instagram", "TikTok", "YouTube"].includes(platform));
  if (audienceCapablePlatforms.length === 0) {
    return "No audience-growth source was included in this report.";
  }

  return "Audience signals are not available for the included sources yet.";
}

export default function ReportPage() {
  const { state: gateState, entitlements } = useAppGate();
  const params = useParams<{ id?: string | string[] }>();
  const routeParamId = params?.id;
  const routeParamIdForDebug = useMemo(() => {
    if (Array.isArray(routeParamId)) {
      return routeParamId.join(",");
    }

    return routeParamId ?? null;
  }, [routeParamId]);
  const canonicalReportId = useMemo(() => readReportRouteParamId({ id: routeParamId }), [routeParamId]);
  const [state, setState] = useState<ReportPageState>(initialState);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const canAccessPdf = useMemo(
    () =>
      state.report
        ? hasUsableReportArtifact({
            reportId: state.report.id,
            status: state.report.status,
            artifactUrl: state.report.artifactUrl,
          })
        : false,
    [state.report],
  );

  useEffect(() => {
    let cancelled = false;
    const activeReportId = canonicalReportId;

    setState(initialState);
    setPdfError(null);

    if (!activeReportId) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[report.detail] route parameter [id] is missing or invalid; blocking detail fetch.", {
          routeParamId: routeParamIdForDebug,
        });
      }

      setState({
        ...initialState,
        view: "invalid_route",
      });
      return () => {
        cancelled = true;
      };
    }
    const resolvedReportId: string = activeReportId;

    async function load() {
      try {
        const report = await fetchReportDetail(resolvedReportId);
        if (cancelled) {
          return;
        }

        if (!report.artifactJsonUrl) {
          setState({
            view: "success",
            report,
            artifactModel: null,
            artifactWarnings: [],
            artifactRaw: null,
            artifactError: null,
            artifactJsonMissing: true,
          });
          return;
        }

        try {
          const artifactRaw = await fetchReportArtifactJson(report.artifactJsonUrl);
          if (cancelled) {
            return;
          }

          const artifactPatched = patchSparseArtifact(artifactRaw);
          const contract = validateReportArtifactContract(artifactPatched);
          const normalized = normalizeArtifactToReportModel(artifactPatched);
          if (!contract.valid) {
            setState({
              view: "success",
              report,
              artifactModel: normalized.model,
              artifactWarnings: [...contract.errors, ...normalized.warnings],
              artifactRaw: artifactPatched,
              artifactError: formatReportArtifactContractErrors(contract.errors),
              artifactJsonMissing: false,
            });
            return;
          }

          setState({
            view: "success",
            report,
            artifactModel: normalized.model,
            artifactWarnings: normalized.warnings,
            artifactRaw: artifactPatched,
            artifactError: null,
            artifactJsonMissing: false,
          });
        } catch (artifactError) {
          if (cancelled) {
            return;
          }

          setState({
            view: "success",
            report,
            artifactModel: null,
            artifactWarnings: [],
            artifactRaw: null,
            artifactError: toArtifactErrorMessage(artifactError),
            artifactJsonMissing: false,
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          ...initialState,
          view: getReportViewState(error),
          requestId: getRequestId(error),
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [canonicalReportId, reloadNonce, routeParamIdForDebug]);

  useEffect(() => {
    if (state.view !== "success" || !state.report || !isInFlightReportStatus(state.report.status)) {
      return;
    }

    let cancelled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const activeReportId = state.report.id;

    const pollStatus = async () => {
      try {
        const latestStatus = await fetchReportRunStatus(activeReportId);
        if (cancelled) {
          return;
        }

        const nextStatus = latestStatus.status.trim() || state.report?.status || "unknown";
        setState((current) => {
          if (!current.report || current.report.id !== activeReportId) {
            return current;
          }

          if (current.report.status === nextStatus && current.report.updatedAt === (latestStatus.updatedAt ?? current.report.updatedAt)) {
            return current;
          }

          return {
            ...current,
            report: {
              ...current.report,
              status: nextStatus,
              updatedAt: latestStatus.updatedAt ?? current.report.updatedAt,
            },
          };
        });

        const normalizedNextStatus = nextStatus.toLowerCase();
        if (["ready", "completed", "complete", "success", "succeeded"].includes(normalizedNextStatus)) {
          setReloadNonce((current) => current + 1);
          return;
        }

        if (!isInFlightReportStatus(nextStatus)) {
          return;
        }
      } catch {
        // Keep the current report detail state intact and try again on the next interval.
      }

      if (!cancelled) {
        timeoutHandle = setTimeout(() => {
          void pollStatus();
        }, REPORT_DETAIL_POLL_INTERVAL_MS);
      }
    };

    timeoutHandle = setTimeout(() => {
      void pollStatus();
    }, REPORT_DETAIL_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [state.report, state.view]);

  const openPdf = async () => {
    if (!state.report || !canAccessFullPdf || !canAccessPdf || pdfLoading) {
      return;
    }

    setPdfError(null);
    setPdfLoading(true);
    const popup = window.open("", "_blank", "noopener,noreferrer");

    try {
      const pdfBlobUrl = await fetchReportPdfBlobUrl(state.report);
      if (popup) {
        popup.location.href = pdfBlobUrl;
      } else {
        window.open(pdfBlobUrl, "_blank", "noopener,noreferrer");
      }

      window.setTimeout(() => {
        if (pdfBlobUrl.startsWith("blob:")) {
          URL.revokeObjectURL(pdfBlobUrl);
        }
      }, 120_000);
    } catch (error) {
      popup?.close();
      setPdfError(getReportErrorMessage(error));
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!state.report || !canAccessFullPdf || !canAccessPdf || downloadLoading) {
      return;
    }

    setPdfError(null);
    setDownloadLoading(true);

    try {
      await downloadReportArtifactPdf({
        reportId: state.report.id,
        title: state.report.title,
        artifactUrl: state.report.artifactUrl,
      });
    } catch (error) {
      setPdfError(getReportErrorMessage(error));
    } finally {
      setDownloadLoading(false);
    }
  };

  const artifactSignals = useMemo(() => {
    if (!state.artifactRaw) {
      return null;
    }

    return hydrateDashboardFromArtifact(state.artifactRaw);
  }, [state.artifactRaw]);

  const presentation = useMemo(() => {
    if (!state.report) {
      return null;
    }

    return buildReportDetailPresentationModel({
      report: state.report,
      artifactModel: state.artifactModel,
      artifactSignals: artifactSignals ?? null,
    });
  }, [artifactSignals, state.artifactModel, state.report]);
  const revenueTrend = useMemo(
    () =>
      buildDashboardRevenueTrendViewModel({
        points: presentation?.revenueTrend.points ?? [],
      }),
    [presentation?.revenueTrend.points],
  );
  const proSectionGate = useMemo(
    () =>
      buildReportDetailSectionGatingModel({
        gateState,
        entitlements,
      }),
    [entitlements, gateState],
  );
  const pdfAccessMode = useMemo(
    () =>
      resolveReportDetailPdfAccessMode({
        gateState,
        entitlements,
      }),
    [entitlements, gateState],
  );
  const isFounder = useMemo(() => isFounderFromEntitlement(entitlements), [entitlements]);
  const canAccessFullPdf = isFounder || canAccessFullReportPdf(pdfAccessMode);

  const wowSummary = useMemo(
    () =>
      presentation
        ? buildReportWowSummaryViewModel(presentation, state.artifactModel, state.report, { includeContinuitySignals: true })
        : null,
    [presentation, state.artifactModel, state.report],
  );
  const freeTeaserModel = useMemo(
    () => (presentation ? buildReportFreeTeaserViewModel(presentation) : null),
    [presentation],
  );
  const showFullReportContent = isFounder || canRenderReportDetailReportContent(proSectionGate.wowSummary);

  const createdAtLabel = formatReportCreatedAt(state.report?.createdAt ?? state.artifactModel?.createdAt ?? null);
  const status = state.report?.status ?? "unknown";
  const statusLabel = toReportStatusLabel(status);
  const statusVariant = toReportStatusVariant(status);
  const reportFraming = useMemo(
    () =>
      buildReportFraming({
        platformsIncluded: state.report?.platformsIncluded,
        sourceCount: state.report?.sourceCount ?? state.report?.metrics.platformsConnected ?? null,
      }),
    [state.report],
  );
  const sourceCountLabel = useMemo(
    () => formatIncludedSourceCountLabel(state.report?.sourceCount ?? state.report?.metrics.platformsConnected ?? null),
    [state.report],
  );
  const revenueExplanation = useMemo(
    () =>
      buildRevenueExplanation({
        movementLabel: revenueTrend.movementLabel ?? null,
        narrative: presentation?.revenueTrend.narrative ?? null,
        snapshotCoverageNote: state.report?.snapshotCoverageNote ?? null,
      }),
    [presentation?.revenueTrend.narrative, revenueTrend.movementLabel, state.report?.snapshotCoverageNote],
  );
  const heroHeadline = presentation ? buildHeroHeadline({ model: presentation, wowSummary }) : null;
  const heroSubline = presentation ? buildHeroSubline({ model: presentation, wowSummary }) : null;
  const hasCoverageNotice = Boolean(presentation?.heroNotice || presentation?.displayContext.businessFramingNote);
  const keyFindings = presentation ? buildKeyFindings(presentation, wowSummary) : [];
  const tierRows = state.artifactRaw ? parseStructuredTierRows(state.artifactRaw) : [];
  const subscriberSignalRows = presentation ? buildSubscriberSignalRows(presentation) : [];
  const spotlight = presentation ? buildSpotlightModel(state.artifactRaw, presentation, wowSummary) : null;
  const opportunityCards = presentation && state.report ? buildOpportunityCards(presentation, wowSummary, state.report, hasCoverageNotice) : [];
  const actionPlan = presentation && state.report ? buildActionPlan(presentation, wowSummary, state.report) : [];
  const methodologyLines = presentation && state.report ? buildMethodologyLines({ presentation, report: state.report, sourceCountLabel }) : [];
  const audienceEmptyState = presentation && state.report ? buildAudienceEmptyState(state.report, presentation.audienceGrowth) : null;
  const audienceSectionModel =
    presentation?.audienceGrowth ?? {
      title: "Audience signals",
      subtitle: null,
      summaryTiles: [],
      includedSources: [],
      platformCards: [],
      diagnosis: null,
      trustNote: null,
    };
  const strengthsOpportunityLines = dedupeLines([
    ...opportunityCards.map((card) => card.title),
    wowSummary?.opportunity.finding ?? null,
  ]).slice(0, 3);
  const executiveNarrativeLines = (() => {
    const lines = presentation?.executiveSummary ?? [];
    if (!hasCoverageNotice) {
      return lines.slice(0, 2);
    }

    const filtered = lines.filter((line) => !isCoverageCaveatLine(line));
    if (filtered.length > 0 || wowSummary?.summarySentence) {
      return filtered.slice(0, 2);
    }

    return lines.slice(0, 1);
  })();
  const heroNarrative = dedupeLines([
    wowSummary?.summarySentence ?? null,
    ...executiveNarrativeLines,
  ]).slice(0, 2);
  const topPlatformShare = presentation ? getTopPlatformShare(presentation) : null;
  const concentrationTone = presentation?.platformMix.concentrationScore != null ? concentrationRiskTone(presentation.platformMix.concentrationScore) : null;

  return (
    <FeatureGuard feature="report">
      {state.view === "loading" ? (
        <div className="space-y-3" data-testid="report-loading">
          <h1 className="text-2xl font-semibold">Loading report...</h1>
          <p className="text-sm text-brand-text-secondary">Fetching report details for {canonicalReportId ?? "unknown report"}.</p>
        </div>
      ) : null}

      {state.view === "success" && state.report && presentation ? (
        <section className="mx-auto max-w-[1120px] space-y-10" data-testid="report-content">
          <section className={reportDocumentShellClassName}>
            <div className="mx-auto max-w-[1080px] px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-4xl space-y-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-text-muted">
                    <span
                      data-testid={state.report.reportKind === "single-source" ? "report-single-source-framing" : "report-combined-framing"}
                    >
                      {reportFraming.badgeLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span data-testid="report-snapshot-label">{presentation.displayContext.snapshotLabel}</span>
                    {sourceCountLabel ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span data-testid="report-source-count">{sourceCountLabel}</span>
                      </>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <h1 className="max-w-4xl text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-brand-text-primary sm:text-[2.8rem]">
                      {heroHeadline ?? presentation.heroTitle}
                    </h1>
                    {heroSubline ? <p className="text-sm font-medium text-brand-text-secondary sm:text-[0.96rem]">{heroSubline}</p> : null}
                  </div>

                  {heroNarrative.length > 0 ? (
                    <article className="max-w-3xl space-y-3" data-testid="report-executive-summary-card">
                      {heroNarrative.map((paragraph) => (
                        <p key={paragraph} className="text-[0.98rem] leading-8 text-brand-text-secondary">
                          {paragraph}
                        </p>
                      ))}
                    </article>
                  ) : null}

                  <div className="space-y-2 text-sm text-brand-text-muted">
                    <p>Created {createdAtLabel}</p>
                    {presentation.displayContext.sourceContributionLine ? (
                      <p data-testid="report-source-contribution">{presentation.displayContext.sourceContributionLine}</p>
                    ) : null}
                    {presentation.displayContext.businessFramingNote && !presentation.heroNotice ? (
                      <p data-testid="report-snapshot-coverage-note">{presentation.displayContext.businessFramingNote}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                  {pdfAccessMode === "pdf-unlocked" ? (
                    canAccessPdf ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void openPdf()}
                          disabled={pdfLoading}
                          className={buttonClassName({ variant: "secondary", size: "sm", className: "px-4 shadow-brand-card" })}
                        >
                          {pdfLoading ? "Opening PDF..." : "Open PDF"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void downloadPdf()}
                          disabled={downloadLoading}
                          className={buttonClassName({ variant: "primary", size: "sm", className: "px-4 shadow-brand-glow" })}
                        >
                          {downloadLoading ? "Downloading PDF..." : "Download PDF"}
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex rounded-full border border-[rgba(245,158,11,0.42)] bg-[rgba(245,158,11,0.18)] px-3 py-1.5 text-xs font-medium text-amber-200">
                        PDF unavailable
                      </span>
                    )
                  ) : pdfAccessMode === "pdf-locked" ? (
                    <PdfExportLockedState />
                  ) : (
                    <PdfExportLoadingState />
                  )}
                </div>
              </div>

              {presentation.heroNotice ? <div className="mt-6"><TruthNotice notice={presentation.heroNotice} testId="report-hero-truth-notice" /></div> : null}

              {showFullReportContent ? (
                <div
                  className="mt-8 flex flex-wrap divide-y divide-brand-border/60 border-y border-brand-border/70 text-brand-text-primary md:divide-x md:divide-y-0 md:divide-brand-border/60"
                  data-testid="report-hero-at-a-glance"
                >
                  {[
                    { label: "Revenue", value: getHeroMetric(presentation, "net_revenue")?.value ?? "$--" },
                    { label: "Subscribers", value: getSubscriberMetric(presentation, ["subscribers"])?.value ?? "—" },
                    { label: "Growth", value: wowSummary?.kpiCards[2]?.value ?? "—" },
                    {
                      label: "Concentration",
                      value:
                        concentrationTone && presentation.platformMix.concentrationScore != null
                          ? `${Math.round(presentation.platformMix.concentrationScore)}% ${concentrationTone.label.toLowerCase()}`
                          : topPlatformShare?.shareLabel ?? "—",
                    },
                  ].map((item) => (
                    <div key={item.label} className="min-w-[180px] flex-1 px-0 py-4 md:px-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">{item.label}</p>
                      <p className="mt-2 text-[1.55rem] font-semibold tracking-[-0.02em] text-brand-text-primary">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {showFullReportContent ? (
              <>
                <DocumentSection
                  number="1"
                  title="Key findings"
                  subtitle="The business facts that matter most in this snapshot."
                  testId="report-key-findings"
                >
                  <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
                    {keyFindings.map((finding) => (
                      <article key={finding.id} className="border-b border-brand-border/60 pb-6">
                        <p className="text-[2.4rem] font-semibold leading-none tracking-[-0.04em] text-brand-text-primary">{finding.value}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">{finding.label}</p>
                        <h2 className="mt-3 text-lg font-semibold leading-snug text-brand-text-primary">{finding.headline}</h2>
                        <p className="mt-2 text-sm leading-7 text-brand-text-secondary">{finding.body}</p>
                      </article>
                    ))}
                  </div>
                </DocumentSection>

                <DocumentSection
                  number="2"
                  title="Revenue overview"
                  subtitle={presentation.displayContext.historyLabel || "How revenue moved across the tracked history window."}
                >
                  <div className="space-y-6">
                    <div className={`${reportDocumentPanelClassName} p-4 sm:p-5`}>
                      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">Latest revenue</p>
                          <p className="mt-2 text-[2rem] font-semibold tracking-[-0.03em] text-brand-text-primary">
                            {revenueTrend.latestValueDisplay ?? "$--"}
                          </p>
                        </div>
                        <div className="text-right">
                          {revenueTrend.movementLabel ? <p className="text-sm font-semibold text-brand-text-primary">{revenueTrend.movementLabel}</p> : null}
                          {revenueTrend.periodLabel ? <p className="mt-1 text-xs text-brand-text-muted">{revenueTrend.periodLabel}</p> : null}
                        </div>
                      </div>
                      {revenueTrend.hasRenderableChart ? (
                        <RevenueTrendChart points={revenueTrend.points} />
                      ) : (
                        <div className="rounded-[1rem] border border-dashed border-brand-border-strong/65 bg-brand-panel-muted/55 px-4 py-5">
                          <p className="text-sm text-brand-text-muted">Trend chart data was not included in this export.</p>
                        </div>
                      )}
                    </div>
                    <article className="max-w-3xl space-y-2" data-testid="report-revenue-interpretation">
                      <p className="text-sm leading-7 text-brand-text-secondary">
                        {`${revenueExplanation.whatHappened} ${revenueExplanation.whyItMatters} ${revenueExplanation.whatToWatch}`}
                      </p>
                    </article>
                  </div>
                </DocumentSection>

                <DocumentSection
                  number="3"
                  title="Platform concentration"
                  subtitle="Where revenue is coming from now, and how exposed the business still is to one source leading the mix."
                  testId="report-platform-mix"
                >
                  <div className="space-y-8">
                    {presentation.platformMix.platformShares && presentation.platformMix.platformShares.length > 0 ? (
                      <div className="space-y-5">
                        {presentation.platformMix.platformShares.map((row, index) => {
                          const sharePct = Math.round(row.share * 100);
                          return (
                            <article key={row.platform} className="space-y-2.5" data-testid="report-platform-mix-row">
                              <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                  <p className="text-base font-semibold text-brand-text-primary">{toTitleCase(row.platform)}</p>
                                  <p className="mt-1 text-sm text-brand-text-secondary">{platformShareBandLabel(index, sharePct)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-base font-semibold text-brand-text-primary">{formatCurrencyLabel(row.revenue) ?? "$0"}</p>
                                  <p className="mt-1 text-sm text-brand-text-secondary">{sharePct}% share</p>
                                </div>
                              </div>
                              <div className="h-2.5 rounded-full bg-brand-panel-muted/80">
                                <div
                                  className={`h-full rounded-full ${platformShareBarColor(sharePct)}`}
                                  style={{ width: `${sharePct}%` }}
                                />
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm leading-7 text-brand-text-secondary">{presentation.platformMix.highlights[0] ?? "Platform mix detail is limited in this report."}</p>
                    )}

                    {presentation.platformMix.concentrationScore != null && concentrationTone ? (
                      <div className="max-w-3xl space-y-4 pt-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-semibold text-brand-text-primary">
                            {Math.round(presentation.platformMix.concentrationScore)}% {concentrationTone.label.toLowerCase()} concentration risk
                          </p>
                        </div>
                        {wowSummary?.platformMix.highlights[0] ? (
                          <p className="text-sm leading-7 text-brand-text-secondary">
                            {wowSummary.platformMix.highlights[0]}
                          </p>
                        ) : (
                          <p className="text-sm leading-7 text-brand-text-secondary">
                            A more balanced mix makes the business less fragile when one platform slows down.
                          </p>
                        )}
                        <div className="pt-2">
                          <div className="relative h-1.5 rounded-full bg-brand-panel-muted/80">
                            <div className="absolute inset-y-0 left-[20%] w-px bg-brand-border/70" />
                            <div className="absolute inset-y-0 left-[40%] w-px bg-brand-border/70" />
                            <div className="absolute inset-y-0 left-[60%] w-px bg-brand-border/70" />
                            <div
                              className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-[#071126] bg-brand-accent-blue shadow-[0_0_0_4px_rgba(96,165,250,0.2)]"
                              style={{ left: `calc(${Math.min(100, Math.max(0, presentation.platformMix.concentrationScore))}% - 0.5rem)` }}
                            />
                            <div
                              className="absolute -top-9 -translate-x-1/2 rounded-full border border-brand-accent-blue/35 bg-brand-accent-blue/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent-blue"
                              style={{ left: `calc(${Math.min(100, Math.max(0, presentation.platformMix.concentrationScore))}% )` }}
                            >
                              You are here
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-4 gap-3 text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">
                            <span>Safe &lt;20%</span>
                            <span>Watch 20–40%</span>
                            <span>Elevated 40–60%</span>
                            <span className="text-right">High risk &gt;60%</span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </DocumentSection>

                <DocumentSection
                  number="4"
                  title="Subscriber structure"
                  subtitle="Subscriber-level depth is limited in this upload, so this section focuses on the stable signals available here: paid subscribers, ARPU, and churn where the export supports it."
                  testId="report-subscriber-structure"
                >
                  {tierRows.length > 0 ? (
                    <div className={reportDocumentTableClassName}>
                      <table className="min-w-full divide-y divide-brand-border/60">
                        <thead className="bg-brand-panel-muted/55">
                          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                            <th className="px-4 py-3">Tier</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Subscribers</th>
                            <th className="px-4 py-3">Revenue share</th>
                            <th className="px-4 py-3">Churn / risk</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/55 bg-transparent">
                          {tierRows.map((row) => (
                            <tr key={row.id} className="text-sm text-brand-text-secondary">
                              <td className="px-4 py-3 font-semibold text-brand-text-primary">{row.tier}</td>
                              <td className="px-4 py-3">{row.price ?? "—"}</td>
                              <td className="px-4 py-3">{row.subscribers ?? "—"}</td>
                              <td className="px-4 py-3">{row.revenueShare ?? "—"}</td>
                              <td className="px-4 py-3">{row.churnOrRisk ?? "—"}</td>
                              <td className="px-4 py-3">{row.status ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={reportDocumentTableClassName}>
                      <table className="min-w-full divide-y divide-brand-border/60">
                        <thead className="bg-brand-panel-muted/55">
                          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                            <th className="px-4 py-3">Signal</th>
                            <th className="px-4 py-3">Value</th>
                            <th className="px-4 py-3">Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/55 bg-transparent">
                          {subscriberSignalRows.map((row) => (
                            <tr key={row.id} className="text-sm text-brand-text-secondary">
                              <td className="px-4 py-3 font-semibold text-brand-text-primary">{row.label}</td>
                              <td className="px-4 py-3">{row.value}</td>
                              <td className="px-4 py-3">{row.note ?? "Tier-level detail was not included in this export."}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </DocumentSection>

                <DocumentSection
                  number="5"
                  title="Revenue concentration"
                  subtitle="What the lead platform means for the business, not just the revenue mix."
                  testId="report-revenue-concentration"
                >
                  <div className="max-w-4xl space-y-4">
                    <h2 className="max-w-3xl text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.04em] text-brand-text-primary">
                      {spotlight?.statement ?? (topPlatformShare ? `${topPlatformShare.shareLabel} of revenue still comes from ${topPlatformShare.platform}.` : "Revenue concentration is still shaping the business read.")}
                    </h2>
                    {spotlight?.details.length ? (
                      spotlight.details.map((detail) => (
                        <p key={detail} className="max-w-3xl text-sm leading-7 text-brand-text-secondary">
                          {detail}
                        </p>
                      ))
                    ) : (
                      <p className="max-w-3xl text-sm leading-7 text-brand-text-secondary">
                        {wowSummary?.platformMix.highlights[0] ?? "When too much of the business depends on one source, small changes there matter more than they should."}
                      </p>
                    )}
                  </div>
                </DocumentSection>

                {presentation.audienceGrowth || audienceEmptyState ? (
                  <DocumentSection
                    number="6"
                    title="Audience signals"
                    subtitle="Discovery and engagement signals that can feed paid channels over time."
                    testId="report-audience-signals"
                  >
                    <ReportAudienceGrowthSection model={audienceSectionModel} emptyMessage={audienceEmptyState} />
                  </DocumentSection>
                ) : null}

                {wowSummary ? (
                  <DocumentSection
                    number="7"
                    title="Strengths, risks, and opportunities"
                    subtitle="What looks solid, what looks fragile, and where there is room to improve."
                  >
                    <ReportStrengthsRisksSection model={wowSummary.strengthsRisks} opportunities={strengthsOpportunityLines} />
                  </DocumentSection>
                ) : null}

                {opportunityCards.length > 0 ? (
                  <DocumentSection
                    number="8"
                    title="Opportunities"
                    subtitle={
                      hasCoverageNotice
                        ? "These are the clearest business moves supported by the current data. They stay directional until more history is available."
                        : "These are the clearest business moves supported by the current data."
                    }
                    testId="report-opportunities"
                  >
                    <div className="space-y-5">
                      {opportunityCards.map((card, index) => (
                        <article
                          key={card.id}
                          className="grid gap-4 border-b border-brand-border/60 pb-5 last:border-b-0 last:pb-0 sm:grid-cols-[3rem_minmax(0,1fr)]"
                        >
                          <p className="pt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                            0{index + 1}
                          </p>
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <h2 className="text-base font-semibold leading-snug text-brand-text-primary">{card.title}</h2>
                              {card.timeframe ? (
                                <span className="rounded-full border border-brand-border/65 bg-brand-panel/65 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
                                  {card.timeframe}
                                </span>
                              ) : null}
                            </div>
                            {card.impact ? <p className="text-sm font-semibold text-brand-accent-blue">{card.impact}</p> : null}
                            {card.rationale ? <p className="text-sm leading-7 text-brand-text-secondary">{card.rationale}</p> : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  </DocumentSection>
                ) : null}

                <DocumentSection
                  number="9"
                  title="Action plan"
                  subtitle="What to do next, in order."
                  testId="report-what-to-do-next"
                >
                  <div className="space-y-6">
                    <p className="text-sm font-semibold text-brand-text-primary">If you do one thing next, do this:</p>
                    <ol className="space-y-5">
                      {actionPlan.map((item, index) => (
                        <li
                          key={item.id}
                          className="grid gap-3 border-b border-brand-border/60 pb-5 last:border-b-0 last:pb-0 md:grid-cols-[52px_minmax(0,1fr)]"
                          data-testid={index === 0 ? "report-next-action-primary" : index === 1 ? "report-next-action-secondary" : undefined}
                        >
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-border/70 bg-brand-panel/75 text-sm font-semibold text-brand-text-primary">
                            {index + 1}
                          </span>
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h2 className="text-lg font-semibold leading-snug text-brand-text-primary">{item.title}</h2>
                              {item.timeframe ? (
                                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">
                                  {item.timeframe}
                                </span>
                              ) : null}
                            </div>
                            {item.rationale ? <p className="text-sm leading-7 text-brand-text-secondary">{item.rationale}</p> : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-brand-border/70 bg-[linear-gradient(165deg,rgba(19,41,80,0.74),rgba(16,32,67,0.86))] px-4 py-3">
                      <p className="text-sm leading-7 text-brand-text-secondary">
                        {presentation.platformMix.platformsConnected !== null && presentation.platformMix.platformsConnected <= 1
                          ? "Bringing in one more source before the next run will give the business a fuller read."
                          : "When the next cycle closes, upload a fresh pull so the next read reflects what actually changed in the business."}
                      </p>
                      <Link
                        href="/app/data"
                        data-testid="report-return-to-workspace"
                        className={buttonClassName({ variant: "secondary", size: "sm", className: "shrink-0 px-4 shadow-brand-card" })}
                      >
                        Return to workspace
                      </Link>
                    </div>
                  </div>
                </DocumentSection>

                <DocumentSection
                  number="10"
                  title="Methodology"
                  subtitle="Included sources, current coverage, and what this report can and cannot measure."
                  testId="report-methodology"
                  className="pb-12"
                >
                  <div className="max-w-4xl space-y-4 text-sm leading-7 text-brand-text-secondary">
                    {methodologyLines.length > 0 ? (
                      <ul className="space-y-2">
                        {methodologyLines.map((line) => (
                          <li key={line} className="flex items-start gap-2.5">
                            <span className="mt-[0.8rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-text-muted/55" aria-hidden="true" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>This report is limited to the sources and history currently attached to this run.</p>
                    )}
                  </div>
                </DocumentSection>
              </>
            ) : null}
          </section>

          {pdfError ? <ErrorBanner title="PDF unavailable" message={pdfError} /> : null}

          {!showFullReportContent && !isFounder && proSectionGate.wowSummary === "report-locked" && freeTeaserModel ? (
            <ReportFreeTeaser model={freeTeaserModel} />
          ) : null}

          {showFullReportContent && state.artifactJsonMissing ? (
            <Panel title="Report Data Unavailable" description="We couldn't load this report's data yet. Try refreshing, or return to your workspace.">
              <div className="space-y-3">
                <p className="text-sm text-brand-text-secondary">Try refreshing to load updated report metadata.</p>
                <button
                  type="button"
                  onClick={() => setReloadNonce((prev) => prev + 1)}
                  className={buttonClassName({ variant: "secondary", size: "sm", className: "px-3 shadow-brand-card" })}
                >
                  Refresh
                </button>
              </div>
            </Panel>
          ) : null}

          {showFullReportContent && state.artifactError ? (
            <ErrorBanner title="Report data unavailable" message="We couldn't load this report's data. Try refreshing, or return to your workspace." />
          ) : null}
        </section>
      ) : null}

      {/*
        <section className="space-y-8" data-testid="report-content">
          <PanelCard className="relative overflow-hidden border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.96),rgba(23,49,117,0.82),rgba(15,118,110,0.28))] p-0">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-accent-blue/22 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 bottom-[-5rem] h-40 w-40 rounded-full bg-brand-accent-emerald/16 blur-3xl" />
            <div className="relative space-y-6 p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
                    {reportFraming.badgeLabel}
                  </p>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-brand-text-primary md:text-[2rem]">{presentation.heroTitle}</h1>
                    {presentation.heroSubtitle ? <p className="mt-1.5 text-sm text-brand-text-secondary">{presentation.heroSubtitle}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-text-muted">
                    <span>Created {createdAtLabel}</span>
                    {sourceCountLabel ? <span aria-hidden="true" className="text-brand-text-muted/35">|</span> : null}
                    {sourceCountLabel ? <span data-testid="report-source-count">{sourceCountLabel}</span> : null}
                    {reportFraming.helperText ? <span aria-hidden="true" className="text-brand-text-muted/35">|</span> : null}
                    {reportFraming.helperText ? (
                      <span
                        data-testid={state.report.reportKind === "single-source" ? "report-single-source-framing" : "report-combined-framing"}
                      >
                        {reportFraming.helperText}
                      </span>
                    ) : null}
                    {false ? (
                      <>
                    <span aria-hidden="true" className="text-brand-text-muted/35">·</span>
                    <span data-testid="report-combined-framing">Your combined cross-platform report — built from your creator data sources</span>
                    {legacyPlatformCountLabel ? (
                      <>
                        <span aria-hidden="true" className="text-brand-text-muted/35">·</span>
                        <span data-testid="report-source-count">{legacyPlatformCountLabel}</span>
                      </>
                    ) : null}
                      </>
                    ) : null}
                  </div>
                  {state.report.platformsIncluded.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2" data-testid="report-platform-chips">
                      {state.report.platformsIncluded.map((platform) => (
                        <Badge key={platform} variant="neutral">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {presentation.displayContext.sourceContributionLine ? (
                    <p className="text-xs text-brand-text-muted" data-testid="report-source-contribution">
                      {presentation.displayContext.sourceContributionLine}
                    </p>
                  ) : null}
                  {state.report.snapshotCoverageNote ? (
                    <p className="text-xs text-brand-text-muted" data-testid="report-snapshot-coverage-note">
                      {state.report.snapshotCoverageNote}
                    </p>
                  ) : null}
                  {state.report.youtubeContributionMode === "content_only" ? (
                    <p className="text-xs text-brand-text-muted" data-testid="report-youtube-contribution-note">
                      YouTube data includes content performance only (revenue not included in business metrics).
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                  {pdfAccessMode === "pdf-unlocked" ? (
                    canAccessPdf ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void openPdf()}
                          disabled={pdfLoading}
                          className="inline-flex rounded-xl bg-brand-accent-blue px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {pdfLoading ? "Opening PDF..." : "Open PDF"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void downloadPdf()}
                          disabled={downloadLoading}
                          className="inline-flex rounded-xl bg-brand-accent-blue px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {downloadLoading ? "Downloading PDF..." : "Download PDF"}
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1.5 text-xs font-medium text-amber-100">
                        PDF unavailable
                      </span>
                    )
                  ) : pdfAccessMode === "pdf-locked" ? (
                    <PdfExportLockedState />
                  ) : (
                    <PdfExportLoadingState />
                  )}
                </div>
              </div>

              {presentation.heroNotice ? <TruthNotice notice={presentation.heroNotice} testId="report-hero-truth-notice" /> : null}
              {showFullReportContent ? (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-brand-text-muted" data-testid="report-snapshot-label">
                    {presentation.displayContext.snapshotLabel}
                  </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {presentation.heroMetrics.map((metric) => (
                    <article
                      key={metric.id}
                      className="rounded-[1.1rem] border border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.96),rgba(19,41,80,0.9),rgba(16,32,67,0.95))] p-4 shadow-brand-card"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{metric.label}</p>
                        {metric.stateLabel ? <Badge variant={metric.stateTone ?? "neutral"} tooltip={getConfidenceLabelTooltip(metric.stateLabel)}>{metric.stateLabel}</Badge> : null}
                      </div>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-text-primary">{metric.value}</p>
                      {metric.detail ? <p className="mt-2 text-xs leading-relaxed text-brand-text-muted">{metric.detail}</p> : null}
                    </article>
                  ))}
                </div>
                {presentation.stabilityComponents ? (
                  <div
                    className="overflow-hidden rounded-[1.15rem] border border-brand-border-strong/60 bg-[linear-gradient(165deg,rgba(15,31,63,0.88),rgba(19,41,80,0.72),rgba(13,28,57,0.92))] px-4 py-4 shadow-brand-card"
                    data-testid="report-stability-components"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">Income Health Breakdown</p>
                        <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
                          The pieces holding the health score up, and the ones putting pressure on it.
                        </p>
                      </div>
                      <span className="inline-flex rounded-full border border-brand-border/55 bg-brand-panel/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
                        Same data, clearer read
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      {STABILITY_COMPONENT_ORDER.map((key) => {
                        const score = presentation.stabilityComponents?.[key];
                        if (score == null) return null;
                        const label = STABILITY_COMPONENT_LABELS[key] ?? key;
                        return (
                          <article
                            key={key}
                            className={`rounded-[1rem] border p-3 shadow-brand-card ${stabilitySurfaceClass(score)}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] uppercase leading-tight tracking-[0.12em] text-brand-text-muted">{label}</span>
                              <span className={`text-sm font-semibold tabular-nums ${stabilityTextColor(score)}`}>{score}</span>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-brand-panel-muted/55">
                              <div
                                className={`h-full rounded-full ${stabilityBarColor(score)}`}
                                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                              />
                            </div>
                            <p className="mt-2 text-[11px] leading-relaxed text-brand-text-secondary">{stabilityCaption(score)}</p>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                </div>
              ) : null}
            </div>
          </PanelCard>

          {pdfError ? <ErrorBanner title="PDF unavailable" message={pdfError} /> : null}

          {showFullReportContent && wowSummary ? (
            <ReportWowSummary model={wowSummary} />
          ) : !isFounder && proSectionGate.wowSummary === "report-locked" && freeTeaserModel ? (
            <ReportFreeTeaser model={freeTeaserModel} />
          ) : null}

          {showFullReportContent && state.artifactJsonMissing ? (
            <Panel title="Report Data Unavailable" description="We couldn't load this report's data yet. Try refreshing, or return to your workspace.">
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Try refreshing to load updated report metadata.</p>
                <button
                  type="button"
                  onClick={() => setReloadNonce((prev) => prev + 1)}
                  className="inline-flex rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Refresh
                </button>
              </div>
            </Panel>
          ) : null}

          {showFullReportContent ? (
            <>
              {state.artifactError ? (
                <ErrorBanner title="Report data unavailable" message="We couldn't load this report's data. Try refreshing, or return to your workspace." />
              ) : null}

              <ReportExecutiveNarrative
                paragraphs={presentation.executiveSummary}
                summarySentence={wowSummary?.summarySentence ?? null}
              />

              <ReportDiagnosisCallout diagnosis={presentation.diagnosis} />

              <section className="space-y-3">
                <DashboardSectionHeader
                  title="Revenue Trend"
                  description={presentation.displayContext.historyLabel || "How income moved across your report window."}
                />
                <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-brand-border-strong/70 bg-brand-panel/70 px-4 py-3 shadow-brand-card">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Latest revenue</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight text-brand-text-primary md:text-3xl">
                              {revenueTrend.latestValueDisplay ?? "$--"}
                            </p>
                          </div>
                          <div className="space-y-0.5 text-right">
                            {revenueTrend.movementLabel ? (
                              <p className="inline-flex rounded-full border border-brand-border-strong/75 bg-brand-panel/70 px-3 py-0.5 text-xs font-semibold tracking-[0.08em] text-brand-text-secondary">
                                {revenueTrend.movementLabel}
                              </p>
                            ) : null}
                            {revenueTrend.periodLabel ? <p className="text-xs text-brand-text-muted">{revenueTrend.periodLabel}</p> : null}
                          </div>
                        </div>
                      </div>
                      {revenueTrend.hasRenderableChart ? (
                        <div className="rounded-2xl border border-brand-border-strong/70 bg-brand-panel/60 p-3">
                          <RevenueTrendChart points={revenueTrend.points} />
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/70 p-4">
                          <p className="text-sm text-brand-text-secondary">Trend chart data was not included in this export.</p>
                        </div>
                      )}
                    </div>

                    <article
                      className="rounded-[1.1rem] border border-brand-border-strong/70 bg-brand-panel/72 p-4"
                      data-testid="report-revenue-interpretation"
                    >
                      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-accent-blue">What this means</p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-brand-text-muted">What happened</p>
                          <p className="mt-1 text-sm leading-relaxed text-brand-text-primary">{revenueExplanation.whatHappened}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-brand-text-muted">Why it matters</p>
                          <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">{revenueExplanation.whyItMatters}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-brand-text-muted">What to watch next</p>
                          <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">{revenueExplanation.whatToWatch}</p>
                        </div>
                      </div>
                    </article>
                  </div>
                </PanelCard>
              </section>

              {presentation.platformMix.platformShares && presentation.platformMix.platformShares.length > 0 ? (
                <section className="space-y-3" data-testid="report-platform-mix">
                  <DashboardSectionHeader
                    title="Revenue by Platform"
                    description="Where income is coming from and how concentrated it is across your sources."
                  />
                  <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
                    <div className="space-y-3.5">
                      {presentation.platformMix.platformShares.map((row, index) => {
                        const sharePct = Math.round(row.share * 100);
                        return (
                          <article
                            key={row.platform}
                            className="rounded-[1rem] border border-brand-border/55 bg-[linear-gradient(165deg,rgba(18,37,74,0.72),rgba(11,24,50,0.84))] p-3.5 shadow-brand-card"
                            data-testid="report-platform-mix-row"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold capitalize text-brand-text-primary">{row.platform}</span>
                                  <span className="inline-flex rounded-full border border-brand-border/50 bg-brand-panel/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">
                                    {platformShareBandLabel(index, sharePct)}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-brand-text-muted">{sharePct}% of tracked revenue</p>
                              </div>
                              <div className="text-right">
                                {row.revenue > 0 ? (
                                  <p className="text-sm font-semibold tabular-nums text-brand-text-primary">
                                    ${Math.round(row.revenue).toLocaleString("en-US")}
                                  </p>
                                ) : null}
                                <p className="mt-0.5 text-[11px] tabular-nums text-brand-text-muted">{sharePct}% share</p>
                              </div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-brand-panel-muted/55">
                              <div
                                className={`h-full rounded-full ${platformShareBarColor(sharePct)}`}
                                style={{ width: `${sharePct}%` }}
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    {presentation.platformMix.concentrationScore !== null ? (
                      <div className="mt-4 rounded-[1rem] border border-brand-border/50 bg-brand-panel/55 px-4 py-3">
                        {(() => {
                          const tone = concentrationRiskTone(presentation.platformMix.concentrationScore);
                          return (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">Concentration read</p>
                                <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
                                  Your current revenue mix reads as{" "}
                                  <span className={`font-semibold ${tone.textClassName}`}>{tone.label.toLowerCase()}</span>{" "}
                                  concentration risk across tracked sources.
                                </p>
                              </div>
                              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone.pillClassName}`}>
                                {tone.label} risk {Math.round(presentation.platformMix.concentrationScore)}%
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}
                  </PanelCard>
                </section>
              ) : null}

              <ReportSubscriberHealthSection model={presentation.subscriberHealth} />

              {presentation.audienceGrowth ? (
                <section className="space-y-3">
                  <DashboardSectionHeader
                    title="Audience signals"
                    description="Where discovery is building, what to watch, and where to point that attention next."
                  />
                  <ReportAudienceGrowthSection model={presentation.audienceGrowth} />
                </section>
              ) : null}

              {wowSummary ? <ReportStrengthsRisksSection model={wowSummary.strengthsRisks} /> : null}

              {wowSummary ? (
                <section className="space-y-3" data-testid="report-what-to-do-next">
                  <DashboardSectionHeader
                    title="What to do next"
                    description="Start with the move most connected to the diagnosis, then use the follow-up move to make it stick."
                  />
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    {wowSummary.nextActions.length > 0 ? (
                      wowSummary.nextActions.map((action, index) => (
                        <PanelCard
                          key={action.id}
                          className={`border-brand-border/75 ${
                            index === 0
                              ? "relative overflow-hidden bg-[linear-gradient(155deg,rgba(18,40,82,0.92),rgba(14,30,60,0.94),rgba(10,64,77,0.44))] shadow-brand-glow"
                              : "bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]"
                          }`}
                          data-testid={index === 0 ? "report-next-action-primary" : "report-next-action-secondary"}
                        >
                          {index === 0 ? (
                            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-accent-teal/16 blur-3xl" />
                          ) : null}
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${index === 0 ? "text-brand-accent-teal" : "text-brand-accent-blue"}`}>
                                  {index === 0 ? "Start here" : "Then reinforce"}
                                </p>
                                {presentation.recommendations[index]?.expectedImpact ? (
                                  <span
                                    className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${expectedImpactChipClass(presentation.recommendations[index]?.expectedImpact ?? "low")}`}
                                  >
                                    {expectedImpactLabel(presentation.recommendations[index]?.expectedImpact ?? "low")}
                                  </span>
                                ) : null}
                              </div>
                              {action.timeframe ? (
                                <span className="rounded-full border border-brand-border/70 bg-brand-panel/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-brand-text-muted">
                                  {action.timeframe}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-lg font-semibold leading-snug text-brand-text-primary md:text-[1.15rem]">{action.title}</p>
                            {action.detail ? <p className="text-sm leading-relaxed text-brand-text-secondary">{action.detail}</p> : null}
                            <p className="text-xs leading-relaxed text-brand-text-muted">
                              {index === 0
                                ? "This is the move most likely to change the business read in the next cycle."
                                : "Use this once the first change is underway so the gain has somewhere to compound."}
                            </p>
                          </div>
                        </PanelCard>
                      ))
                    ) : (
                      <PanelCard className="border-brand-border/75 bg-brand-panel/72 md:col-span-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
                          Limited action signal
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                          This report has enough signal for a business read, but not enough history to rank precise actions.
                          Use the biggest opportunity above as the first move, then rerun once another month of data is present.
                        </p>
                      </PanelCard>
                    )}
                  </div>
                  {presentation.recommendations.length > 2 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
                        Additional recommendations
                      </p>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {presentation.recommendations.slice(2).map((rec) => (
                          <article
                            key={rec.id}
                            className="rounded-[1.05rem] border border-brand-border/65 bg-[linear-gradient(155deg,rgba(16,32,67,0.88),rgba(19,41,80,0.82))] p-4"
                            data-testid="report-additional-recommendation"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              {rec.label ? (
                                <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">{rec.label}</p>
                              ) : null}
                              {rec.stateLabel ? (
                                <Badge variant={rec.stateTone ?? "neutral"}>{rec.stateLabel}</Badge>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm font-semibold leading-snug text-brand-text-primary">{rec.body}</p>
                            {rec.detail ? (
                              <p className="mt-1.5 text-xs leading-relaxed text-brand-text-secondary">{rec.detail}</p>
                            ) : null}
                            {rec.expectedImpact ? (
                              <span
                                className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${expectedImpactChipClass(rec.expectedImpact)}`}
                                data-testid="report-rec-impact-chip"
                              >
                                {expectedImpactLabel(rec.expectedImpact)}
                              </span>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-brand-border/55 bg-[linear-gradient(165deg,rgba(18,37,74,0.58),rgba(11,24,50,0.72))] px-4 py-3">
                    <p className="text-xs leading-relaxed text-brand-text-secondary">
                      {presentation.platformMix.platformsConnected !== null && presentation.platformMix.platformsConnected <= 1
                        ? "Adding one more source or owned channel will make the next report more useful and less fragile."
                        : "Upload a fresh data pull after your next cycle so the next recommendation is based on what changed, not what you remember."}
                    </p>
                    <Link
                      href="/app/data"
                      data-testid="report-return-to-workspace"
                      className="inline-flex shrink-0 rounded-xl border border-brand-border/60 bg-brand-panel/50 px-3 py-2 text-sm font-medium text-brand-text-secondary transition hover:bg-brand-panel/80 hover:text-brand-text-primary"
                    >
                      Return to workspace
                    </Link>
                  </div>
                </section>
              ) : null}

              <ReportOutlookSection model={presentation.revenueOutlook} />
            </>
          ) : null}
        </section>
      */}

      {state.view === "not_found" ? (
        <section className="space-y-3" data-testid="report-not-found">
          <h1 className="text-2xl font-semibold">Report not found</h1>
          <p className="text-brand-text-secondary">
            We could not find a report with ID {canonicalReportId ?? "unknown"}. It may have been deleted or never existed.
          </p>
          <Link href="/app/report" className={buttonClassName({ variant: "secondary", size: "sm", className: "px-4 shadow-brand-card" })}>
            Back to Reports
          </Link>
        </section>
      ) : null}

      {state.view === "invalid_route" ? (
        <section className="space-y-3" data-testid="report-invalid-route">
          <h1 className="text-2xl font-semibold">Invalid report route</h1>
          <p className="text-brand-text-secondary">The report URL is missing a valid report ID.</p>
          <Link href="/app/report" className={buttonClassName({ variant: "secondary", size: "sm", className: "px-4 shadow-brand-card" })}>
            Back to Reports
          </Link>
        </section>
      ) : null}

      {state.view === "forbidden" ? (
        <section className="space-y-3" data-testid="report-forbidden">
          <h1 className="text-2xl font-semibold">Unauthorized access</h1>
          <p className="text-brand-text-secondary">You do not have permission to view this report.</p>
          <Link href="/app" className={buttonClassName({ variant: "secondary", size: "sm", className: "px-4 shadow-brand-card" })}>
            Back to Dashboard
          </Link>
        </section>
      ) : null}

      {state.view === "entitlement_required" && !isFounder ? (
        <section className="space-y-3" data-testid="report-entitlement-required">
          <h1 className="text-2xl font-semibold">Upgrade required</h1>
          <p className="text-brand-text-secondary">This report requires Report or Pro access. Continue in Billing to unlock access.</p>
          <Link href="/app/billing" className={buttonClassName({ variant: "secondary", size: "sm", className: "px-4 shadow-brand-card" })}>
            Go to Billing
          </Link>
        </section>
      ) : state.view === "entitlement_required" ? (
        <section className="space-y-3" data-testid="report-founder-override-retry">
          <h1 className="text-2xl font-semibold">Access sync required</h1>
          <p className="text-brand-text-secondary">Founder override was detected, but this report request still returned a gated response. Retry to refresh access.</p>
          <button
            type="button"
            onClick={() => setReloadNonce((prev) => prev + 1)}
            className={buttonClassName({ variant: "secondary", size: "sm", className: "px-4 shadow-brand-card" })}
          >
            Retry
          </button>
        </section>
      ) : null}

      {state.view === "session_expired" ? <SessionExpiredCallout requestId={state.requestId} /> : null}

      {state.view === "server_error" ? (
        <div data-testid="report-error">
          <ErrorBanner
            title="Report unavailable"
            message="We could not load this report due to a server error. Please try again shortly."
            requestId={state.requestId}
            action={
              <Link href="/app/report" className={buttonClassName({ variant: "secondary", size: "sm", className: "px-4 shadow-brand-card" })}>
                Back to Reports
              </Link>
            }
          />
        </div>
      ) : null}
    </FeatureGuard>
  );
}
