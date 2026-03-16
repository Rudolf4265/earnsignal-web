/**
 * Normalized internal model for a native Instagram Content CSV export.
 *
 * instagram_content_export is the SUPPORTED Instagram export family.
 * It contains per-post/reel engagement metrics exported from
 * Meta Business Suite › Content › Export or Instagram Creator Studio.
 *
 * Used by downstream analytics once the backend persists the ingested rows.
 * The frontend uses this for type-safe display and pre-upload validation results.
 */

// Inline normalizeHeader to keep this module self-contained when loaded via
// dynamic import in tests (avoids cross-file ESM resolution edge cases).
// The algorithm is identical to the one in instagram-csv-detector.ts.
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

import type { InstagramContentCanonicalColumn } from "./instagram-csv-detector";

// Inline alias map for content-export column resolution (mirrors INSTAGRAM_CONTENT_ALIASES).
const CONTENT_ALIASES: Record<string, InstagramContentCanonicalColumn> = {
  "post url": "permalink",
  url: "permalink",
  link: "permalink",
  "post link": "permalink",
  "content url": "permalink",
  caption: "description",
  text: "description",
  "post caption": "description",
  "post text": "description",
  "post description": "description",
  "content type": "post type",
  type: "post type",
  "media type": "post type",
  "post format": "post type",
  "publish date": "publish time",
  "published at": "publish time",
  "published time": "publish time",
  "post date": "publish time",
  "posted at": "publish time",
  "creation time": "publish time",
  "created at": "publish time",
  "date posted": "publish time",
  "total impressions": "impressions",
  "video views": "impressions",
  "view count": "impressions",
  "unique reach": "reach",
  "like count": "likes",
  reactions: "likes",
  "comment count": "comments",
  "share count": "shares",
  reposts: "shares",
  "save count": "saves",
  bookmarks: "saves",
  "profile activity": "profile visits",
  "profile clicks": "profile visits",
  "profile visit count": "profile visits",
  "new followers": "follows",
  "follow count": "follows",
  "followers gained": "follows",
};

const CONTENT_CANONICAL_COLUMNS: readonly InstagramContentCanonicalColumn[] = [
  "permalink",
  "description",
  "post type",
  "publish time",
  "impressions",
  "reach",
  "likes",
  "comments",
  "shares",
  "saves",
  "profile visits",
  "follows",
];

function resolveContentCanonical(
  normalized: string,
): InstagramContentCanonicalColumn | null {
  if ((CONTENT_CANONICAL_COLUMNS as readonly string[]).includes(normalized)) {
    return normalized as InstagramContentCanonicalColumn;
  }
  return CONTENT_ALIASES[normalized] ?? null;
}

// ---------------------------------------------------------------------------
// Row model
// ---------------------------------------------------------------------------

/**
 * Typed representation of a single row in an Instagram Content export.
 * All optional fields map to `null` when the source cell is blank.
 */
export interface InstagramContentExportRow {
  // ── Content identity ──────────────────────────────────────────────────────
  /** Direct URL to the post/reel/story on Instagram. */
  permalink: string | null;
  /** Post caption or description text. */
  description: string | null;
  /** Content type: "Photo", "Video", "Reel", "Story", "Album", etc. */
  postType: string | null;
  /** ISO 8601 datetime string when the post was published. */
  publishTime: string | null;

  // ── Reach & visibility ────────────────────────────────────────────────────
  /** Total times the content was shown (including repeat views). */
  impressions: number | null;
  /** Unique accounts that saw the content. */
  reach: number | null;

  // ── Engagement ────────────────────────────────────────────────────────────
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;

  // ── Profile actions ───────────────────────────────────────────────────────
  /** Profile visits that originated from this content. */
  profileVisits: number | null;
  /** New followers gained from this content. */
  follows: number | null;

  // ── Traceability ──────────────────────────────────────────────────────────
  /** Raw key→value map preserved from the source CSV row. */
  _raw: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Snapshot model
// ---------------------------------------------------------------------------

/**
 * A point-in-time snapshot from an Instagram Content CSV export.
 * Contains metadata about the file plus all normalised rows.
 */
export interface InstagramContentSnapshot {
  exportType: "instagram_content_export";
  /** Number of data rows (excluding header). */
  rowCount: number;
  rows: InstagramContentExportRow[];
  /** Raw header strings from the source file. */
  headers: string[];
  /** ISO 8601 timestamp of when this snapshot was parsed. */
  detectedAt: string;
  /**
   * Capability flags derived from which fields were present in this export.
   * Consumers must check these before rendering any derived section.
   */
  capabilities: InstagramContentCapabilities;
}

/**
 * Capability flags for an instagram_content_export snapshot.
 * Set to `true` only when the corresponding data is genuinely present.
 */
export interface InstagramContentCapabilities {
  /** File has at least one data row. */
  has_rows: boolean;
  /** publish_time field is present; enables cadence and time-series analysis. */
  supports_time_series: boolean;
  /** reach and/or impressions fields are present. */
  supports_reach_impressions: boolean;
  /** saves field is present; enables save rate analysis. */
  supports_saves: boolean;
  /** profile_visits and/or follows fields are present. */
  supports_profile_actions: boolean;
  /** shares field is present. */
  supports_shares: boolean;
  /** post_type field is present; enables content-type distribution. */
  supports_content_type_breakdown: boolean;
  /** permalink field is present; enables deep-link to posts. */
  supports_permalink: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function nullableNumber(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Row normalisation
// ---------------------------------------------------------------------------

/**
 * Map a raw CSV row (keyed by raw header strings) into a typed
 * `InstagramContentExportRow`, resolving header aliases and normalising values.
 *
 * Unknown columns are silently preserved in `_raw` for traceability.
 */
export function normalizeInstagramContentRow(
  rawRow: Record<string, string>,
): InstagramContentExportRow {
  // Build canonical-key → raw-value lookup
  const canonical: Partial<Record<string, string>> = {};
  for (const [rawKey, rawValue] of Object.entries(rawRow)) {
    const resolved = resolveContentCanonical(normalizeHeader(rawKey));
    if (resolved !== null) {
      if (!(resolved in canonical)) {
        canonical[resolved] = rawValue;
      }
    }
  }

  const get = (col: string): string => canonical[col] ?? "";

  return {
    permalink: nullable(get("permalink")),
    description: nullable(get("description")),
    postType: nullable(get("post type")),
    publishTime: nullable(get("publish time")),
    impressions: nullableNumber(get("impressions")),
    reach: nullableNumber(get("reach")),
    likes: nullableNumber(get("likes")),
    comments: nullableNumber(get("comments")),
    shares: nullableNumber(get("shares")),
    saves: nullableNumber(get("saves")),
    profileVisits: nullableNumber(get("profile visits")),
    follows: nullableNumber(get("follows")),
    _raw: { ...rawRow },
  };
}

// ---------------------------------------------------------------------------
// Capability detection
// ---------------------------------------------------------------------------

/**
 * Derive capability flags from a set of normalised rows.
 * Capabilities are field-presence driven — never inferred.
 */
export function deriveInstagramContentCapabilities(
  rows: InstagramContentExportRow[],
  headers: string[],
): InstagramContentCapabilities {
  const normalizedHeaders = headers.map(normalizeHeader);

  const hasHeader = (col: string): boolean => {
    // Check canonical columns that map to this field
    return normalizedHeaders.some((h) => {
      const resolved = resolveContentCanonical(h);
      return resolved === col;
    });
  };

  return {
    has_rows: rows.length > 0,
    supports_time_series: hasHeader("publish time"),
    supports_reach_impressions: hasHeader("reach") || hasHeader("impressions"),
    supports_saves: hasHeader("saves"),
    supports_profile_actions: hasHeader("profile visits") || hasHeader("follows"),
    supports_shares: hasHeader("shares"),
    supports_content_type_breakdown: hasHeader("post type"),
    supports_permalink: hasHeader("permalink"),
  };
}

// ---------------------------------------------------------------------------
// Snapshot builder
// ---------------------------------------------------------------------------

/**
 * Parse an array of raw CSV rows into a typed `InstagramContentSnapshot`.
 * The header row must NOT be included in `rows`.
 *
 * @param headers  Raw header strings from the first CSV line.
 * @param rows     Data rows as raw string maps (header → cell value).
 */
export function buildInstagramContentSnapshot(
  headers: string[],
  rows: Record<string, string>[],
): InstagramContentSnapshot {
  const normalizedRows = rows.map(normalizeInstagramContentRow);
  const capabilities = deriveInstagramContentCapabilities(normalizedRows, headers);

  return {
    exportType: "instagram_content_export",
    rowCount: rows.length,
    rows: normalizedRows,
    headers,
    detectedAt: new Date().toISOString(),
    capabilities,
  };
}

// ---------------------------------------------------------------------------
// Analytics helpers
// ---------------------------------------------------------------------------

/**
 * Compute summary analytics from an Instagram Content snapshot.
 * Only computes metrics supported by the actual available fields.
 * Returns `null` for any metric that cannot be computed honestly.
 */
export interface InstagramContentSummary {
  totalPosts: number;
  totalImpressions: number | null;
  totalReach: number | null;
  totalLikes: number | null;
  totalComments: number | null;
  totalShares: number | null;
  totalSaves: number | null;
  totalProfileVisits: number | null;
  totalFollows: number | null;
  /** Earliest publish date found in the export (ISO string or null). */
  earliestPublishTime: string | null;
  /** Latest publish date found in the export (ISO string or null). */
  latestPublishTime: string | null;
  /** Breakdown of post counts by content type (null if post type field absent). */
  contentTypeBreakdown: Record<string, number> | null;
}

export function computeInstagramContentSummary(
  snapshot: InstagramContentSnapshot,
): InstagramContentSummary {
  const { rows, capabilities } = snapshot;

  const sumOrNull = (
    field: keyof InstagramContentExportRow,
    supported: boolean,
  ): number | null => {
    if (!supported || rows.length === 0) return null;
    let total = 0;
    let hasAny = false;
    for (const row of rows) {
      const v = row[field] as number | null;
      if (v !== null) {
        total += v;
        hasAny = true;
      }
    }
    return hasAny ? total : null;
  };

  // Publish time range
  let earliestPublishTime: string | null = null;
  let latestPublishTime: string | null = null;
  if (capabilities.supports_time_series) {
    const times = rows
      .map((r) => r.publishTime)
      .filter((t): t is string => t !== null)
      .sort();
    if (times.length > 0) {
      earliestPublishTime = times[0];
      latestPublishTime = times[times.length - 1];
    }
  }

  // Content-type breakdown — only meaningful when there are rows
  let contentTypeBreakdown: Record<string, number> | null = null;
  if (capabilities.supports_content_type_breakdown && rows.length > 0) {
    contentTypeBreakdown = {};
    for (const row of rows) {
      const t = row.postType ?? "Unknown";
      contentTypeBreakdown[t] = (contentTypeBreakdown[t] ?? 0) + 1;
    }
  }

  return {
    totalPosts: rows.length,
    totalImpressions: sumOrNull("impressions", capabilities.supports_reach_impressions),
    totalReach: sumOrNull("reach", capabilities.supports_reach_impressions),
    totalLikes: sumOrNull("likes", true),
    totalComments: sumOrNull("comments", true),
    totalShares: sumOrNull("shares", capabilities.supports_shares),
    totalSaves: sumOrNull("saves", capabilities.supports_saves),
    totalProfileVisits: sumOrNull("profileVisits", capabilities.supports_profile_actions),
    totalFollows: sumOrNull("follows", capabilities.supports_profile_actions),
    earliestPublishTime,
    latestPublishTime,
    contentTypeBreakdown,
  };
}
