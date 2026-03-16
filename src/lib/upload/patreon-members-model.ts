/**
 * Normalized internal model for a native Patreon Members CSV export.
 *
 * Used by downstream analytics once the backend persists the ingested rows.
 * The frontend uses this for type-safe display and pre-upload validation results.
 */

import { normalizeHeader, resolveToCanonical } from "./patreon-csv-detector";

// ---------------------------------------------------------------------------
// Row model
// ---------------------------------------------------------------------------

/**
 * Typed representation of a single row in a Patreon Members export.
 * All optional fields map to `null` when the source cell is blank.
 */
export interface PatreonMembersExportRow {
  // ── Identity ──────────────────────────────────────────────────────────────
  name: string;
  email: string;
  userId: string;
  discord: string | null;

  // ── Membership status ─────────────────────────────────────────────────────
  /** e.g. "Active patron", "Former patron", "Declined patron" */
  patronStatus: string;
  /** Whether the creator follows this patron back on Patreon. */
  followsYou: boolean | null;
  freeMember: boolean | null;
  freeTrial: boolean | null;
  tier: string | null;
  subscriptionSource: string | null;

  // ── Financial ─────────────────────────────────────────────────────────────
  /** Total historical pledge amount in `currency`. */
  lifetimeAmount: number | null;
  /** Current recurring pledge amount in `currency`. */
  pledgeAmount: number | null;
  /** "monthly" | "annual" | other platform values. */
  chargeFrequency: string | null;
  /** ISO 4217 currency code, e.g. "USD". */
  currency: string | null;
  maxPosts: number | null;

  // ── Dates ─────────────────────────────────────────────────────────────────
  /** ISO date string: when the patron first pledged. */
  patronageSinceDate: string | null;
  /** ISO date string: most recent successful charge. */
  lastChargeDate: string | null;
  /** ISO date string: when the patron record was last modified. */
  lastUpdated: string | null;
  /** ISO date string: next scheduled charge. */
  nextChargeDate: string | null;
  /** ISO date string: when access to exclusive content expires. */
  accessExpiration: string | null;

  // ── Charge info ───────────────────────────────────────────────────────────
  /** e.g. "Paid", "Declined", "Refunded" */
  lastChargeStatus: string | null;

  // ── Address ───────────────────────────────────────────────────────────────
  addressee: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  /** Raw country value as exported (often 2-letter code). */
  country: string | null;
  /** Full English country name. */
  fullCountryName: string | null;
  phone: string | null;

  // ── Miscellaneous ─────────────────────────────────────────────────────────
  additionalDetails: string | null;

  // ── Traceability ─────────────────────────────────────────────────────────
  /** Raw key→value map preserved from the source CSV row for debugging. */
  _raw: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Snapshot model
// ---------------------------------------------------------------------------

/**
 * A point-in-time snapshot from a Patreon Members CSV export.
 * Contains metadata about the file plus all normalised rows.
 */
export interface PatreonMembersSnapshot {
  exportType: "patreon_members_export";
  /** Number of data rows (excluding header). */
  rowCount: number;
  rows: PatreonMembersExportRow[];
  /** Raw header strings from the source file. */
  headers: string[];
  /** ISO 8601 timestamp of when this snapshot was parsed. */
  detectedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function nullableBoolean(value: string): boolean | null {
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "yes" || v === "1") return true;
  if (v === "false" || v === "no" || v === "0") return false;
  return null;
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
 * `PatreonMembersExportRow`, resolving header aliases and normalising values.
 *
 * Unknown columns are silently preserved in `_raw` for traceability.
 *
 * @param rawRow  Object mapping raw CSV column header → cell value string.
 */
export function normalizePatreonMembersRow(rawRow: Record<string, string>): PatreonMembersExportRow {
  // Build a canonical-key → raw-value lookup
  const canonical: Partial<Record<string, string>> = {};
  for (const [rawKey, rawValue] of Object.entries(rawRow)) {
    const resolved = resolveToCanonical(normalizeHeader(rawKey));
    if (resolved !== null) {
      // First occurrence wins (in case of duplicate aliases)
      if (!(resolved in canonical)) {
        canonical[resolved] = rawValue;
      }
    }
  }

  const get = (col: string): string => canonical[col] ?? "";

  return {
    name: get("name").trim(),
    email: get("email").trim(),
    userId: get("user id").trim(),
    discord: nullable(get("discord")),

    patronStatus: get("patron status").trim(),
    followsYou: nullableBoolean(get("follows you")),
    freeMember: nullableBoolean(get("free member")),
    freeTrial: nullableBoolean(get("free trial")),
    tier: nullable(get("tier")),
    subscriptionSource: nullable(get("subscription source")),

    lifetimeAmount: nullableNumber(get("lifetime amount")),
    pledgeAmount: nullableNumber(get("pledge amount")),
    chargeFrequency: nullable(get("charge frequency")),
    currency: nullable(get("currency")),
    maxPosts: nullableNumber(get("max posts")),

    patronageSinceDate: nullable(get("patronage since date")),
    lastChargeDate: nullable(get("last charge date")),
    lastUpdated: nullable(get("last updated")),
    nextChargeDate: nullable(get("next charge date")),
    accessExpiration: nullable(get("access expiration")),

    lastChargeStatus: nullable(get("last charge status")),

    addressee: nullable(get("addressee")),
    street: nullable(get("street")),
    city: nullable(get("city")),
    state: nullable(get("state")),
    zip: nullable(get("zip")),
    country: nullable(get("country")),
    fullCountryName: nullable(get("full country name")),
    phone: nullable(get("phone")),

    additionalDetails: nullable(get("additional details")),

    _raw: { ...rawRow },
  };
}

// ---------------------------------------------------------------------------
// Snapshot builder
// ---------------------------------------------------------------------------

/**
 * Parse an array of raw CSV rows (each a Record<header, value>) into a typed
 * `PatreonMembersSnapshot`.  The header row should NOT be included in `rows`.
 *
 * @param headers  Raw header strings from the first CSV line.
 * @param rows     Data rows as raw string maps.
 */
export function buildPatreonMembersSnapshot(
  headers: string[],
  rows: Record<string, string>[],
): PatreonMembersSnapshot {
  return {
    exportType: "patreon_members_export",
    rowCount: rows.length,
    rows: rows.map(normalizePatreonMembersRow),
    headers,
    detectedAt: new Date().toISOString(),
  };
}
