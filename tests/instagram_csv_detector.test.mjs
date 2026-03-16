/**
 * Tests for the Instagram CSV detector and content row model.
 *
 * Coverage:
 *   1.  Exact content export headers detected correctly
 *   2.  Exact insights export headers detected correctly
 *   3.  Exact audience export headers detected correctly
 *   4.  Header order independence
 *   5.  Case / whitespace / punctuation / BOM tolerance
 *   6.  Alias variations accepted
 *   7.  Disambiguation: content vs insights vs audience
 *   8.  Wrong platform_hint does not misroute (Patreon/Substack/YouTube reject)
 *   9.  Instagram exports do not misclassify as Patreon/Substack
 *   10. Schema validation states: valid_with_rows, empty_valid, invalid_schema, recognized_not_implemented
 *   11. Row normalisation: canonical field mapping, alias keys, missing optional fields
 *   12. Snapshot builder: empty and populated
 *   13. Capability flags derived from present headers
 *   14. Analytics summary computation
 *   15. Fixture CSV files are parseable and detected correctly
 *   16. Confidence is always in [0, 1]
 *   17. Regression: Patreon / insights / audience flows unaffected
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";

const detectorUrl = pathToFileURL(
  path.resolve("src/lib/upload/instagram-csv-detector.ts"),
).href;
const modelUrl = pathToFileURL(
  path.resolve("src/lib/upload/instagram-content-model.ts"),
).href;

const {
  detectInstagramExportType,
  validateInstagramSchema,
  normalizeHeader,
  resolveContentCanonical,
  resolveInsightsCanonical,
  resolveAudienceCanonical,
  INSTAGRAM_CONTENT_CANONICAL_COLUMNS,
  INSTAGRAM_INSIGHTS_CANONICAL_COLUMNS,
  INSTAGRAM_AUDIENCE_CANONICAL_COLUMNS,
} = await import(`${detectorUrl}?t=${Date.now()}`);

const {
  normalizeInstagramContentRow,
  buildInstagramContentSnapshot,
  deriveInstagramContentCapabilities,
  computeInstagramContentSummary,
} = await import(`${modelUrl}?t=${Date.now() + 1}`);

// ---------------------------------------------------------------------------
// Fixture header sets
// ---------------------------------------------------------------------------

/** Exact headers as produced by Meta Business Suite content export. */
const CONTENT_EXACT = [
  "Permalink",
  "Description",
  "Post type",
  "Publish time",
  "Impressions",
  "Reach",
  "Likes",
  "Comments",
  "Shares",
  "Saves",
  "Profile visits",
  "Follows",
];

/** Exact headers as produced by Meta insights time-series export. */
const INSIGHTS_EXACT = [
  "Date",
  "Reach",
  "Impressions",
  "Profile views",
  "Website clicks",
  "Email button clicks",
  "Follows",
  "Unfollows",
  "Accounts engaged",
  "Accounts reached",
  "Content interactions",
];

/** Exact headers as produced by audience demographics export. */
const AUDIENCE_EXACT = [
  "Date",
  "Followers",
  "Follows",
  "Top cities",
  "Top countries",
  "Age 13-17",
  "Age 18-24",
  "Age 25-34",
  "Age 35-44",
  "Age 45-54",
  "Age 55-64",
  "Age 65+",
  "Men",
  "Women",
  "Other",
];

const PATREON_MEMBERS_HEADERS = [
  "Name", "Email", "Discord", "Patron Status", "Follows You", "Free Member", "Free Trial",
  "Lifetime Amount", "Pledge Amount", "Charge Frequency", "Tier", "Addressee", "Street",
  "City", "State", "Zip", "Country", "Phone", "Patronage Since Date", "Last Charge Date",
  "Last Charge Status", "Additional Details", "User ID", "Last Updated", "Currency",
  "Max Posts", "Access Expiration", "Next Charge Date", "Full country name", "Subscription Source",
];

const SUBSTACK_HEADERS = ["email", "name", "subscription_status", "plan", "created_at", "expiry"];

const YOUTUBE_CHANNEL_HEADERS = [
  "Video title", "Video publish time", "Views", "Watch time (hours)", "Subscribers",
  "Impressions", "Impressions click-through rate (%)", "Average view duration",
];

// ---------------------------------------------------------------------------
// 1. Content export detected correctly
// ---------------------------------------------------------------------------

test("detects exact instagram_content_export headers", () => {
  const result = detectInstagramExportType(CONTENT_EXACT);

  assert.equal(result.detected_export_type, "instagram_content_export");
  assert.ok(result.confidence >= 0.7, `Expected confidence >= 0.7, got ${result.confidence}`);
  assert.ok(result.critical_matched >= 3, `Expected ≥3 critical columns, got ${result.critical_matched}`);
  assert.ok(result.matched_fields.length >= 8);
});

test("validateInstagramSchema: content export with rows returns valid_with_rows", () => {
  const result = validateInstagramSchema(CONTENT_EXACT, 5);
  assert.equal(result.state, "valid_with_rows");
  assert.equal(result.detected_export_type, "instagram_content_export");
  assert.ok(result.confidence >= 0.7);
});

// ---------------------------------------------------------------------------
// 2. Insights export detected correctly
// ---------------------------------------------------------------------------

test("detects exact instagram_insights_export headers", () => {
  const result = detectInstagramExportType(INSIGHTS_EXACT);

  assert.equal(result.detected_export_type, "instagram_insights_export");
  assert.ok(result.confidence >= 0.5, `Expected confidence >= 0.5, got ${result.confidence}`);
  assert.ok(result.critical_matched >= 2);
});

test("validateInstagramSchema: insights export returns recognized_not_implemented", () => {
  const result = validateInstagramSchema(INSIGHTS_EXACT, 10);
  assert.equal(result.state, "recognized_not_implemented");
  assert.equal(result.detected_export_type, "instagram_insights_export");
  assert.ok(result.reason.toLowerCase().includes("recognised") || result.reason.toLowerCase().includes("recognized"));
});

test("validateInstagramSchema: insights header-only also returns recognized_not_implemented", () => {
  const result = validateInstagramSchema(INSIGHTS_EXACT, 0);
  assert.equal(result.state, "recognized_not_implemented");
  assert.equal(result.detected_export_type, "instagram_insights_export");
});

// ---------------------------------------------------------------------------
// 3. Audience export detected correctly
// ---------------------------------------------------------------------------

test("detects exact instagram_audience_export headers", () => {
  const result = detectInstagramExportType(AUDIENCE_EXACT);

  assert.equal(result.detected_export_type, "instagram_audience_export");
  assert.ok(result.confidence >= 0.4, `Expected confidence >= 0.4, got ${result.confidence}`);
  assert.ok(result.critical_matched >= 1);
});

test("validateInstagramSchema: audience export returns recognized_not_implemented", () => {
  const result = validateInstagramSchema(AUDIENCE_EXACT, 4);
  assert.equal(result.state, "recognized_not_implemented");
  assert.equal(result.detected_export_type, "instagram_audience_export");
});

// ---------------------------------------------------------------------------
// 4. Header order independence
// ---------------------------------------------------------------------------

test("detects content export regardless of column order", () => {
  const shuffled = [...CONTENT_EXACT].reverse();
  const result = detectInstagramExportType(shuffled);
  assert.equal(result.detected_export_type, "instagram_content_export");
});

test("detects insights export regardless of column order", () => {
  const shuffled = ["Unfollows", "Date", "Accounts engaged", "Impressions", "Reach", "Follows", "Accounts reached", "Content interactions", "Profile views", "Website clicks", "Email button clicks"];
  const result = detectInstagramExportType(shuffled);
  assert.equal(result.detected_export_type, "instagram_insights_export");
});

test("detects audience export regardless of column order", () => {
  const shuffled = ["Age 25-34", "Followers", "Top cities", "Age 18-24", "Men", "Date", "Women", "Top countries", "Follows"];
  const result = detectInstagramExportType(shuffled);
  assert.equal(result.detected_export_type, "instagram_audience_export");
});

// ---------------------------------------------------------------------------
// 5. Case / whitespace / BOM tolerance
// ---------------------------------------------------------------------------

test("normalizeHeader strips casing and punctuation", () => {
  assert.equal(normalizeHeader("Publish time"), "publish time");
  assert.equal(normalizeHeader("PUBLISH_TIME"), "publish time");
  assert.equal(normalizeHeader("  Permalink  "), "permalink");
  assert.equal(normalizeHeader("Post type"), "post type");
  assert.equal(normalizeHeader("POST_TYPE"), "post type");
  assert.equal(normalizeHeader("Age 18-24"), "age 18 24");
  assert.equal(normalizeHeader("Age 65+"), "age 65");
});

test("normalizeHeader strips BOM character", () => {
  assert.equal(normalizeHeader("\uFEFFDate"), "date");
  assert.equal(normalizeHeader("\uFEFFPermalink"), "permalink");
});

test("detects content export with all-lowercase headers", () => {
  const lowercase = CONTENT_EXACT.map((h) => h.toLowerCase());
  const result = detectInstagramExportType(lowercase);
  assert.equal(result.detected_export_type, "instagram_content_export");
});

test("detects content export with all-uppercase headers", () => {
  const uppercase = CONTENT_EXACT.map((h) => h.toUpperCase());
  const result = detectInstagramExportType(uppercase);
  assert.equal(result.detected_export_type, "instagram_content_export");
});

test("detects content export with underscore-cased headers", () => {
  const underscored = CONTENT_EXACT.map((h) => h.replace(/ /g, "_"));
  const result = detectInstagramExportType(underscored);
  assert.equal(result.detected_export_type, "instagram_content_export");
});

// ---------------------------------------------------------------------------
// 6. Alias variations accepted
// ---------------------------------------------------------------------------

test("resolveContentCanonical handles common aliases", () => {
  assert.equal(resolveContentCanonical("caption"), "description");
  assert.equal(resolveContentCanonical("post url"), "permalink");
  assert.equal(resolveContentCanonical("publish date"), "publish time");
  assert.equal(resolveContentCanonical("save count"), "saves");
  assert.equal(resolveContentCanonical("bookmarks"), "saves");
  assert.equal(resolveContentCanonical("video views"), "impressions");
  assert.equal(resolveContentCanonical("content type"), "post type");
  assert.equal(resolveContentCanonical("like count"), "likes");
  assert.equal(resolveContentCanonical("comment count"), "comments");
  assert.equal(resolveContentCanonical("share count"), "shares");
});

test("resolveInsightsCanonical handles common aliases", () => {
  assert.equal(resolveInsightsCanonical("profile visits"), "profile views");
  assert.equal(resolveInsightsCanonical("website taps"), "website clicks");
  assert.equal(resolveInsightsCanonical("lost followers"), "unfollows");
  assert.equal(resolveInsightsCanonical("engaged accounts"), "accounts engaged");
  assert.equal(resolveInsightsCanonical("reached accounts"), "accounts reached");
  assert.equal(resolveInsightsCanonical("total interactions"), "content interactions");
});

test("resolveAudienceCanonical handles common aliases", () => {
  assert.equal(resolveAudienceCanonical("follower count"), "followers");
  assert.equal(resolveAudienceCanonical("total followers"), "followers");
  assert.equal(resolveAudienceCanonical("following"), "follows");
  assert.equal(resolveAudienceCanonical("cities"), "top cities");
  assert.equal(resolveAudienceCanonical("countries"), "top countries");
  assert.equal(resolveAudienceCanonical("male"), "men");
  assert.equal(resolveAudienceCanonical("female"), "women");
  assert.equal(resolveAudienceCanonical("65 and over"), "age 65");
});

test("detects content export with alias headers (caption, post url, save count)", () => {
  const aliased = ["Post URL", "Caption", "Content type", "Publish date", "Impressions", "Reach", "Like count", "Comment count", "Share count", "Save count", "Profile activity", "New followers"];
  const result = detectInstagramExportType(aliased);
  assert.equal(result.detected_export_type, "instagram_content_export");
});

test("detects audience export with alias headers (Follower count, Following, Cities)", () => {
  const aliased = ["Date", "Follower count", "Following", "Cities", "Countries", "Age 18-24", "Age 25-34", "Male", "Female"];
  const result = detectInstagramExportType(aliased);
  assert.equal(result.detected_export_type, "instagram_audience_export");
});

// ---------------------------------------------------------------------------
// 7. Disambiguation
// ---------------------------------------------------------------------------

test("content wins over insights when saves column is present", () => {
  // Mix of content + insights columns; saves is content-exclusive
  const mixed = ["Date", "Reach", "Impressions", "Likes", "Saves", "Comments", "Publish time"];
  const result = detectInstagramExportType(mixed);
  assert.equal(result.detected_export_type, "instagram_content_export");
});

test("insights wins over content when accounts-engaged + unfollows present, no saves", () => {
  const insightsHeaders = ["Date", "Reach", "Impressions", "Accounts engaged", "Accounts reached", "Unfollows", "Follows"];
  const result = detectInstagramExportType(insightsHeaders);
  assert.equal(result.detected_export_type, "instagram_insights_export");
});

test("audience wins when followers + age buckets present", () => {
  const audienceHeaders = ["Date", "Followers", "Age 18-24", "Age 25-34", "Men", "Women"];
  const result = detectInstagramExportType(audienceHeaders);
  assert.equal(result.detected_export_type, "instagram_audience_export");
});

test("disambiguation is deterministic for repeated calls", () => {
  const headers = CONTENT_EXACT;
  const r1 = detectInstagramExportType(headers);
  const r2 = detectInstagramExportType(headers);
  assert.equal(r1.detected_export_type, r2.detected_export_type);
  assert.equal(r1.confidence, r2.confidence);
});

// ---------------------------------------------------------------------------
// 8. Wrong platform doesn't misroute real Instagram files
// ---------------------------------------------------------------------------

test("Patreon Members headers are not classified as any Instagram export", () => {
  const result = detectInstagramExportType(PATREON_MEMBERS_HEADERS);
  assert.equal(result.detected_export_type, "unknown");
});

test("Substack headers are not classified as any Instagram export", () => {
  const result = detectInstagramExportType(SUBSTACK_HEADERS);
  assert.equal(result.detected_export_type, "unknown");
});

test("YouTube channel analytics headers are not classified as Instagram", () => {
  const result = detectInstagramExportType(YOUTUBE_CHANNEL_HEADERS);
  assert.equal(result.detected_export_type, "unknown");
});

// ---------------------------------------------------------------------------
// 9. Instagram exports do not misclassify as Patreon
// ---------------------------------------------------------------------------

test("instagram_content_export headers do not match Patreon members schema", () => {
  // This uses the Instagram detector; verify the result is instagram-typed
  const result = detectInstagramExportType(CONTENT_EXACT);
  assert.ok(result.detected_export_type.startsWith("instagram_"));
});

test("generic rows-only CSV is not classified as any Instagram export", () => {
  const generic = ["order_id", "product", "quantity", "price", "date", "customer_email"];
  const result = detectInstagramExportType(generic);
  assert.equal(result.detected_export_type, "unknown");
});

test("empty header array returns unknown", () => {
  const result = detectInstagramExportType([]);
  assert.equal(result.detected_export_type, "unknown");
  assert.equal(result.matched_fields.length, 0);
});

// ---------------------------------------------------------------------------
// 10. Schema validation states
// ---------------------------------------------------------------------------

test("validateInstagramSchema: content export with 0 rows returns empty_valid", () => {
  const result = validateInstagramSchema(CONTENT_EXACT, 0);
  assert.equal(result.state, "empty_valid");
  assert.equal(result.detected_export_type, "instagram_content_export");
  assert.ok(result.reason.toLowerCase().includes("empty") || result.reason.toLowerCase().includes("no data"));
});

test("validateInstagramSchema: non-Instagram CSV returns invalid_schema", () => {
  const result = validateInstagramSchema(["foo", "bar", "baz"], 10);
  assert.equal(result.state, "invalid_schema");
  assert.equal(result.detected_export_type, "unknown");
  assert.ok(result.reason.length > 0);
});

test("validateInstagramSchema: Patreon headers return invalid_schema (not instagram)", () => {
  const result = validateInstagramSchema(PATREON_MEMBERS_HEADERS, 5);
  assert.equal(result.state, "invalid_schema");
});

// ---------------------------------------------------------------------------
// 11. Row normalisation
// ---------------------------------------------------------------------------

test("normalizeInstagramContentRow maps all canonical fields correctly", () => {
  const rawRow = {
    "Permalink": "https://www.instagram.com/p/test123/",
    "Description": "A great post about creativity",
    "Post type": "Photo",
    "Publish time": "2026-02-15 10:30",
    "Impressions": "3500",
    "Reach": "2900",
    "Likes": "210",
    "Comments": "28",
    "Shares": "42",
    "Saves": "95",
    "Profile visits": "78",
    "Follows": "9",
  };

  const row = normalizeInstagramContentRow(rawRow);

  assert.equal(row.permalink, "https://www.instagram.com/p/test123/");
  assert.equal(row.description, "A great post about creativity");
  assert.equal(row.postType, "Photo");
  assert.equal(row.publishTime, "2026-02-15 10:30");
  assert.equal(row.impressions, 3500);
  assert.equal(row.reach, 2900);
  assert.equal(row.likes, 210);
  assert.equal(row.comments, 28);
  assert.equal(row.shares, 42);
  assert.equal(row.saves, 95);
  assert.equal(row.profileVisits, 78);
  assert.equal(row.follows, 9);
  assert.ok(typeof row._raw === "object", "_raw should be preserved");
  assert.equal(row._raw["Permalink"], "https://www.instagram.com/p/test123/");
});

test("normalizeInstagramContentRow handles alias-keyed headers", () => {
  const rawRow = {
    "Post URL": "https://www.instagram.com/p/alias123/",
    "Caption": "Testing alias mapping",
    "Content type": "Reel",
    "Publish date": "2026-01-10 14:00",
    "Impressions": "5000",
    "Reach": "4200",
    "Like count": "380",
    "Comment count": "45",
    "Share count": "67",
    "Save count": "150",
  };

  const row = normalizeInstagramContentRow(rawRow);

  assert.equal(row.permalink, "https://www.instagram.com/p/alias123/");
  assert.equal(row.description, "Testing alias mapping");
  assert.equal(row.postType, "Reel");
  assert.equal(row.publishTime, "2026-01-10 14:00");
  assert.equal(row.likes, 380);
  assert.equal(row.saves, 150);
});

test("normalizeInstagramContentRow maps missing optional fields to null", () => {
  const rawRow = {
    "Permalink": "https://www.instagram.com/p/minimal/",
    "Publish time": "2026-01-01 09:00",
    "Reach": "1000",
    "Impressions": "1500",
    "Likes": "75",
  };

  const row = normalizeInstagramContentRow(rawRow);

  assert.equal(row.permalink, "https://www.instagram.com/p/minimal/");
  assert.equal(row.saves, null);
  assert.equal(row.shares, null);
  assert.equal(row.profileVisits, null);
  assert.equal(row.follows, null);
  assert.equal(row.description, null);
  assert.equal(row.postType, null);
});

test("normalizeInstagramContentRow handles blank optional cells as null", () => {
  const rawRow = {
    "Permalink": "",
    "Description": "",
    "Post type": "",
    "Publish time": "2026-03-01 12:00",
    "Impressions": "2000",
    "Reach": "1800",
    "Likes": "120",
    "Comments": "",
    "Shares": "",
    "Saves": "45",
    "Profile visits": "",
    "Follows": "",
  };

  const row = normalizeInstagramContentRow(rawRow);

  assert.equal(row.permalink, null);
  assert.equal(row.description, null);
  assert.equal(row.postType, null);
  assert.equal(row.comments, null);
  assert.equal(row.shares, null);
  assert.equal(row.profileVisits, null);
  assert.equal(row.follows, null);
  assert.equal(row.saves, 45);
});

test("normalizeInstagramContentRow handles comma-formatted numbers", () => {
  const rawRow = {
    "Publish time": "2026-01-15 08:00",
    "Impressions": "12,500",
    "Reach": "10,200",
    "Likes": "1,050",
  };

  const row = normalizeInstagramContentRow(rawRow);

  assert.equal(row.impressions, 12500);
  assert.equal(row.reach, 10200);
  assert.equal(row.likes, 1050);
});

// ---------------------------------------------------------------------------
// 12. Snapshot builder
// ---------------------------------------------------------------------------

test("buildInstagramContentSnapshot: zero rows produces valid empty snapshot", () => {
  const snapshot = buildInstagramContentSnapshot(CONTENT_EXACT, []);

  assert.equal(snapshot.exportType, "instagram_content_export");
  assert.equal(snapshot.rowCount, 0);
  assert.deepEqual(snapshot.rows, []);
  assert.equal(snapshot.headers.length, CONTENT_EXACT.length);
  assert.ok(snapshot.detectedAt);
});

test("buildInstagramContentSnapshot: parses multiple rows correctly", () => {
  const rows = [
    {
      "Permalink": "https://www.instagram.com/p/post1/",
      "Post type": "Photo",
      "Publish time": "2026-01-10 09:00",
      "Impressions": "2000",
      "Reach": "1800",
      "Likes": "120",
      "Saves": "55",
    },
    {
      "Permalink": "https://www.instagram.com/reel/post2/",
      "Post type": "Reel",
      "Publish time": "2026-02-05 15:30",
      "Impressions": "8500",
      "Reach": "7100",
      "Likes": "640",
      "Saves": "280",
    },
  ];

  const snapshot = buildInstagramContentSnapshot(CONTENT_EXACT, rows);

  assert.equal(snapshot.exportType, "instagram_content_export");
  assert.equal(snapshot.rowCount, 2);
  assert.equal(snapshot.rows.length, 2);
  assert.equal(snapshot.rows[0].postType, "Photo");
  assert.equal(snapshot.rows[1].saves, 280);
  assert.ok(snapshot.capabilities);
});

// ---------------------------------------------------------------------------
// 13. Capability flags
// ---------------------------------------------------------------------------

test("deriveInstagramContentCapabilities: full headers enable all capabilities", () => {
  const rows = [{ "Permalink": "https://www.instagram.com/p/x/", "Post type": "Photo", "Publish time": "2026-01-01 09:00", "Impressions": "1000", "Reach": "900", "Likes": "50", "Saves": "20", "Shares": "10", "Profile visits": "15", "Follows": "2" }];
  const normalizedRows = rows.map(normalizeInstagramContentRow);
  const caps = deriveInstagramContentCapabilities(normalizedRows, CONTENT_EXACT);

  assert.equal(caps.has_rows, true);
  assert.equal(caps.supports_time_series, true);
  assert.equal(caps.supports_reach_impressions, true);
  assert.equal(caps.supports_saves, true);
  assert.equal(caps.supports_profile_actions, true);
  assert.equal(caps.supports_shares, true);
  assert.equal(caps.supports_content_type_breakdown, true);
  assert.equal(caps.supports_permalink, true);
});

test("deriveInstagramContentCapabilities: partial headers disable missing capabilities", () => {
  const partialHeaders = ["Publish time", "Reach", "Likes"];
  const rows = [{ "Publish time": "2026-01-01", "Reach": "500", "Likes": "30" }];
  const normalizedRows = rows.map(normalizeInstagramContentRow);
  const caps = deriveInstagramContentCapabilities(normalizedRows, partialHeaders);

  assert.equal(caps.supports_saves, false);
  assert.equal(caps.supports_shares, false);
  assert.equal(caps.supports_permalink, false);
  assert.equal(caps.supports_content_type_breakdown, false);
  assert.equal(caps.supports_profile_actions, false);
  assert.equal(caps.supports_reach_impressions, true); // "reach" is present
});

test("deriveInstagramContentCapabilities: empty rows sets has_rows to false", () => {
  const caps = deriveInstagramContentCapabilities([], CONTENT_EXACT);
  assert.equal(caps.has_rows, false);
});

// ---------------------------------------------------------------------------
// 14. Analytics summary
// ---------------------------------------------------------------------------

test("computeInstagramContentSummary: computes correct totals", () => {
  const rows = [
    { "Publish time": "2026-01-10 09:00", "Post type": "Photo", "Impressions": "2000", "Reach": "1800", "Likes": "120", "Comments": "15", "Shares": "20", "Saves": "55", "Profile visits": "30", "Follows": "4" },
    { "Publish time": "2026-02-05 15:30", "Post type": "Reel",  "Impressions": "8500", "Reach": "7100", "Likes": "640", "Comments": "82", "Shares": "98", "Saves": "280", "Profile visits": "125", "Follows": "22" },
  ];
  const snapshot = buildInstagramContentSnapshot(CONTENT_EXACT, rows);
  const summary = computeInstagramContentSummary(snapshot);

  assert.equal(summary.totalPosts, 2);
  assert.equal(summary.totalImpressions, 10500);
  assert.equal(summary.totalReach, 8900);
  assert.equal(summary.totalLikes, 760);
  assert.equal(summary.totalComments, 97);
  assert.equal(summary.totalShares, 118);
  assert.equal(summary.totalSaves, 335);
  assert.equal(summary.totalProfileVisits, 155);
  assert.equal(summary.totalFollows, 26);
  assert.equal(summary.earliestPublishTime, "2026-01-10 09:00");
  assert.equal(summary.latestPublishTime, "2026-02-05 15:30");
  assert.ok(summary.contentTypeBreakdown);
  assert.equal(summary.contentTypeBreakdown["Photo"], 1);
  assert.equal(summary.contentTypeBreakdown["Reel"], 1);
});

test("computeInstagramContentSummary: suppresses metrics for absent fields", () => {
  const minimalHeaders = ["Publish time", "Reach", "Likes"];
  const rows = [
    { "Publish time": "2026-01-01 09:00", "Reach": "500", "Likes": "30" },
  ];
  const snapshot = buildInstagramContentSnapshot(minimalHeaders, rows);
  const summary = computeInstagramContentSummary(snapshot);

  assert.equal(summary.totalLikes, 30);
  assert.equal(summary.totalSaves, null);         // saves not in headers
  assert.equal(summary.totalShares, null);        // shares not in headers
  assert.equal(summary.totalProfileVisits, null); // profile visits not in headers
  assert.equal(summary.totalFollows, null);       // follows not in headers
  assert.equal(summary.contentTypeBreakdown, null); // post type not in headers
});

test("computeInstagramContentSummary: empty snapshot returns zero posts, null metrics", () => {
  const snapshot = buildInstagramContentSnapshot(CONTENT_EXACT, []);
  const summary = computeInstagramContentSummary(snapshot);

  assert.equal(summary.totalPosts, 0);
  assert.equal(summary.totalImpressions, null);
  assert.equal(summary.totalLikes, null);
  assert.equal(summary.earliestPublishTime, null);
  assert.equal(summary.contentTypeBreakdown, null);
});

// ---------------------------------------------------------------------------
// 15. Fixture CSV files are parseable and detected correctly
// ---------------------------------------------------------------------------

test("fixture instagram_content_export.csv is detected as content export", async () => {
  const raw = await readFile(
    path.resolve("tests/fixtures/instagram_content_export.csv"),
    "utf8",
  );
  const firstLine = raw.split(/\r?\n/)[0];
  const headers = firstLine.split(",");

  const result = detectInstagramExportType(headers);
  assert.equal(result.detected_export_type, "instagram_content_export");
  assert.ok(result.confidence >= 0.6, `confidence too low: ${result.confidence}`);
});

test("fixture instagram_insights_export.csv is detected as insights export", async () => {
  const raw = await readFile(
    path.resolve("tests/fixtures/instagram_insights_export.csv"),
    "utf8",
  );
  const firstLine = raw.split(/\r?\n/)[0];
  const headers = firstLine.split(",");

  const result = detectInstagramExportType(headers);
  assert.equal(result.detected_export_type, "instagram_insights_export");
});

test("fixture instagram_audience_export.csv is detected as audience export", async () => {
  const raw = await readFile(
    path.resolve("tests/fixtures/instagram_audience_export.csv"),
    "utf8",
  );
  const firstLine = raw.split(/\r?\n/)[0];
  // The audience fixture has quoted multi-value cells; use simple comma split for header
  const headers = firstLine.split(",");

  const result = detectInstagramExportType(headers);
  assert.equal(result.detected_export_type, "instagram_audience_export");
});

test("fixture instagram_content_export.csv has expected column count and can be fully parsed", async () => {
  const raw = await readFile(
    path.resolve("tests/fixtures/instagram_content_export.csv"),
    "utf8",
  );
  const lines = raw.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  assert.equal(headers.length, CONTENT_EXACT.length, "Expected same column count as CONTENT_EXACT");
  assert.ok(lines.length > 1, "Fixture should have data rows");
});

// ---------------------------------------------------------------------------
// 16. Confidence always in [0, 1]
// ---------------------------------------------------------------------------

test("confidence is in [0, 1] for all test cases", () => {
  const cases = [
    CONTENT_EXACT,
    INSIGHTS_EXACT,
    AUDIENCE_EXACT,
    PATREON_MEMBERS_HEADERS,
    SUBSTACK_HEADERS,
    YOUTUBE_CHANNEL_HEADERS,
    ["foo", "bar"],
    [],
    ["Saves"],
    ["Followers"],
    ["Date", "Reach"],
  ];

  for (const headers of cases) {
    const result = detectInstagramExportType(headers);
    assert.ok(
      result.confidence >= 0 && result.confidence <= 1,
      `Confidence out of [0,1]: ${result.confidence} for [${headers.join(", ")}]`,
    );
  }
});

// ---------------------------------------------------------------------------
// 17. Regression: existing detector results unaffected
// ---------------------------------------------------------------------------

test("Patreon members fixture still detects as Patreon (not Instagram)", () => {
  // Confirm the Instagram detector does NOT claim Patreon files
  const result = detectInstagramExportType(PATREON_MEMBERS_HEADERS);
  assert.equal(result.detected_export_type, "unknown");
});

test("minimal set of only generic columns is not classified as Instagram", () => {
  const generic = ["name", "email", "date", "amount", "status"];
  const result = detectInstagramExportType(generic);
  assert.equal(result.detected_export_type, "unknown");
});

test("content export with only reach+impressions (no saves/permalink) still classifies correctly when publish time present", () => {
  // Publish time is a content-specific column; should classify as content
  const minimal = ["Publish time", "Reach", "Impressions", "Likes"];
  const result = detectInstagramExportType(minimal);
  assert.equal(result.detected_export_type, "instagram_content_export");
});
