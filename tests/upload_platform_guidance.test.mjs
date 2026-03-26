import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const supportSurfaceModuleUrl = pathToFileURL(path.resolve("src/lib/upload/support-surface.ts")).href;
const platformGuidanceModuleUrl = pathToFileURL(path.resolve("src/lib/upload/platform-guidance.ts")).href;

test("fallback guidance exposes the public manifest-driven platform list in stable order", async () => {
  const {
    getFallbackVisibleUploadPlatformCards,
    getFallbackVisibleUploadPlatformLabels,
    getSupportedRevenueUploadFormatGuidanceFromCards,
    getSupportedRevenueUploadSummaryFromCards,
  } = await import(`${supportSurfaceModuleUrl}?t=${Date.now()}`);
  const fallbackCards = getFallbackVisibleUploadPlatformCards();

  assert.deepEqual(
    fallbackCards.map((card) => card.label),
    ["Patreon", "Substack", "YouTube", "Instagram Performance", "TikTok Performance"],
  );
  assert.deepEqual(getFallbackVisibleUploadPlatformLabels(), [
    "Patreon",
    "Substack",
    "YouTube",
    "Instagram Performance",
    "TikTok Performance",
  ]);
  assert.equal(
    getSupportedRevenueUploadSummaryFromCards(fallbackCards),
    "Patreon, Substack, YouTube, Instagram Performance, and TikTok Performance",
  );
  assert.equal(
    getSupportedRevenueUploadFormatGuidanceFromCards(fallbackCards),
    "Patreon and Substack use supported CSV inputs. YouTube, Instagram Performance, and TikTok Performance accept supported CSV or allowlisted ZIP inputs. Not every file from a platform will match the supported contract.",
  );
});

test("platform guidance helpers mirror manifest-driven fallback truth", async () => {
  const { getSupportedRevenueUploadFormatGuidance, getSupportedRevenueUploadLabels, getSupportedRevenueUploadSummary } = await import(
    `${platformGuidanceModuleUrl}?t=${Date.now() + 1}`,
  );

  assert.deepEqual(getSupportedRevenueUploadLabels(), [
    "Patreon",
    "Substack",
    "YouTube",
    "Instagram Performance",
    "TikTok Performance",
  ]);
  assert.equal(
    getSupportedRevenueUploadSummary(),
    "Patreon, Substack, YouTube, Instagram Performance, and TikTok Performance",
  );
  assert.equal(
    getSupportedRevenueUploadFormatGuidance(),
    "Patreon and Substack use supported CSV inputs. YouTube, Instagram Performance, and TikTok Performance accept supported CSV or allowlisted ZIP inputs. Not every file from a platform will match the supported contract.",
  );
});

test("source-manifest helpers normalize backend payloads and expose visible platform ids", async () => {
  const {
    buildVisibleUploadPlatformCardsFromSourceManifest,
    buildVisibleUploadPlatformIdsFromSourceManifest,
    normalizeSourceManifestOrFallback,
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
        upload_help_text: "Upload the exact supported Patreon CSV for this workspace.",
        public_support_status: "supported_now",
        report_role: "report_driving",
        standalone_report_eligible: true,
        business_metrics_capable: true,
        accepted_extensions: [".csv"],
      },
      {
        platform: "instagram",
        label: "Instagram Performance",
        descriptor: "Social performance",
        accepted_file_types_label: "CSV or allowlisted ZIP",
        upload_help_text: "Upload the supported Instagram performance CSV or allowlisted ZIP.",
        public_support_status: "supported_now",
        report_role: "supporting",
        standalone_report_eligible: false,
        business_metrics_capable: false,
        accepted_extensions: [".csv", ".zip"],
      },
    ],
  };

  const normalized = normalizeSourceManifestOrFallback(manifest);
  const cards = buildVisibleUploadPlatformCardsFromSourceManifest(normalized);
  const ids = buildVisibleUploadPlatformIdsFromSourceManifest(normalized);

  assert.equal(normalized.eligibilityRule, "Add at least one report-driving source.");
  assert.deepEqual(ids, ["patreon", "instagram"]);
  assert.deepEqual(
    cards?.map((card) => ({ id: card.id, role: card.platformRole })),
    [
      { id: "patreon", role: "report-driving" },
      { id: "instagram", role: "supporting" },
    ],
  );
});
