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
  "repeated base projection",
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

function formatWholeDollar(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNarrativePercentValue(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function formatDirectionalPercent(value: number): string {
  const magnitude = formatNarrativePercentValue(Math.abs(value));
  if (value > 0) {
    return `up ${magnitude}`;
  }
  if (value < 0) {
    return `down ${magnitude}`;
  }
  return "flat";
}

function normalizeNumericProse(value: string): string {
  return value
    .replace(/\$-?\d[\d,]*(?:\.\d+)?/g, (match) => {
      const parsed = Number(match.replace(/[$,]/g, ""));
      if (!Number.isFinite(parsed)) {
        return match;
      }

      const cents = Math.round((Math.abs(parsed) % 1) * 100);
      return cents === 0 ? formatWholeDollar(parsed) : match;
    })
    .replace(/(-?\d+(?:\.\d{2,})?)%/g, (_, raw) => {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? formatNarrativePercentValue(parsed) : `${raw}%`;
    });
}

function rewriteMechanicalRevenueSentence(value: string): string | null {
  const revenueChangeMatch = value.match(
    /current net revenue is\s+(\$-?\d[\d,]*(?:\.\d+)?),?\s+with a month-over-month change of\s+(-?\d+(?:\.\d+)?)%/i,
  );
  if (revenueChangeMatch) {
    const revenue = Number((revenueChangeMatch[1] ?? "").replace(/[$,]/g, ""));
    const percent = Number(revenueChangeMatch[2] ?? "");
    const revenueLabel = Number.isFinite(revenue) ? formatWholeDollar(revenue) : revenueChangeMatch[1];
    if (!Number.isFinite(percent)) {
      return `Revenue this cycle is ${revenueLabel}.`;
    }

    if (Math.abs(percent) < 1) {
      return `Revenue is holding steady this cycle, ${formatDirectionalPercent(percent)} month over month to ${revenueLabel}.`;
    }

    return `Revenue moved ${formatDirectionalPercent(percent)} month over month to ${revenueLabel}.`;
  }

  const revenueOnlyMatch = value.match(/current net revenue is\s+(\$-?\d[\d,]*(?:\.\d+)?)/i);
  if (revenueOnlyMatch) {
    const revenue = Number((revenueOnlyMatch[1] ?? "").replace(/[$,]/g, ""));
    const revenueLabel = Number.isFinite(revenue) ? formatWholeDollar(revenue) : revenueOnlyMatch[1];
    return `Revenue this cycle is ${revenueLabel}.`;
  }

  return null;
}

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

  const rewritten = rewriteMechanicalRevenueSentence(value);
  const cleaned = normalizeNumericProse(rewritten ?? value)
    .replace(/\s+/g, " ")
    .replace(/[_]+/g, " ")
    .replace(/\bcurrent profile (shows|looks)\b/gi, "")
    .replace(/\bmixed pressure across\b/gi, "Several pressure signals are present across")
    .replace(/\b(churn|monetization|acquisition|concentration)\s+pressure\s+primary\b/gi, "$1 pressure")
    .replace(/\bsupported by the evidence\b/gi, "")
    .replace(/\bthe evidence does not support a single dominant constraint\b/gi, "no single issue clearly outweighs the others")
    .replace(/\bprimary growth constraint\b/gi, "main growth constraint")
    .replace(/\bconfidence is limited because\b/gi, "Confidence is lower because")
    .replace(/\blatest net revenue increased versus the prior comparable report with limited comparison confidence\b/gi, "Revenue is moving in the right direction, though the comparison window is still short")
    .replace(/\bactive subscribers increased versus the prior comparable report with limited comparison confidence\b/gi, "Paid subscriber count is improving, but retention history is still the missing layer")
    .replace(/\bconcentration risk decreased versus the prior comparable report\b/gi, "Platform dependence improved slightly, but the business still leans on a lead platform")
    .replace(/\bwatch stability index next cycle because this comparison is evidence-limited\b/gi, "Watch whether this holds in the next upload before changing pricing or cadence")
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

  if (/(churn|subscriber|member|retention).*\bmonth:\s*\d{4}-\d{2}\b/i.test(normalized)) {
    return true;
  }

  if (/churn rates?:\s*month:\s*\d{4}-\d{2}/i.test(normalized)) {
    return true;
  }

  if (/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}.*(churn|subscriber|member)/i.test(normalized)) {
    return true;
  }

  if (/base.*projection.*base/i.test(normalized)) {
    return true;
  }

  if (/revenue projection\b.*(repeated|current period)/i.test(normalized)) {
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
    .replace(/\s*in\s+the\s+next\s+30(?:-60)?\s+days\.?/gi, "")
    .replace(/\s*this\s+month\.?/gi, "")
    .replace(/\s+over\s+the\s+next\s+month\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[;:, ]+$/, "");
}

export function buildRevenueExplanation(input: RevenueExplanationInput): RevenueExplanation {
  const normalizedMovement = input.movementLabel?.toLowerCase() ?? "";
  const normalizedNarrative = input.narrative?.toLowerCase() ?? "";
  const percentMatch = input.movementLabel?.match(/(-?\d+(?:\.\d+)?)%/);
  const rawPercent = percentMatch ? Number(percentMatch[1]) : null;
  const percentLabel = rawPercent !== null && Number.isFinite(rawPercent) ? formatNarrativePercentValue(Math.abs(rawPercent)) : null;
  const movementSentence =
    input.movementLabel && normalizedMovement.includes("down")
      ? rawPercent !== null && rawPercent > -1
        ? `Revenue is mostly holding up, but it slipped ${percentLabel} from the start of this window.`
        : `Revenue is down ${percentLabel ?? ""} from the start of this window.`.replace(/\s+\./, ".")
      : input.movementLabel && normalizedMovement.includes("up")
        ? rawPercent !== null && rawPercent < 1
          ? `Revenue is holding steady this cycle, up ${percentLabel} from the start of this window.`
          : `Revenue is up ${percentLabel ?? ""} from the start of this window.`.replace(/\s+\./, ".")
        : input.movementLabel && normalizedMovement.includes("flat")
          ? "Revenue is holding fairly steady across this window."
          : null;

  const whatHappened =
    input.narrative && !normalizedNarrative.includes("directional guidance")
      ? polishReportSentence(input.narrative) ?? movementSentence ?? "Revenue history is limited in this report."
      : movementSentence ?? "Revenue history is limited in this report.";

  if (input.snapshotCoverageNote) {
    return {
      whatHappened,
      whyItMatters:
        "This latest upload only covers part of the business, so the movement is useful context but not the final read.",
      whatToWatch:
        "Wait for the next full cycle before making a bigger pricing or cadence change, then act on the pattern that still holds.",
    };
  }

  if (normalizedMovement.includes("down")) {
    return {
      whatHappened,
      whyItMatters:
        "A softer revenue line usually means retention, offer clarity, or publishing rhythm is doing more damage than it first appears.",
      whatToWatch:
        "Watch whether the next cycle stabilizes. If it does not, treat retention and offer clarity as the first priorities.",
    };
  }

  if (normalizedMovement.includes("up")) {
    return {
      whatHappened,
      whyItMatters:
        "The goal now is to make that improvement repeatable rather than letting one stronger cycle carry too much meaning.",
      whatToWatch:
        "Look for the same lift next cycle before you expand the plan, then reinforce the source or offer making the improvement durable.",
    };
  }

  return {
    whatHappened,
    whyItMatters:
      "Steady revenue gives you room to make a cleaner strategic choice instead of reacting to noise.",
    whatToWatch:
      "Use the next cycle to learn whether the business is quietly compounding or simply waiting for the next growth lever.",
  };
}
