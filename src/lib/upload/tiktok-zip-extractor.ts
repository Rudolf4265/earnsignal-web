import {
  extractZipArchiveEntryText,
  inspectZipArchiveBuffer,
  type ZipArchiveEntry,
  type ZipArchiveInspectionResult,
  type ZipUploadFileLike,
} from "./zip-intake";

export type TiktokZipExtractionReasonCode =
  | "tiktok_required_file_missing"
  | "tiktok_required_content_invalid"
  | "tiktok_supported_shape_but_unparseable"
  | "tiktok_normalization_failed";

export type TiktokZipExtractionSuccess = {
  ok: true;
  sourceEntryPath: string;
  normalizedFilename: string;
  normalizedCsvText: string;
  rowCount: number;
};

export type TiktokZipExtractionFailure = {
  ok: false;
  reasonCode: TiktokZipExtractionReasonCode;
  message: string;
  sourceEntryPath: string | null;
};

export type TiktokZipExtractionResult = TiktokZipExtractionSuccess | TiktokZipExtractionFailure;

type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

type TiktokPerformanceCanonicalColumn =
  | "date"
  | "video views"
  | "likes"
  | "comments"
  | "shares"
  | "profile views"
  | "followers gained";

type TiktokPerformanceRow = {
  date: string | null;
  videoViews: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  profileViews: number | null;
  followersGained: number | null;
};

const TIKTOK_PERFORMANCE_CANONICAL_COLUMNS: Array<{
  label: string;
  key: TiktokPerformanceCanonicalColumn;
  value: (row: TiktokPerformanceRow) => string | number | null;
}> = [
  { label: "Date", key: "date", value: (row) => row.date },
  { label: "Video views", key: "video views", value: (row) => row.videoViews },
  { label: "Likes", key: "likes", value: (row) => row.likes },
  { label: "Comments", key: "comments", value: (row) => row.comments },
  { label: "Shares", key: "shares", value: (row) => row.shares },
  { label: "Profile views", key: "profile views", value: (row) => row.profileViews },
  { label: "Followers gained", key: "followers gained", value: (row) => row.followersGained },
];

const TIKTOK_PERFORMANCE_ALIASES: Record<string, TiktokPerformanceCanonicalColumn> = {
  views: "video views",
  "view count": "video views",
  "video view": "video views",
  "like count": "likes",
  "comment count": "comments",
  "share count": "shares",
  "profile activity": "profile views",
  "profile visit": "profile views",
  "profile visits": "profile views",
  "new followers": "followers gained",
  "follow count": "followers gained",
};

function createFailure(
  reasonCode: TiktokZipExtractionReasonCode,
  message: string,
  sourceEntryPath: string | null,
): TiktokZipExtractionFailure {
  return {
    ok: false,
    reasonCode,
    message,
    sourceEntryPath,
  };
}

function normalizeHeader(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function resolveTiktokCanonical(normalizedHeader: string): TiktokPerformanceCanonicalColumn | null {
  const exactMatch = TIKTOK_PERFORMANCE_CANONICAL_COLUMNS.find((column) => normalizeHeader(column.label) === normalizedHeader);
  if (exactMatch) {
    return exactMatch.key;
  }

  return TIKTOK_PERFORMANCE_ALIASES[normalizedHeader] ?? null;
}

function isTrailingEmptyRow(row: string[]): boolean {
  return row.every((value) => value.length === 0);
}

function parseCsvText(csvText: string): ParsedCsv {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];

    if (char === '"') {
      if (inQuotes && csvText[index + 1] === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      if (!(rows.length === 0 && isTrailingEmptyRow(currentRow))) {
        rows.push(currentRow);
      }
      currentRow = [];

      if (char === "\r" && csvText[index + 1] === "\n") {
        index += 1;
      }
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  if (!(rows.length > 0 && isTrailingEmptyRow(currentRow))) {
    rows.push(currentRow);
  }

  if (rows.length === 0 || rows[0].every((value) => value.trim().length === 0)) {
    throw new Error("CSV did not contain a header row.");
  }

  const headers = rows[0];
  const records: Record<string, string>[] = [];

  for (const row of rows.slice(1)) {
    if (isTrailingEmptyRow(row)) {
      continue;
    }

    if (row.length > headers.length) {
      throw new Error("CSV row exceeded header width.");
    }

    const record: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      record[header] = row[headerIndex] ?? "";
    });
    records.push(record);
  }

  return { headers, rows: records };
}

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function nullableNumber(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (trimmed === "") {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringifyCsvValue(value: string | number | null): string {
  if (value === null || typeof value === "undefined") {
    return "";
  }

  const raw = String(value);
  if (!/[",\r\n]/.test(raw)) {
    return raw;
  }

  return `"${raw.replace(/"/g, '""')}"`;
}

function normalizeTiktokPerformanceRow(rawRow: Record<string, string>): TiktokPerformanceRow {
  const canonical: Partial<Record<TiktokPerformanceCanonicalColumn, string>> = {};

  for (const [rawKey, rawValue] of Object.entries(rawRow)) {
    const resolved = resolveTiktokCanonical(normalizeHeader(rawKey));
    if (resolved && !(resolved in canonical)) {
      canonical[resolved] = rawValue;
    }
  }

  const get = (column: TiktokPerformanceCanonicalColumn): string => canonical[column] ?? "";

  return {
    date: nullable(get("date")),
    videoViews: nullableNumber(get("video views")),
    likes: nullableNumber(get("likes")),
    comments: nullableNumber(get("comments")),
    shares: nullableNumber(get("shares")),
    profileViews: nullableNumber(get("profile views")),
    followersGained: nullableNumber(get("followers gained")),
  };
}

function buildNormalizedTiktokCsv(rows: Record<string, string>[]): string {
  const headerLine = TIKTOK_PERFORMANCE_CANONICAL_COLUMNS.map((column) => column.label).join(",");
  const dataLines = rows.map((rawRow) => {
    const normalizedRow = normalizeTiktokPerformanceRow(rawRow);
    return TIKTOK_PERFORMANCE_CANONICAL_COLUMNS.map((column) => stringifyCsvValue(column.value(normalizedRow))).join(",");
  });

  return [headerLine, ...dataLines].join("\n");
}

function findAllowlistedTiktokPerformanceEntry(entries: ZipArchiveEntry[]): ZipArchiveEntry | null {
  const pathLookup = new Map(entries.map((entry) => [entry.normalizedPath.toLowerCase(), entry]));
  const candidatePaths = ["tiktok_performance_export.csv", "tiktok data/tiktok_performance_export.csv"];

  for (const candidatePath of candidatePaths) {
    const match = pathLookup.get(candidatePath);
    if (match) {
      return match;
    }
  }

  return null;
}

function validateTiktokPerformanceHeaders(headers: string[]): boolean {
  const resolvedHeaders = new Set(
    headers
      .map((header) => resolveTiktokCanonical(normalizeHeader(header)))
      .filter((header): header is TiktokPerformanceCanonicalColumn => header !== null),
  );

  return resolvedHeaders.has("date") && resolvedHeaders.has("video views");
}

function validateNormalizedTiktokHeaders(headers: string[]): boolean {
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  const expectedHeaders = TIKTOK_PERFORMANCE_CANONICAL_COLUMNS.map((column) => normalizeHeader(column.label));

  return expectedHeaders.every((header, index) => normalizedHeaders[index] === header);
}

function buildNormalizedFilename(originalName: string | null | undefined): string {
  const trimmed = typeof originalName === "string" ? originalName.trim() : "";
  const safeBaseName = trimmed.length > 0 ? trimmed.replace(/\.zip$/i, "") : "tiktok-export";
  return `${safeBaseName}.normalized.csv`;
}

export async function extractTiktokZipBufferToUploadArtifact(
  buffer: ArrayBuffer,
  options?: {
    inspection?: ZipArchiveInspectionResult;
    fileName?: string | null;
  },
): Promise<TiktokZipExtractionResult> {
  const inspection = options?.inspection ?? inspectZipArchiveBuffer(buffer, { name: options?.fileName ?? "tiktok.zip", size: buffer.byteLength });

  if (inspection.kind !== "supported_shape_tiktok_native_zip") {
    return createFailure(
      "tiktok_supported_shape_but_unparseable",
      "ZIP archive was not eligible for the bounded TikTok extractor.",
      null,
    );
  }

  const sourceEntry = findAllowlistedTiktokPerformanceEntry(inspection.entries);
  if (!sourceEntry) {
    return createFailure(
      "tiktok_required_file_missing",
      "Supported TikTok ZIP is missing the required allowlisted performance CSV.",
      null,
    );
  }

  let csvText = "";
  try {
    csvText = await extractZipArchiveEntryText(buffer, sourceEntry);
  } catch {
    return createFailure(
      "tiktok_supported_shape_but_unparseable",
      "Supported TikTok ZIP could not be parsed from the allowlisted performance CSV.",
      sourceEntry.normalizedPath,
    );
  }

  let parsedCsv: ParsedCsv;
  try {
    parsedCsv = parseCsvText(csvText);
  } catch {
    return createFailure(
      "tiktok_supported_shape_but_unparseable",
      "Supported TikTok ZIP contained an unreadable performance CSV.",
      sourceEntry.normalizedPath,
    );
  }

  if (!validateTiktokPerformanceHeaders(parsedCsv.headers)) {
    return createFailure(
      "tiktok_required_content_invalid",
      "Supported TikTok ZIP contained an unsupported TikTok CSV structure.",
      sourceEntry.normalizedPath,
    );
  }

  try {
    const normalizedCsvText = buildNormalizedTiktokCsv(parsedCsv.rows);
    const normalizedHeaders = normalizedCsvText.split(/\r?\n/)[0]?.split(",") ?? [];

    if (!validateNormalizedTiktokHeaders(normalizedHeaders)) {
      return createFailure(
        "tiktok_normalization_failed",
        "TikTok ZIP could not be normalized into the supported upload contract.",
        sourceEntry.normalizedPath,
      );
    }

    return {
      ok: true,
      sourceEntryPath: sourceEntry.normalizedPath,
      normalizedFilename: buildNormalizedFilename(options?.fileName),
      normalizedCsvText,
      rowCount: parsedCsv.rows.length,
    };
  } catch {
    return createFailure(
      "tiktok_normalization_failed",
      "TikTok ZIP could not be normalized into the supported upload contract.",
      sourceEntry.normalizedPath,
    );
  }
}

export async function extractTiktokZipUploadArtifact(file: ZipUploadFileLike): Promise<TiktokZipExtractionResult> {
  const buffer = await file.arrayBuffer();
  return extractTiktokZipBufferToUploadArtifact(buffer, { fileName: file.name });
}
