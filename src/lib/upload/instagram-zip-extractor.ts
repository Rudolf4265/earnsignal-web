import { normalizeHeader, validateInstagramSchema } from "./instagram-csv-detector";
import { normalizeInstagramContentRow, type InstagramContentExportRow } from "./instagram-content-model";
import {
  extractZipArchiveEntryText,
  inspectZipArchiveBuffer,
  type ZipArchiveEntry,
  type ZipArchiveInspectionResult,
  type ZipUploadFileLike,
} from "./zip-intake";

export type InstagramZipExtractionReasonCode =
  | "instagram_required_file_missing"
  | "instagram_required_content_invalid"
  | "instagram_supported_shape_but_unparseable"
  | "instagram_normalization_failed";

export type InstagramZipExtractionSuccess = {
  ok: true;
  detectedExportType: "instagram_content_export";
  sourceEntryPath: string;
  normalizedFilename: string;
  normalizedCsvText: string;
  rowCount: number;
};

export type InstagramZipExtractionFailure = {
  ok: false;
  reasonCode: InstagramZipExtractionReasonCode;
  message: string;
  sourceEntryPath: string | null;
};

export type InstagramZipExtractionResult = InstagramZipExtractionSuccess | InstagramZipExtractionFailure;

type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};

const INSTAGRAM_CONTENT_CANONICAL_COLUMNS: Array<{
  label: string;
  value: (row: InstagramContentExportRow) => string | number | null;
}> = [
  { label: "Permalink", value: (row) => row.permalink },
  { label: "Description", value: (row) => row.description },
  { label: "Post type", value: (row) => row.postType },
  { label: "Publish time", value: (row) => row.publishTime },
  { label: "Impressions", value: (row) => row.impressions },
  { label: "Reach", value: (row) => row.reach },
  { label: "Likes", value: (row) => row.likes },
  { label: "Comments", value: (row) => row.comments },
  { label: "Shares", value: (row) => row.shares },
  { label: "Saves", value: (row) => row.saves },
  { label: "Profile visits", value: (row) => row.profileVisits },
  { label: "Follows", value: (row) => row.follows },
];

function createFailure(
  reasonCode: InstagramZipExtractionReasonCode,
  message: string,
  sourceEntryPath: string | null,
): InstagramZipExtractionFailure {
  return {
    ok: false,
    reasonCode,
    message,
    sourceEntryPath,
  };
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

function buildNormalizedInstagramCsv(rows: Record<string, string>[]): string {
  const headerLine = INSTAGRAM_CONTENT_CANONICAL_COLUMNS.map((column) => column.label).join(",");
  const dataLines = rows.map((rawRow) => {
    const normalizedRow = normalizeInstagramContentRow(rawRow);
    return INSTAGRAM_CONTENT_CANONICAL_COLUMNS.map((column) => stringifyCsvValue(column.value(normalizedRow))).join(",");
  });

  return [headerLine, ...dataLines].join("\n");
}

function findAllowlistedInstagramContentEntry(entries: ZipArchiveEntry[]): ZipArchiveEntry | null {
  const pathLookup = new Map(entries.map((entry) => [entry.normalizedPath.toLowerCase(), entry]));
  const candidatePaths = ["instagram_content_export.csv", "content/instagram_content_export.csv"];

  for (const candidatePath of candidatePaths) {
    const match = pathLookup.get(candidatePath);
    if (match) {
      return match;
    }
  }

  return null;
}

function buildNormalizedFilename(originalName: string | null | undefined): string {
  const trimmed = typeof originalName === "string" ? originalName.trim() : "";
  const safeBaseName = trimmed.length > 0 ? trimmed.replace(/\.zip$/i, "") : "instagram-export";
  return `${safeBaseName}.normalized.csv`;
}

export async function extractInstagramZipBufferToUploadArtifact(
  buffer: ArrayBuffer,
  options?: {
    inspection?: ZipArchiveInspectionResult;
    fileName?: string | null;
  },
): Promise<InstagramZipExtractionResult> {
  const inspection = options?.inspection ?? inspectZipArchiveBuffer(buffer, { name: options?.fileName ?? "instagram.zip", size: buffer.byteLength });

  if (inspection.kind !== "supported_shape_instagram_native_zip") {
    return createFailure(
      "instagram_supported_shape_but_unparseable",
      "ZIP archive was not eligible for the bounded Instagram extractor.",
      null,
    );
  }

  const sourceEntry = findAllowlistedInstagramContentEntry(inspection.entries);
  if (!sourceEntry) {
    return createFailure(
      "instagram_required_file_missing",
      "Supported Instagram ZIP is missing the required allowlisted content CSV.",
      null,
    );
  }

  let csvText = "";
  try {
    csvText = await extractZipArchiveEntryText(buffer, sourceEntry);
  } catch {
    return createFailure(
      "instagram_supported_shape_but_unparseable",
      "Supported Instagram ZIP could not be parsed from the allowlisted content CSV.",
      sourceEntry.normalizedPath,
    );
  }

  let parsedCsv: ParsedCsv;
  try {
    parsedCsv = parseCsvText(csvText);
  } catch {
    return createFailure(
      "instagram_supported_shape_but_unparseable",
      "Supported Instagram ZIP contained an unreadable content CSV.",
      sourceEntry.normalizedPath,
    );
  }

  const validation = validateInstagramSchema(parsedCsv.headers, parsedCsv.rows.length);
  if (validation.detected_export_type !== "instagram_content_export" || validation.state === "invalid_schema" || validation.state === "recognized_not_implemented") {
    return createFailure(
      "instagram_required_content_invalid",
      "Supported Instagram ZIP contained an unsupported Instagram CSV structure.",
      sourceEntry.normalizedPath,
    );
  }

  try {
    const normalizedCsvText = buildNormalizedInstagramCsv(parsedCsv.rows);
    const normalizedHeaders = INSTAGRAM_CONTENT_CANONICAL_COLUMNS.map((column) => normalizeHeader(column.label));
    const normalizedValidation = validateInstagramSchema(normalizedHeaders, parsedCsv.rows.length);

    if (normalizedValidation.detected_export_type !== "instagram_content_export" || normalizedValidation.state === "invalid_schema") {
      return createFailure(
        "instagram_normalization_failed",
        "Instagram ZIP could not be normalized into the supported upload contract.",
        sourceEntry.normalizedPath,
      );
    }

    return {
      ok: true,
      detectedExportType: "instagram_content_export",
      sourceEntryPath: sourceEntry.normalizedPath,
      normalizedFilename: buildNormalizedFilename(options?.fileName),
      normalizedCsvText,
      rowCount: parsedCsv.rows.length,
    };
  } catch {
    return createFailure(
      "instagram_normalization_failed",
      "Instagram ZIP could not be normalized into the supported upload contract.",
      sourceEntry.normalizedPath,
    );
  }
}

export async function extractInstagramZipUploadArtifact(file: ZipUploadFileLike): Promise<InstagramZipExtractionResult> {
  const buffer = await file.arrayBuffer();
  return extractInstagramZipBufferToUploadArtifact(buffer, { fileName: file.name });
}
