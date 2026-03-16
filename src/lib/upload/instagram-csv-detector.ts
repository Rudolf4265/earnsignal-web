/**
 * Client-side detector for native Instagram CSV exports.
 *
 * Instagram offers three structurally different native CSV export families:
 *   - instagram_content_export   : per-post/reel metrics (permalink, saves, reach, …)
 *   - instagram_insights_export  : account-level time-series insights (reach, impressions, …)
 *   - instagram_audience_export  : audience demographics snapshot (followers, age buckets, …)
 *
 * Implementation status:
 *   - instagram_content_export   → SUPPORTED end-to-end
 *   - instagram_insights_export  → RECOGNIZED (detection only; ingestion not yet implemented)
 *   - instagram_audience_export  → RECOGNIZED (detection only; ingestion not yet implemented)
 *
 * This module inspects CSV header rows and classifies which format is present so the
 * upload pipeline can route to the correct backend validator.
 */

// ---------------------------------------------------------------------------
// Header normalisation
// ---------------------------------------------------------------------------

/**
 * Normalise a raw CSV header string for comparison.
 * Lowercases, strips BOM, converts underscores/dashes to spaces,
 * collapses whitespace, and removes non-alphanumeric characters (except space).
 */
export function normalizeHeader(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")        // strip leading BOM
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, " ")       // underscores and dashes → space
    .replace(/\s+/g, " ")          // collapse whitespace
    .replace(/[^a-z0-9 ]/g, "")   // strip non-alphanumeric except space
    .trim();
}

// ---------------------------------------------------------------------------
// instagram_content_export — canonical columns and aliases
// ---------------------------------------------------------------------------

/**
 * Canonical column names for a native Instagram content performance export.
 * Stored in normalised form (lowercase, spaces not dashes/underscores).
 * Note: "age XX-YY" age ranges are stored as "age XX YY" (dash → space).
 */
export const INSTAGRAM_CONTENT_CANONICAL_COLUMNS = [
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
] as const;

export type InstagramContentCanonicalColumn =
  (typeof INSTAGRAM_CONTENT_CANONICAL_COLUMNS)[number];

/**
 * Columns that strongly indicate an instagram_content_export.
 * Weighted 2× in confidence scoring.
 */
export const INSTAGRAM_CONTENT_CRITICAL_COLUMNS = new Set<InstagramContentCanonicalColumn>([
  "publish time",
  "reach",
  "impressions",
  "likes",
  "saves",
]);

const INSTAGRAM_CONTENT_ALIASES: Record<string, InstagramContentCanonicalColumn> = {
  // permalink
  "post url": "permalink",
  url: "permalink",
  link: "permalink",
  "post link": "permalink",
  "content url": "permalink",
  // description / caption
  caption: "description",
  text: "description",
  "post caption": "description",
  "post text": "description",
  "post description": "description",
  // post type
  "content type": "post type",
  type: "post type",
  "media type": "post type",
  "post format": "post type",
  // publish time — content-specific aliases only (not bare "date" to avoid insights collision)
  "publish date": "publish time",
  "published at": "publish time",
  "published time": "publish time",
  "post date": "publish time",
  "posted at": "publish time",
  "creation time": "publish time",
  "created at": "publish time",
  "date posted": "publish time",
  // impressions
  "total impressions": "impressions",
  "video views": "impressions",
  "view count": "impressions",
  // reach
  "unique reach": "reach",
  // likes
  "like count": "likes",
  reactions: "likes",
  // comments
  "comment count": "comments",
  // shares
  "share count": "shares",
  reposts: "shares",
  // saves
  "save count": "saves",
  bookmarks: "saves",
  // profile visits
  "profile activity": "profile visits",
  "profile clicks": "profile visits",
  "profile visit count": "profile visits",
  // follows (from this post)
  "new followers": "follows",
  "follow count": "follows",
  "followers gained": "follows",
};

// ---------------------------------------------------------------------------
// instagram_insights_export — canonical columns and aliases
// ---------------------------------------------------------------------------

export const INSTAGRAM_INSIGHTS_CANONICAL_COLUMNS = [
  "date",
  "reach",
  "impressions",
  "profile views",
  "website clicks",
  "email button clicks",
  "follows",
  "unfollows",
  "accounts engaged",
  "accounts reached",
  "content interactions",
] as const;

export type InstagramInsightsCanonicalColumn =
  (typeof INSTAGRAM_INSIGHTS_CANONICAL_COLUMNS)[number];

export const INSTAGRAM_INSIGHTS_CRITICAL_COLUMNS = new Set<InstagramInsightsCanonicalColumn>([
  "date",
  "reach",
  "impressions",
]);

/**
 * Columns that, when present, strongly favour insights over other Instagram families.
 */
export const INSTAGRAM_INSIGHTS_DIFFERENTIATOR_COLUMNS =
  new Set<InstagramInsightsCanonicalColumn>([
    "accounts engaged",
    "accounts reached",
    "unfollows",
    "content interactions",
    "profile views",
    "website clicks",
    "email button clicks",
  ]);

const INSTAGRAM_INSIGHTS_ALIASES: Record<string, InstagramInsightsCanonicalColumn> = {
  // date
  period: "date",
  week: "date",
  month: "date",
  // reach
  "total reach": "reach",
  // impressions
  "total impressions": "impressions",
  views: "impressions",
  // profile views
  "profile visits": "profile views",
  "profile activity": "profile views",
  "page views": "profile views",
  // website clicks
  "website taps": "website clicks",
  "link clicks": "website clicks",
  "bio link clicks": "website clicks",
  "external link clicks": "website clicks",
  // email button clicks
  "email clicks": "email button clicks",
  "contact clicks": "email button clicks",
  "contact button clicks": "email button clicks",
  // follows
  "follower gains": "follows",
  "new followers": "follows",
  "followers gained": "follows",
  // unfollows
  "lost followers": "unfollows",
  "follower losses": "unfollows",
  "followers lost": "unfollows",
  // accounts engaged
  "engaged accounts": "accounts engaged",
  "unique engaged": "accounts engaged",
  "engaged users": "accounts engaged",
  // accounts reached
  "reached accounts": "accounts reached",
  "unique reached": "accounts reached",
  // content interactions
  interactions: "content interactions",
  "total interactions": "content interactions",
  "post interactions": "content interactions",
  engagements: "content interactions",
};

// ---------------------------------------------------------------------------
// instagram_audience_export — canonical columns and aliases
// ---------------------------------------------------------------------------

/**
 * Age range canonicals use space-separated numbers because the normalizer
 * converts "Age 18-24" → "age 18 24" and strips the "+" from "Age 65+".
 */
export const INSTAGRAM_AUDIENCE_CANONICAL_COLUMNS = [
  "date",
  "followers",
  "follows",
  "top cities",
  "top countries",
  "age 13 17",
  "age 18 24",
  "age 25 34",
  "age 35 44",
  "age 45 54",
  "age 55 64",
  "age 65",
  "men",
  "women",
  "other",
] as const;

export type InstagramAudienceCanonicalColumn =
  (typeof INSTAGRAM_AUDIENCE_CANONICAL_COLUMNS)[number];

export const INSTAGRAM_AUDIENCE_CRITICAL_COLUMNS = new Set<InstagramAudienceCanonicalColumn>([
  "followers",
]);

/**
 * Columns that, when present, strongly favour audience over other families.
 */
export const INSTAGRAM_AUDIENCE_DIFFERENTIATOR_COLUMNS =
  new Set<InstagramAudienceCanonicalColumn>([
    "top cities",
    "top countries",
    "age 13 17",
    "age 18 24",
    "age 25 34",
    "age 35 44",
    "age 45 54",
    "age 55 64",
    "age 65",
    "men",
    "women",
  ]);

const INSTAGRAM_AUDIENCE_ALIASES: Record<string, InstagramAudienceCanonicalColumn> = {
  // date
  "as of date": "date",
  "snapshot date": "date",
  period: "date",
  // followers
  "follower count": "followers",
  "total followers": "followers",
  "follower total": "followers",
  subscribers: "followers",
  "subscriber count": "followers",
  // follows (accounts this profile follows)
  following: "follows",
  "following count": "follows",
  // top cities
  cities: "top cities",
  "top locations": "top cities",
  // top countries
  countries: "top countries",
  locations: "top countries",
  // age ranges — aliases from common header variations
  // "Age 13-17" normalises to "age 13 17" which is an exact match; aliases below catch further variants
  "13 17": "age 13 17",
  "age1317": "age 13 17",
  "18 24": "age 18 24",
  "age1824": "age 18 24",
  "25 34": "age 25 34",
  "age2534": "age 25 34",
  "35 44": "age 35 44",
  "age3544": "age 35 44",
  "45 54": "age 45 54",
  "age4554": "age 45 54",
  "55 64": "age 55 64",
  "age5564": "age 55 64",
  // "Age 65+" normalises to "age 65" (+ stripped) — direct match; aliases below:
  "65 and over": "age 65",
  "65 plus": "age 65",
  age65: "age 65",
  "age 65 plus": "age 65",
  // gender
  male: "men",
  female: "women",
  "non binary": "other",
  nonbinary: "other",
};

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type InstagramExportType =
  | "instagram_content_export"
  | "instagram_insights_export"
  | "instagram_audience_export"
  | "unknown";

export interface InstagramDetectionResult {
  /** Classified export family. */
  detected_export_type: InstagramExportType;
  /**
   * Confidence score in [0, 1].
   * ≥ 0.7 = high confidence, ≥ 0.4 = medium, < 0.4 = low/inconclusive.
   */
  confidence: number;
  /** Canonical column names that were matched. */
  matched_fields: string[];
  /** Canonical column names that were NOT found. */
  missing_fields: string[];
  /** Number of critical columns matched. */
  critical_matched: number;
  /** Total critical columns for this family. */
  critical_total: number;
  /** Human-readable explanation. */
  reason: string;
}

export type InstagramSchemaState =
  | "invalid_schema"
  | "empty_valid"
  | "valid_with_rows"
  | "recognized_not_implemented";

export interface InstagramSchemaValidationResult {
  state: InstagramSchemaState;
  detected_export_type: InstagramExportType;
  confidence: number;
  matched_fields: string[];
  missing_fields: string[];
  reason: string;
}

// ---------------------------------------------------------------------------
// Per-family scoring
// ---------------------------------------------------------------------------

interface FamilyScore {
  exportType: InstagramExportType;
  confidence: number;
  matched_fields: string[];
  missing_fields: string[];
  critical_matched: number;
  critical_total: number;
}

function scoreFamily<T extends string>(
  normalizedInputs: string[],
  exportType: InstagramExportType,
  canonicalColumns: readonly T[],
  criticalColumns: Set<T>,
  aliases: Record<string, T>,
  differentiatorColumns?: Set<T>,
  differentiatorBoost = 0.0,
): FamilyScore {
  const matched = new Set<T>();

  for (const h of normalizedInputs) {
    if ((canonicalColumns as readonly string[]).includes(h)) {
      matched.add(h as T);
    } else if (h in aliases) {
      matched.add(aliases[h]);
    }
  }

  const matchedArr = Array.from(matched);
  const missingArr = canonicalColumns.filter((c) => !matched.has(c));
  const criticalMatched = matchedArr.filter((f) =>
    criticalColumns.has(f as T),
  ).length;
  const criticalTotal = criticalColumns.size;

  const criticalScore = criticalMatched * 2;
  const nonCritical = matchedArr.length - criticalMatched;
  const maxScore =
    criticalTotal * 2 + (canonicalColumns.length - criticalTotal);
  let confidence = maxScore > 0 ? (criticalScore + nonCritical) / maxScore : 0;

  // Differentiator boost: columns that are uniquely characteristic of this family
  if (differentiatorColumns && differentiatorBoost > 0) {
    const diffMatched = matchedArr.filter((f) =>
      differentiatorColumns.has(f as T),
    ).length;
    if (diffMatched >= 1) {
      confidence = Math.min(confidence + differentiatorBoost * diffMatched, 1);
    }
  }

  return {
    exportType,
    confidence: Math.min(confidence, 1),
    matched_fields: matchedArr,
    missing_fields: missingArr,
    critical_matched: criticalMatched,
    critical_total: criticalTotal,
  };
}

// ---------------------------------------------------------------------------
// Disambiguation: signature detection
// ---------------------------------------------------------------------------

/**
 * Returns true if any header uniquely signals a content export.
 * These columns do not appear in insights or audience exports.
 */
function hasContentSignature(normalizedInputs: Set<string>): boolean {
  // "saves" / "save count" / "bookmarks" are the strongest Instagram content signals
  // "permalink" / "post url" / "post type" are also distinctive
  // "publish time" / "publish date" but NOT bare "date"
  const contentOnly = [
    "permalink",
    "post url",
    "post link",
    "content url",
    "saves",
    "save count",
    "bookmarks",
    "post type",
    "content type",
    "media type",
    "publish time",
    "publish date",
    "published at",
    "published time",
    "date posted",
  ];
  return contentOnly.some((s) => normalizedInputs.has(s));
}

/**
 * Returns true if any header uniquely signals an insights export.
 */
function hasInsightsSignature(normalizedInputs: Set<string>): boolean {
  const insightsOnly = [
    "accounts engaged",
    "accounts reached",
    "engaged accounts",
    "reached accounts",
    "unfollows",
    "lost followers",
    "follower losses",
    "content interactions",
    "website clicks",
    "website taps",
    "bio link clicks",
    "email button clicks",
    "email clicks",
    "contact clicks",
  ];
  return insightsOnly.some((s) => normalizedInputs.has(s));
}

/**
 * Returns true if any header uniquely signals an audience export.
 */
function hasAudienceSignature(normalizedInputs: Set<string>): boolean {
  const audienceOnly = [
    "followers",
    "follower count",
    "total followers",
    "subscriber count",
    "top cities",
    "top countries",
    // age buckets (normalised form)
    "age 13 17",
    "age 18 24",
    "age 25 34",
    "age 35 44",
    "age 45 54",
    "age 55 64",
    "age 65",
    "13 17",
    "18 24",
    "25 34",
    "35 44",
  ];
  return audienceOnly.some((s) => normalizedInputs.has(s));
}

// ---------------------------------------------------------------------------
// Detection thresholds
// ---------------------------------------------------------------------------

const CONTENT_MIN_CRITICAL = 2;
const CONTENT_MIN_CONFIDENCE = 0.30;

const INSIGHTS_MIN_CRITICAL = 2;
const INSIGHTS_MIN_CONFIDENCE = 0.25;

const AUDIENCE_MIN_CRITICAL = 1;
const AUDIENCE_MIN_CONFIDENCE = 0.20;

// ---------------------------------------------------------------------------
// Main detection function
// ---------------------------------------------------------------------------

/**
 * Inspect a list of raw CSV header strings and classify the Instagram export family.
 *
 * Precedence rules when multiple families partially match:
 *   1. Explicit signature columns break ties deterministically.
 *   2. If both content and insights have equal score, content wins.
 *   3. If audience has "followers" plus any differentiator, it wins over insights.
 *   4. Alphabetical tie-break is last resort only.
 *
 * Does NOT require exact header order.
 * Accepts case, whitespace, punctuation, and BOM variations.
 *
 * @param rawHeaders  First row of a CSV file, split by delimiter.
 */
export function detectInstagramExportType(
  rawHeaders: string[],
): InstagramDetectionResult {
  const normalizedInputs = rawHeaders.map(normalizeHeader);
  const normalizedSet = new Set(normalizedInputs);

  // ── Signature fast-path ─────────────────────────────────────────────────
  const contentSig = hasContentSignature(normalizedSet);
  const insightsSig = hasInsightsSignature(normalizedSet);
  const audienceSig = hasAudienceSignature(normalizedSet);

  // Score all three families
  const contentScore = scoreFamily(
    normalizedInputs,
    "instagram_content_export",
    INSTAGRAM_CONTENT_CANONICAL_COLUMNS,
    INSTAGRAM_CONTENT_CRITICAL_COLUMNS,
    INSTAGRAM_CONTENT_ALIASES,
  );

  const insightsScore = scoreFamily(
    normalizedInputs,
    "instagram_insights_export",
    INSTAGRAM_INSIGHTS_CANONICAL_COLUMNS,
    INSTAGRAM_INSIGHTS_CRITICAL_COLUMNS,
    INSTAGRAM_INSIGHTS_ALIASES,
    INSTAGRAM_INSIGHTS_DIFFERENTIATOR_COLUMNS,
    0.10,
  );

  const audienceScore = scoreFamily(
    normalizedInputs,
    "instagram_audience_export",
    INSTAGRAM_AUDIENCE_CANONICAL_COLUMNS,
    INSTAGRAM_AUDIENCE_CRITICAL_COLUMNS,
    INSTAGRAM_AUDIENCE_ALIASES,
    INSTAGRAM_AUDIENCE_DIFFERENTIATOR_COLUMNS,
    0.15,
  );

  // ── Signature-driven disambiguation ─────────────────────────────────────
  // Content signature is strongest — if present and threshold met, classify immediately
  if (
    contentSig &&
    !insightsSig &&
    contentScore.critical_matched >= CONTENT_MIN_CRITICAL &&
    contentScore.confidence >= CONTENT_MIN_CONFIDENCE
  ) {
    return buildResult(contentScore, "instagram_content_export");
  }

  // Audience signature (followers / age buckets) beats insights
  if (
    audienceSig &&
    !contentSig &&
    !insightsSig &&
    audienceScore.critical_matched >= AUDIENCE_MIN_CRITICAL &&
    audienceScore.confidence >= AUDIENCE_MIN_CONFIDENCE
  ) {
    return buildResult(audienceScore, "instagram_audience_export");
  }

  // Insights signature
  if (
    insightsSig &&
    !contentSig &&
    !audienceSig &&
    insightsScore.critical_matched >= INSIGHTS_MIN_CRITICAL &&
    insightsScore.confidence >= INSIGHTS_MIN_CONFIDENCE
  ) {
    return buildResult(insightsScore, "instagram_insights_export");
  }

  // ── Mixed or no clear signature — pick highest-scoring family ───────────
  const candidates: FamilyScore[] = [];

  if (
    contentScore.critical_matched >= CONTENT_MIN_CRITICAL &&
    contentScore.confidence >= CONTENT_MIN_CONFIDENCE
  ) {
    candidates.push(contentScore);
  }
  if (
    insightsScore.critical_matched >= INSIGHTS_MIN_CRITICAL &&
    insightsScore.confidence >= INSIGHTS_MIN_CONFIDENCE
  ) {
    candidates.push(insightsScore);
  }
  if (
    audienceScore.critical_matched >= AUDIENCE_MIN_CRITICAL &&
    audienceScore.confidence >= AUDIENCE_MIN_CONFIDENCE
  ) {
    candidates.push(audienceScore);
  }

  if (candidates.length === 0) {
    return {
      detected_export_type: "unknown",
      confidence: Math.max(
        contentScore.confidence,
        insightsScore.confidence,
        audienceScore.confidence,
      ),
      matched_fields: [],
      missing_fields: [],
      critical_matched: 0,
      critical_total: 0,
      reason:
        normalizedInputs.length === 0
          ? "No headers provided."
          : "No recognised Instagram export columns found. " +
            "Confidence thresholds not met for any known Instagram export family.",
    };
  }

  // Sort: highest confidence first; content wins ties over insights/audience
  candidates.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) < 0.01) {
      // Tie-break: content > audience > insights (by specificity of engagement fields)
      const priority: Record<InstagramExportType, number> = {
        instagram_content_export: 3,
        instagram_audience_export: 2,
        instagram_insights_export: 1,
        unknown: 0,
      };
      return priority[b.exportType] - priority[a.exportType];
    }
    return b.confidence - a.confidence;
  });

  const winner = candidates[0];
  return buildResult(winner, winner.exportType as Exclude<InstagramExportType, "unknown">);
}

function buildResult(
  score: FamilyScore,
  exportType: Exclude<InstagramExportType, "unknown">,
): InstagramDetectionResult {
  const familyLabel: Record<Exclude<InstagramExportType, "unknown">, string> = {
    instagram_content_export: "Instagram Content export",
    instagram_insights_export: "Instagram Insights export",
    instagram_audience_export: "Instagram Audience export",
  };

  return {
    detected_export_type: exportType,
    confidence: score.confidence,
    matched_fields: score.matched_fields,
    missing_fields: score.missing_fields,
    critical_matched: score.critical_matched,
    critical_total: score.critical_total,
    reason:
      `Matched ${score.matched_fields.length} columns ` +
      `(${score.critical_matched}/${score.critical_total} critical). ` +
      `Confidence ${(score.confidence * 100).toFixed(0)}%. ` +
      `Classified as ${familyLabel[exportType]}.`,
  };
}

// ---------------------------------------------------------------------------
// Resolver helpers (for row normalisation)
// ---------------------------------------------------------------------------

export function resolveContentCanonical(
  normalized: string,
): InstagramContentCanonicalColumn | null {
  if ((INSTAGRAM_CONTENT_CANONICAL_COLUMNS as readonly string[]).includes(normalized)) {
    return normalized as InstagramContentCanonicalColumn;
  }
  return INSTAGRAM_CONTENT_ALIASES[normalized] ?? null;
}

export function resolveInsightsCanonical(
  normalized: string,
): InstagramInsightsCanonicalColumn | null {
  if ((INSTAGRAM_INSIGHTS_CANONICAL_COLUMNS as readonly string[]).includes(normalized)) {
    return normalized as InstagramInsightsCanonicalColumn;
  }
  return INSTAGRAM_INSIGHTS_ALIASES[normalized] ?? null;
}

export function resolveAudienceCanonical(
  normalized: string,
): InstagramAudienceCanonicalColumn | null {
  if ((INSTAGRAM_AUDIENCE_CANONICAL_COLUMNS as readonly string[]).includes(normalized)) {
    return normalized as InstagramAudienceCanonicalColumn;
  }
  return INSTAGRAM_AUDIENCE_ALIASES[normalized] ?? null;
}

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

/**
 * Validate a parsed Instagram CSV against its detected export family schema.
 *
 * States:
 *   - `invalid_schema`             — headers do not match any Instagram family
 *   - `empty_valid`                — valid content-export headers, zero data rows
 *   - `valid_with_rows`            — valid content-export headers with ≥1 data rows
 *   - `recognized_not_implemented` — valid insights or audience headers (RECOGNIZED families)
 *
 * @param rawHeaders  First row of the CSV, split by delimiter.
 * @param rowCount    Number of data rows (0 for header-only files).
 */
export function validateInstagramSchema(
  rawHeaders: string[],
  rowCount: number,
): InstagramSchemaValidationResult {
  const detection = detectInstagramExportType(rawHeaders);

  if (detection.detected_export_type === "unknown") {
    return {
      state: "invalid_schema",
      detected_export_type: "unknown",
      confidence: detection.confidence,
      matched_fields: detection.matched_fields,
      missing_fields: detection.missing_fields,
      reason:
        "The CSV headers do not match any known Instagram export format. " +
        "Please export directly from Instagram › Professional Dashboard › Insights, " +
        "or Meta Business Suite › Insights › Export.",
    };
  }

  // RECOGNIZED-only families return their honest state
  if (
    detection.detected_export_type === "instagram_insights_export" ||
    detection.detected_export_type === "instagram_audience_export"
  ) {
    const label =
      detection.detected_export_type === "instagram_insights_export"
        ? "Insights"
        : "Audience";
    return {
      state: "recognized_not_implemented",
      detected_export_type: detection.detected_export_type,
      confidence: detection.confidence,
      matched_fields: detection.matched_fields,
      missing_fields: detection.missing_fields,
      reason:
        `Recognised as Instagram ${label} export (confidence ${(detection.confidence * 100).toFixed(0)}%). ` +
        `Full ingestion for this export family is not yet implemented. ` +
        `Your file has been received and will be supported in a future update.`,
    };
  }

  // instagram_content_export is SUPPORTED
  if (rowCount === 0) {
    return {
      state: "empty_valid",
      detected_export_type: "instagram_content_export",
      confidence: detection.confidence,
      matched_fields: detection.matched_fields,
      missing_fields: detection.missing_fields,
      reason:
        "Valid Instagram Content export schema detected, but the file contains no data rows. " +
        "This will be ingested as an empty content snapshot.",
    };
  }

  return {
    state: "valid_with_rows",
    detected_export_type: "instagram_content_export",
    confidence: detection.confidence,
    matched_fields: detection.matched_fields,
    missing_fields: detection.missing_fields,
    reason:
      `Valid Instagram Content export: ${detection.matched_fields.length} columns matched, ` +
      `${rowCount} data row(s).`,
  };
}
