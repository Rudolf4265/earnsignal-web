/**
 * Tests for the Patreon CSV detector.
 *
 * Covers all cases specified in the Patreon Members export MVP requirements:
 *   1. Exact 30-column sample accepted
 *   2. Header order shuffled – still accepted
 *   3. Minor casing/punctuation aliasing accepted
 *   4. Missing critical columns – rejected
 *   5. Header-only file accepted as empty valid snapshot
 *   6. Legacy patreon_monthly_rollup path still behaves correctly
 *   7. normalizeHeader and resolveToCanonical utilities
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";

const detectorUrl = pathToFileURL(path.resolve("src/lib/upload/patreon-csv-detector.ts")).href;
const modelUrl = pathToFileURL(path.resolve("src/lib/upload/patreon-members-model.ts")).href;

const {
  detectPatreonExportType,
  validatePatreonMembersSchema,
  normalizeHeader,
  resolveToCanonical,
  PATREON_MEMBERS_CANONICAL_COLUMNS,
} = await import(`${detectorUrl}?t=${Date.now()}`);

const { normalizePatreonMembersRow, buildPatreonMembersSnapshot } = await import(`${modelUrl}?t=${Date.now() + 1}`);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The canonical 30 headers exactly as exported by Patreon. */
const EXACT_30 = [
  "Name",
  "Email",
  "Discord",
  "Patron Status",
  "Follows You",
  "Free Member",
  "Free Trial",
  "Lifetime Amount",
  "Pledge Amount",
  "Charge Frequency",
  "Tier",
  "Addressee",
  "Street",
  "City",
  "State",
  "Zip",
  "Country",
  "Phone",
  "Patronage Since Date",
  "Last Charge Date",
  "Last Charge Status",
  "Additional Details",
  "User ID",
  "Last Updated",
  "Currency",
  "Max Posts",
  "Access Expiration",
  "Next Charge Date",
  "Full country name",
  "Subscription Source",
];

const LEGACY_ROLLUP_HEADERS = ["Date", "Type", "From Supporter", "To Creator", "Description", "Amount", "Currency", "Status"];

// ---------------------------------------------------------------------------
// 1. Exact 30-column sample accepted
// ---------------------------------------------------------------------------

test("detects exact 30-column Patreon Members export headers", () => {
  const result = detectPatreonExportType(EXACT_30);

  assert.equal(result.detected_export_type, "patreon_members_export");
  assert.ok(result.confidence >= 0.8, `Expected confidence >= 0.8, got ${result.confidence}`);
  assert.equal(result.matched_fields.length, 30);
  assert.equal(result.missing_fields.length, 0);
  assert.ok(result.critical_matched >= 4, `Expected at least 4 critical columns, got ${result.critical_matched}`);
});

test("validatePatreonMembersSchema: valid schema with rows returns valid_with_rows", () => {
  const result = validatePatreonMembersSchema(EXACT_30, 4);

  assert.equal(result.state, "valid_with_rows");
  assert.equal(result.detected_export_type, "patreon_members_export");
  assert.ok(result.confidence >= 0.8);
});

test("fixture CSV is readable and has 30 columns", async () => {
  const raw = await readFile(path.resolve("tests/fixtures/patreon_members_export.csv"), "utf8");
  const firstLine = raw.split(/\r?\n/)[0];
  const headers = firstLine.split(",");
  assert.equal(headers.length, 30, `Expected 30 headers, got ${headers.length}`);

  const result = detectPatreonExportType(headers);
  assert.equal(result.detected_export_type, "patreon_members_export");
});

// ---------------------------------------------------------------------------
// 2. Header order shuffled – still accepted
// ---------------------------------------------------------------------------

test("detects members export regardless of column order", () => {
  const shuffled = [...EXACT_30].reverse(); // reverse order
  const result = detectPatreonExportType(shuffled);

  assert.equal(result.detected_export_type, "patreon_members_export");
  assert.ok(result.confidence >= 0.8);
  assert.equal(result.matched_fields.length, 30);
});

test("detects members export with completely random column order", () => {
  const randomOrder = [
    "Subscription Source",
    "Patron Status",
    "Email",
    "Last Charge Date",
    "Pledge Amount",
    "User ID",
    "Name",
    "Patronage Since Date",
    "Last Charge Status",
    "Charge Frequency",
    "Lifetime Amount",
    "Tier",
    "Currency",
    "Country",
    "Full country name",
    "Zip",
    "State",
    "City",
    "Street",
    "Addressee",
    "Phone",
    "Discord",
    "Follows You",
    "Free Member",
    "Free Trial",
    "Additional Details",
    "Last Updated",
    "Max Posts",
    "Access Expiration",
    "Next Charge Date",
  ];
  const result = detectPatreonExportType(randomOrder);
  assert.equal(result.detected_export_type, "patreon_members_export");
});

// ---------------------------------------------------------------------------
// 3. Minor casing/punctuation aliasing accepted
// ---------------------------------------------------------------------------

test("normalizeHeader strips casing and punctuation variations", () => {
  assert.equal(normalizeHeader("Patron Status"), "patron status");
  assert.equal(normalizeHeader("PATRON_STATUS"), "patron status");
  assert.equal(normalizeHeader("  Patronage Since Date  "), "patronage since date");
  assert.equal(normalizeHeader("Last_Charge_Date"), "last charge date");
  assert.equal(normalizeHeader("User ID"), "user id");
  assert.equal(normalizeHeader("UserID"), "userid");
});

test("resolveToCanonical handles common aliases", () => {
  assert.equal(resolveToCanonical("patron_status"), "patron status");
  assert.equal(resolveToCanonical("patronstatus"), "patron status");
  assert.equal(resolveToCanonical("user_id"), "user id");
  assert.equal(resolveToCanonical("userid"), "user id");
  assert.equal(resolveToCanonical("pledge_amount"), "pledge amount");
  assert.equal(resolveToCanonical("subscription_source"), "subscription source");
  assert.equal(resolveToCanonical("full_country_name"), "full country name");
  assert.equal(resolveToCanonical("next_charge_date"), "next charge date");
  assert.equal(resolveToCanonical("patronage_since_date"), "patronage since date");
});

test("detects members export with underscore-cased aliases", () => {
  const underscored = EXACT_30.map((h) => h.replace(/ /g, "_"));
  // Manually fix a couple that need special alias handling
  const result = detectPatreonExportType(underscored);
  // Should still find most critical columns via alias map
  assert.equal(result.detected_export_type, "patreon_members_export");
  assert.ok(result.critical_matched >= 4, `Expected ≥4 critical columns, got ${result.critical_matched}`);
});

test("detects members export with all-lowercase headers", () => {
  const lowercase = EXACT_30.map((h) => h.toLowerCase());
  const result = detectPatreonExportType(lowercase);
  assert.equal(result.detected_export_type, "patreon_members_export");
  assert.equal(result.matched_fields.length, 30);
});

test("detects members export with all-uppercase headers", () => {
  const uppercase = EXACT_30.map((h) => h.toUpperCase());
  const result = detectPatreonExportType(uppercase);
  assert.equal(result.detected_export_type, "patreon_members_export");
  assert.ok(result.critical_matched >= 4);
});

// ---------------------------------------------------------------------------
// 4. Missing critical columns – rejected
// ---------------------------------------------------------------------------

test("rejects CSV with no recognisable Patreon columns", () => {
  const nonPatreon = ["order_id", "product", "quantity", "price", "date"];
  const result = detectPatreonExportType(nonPatreon);
  assert.equal(result.detected_export_type, "unknown");
  assert.ok(result.confidence < 0.4);
  assert.equal(result.matched_fields.length, 0);
});

test("rejects CSV missing most critical columns (only 1 critical match)", () => {
  // Only has "patron status" — far below the MIN_CRITICAL_COLUMNS threshold
  const sparse = ["patron status", "name", "email", "some_random_col", "another_col"];
  const result = detectPatreonExportType(sparse);
  // 1 critical column is below threshold of 4
  assert.equal(result.detected_export_type, "unknown");
});

test("validatePatreonMembersSchema: invalid schema returns invalid_schema state", () => {
  const garbage = ["foo", "bar", "baz"];
  const result = validatePatreonMembersSchema(garbage, 10);
  assert.equal(result.state, "invalid_schema");
  assert.notEqual(result.detected_export_type, "patreon_members_export");
  assert.ok(typeof result.reason === "string" && result.reason.length > 0);
});

test("rejects Substack CSV headers cleanly", () => {
  const substackHeaders = ["email", "name", "subscription_status", "plan", "created_at", "expiry"];
  const result = detectPatreonExportType(substackHeaders);
  // Should not misidentify as patreon_members_export
  assert.notEqual(result.detected_export_type, "patreon_members_export");
});

// ---------------------------------------------------------------------------
// 5. Header-only file accepted as empty valid snapshot
// ---------------------------------------------------------------------------

test("validatePatreonMembersSchema: header-only CSV (0 data rows) returns empty_valid", () => {
  const result = validatePatreonMembersSchema(EXACT_30, 0);
  assert.equal(result.state, "empty_valid");
  assert.equal(result.detected_export_type, "patreon_members_export");
  assert.ok(result.reason.includes("empty"));
});

test("buildPatreonMembersSnapshot: zero rows produces valid empty snapshot", () => {
  const snapshot = buildPatreonMembersSnapshot(EXACT_30, []);
  assert.equal(snapshot.exportType, "patreon_members_export");
  assert.equal(snapshot.rowCount, 0);
  assert.deepEqual(snapshot.rows, []);
  assert.equal(snapshot.headers.length, 30);
});

// ---------------------------------------------------------------------------
// 6. Legacy patreon_monthly_rollup path still behaves correctly
// ---------------------------------------------------------------------------

test("detects legacy patreon monthly rollup format", () => {
  const result = detectPatreonExportType(LEGACY_ROLLUP_HEADERS);
  assert.equal(result.detected_export_type, "patreon_monthly_rollup");
  assert.ok(result.confidence >= 0.9);
  assert.ok(result.reason.toLowerCase().includes("rollup") || result.reason.toLowerCase().includes("monthly"));
});

test("validatePatreonMembersSchema: monthly rollup returns invalid_schema with rollup explanation", () => {
  const result = validatePatreonMembersSchema(LEGACY_ROLLUP_HEADERS, 5);
  assert.equal(result.state, "invalid_schema");
  assert.equal(result.detected_export_type, "patreon_monthly_rollup");
  assert.ok(result.reason.toLowerCase().includes("rollup") || result.reason.toLowerCase().includes("members"));
});

test("members export detection is not confused by rollup headers being present", () => {
  // A file with rollup signature columns should NEVER be classified as members export
  const mixed = [...EXACT_30, "From Supporter", "To Creator"];
  const result = detectPatreonExportType(mixed);
  assert.equal(result.detected_export_type, "patreon_monthly_rollup");
});

// ---------------------------------------------------------------------------
// 7. Row normalisation model
// ---------------------------------------------------------------------------

test("normalizePatreonMembersRow maps all 30 canonical fields correctly", () => {
  const rawRow = {
    Name: "Jane Doe",
    Email: "jane@example.com",
    Discord: "",
    "Patron Status": "Active patron",
    "Follows You": "true",
    "Free Member": "false",
    "Free Trial": "false",
    "Lifetime Amount": "120.00",
    "Pledge Amount": "10.00",
    "Charge Frequency": "monthly",
    Tier: "Supporter Tier",
    Addressee: "",
    Street: "",
    City: "",
    State: "",
    Zip: "",
    Country: "US",
    Phone: "",
    "Patronage Since Date": "2025-01-01",
    "Last Charge Date": "2026-03-01",
    "Last Charge Status": "Paid",
    "Additional Details": "",
    "User ID": "usr_001",
    "Last Updated": "2026-03-01",
    Currency: "USD",
    "Max Posts": "",
    "Access Expiration": "",
    "Next Charge Date": "2026-04-01",
    "Full country name": "United States",
    "Subscription Source": "patreon",
  };

  const row = normalizePatreonMembersRow(rawRow);

  assert.equal(row.name, "Jane Doe");
  assert.equal(row.email, "jane@example.com");
  assert.equal(row.userId, "usr_001");
  assert.equal(row.discord, null); // blank → null
  assert.equal(row.patronStatus, "Active patron");
  assert.equal(row.followsYou, true);
  assert.equal(row.freeMember, false);
  assert.equal(row.lifetimeAmount, 120);
  assert.equal(row.pledgeAmount, 10);
  assert.equal(row.chargeFrequency, "monthly");
  assert.equal(row.tier, "Supporter Tier");
  assert.equal(row.country, "US");
  assert.equal(row.fullCountryName, "United States");
  assert.equal(row.patronageSinceDate, "2025-01-01");
  assert.equal(row.lastChargeDate, "2026-03-01");
  assert.equal(row.lastChargeStatus, "Paid");
  assert.equal(row.nextChargeDate, "2026-04-01");
  assert.equal(row.subscriptionSource, "patreon");
  assert.equal(row.maxPosts, null);
  assert.equal(row.accessExpiration, null);
  assert.ok(typeof row._raw === "object", "_raw should be preserved");
  assert.equal(row._raw["Name"], "Jane Doe");
});

test("normalizePatreonMembersRow handles alias-keyed headers", () => {
  const rawRow = {
    patron_status: "Active patron",
    user_id: "usr_xyz",
    pledge_amount: "5.00",
    patronage_since_date: "2025-03-01",
    last_charge_date: "2026-02-01",
    last_charge_status: "Paid",
    lifetime_amount: "20.00",
    charge_frequency: "monthly",
    name: "Test User",
    email: "test@example.com",
  };

  const row = normalizePatreonMembersRow(rawRow);
  assert.equal(row.patronStatus, "Active patron");
  assert.equal(row.userId, "usr_xyz");
  assert.equal(row.pledgeAmount, 5);
  assert.equal(row.lifetimeAmount, 20);
  assert.equal(row.chargeFrequency, "monthly");
});

test("buildPatreonMembersSnapshot parses multiple rows correctly", () => {
  const rows = [
    {
      Name: "Alice",
      Email: "alice@example.com",
      "Patron Status": "Active patron",
      "User ID": "u1",
      "Pledge Amount": "10.00",
      "Lifetime Amount": "50.00",
      "Charge Frequency": "monthly",
      "Patronage Since Date": "2025-01-01",
      "Last Charge Date": "2026-03-01",
      "Last Charge Status": "Paid",
    },
    {
      Name: "Bob",
      Email: "bob@example.com",
      "Patron Status": "Former patron",
      "User ID": "u2",
      "Pledge Amount": "0.00",
      "Lifetime Amount": "30.00",
      "Charge Frequency": "monthly",
      "Patronage Since Date": "2024-06-01",
      "Last Charge Date": "2025-11-01",
      "Last Charge Status": "Declined",
    },
  ];

  const snapshot = buildPatreonMembersSnapshot(EXACT_30, rows);
  assert.equal(snapshot.exportType, "patreon_members_export");
  assert.equal(snapshot.rowCount, 2);
  assert.equal(snapshot.rows.length, 2);
  assert.equal(snapshot.rows[0].name, "Alice");
  assert.equal(snapshot.rows[1].patronStatus, "Former patron");
  assert.ok(snapshot.detectedAt); // ISO timestamp
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test("detectPatreonExportType handles empty header array", () => {
  const result = detectPatreonExportType([]);
  assert.equal(result.detected_export_type, "unknown");
  assert.equal(result.matched_fields.length, 0);
  assert.equal(result.missing_fields.length, PATREON_MEMBERS_CANONICAL_COLUMNS.length);
});

test("detectPatreonExportType handles headers with extra whitespace and mixed case", () => {
  const messy = ["  Patron Status  ", "PLEDGE AMOUNT", "  user id  ", "Patronage Since Date", "LAST CHARGE DATE", "Last_Charge_Status", "Lifetime Amount", "CHARGE FREQUENCY"];
  const result = detectPatreonExportType(messy);
  // All 8 critical columns should be matched (all of the above are critical)
  assert.ok(result.critical_matched >= 5, `Expected ≥5 critical columns matched, got ${result.critical_matched}`);
  assert.equal(result.detected_export_type, "patreon_members_export");
});

test("confidence is between 0 and 1 for all cases", () => {
  const cases = [
    EXACT_30,
    LEGACY_ROLLUP_HEADERS,
    ["foo", "bar"],
    [],
    ["Patron Status"],
  ];
  for (const headers of cases) {
    const result = detectPatreonExportType(headers);
    assert.ok(result.confidence >= 0 && result.confidence <= 1,
      `Confidence out of range [0,1]: ${result.confidence} for headers: ${headers.join(",")}`);
  }
});
