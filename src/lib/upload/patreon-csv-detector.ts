/**
 * Client-side detector for native Patreon Members CSV exports.
 *
 * Patreon offers two structurally different CSV exports:
 *   - patreon_members_export  : the native "Members" export (30 columns, this file)
 *   - patreon_monthly_rollup  : a custom aggregated export (Date, Type, From Supporter, …)
 *
 * This module inspects CSV header rows and classifies which format is present so the
 * upload pipeline can route to the correct backend validator.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All 30 canonical column headers in a native Patreon Members export. */
export const PATREON_MEMBERS_CANONICAL_COLUMNS = [
  "name",
  "email",
  "discord",
  "patron status",
  "follows you",
  "free member",
  "free trial",
  "lifetime amount",
  "pledge amount",
  "charge frequency",
  "tier",
  "addressee",
  "street",
  "city",
  "state",
  "zip",
  "country",
  "phone",
  "patronage since date",
  "last charge date",
  "last charge status",
  "additional details",
  "user id",
  "last updated",
  "currency",
  "max posts",
  "access expiration",
  "next charge date",
  "full country name",
  "subscription source",
] as const;

export type PatreonMembersCanonicalColumn = (typeof PATREON_MEMBERS_CANONICAL_COLUMNS)[number];

/**
 * Subset of columns whose presence strongly indicates a Patreon Members export.
 * Weighted 2× in confidence scoring.
 */
export const PATREON_MEMBERS_CRITICAL_COLUMNS = new Set<PatreonMembersCanonicalColumn>([
  "patron status",
  "patronage since date",
  "last charge date",
  "last charge status",
  "user id",
  "pledge amount",
  "lifetime amount",
  "charge frequency",
]);

/** Minimum number of critical columns required to accept as members export. */
const MIN_CRITICAL_COLUMNS = 4;

/** Minimum confidence (0–1) required to accept as members export. */
const MIN_CONFIDENCE = 0.4;

/**
 * Headers that uniquely identify the legacy Patreon monthly-rollup format.
 * Their presence means this is NOT a members export.
 */
const MONTHLY_ROLLUP_SIGNATURE_COLUMNS = new Set(["from supporter", "to creator"]);

/**
 * Alias map: normalised input string → canonical column name.
 * Handles common underscore, case, and punctuation variations.
 */
const HEADER_ALIASES: Record<string, PatreonMembersCanonicalColumn> = {
  patron_status: "patron status",
  patronstatus: "patron status",
  "membership status": "patron status",
  "member status": "patron status",
  patronage_since_date: "patronage since date",
  patron_since: "patronage since date",
  "patron since": "patronage since date",
  "member since": "patronage since date",
  "member since date": "patronage since date",
  patronagesince: "patronage since date",
  last_charge_date: "last charge date",
  lastchargedate: "last charge date",
  last_charge_status: "last charge status",
  lastchargestatus: "last charge status",
  user_id: "user id",
  userid: "user id",
  "patreon user id": "user id",
  pledge_amount: "pledge amount",
  pledgeamount: "pledge amount",
  "monthly pledge": "pledge amount",
  lifetime_amount: "lifetime amount",
  lifetimeamount: "lifetime amount",
  "total pledged": "lifetime amount",
  charge_frequency: "charge frequency",
  chargefrequency: "charge frequency",
  billing_frequency: "charge frequency",
  subscription_source: "subscription source",
  subscriptionsource: "subscription source",
  full_country_name: "full country name",
  fullcountryname: "full country name",
  "country name": "full country name",
  next_charge_date: "next charge date",
  nextchargedate: "next charge date",
  access_expiration: "access expiration",
  accessexpiration: "access expiration",
  "expiration date": "access expiration",
  max_posts: "max posts",
  maxposts: "max posts",
  additional_details: "additional details",
  additionaldetails: "additional details",
  follows_you: "follows you",
  followsyou: "follows you",
  free_member: "free member",
  freemember: "free member",
  free_trial: "free trial",
  freetrial: "free trial",
  last_updated: "last updated",
  lastupdated: "last updated",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PatreonExportType = "patreon_members_export" | "patreon_monthly_rollup" | "unknown";

export interface PatreonDetectionResult {
  /** Classified export type. */
  detected_export_type: PatreonExportType;
  /**
   * Confidence score in [0, 1].
   * ≥ 0.8 = high confidence, ≥ 0.5 = medium, < 0.5 = low/inconclusive.
   */
  confidence: number;
  /** Canonical column names that were successfully matched. */
  matched_fields: string[];
  /** Canonical column names that were NOT found in the input. */
  missing_fields: string[];
  /** Number of critical columns that were matched. */
  critical_matched: number;
  /** Total number of critical columns. */
  critical_total: number;
  /** Human-readable explanation of the decision. */
  reason: string;
}

export type PatreonSchemaState = "invalid_schema" | "empty_valid" | "valid_with_rows";

export interface PatreonSchemaValidationResult {
  /** Structural classification of this CSV. */
  state: PatreonSchemaState;
  detected_export_type: PatreonExportType;
  confidence: number;
  matched_fields: string[];
  missing_fields: string[];
  /**
   * Human-readable reason surfaced in UI error messages and diagnostics.
   * Also used as the value of `detected_export_type` label in status responses.
   */
  reason: string;
}

// ---------------------------------------------------------------------------
// Header normalisation
// ---------------------------------------------------------------------------

/**
 * Normalise a raw CSV header string for comparison.
 * Lowercases, trims, collapses whitespace, removes most punctuation while
 * keeping spaces so multi-word names survive.
 */
export function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, " ") // underscores and dashes → space
    .replace(/\s+/g, " ") // collapse whitespace
    .replace(/[^a-z0-9 ]/g, "") // strip non-alphanumeric (except space)
    .trim();
}

/**
 * Resolve a normalised header to its canonical column name, applying aliases
 * where necessary.  Returns `null` if no match is found.
 */
export function resolveToCanonical(normalized: string): PatreonMembersCanonicalColumn | null {
  // Direct match against canonical set
  if ((PATREON_MEMBERS_CANONICAL_COLUMNS as readonly string[]).includes(normalized)) {
    return normalized as PatreonMembersCanonicalColumn;
  }
  // Alias lookup
  return HEADER_ALIASES[normalized] ?? null;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Inspect a list of raw CSV header strings and classify the Patreon export type.
 *
 * Does NOT require exact header order.
 * Accepts case, whitespace, and punctuation variations via normaliseHeader + alias map.
 *
 * @param rawHeaders  First row of a CSV file, split by comma.
 */
export function detectPatreonExportType(rawHeaders: string[]): PatreonDetectionResult {
  const normalizedInputs = rawHeaders.map(normalizeHeader);

  // ── Fast-path: monthly rollup signature detection ──────────────────────
  const hasRollupSignature = normalizedInputs.some((h) => MONTHLY_ROLLUP_SIGNATURE_COLUMNS.has(h));
  if (hasRollupSignature) {
    return {
      detected_export_type: "patreon_monthly_rollup",
      confidence: 0.95,
      matched_fields: normalizedInputs.filter((h) => MONTHLY_ROLLUP_SIGNATURE_COLUMNS.has(h)),
      missing_fields: Array.from(PATREON_MEMBERS_CANONICAL_COLUMNS),
      critical_matched: 0,
      critical_total: PATREON_MEMBERS_CRITICAL_COLUMNS.size,
      reason:
        "Detected legacy Patreon monthly-rollup format (contains 'From Supporter' / 'To Creator' columns). " +
        "This format is not the native Members export.",
    };
  }

  // ── Members export detection ─────────────────────────────────────────
  const matchedCanonical = new Set<PatreonMembersCanonicalColumn>();

  for (const normalized of normalizedInputs) {
    const canonical = resolveToCanonical(normalized);
    if (canonical !== null) {
      matchedCanonical.add(canonical);
    }
  }

  const matched_fields = Array.from(matchedCanonical);
  const missing_fields = PATREON_MEMBERS_CANONICAL_COLUMNS.filter((c) => !matchedCanonical.has(c));

  const criticalMatched = matched_fields.filter((f) =>
    PATREON_MEMBERS_CRITICAL_COLUMNS.has(f as PatreonMembersCanonicalColumn),
  ).length;
  const criticalTotal = PATREON_MEMBERS_CRITICAL_COLUMNS.size;

  // Weighted confidence: critical columns count double
  const criticalScore = criticalMatched * 2;
  const nonCriticalMatched = matched_fields.length - criticalMatched;
  const maxScore = criticalTotal * 2 + (PATREON_MEMBERS_CANONICAL_COLUMNS.length - criticalTotal);
  const confidence = maxScore > 0 ? (criticalScore + nonCriticalMatched) / maxScore : 0;

  const isAccepted = criticalMatched >= MIN_CRITICAL_COLUMNS && confidence >= MIN_CONFIDENCE;

  if (isAccepted) {
    const totalCols = PATREON_MEMBERS_CANONICAL_COLUMNS.length;
    return {
      detected_export_type: "patreon_members_export",
      confidence: Math.min(confidence, 1),
      matched_fields,
      missing_fields,
      critical_matched: criticalMatched,
      critical_total: criticalTotal,
      reason:
        `Matched ${matched_fields.length}/${totalCols} columns (${criticalMatched}/${criticalTotal} critical). ` +
        `Confidence ${(confidence * 100).toFixed(0)}%. Classified as native Patreon Members export.`,
    };
  }

  return {
    detected_export_type: "unknown",
    confidence: Math.min(confidence, 1),
    matched_fields,
    missing_fields,
    critical_matched: criticalMatched,
    critical_total: criticalTotal,
    reason:
      matched_fields.length === 0
        ? "No recognisable Patreon Members export columns found."
        : `Only ${criticalMatched}/${criticalTotal} critical columns matched (minimum ${MIN_CRITICAL_COLUMNS} required). ` +
          `Confidence ${(confidence * 100).toFixed(0)}% (minimum ${(MIN_CONFIDENCE * 100).toFixed(0)}% required). ` +
          "Cannot confidently classify as Patreon Members export.",
  };
}

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

/**
 * Validate a parsed Patreon CSV against the members-export schema.
 *
 * Distinguishes three states:
 *   - `invalid_schema`  — headers do not match the members-export format
 *   - `empty_valid`     — valid headers but zero data rows (header-only file)
 *   - `valid_with_rows` — valid headers and ≥1 data rows
 *
 * @param rawHeaders  First row of the CSV, split by comma.
 * @param rowCount    Number of data rows (excluding the header row). Pass 0 for header-only files.
 */
export function validatePatreonMembersSchema(rawHeaders: string[], rowCount: number): PatreonSchemaValidationResult {
  const detection = detectPatreonExportType(rawHeaders);

  if (detection.detected_export_type !== "patreon_members_export") {
    const reason =
      detection.detected_export_type === "patreon_monthly_rollup"
        ? "This file matches the legacy Patreon monthly-rollup format, not the native Members export. " +
          "Please export from Patreon › Audience › Members › Export CSV."
        : detection.reason ||
          "The CSV headers do not match the Patreon Members export schema. " +
          "Please use the native export from Patreon › Audience › Members › Export CSV.";

    return {
      state: "invalid_schema",
      detected_export_type: detection.detected_export_type,
      confidence: detection.confidence,
      matched_fields: detection.matched_fields,
      missing_fields: detection.missing_fields,
      reason,
    };
  }

  if (rowCount === 0) {
    return {
      state: "empty_valid",
      detected_export_type: "patreon_members_export",
      confidence: detection.confidence,
      matched_fields: detection.matched_fields,
      missing_fields: detection.missing_fields,
      reason:
        "Valid Patreon Members export schema detected, but the file contains no data rows. " +
        "This will be ingested as an empty member snapshot.",
    };
  }

  return {
    state: "valid_with_rows",
    detected_export_type: "patreon_members_export",
    confidence: detection.confidence,
    matched_fields: detection.matched_fields,
    missing_fields: detection.missing_fields,
    reason: `Valid Patreon Members export: ${detection.matched_fields.length} columns matched, ${rowCount} data row(s).`,
  };
}
