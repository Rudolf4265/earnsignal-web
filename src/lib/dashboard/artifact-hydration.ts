import { normalizeArtifactToReportModel } from "../report/normalize-artifact-to-report-model";
import { validateReportArtifactContract } from "../report/artifact-contract";

export type DashboardArtifactHydrationResult = {
  contractValid: boolean;
  contractErrors: string[];
  warnings: string[];
  kpis: {
    netRevenue: number | null;
    subscribers: number | null;
    stabilityIndex: number | null;
    churnVelocity: number | null;
  };
  keySignals: string[];
  recommendedActions: string[];
  trendPreview: string | null;
};

function dedupe(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function readSectionText(section: { paragraphs: string[]; bullets: string[] } | null): string[] {
  if (!section) {
    return [];
  }

  return dedupe([...section.bullets, ...section.paragraphs]);
}

function normalizeSectionTitle(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function findSectionByTitles(
  sections: { title: string | null; bullets: string[]; paragraphs: string[] }[],
  titles: string[],
): { title: string | null; bullets: string[]; paragraphs: string[] } | null {
  const normalizedTargets = new Set(titles.map((title) => title.trim().toLowerCase()));
  for (const section of sections) {
    if (normalizedTargets.has(normalizeSectionTitle(section.title))) {
      return section;
    }
  }

  return null;
}

function pickTrendPreview(
  sections: { title: string | null; bullets: string[]; paragraphs: string[] }[],
  fallbackSummary: string | null,
): string | null {
  const outlookSection = findSectionByTitles(sections, ["Outlook"]);
  if (outlookSection) {
    const entries = readSectionText(outlookSection);
    if (entries.length > 0) {
      return entries[0];
    }
  }

  const trendSection = findSectionByTitles(sections, ["Revenue Snapshot"]);
  if (trendSection) {
    const entries = readSectionText(trendSection);
    if (entries.length > 0) {
      return entries[0];
    }
  }

  return fallbackSummary;
}

export function hydrateDashboardFromArtifact(artifact: unknown): DashboardArtifactHydrationResult {
  const contract = validateReportArtifactContract(artifact);
  if (!contract.valid) {
    return {
      contractValid: false,
      contractErrors: contract.errors,
      warnings: [],
      kpis: {
        netRevenue: null,
        subscribers: null,
        stabilityIndex: null,
        churnVelocity: null,
      },
      keySignals: [],
      recommendedActions: [],
      trendPreview: null,
    };
  }

  const normalized = normalizeArtifactToReportModel(artifact);
  const keySignalsSection = findSectionByTitles(normalized.model.sections, ["Key Signals"]);
  const recommendationsSection = findSectionByTitles(normalized.model.sections, ["Recommended Actions"]);

  return {
    contractValid: true,
    contractErrors: [],
    warnings: normalized.warnings,
    kpis: {
      netRevenue: normalized.model.kpis.netRevenue,
      subscribers: normalized.model.kpis.subscribers,
      stabilityIndex: normalized.model.kpis.stabilityIndex,
      churnVelocity: normalized.model.kpis.churnVelocity,
    },
    keySignals: readSectionText(keySignalsSection),
    recommendedActions: readSectionText(recommendationsSection),
    trendPreview: pickTrendPreview(normalized.model.sections, normalized.model.executiveSummaryParagraphs[0] ?? null),
  };
}

