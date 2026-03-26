import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const supportSurfaceModuleUrl = pathToFileURL(path.resolve("src/lib/upload/support-surface.ts")).href;
const platformGuidanceModuleUrl = pathToFileURL(path.resolve("src/lib/upload/platform-guidance.ts")).href;

test("static guidance exposes the canonical manifest snapshot in stable order", async () => {
  const {
    getStaticVisibleUploadPlatformCards,
    getStaticVisibleUploadPlatformLabels,
    getSupportedRevenueUploadFormatGuidanceFromCards,
    getSupportedRevenueUploadSummaryFromCards,
  } = await import(`${supportSurfaceModuleUrl}?t=${Date.now()}`);
  const staticCards = getStaticVisibleUploadPlatformCards();

  assert.deepEqual(
    staticCards.map((card) => card.label),
    ["Patreon", "Substack", "YouTube", "Instagram", "TikTok"],
  );
  assert.deepEqual(getStaticVisibleUploadPlatformLabels(), [
    "Patreon",
    "Substack",
    "YouTube",
    "Instagram",
    "TikTok",
  ]);
  assert.equal(
    getSupportedRevenueUploadSummaryFromCards(staticCards),
    "Patreon, Substack, YouTube, Instagram, and TikTok",
  );
  assert.equal(
    getSupportedRevenueUploadFormatGuidanceFromCards(staticCards),
    "Patreon and Substack use supported CSV inputs. YouTube, Instagram, and TikTok accept supported CSV or allowlisted ZIP inputs. Not every file from a platform will match the supported contract.",
  );
});

test("platform guidance helpers mirror the canonical static manifest snapshot", async () => {
  const { getSupportedRevenueUploadFormatGuidance, getSupportedRevenueUploadLabels, getSupportedRevenueUploadSummary } = await import(
    `${platformGuidanceModuleUrl}?t=${Date.now() + 1}`,
  );

  assert.deepEqual(getSupportedRevenueUploadLabels(), [
    "Patreon",
    "Substack",
    "YouTube",
    "Instagram",
    "TikTok",
  ]);
  assert.equal(
    getSupportedRevenueUploadSummary(),
    "Patreon, Substack, YouTube, Instagram, and TikTok",
  );
  assert.equal(
    getSupportedRevenueUploadFormatGuidance(),
    "Patreon and Substack use supported CSV inputs. YouTube, Instagram, and TikTok accept supported CSV or allowlisted ZIP inputs. Not every file from a platform will match the supported contract.",
  );
});

test("source-manifest helpers normalize backend payloads and expose visible platform ids", async () => {
  const {
    buildVisibleUploadPlatformCardsFromSourceManifest,
    buildVisibleUploadPlatformIdsFromSourceManifest,
    getStaticSourceManifestSnapshot,
  } = await import(`${supportSurfaceModuleUrl}?t=${Date.now() + 2}`);

  const manifest = {
    version: 1,
    eligibility_rule: "Add at least one report-driving source.",
    business_metrics_rule: "Reports are strongest with business metrics.",
    platforms: [
      {
        platform: "patreon",
        label: "Patreon",
        descriptor: "Membership revenue",
        accepted_file_types_label: "Normalized CSV only",
        upload_help_text: "Upload the supported Patreon normalized CSV template for this platform.",
        public_support_status: "supported_now",
        report_role: "report_driving",
        standalone_report_eligible: true,
        business_metrics_capable: true,
        accepted_extensions: [".csv"],
        public_contract_ids: ["patreon_normalized_csv"],
        data_domains: ["revenue", "subscribers"],
        role_summary: "Revenue and subscriber data. Can generate a report on its own.",
        known_limitations: ["Exact normalized CSV template only"],
      },
      {
        platform: "instagram",
        label: "Instagram",
        descriptor: "Social performance",
        accepted_file_types_label: "Normalized CSV or exact allowlisted ZIP",
        upload_help_text: "Upload either the supported Instagram normalized CSV template or the supported Instagram export ZIP in the exact allowed format.",
        public_support_status: "supported_now",
        report_role: "supporting",
        standalone_report_eligible: false,
        business_metrics_capable: false,
        accepted_extensions: [".csv", ".zip"],
        public_contract_ids: ["instagram_allowlisted_zip"],
        data_domains: ["performance"],
        role_summary: "Performance data only. Supports a combined report but cannot generate one alone.",
        known_limitations: ["Exact allowlisted ZIP shape only"],
      },
    ],
  };

  const cards = buildVisibleUploadPlatformCardsFromSourceManifest(manifest);
  const ids = buildVisibleUploadPlatformIdsFromSourceManifest(manifest);
  const staticManifest = getStaticSourceManifestSnapshot();

  assert.equal(staticManifest.eligibilityRule.includes("report-driving source"), true);
  assert.deepEqual(ids, ["patreon", "instagram"]);
  assert.deepEqual(
    cards?.map((card) => ({ id: card.id, role: card.platformRole })),
    [
      { id: "patreon", role: "report-driving" },
      { id: "instagram", role: "supporting" },
    ],
  );
});
