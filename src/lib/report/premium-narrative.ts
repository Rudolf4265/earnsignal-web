export type NarrativeTrendDirection = "up" | "down" | "flat" | "unknown";

export type RevenueExplanationInput = {
  movementLabel: string | null;
  narrative: string | null;
  snapshotCoverageNote: string | null;
};

export type RevenueExplanation = {
  whatHappened: string;
  whyItMatters: string;
  whatToWatch: string;
};

const DATA_COMPLETENESS_HINTS = [
  "upload more data",
  "missing source",
  "missing data",
  "get more history",
  "confirm the missing source",
  "verify source coverage",
  "validate data",
  "data coverage",
  "source data",
  "snapshot coverage",
];

const INTERNAL_OR_RAW_HINTS = [
  "revenue projection base",
  "projection base",
  "churn month",
  "churn_month",
  "reason code",
  "reason_code",
  "quality flag",
  "schema",
  "heuristic",
  "technical",
  "raw ",
  "debug",
];

export function normalizeTrendDirection(value: string | null | undefined): NarrativeTrendDirection {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "up" || normalized === "down" || normalized === "flat") {
    return normalized;
  }
  return "unknown";
}

export function polishReportSentence(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/[_]+/g, " ")
    .replace(/\bcurrent profile (shows|looks)\b/gi, "")
    .replace(/\bmixed pressure across\b/gi, "Several pressure signals are present across")
    .replace(/\b(churn|monetization|acquisition|concentration)\s+pressure\s+primary\b/gi, "$1 pressure")
    .replace(/\bsupported by the evidence\b/gi, "")
    .replace(/\bthe evidence does not support a single dominant constraint\b/gi, "no single issue clearly outweighs the others")
    .replace(/\bprimary growth constraint\b/gi, "main growth constraint")
    .replace(/\bconfidence is limited because\b/gi, "Confidence is lower because")
    .replace(/\bwithin the next\s+2\s+weeks\b/gi, "over the next 2 weeks")
    .trim()
    .replace(/^[,;:\- ]+/, "");

  if (!cleaned) {
    return null;
  }

  if (/^\d{4}-\d{2}:/.test(cleaned)) {
    return cleaned;
  }

  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

export function shouldSuppressRawReportText(value: string | null | undefined): boolean {
  const normalized = value?.toLowerCase() ?? "";
  if (!normalized) {
    return true;
  }

  if (/^\d{4}-\d{2}\s*[:|-]\s*/.test(normalized) && /(churn|subscriber|member|retention)/i.test(normalized)) {
    return true;
  }

  if (/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}.*(churn|subscriber|member)/i.test(normalized)) {
    return true;
  }

  if (/base.*projection.*base/i.test(normalized)) {
    return true;
  }

  return INTERNAL_OR_RAW_HINTS.some((hint) => normalized.includes(hint));
}

export function isDataCompletenessAction(value: string | null | undefined): boolean {
  const normalized = value?.toLowerCase() ?? "";
  return DATA_COMPLETENESS_HINTS.some((hint) => normalized.includes(hint));
}

export function stripActionTimeframe(value: string): string {
  return value
    .replace(/\s*(within|over)\s+the\s+next\s+2\s+weeks\.?/gi, "")
    .replace(/\s*this\s+month\.?/gi, "")
    .replace(/\s+over\s+the\s+next\s+month\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[;:, ]+$/, "");
}

export function buildRevenueExplanation(input: RevenueExplanationInput): RevenueExplanation {
  const normalizedMovement = input.movementLabel?.toLowerCase() ?? "";
  const normalizedNarrative = input.narrative?.toLowerCase() ?? "";
  const movementWithoutDirection = input.movementLabel?.replace(/^(up|down)\s+/i, "") ?? null;
  const movementSentence =
    input.movementLabel && normalizedMovement.includes("down")
      ? `Revenue declined ${movementWithoutDirection?.replace(/vs start/i, "from the start of the period").toLowerCase()}.`
      : input.movementLabel && normalizedMovement.includes("up")
        ? `Revenue improved ${movementWithoutDirection?.replace(/vs start/i, "from the start of the period").toLowerCase()}.`
        : input.movementLabel && normalizedMovement.includes("flat")
          ? "Revenue held mostly steady across this report window."
          : null;

  const whatHappened =
    input.narrative && !normalizedNarrative.includes("directional guidance")
      ? polishReportSentence(input.narrative) ?? movementSentence ?? "Revenue history is limited in this report."
      : movementSentence ?? "Revenue history is limited in this report.";

  if (input.snapshotCoverageNote) {
    return {
      whatHappened,
      whyItMatters:
        "The latest period only includes part of the business, so the newest swing is useful context but not a full verdict.",
      whatToWatch:
        "Wait for the next complete pull before making a major strategy change, then act on the pattern that still holds.",
    };
  }

  if (normalizedMovement.includes("down")) {
    return {
      whatHappened,
      whyItMatters:
        "A slide in revenue matters because it can quickly turn a small retention, offer, or cadence problem into a business problem.",
      whatToWatch:
        "Watch whether the next cycle stabilizes. If it keeps sliding, treat retention and offer clarity as the first priorities.",
    };
  }

  if (normalizedMovement.includes("up")) {
    return {
      whatHappened,
      whyItMatters:
        "Growth is healthiest when it is repeatable and not dependent on one platform doing all the work.",
      whatToWatch:
        "Look for the same lift next cycle, then reinforce the source or offer that is making the improvement durable.",
    };
  }

  return {
    whatHappened,
    whyItMatters:
      "Steady revenue is useful breathing room, but it should become a deliberate growth test instead of passive maintenance.",
    whatToWatch:
      "Use the next cycle to learn whether the business is quietly compounding or simply waiting for a new growth lever.",
  };
}
