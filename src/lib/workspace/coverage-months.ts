export function normalizeMonthToken(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return /^\d{4}-\d{2}$/.test(trimmed) ? trimmed : null;
}

export function toMonthIndex(value: string): number {
  const [yearPart, monthPart] = value.split("-");
  return Number(yearPart) * 12 + (Number(monthPart) - 1);
}

export function fromMonthIndex(value: number): string {
  const year = Math.floor(value / 12);
  const month = (value % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function buildMonthsInclusive(startMonth: string, endMonth: string): string[] {
  const startIndex = toMonthIndex(startMonth);
  const endIndex = toMonthIndex(endMonth);
  if (endIndex < startIndex) {
    return [];
  }

  const months: string[] = [];
  for (let cursor = startIndex; cursor <= endIndex; cursor += 1) {
    months.push(fromMonthIndex(cursor));
  }
  return months;
}

export function normalizeCoverageMonths(
  monthsPresent: string[],
  coverageStart: string | null,
  coverageEnd: string | null,
): string[] {
  const normalizedMonths = [...new Set(monthsPresent.map((month) => normalizeMonthToken(month)).filter((month): month is string => Boolean(month)))]
    .sort((left, right) => toMonthIndex(left) - toMonthIndex(right));

  if (normalizedMonths.length > 0) {
    return normalizedMonths;
  }

  const startMonth = normalizeMonthToken(coverageStart);
  const endMonth = normalizeMonthToken(coverageEnd);
  if (!startMonth || !endMonth) {
    return [];
  }

  return buildMonthsInclusive(startMonth, endMonth);
}
