import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const supportSurfaceModuleUrl = pathToFileURL(path.resolve("src/lib/upload/support-surface.ts")).href;
const platformGuidanceModuleUrl = pathToFileURL(path.resolve("src/lib/upload/platform-guidance.ts")).href;

test("fallback upload guidance stays Patreon, Substack, and YouTube in stable order", async () => {
  const { getFallbackVisibleUploadPlatformCards, getFallbackVisibleUploadPlatformLabels, getSupportedRevenueUploadSummaryFromCards } = await import(
    `${supportSurfaceModuleUrl}?t=${Date.now()}`,
  );
  const fallbackCards = getFallbackVisibleUploadPlatformCards();

  assert.deepEqual(
    fallbackCards.map((card) => card.label),
    ["Patreon", "Substack", "YouTube"],
  );
  assert.deepEqual(getFallbackVisibleUploadPlatformLabels(), ["Patreon", "Substack", "YouTube"]);
  assert.equal(
    getSupportedRevenueUploadSummaryFromCards(fallbackCards),
    "Patreon, Substack, and YouTube CSV exports",
  );
});

test("platform guidance summary mirrors the upload-page visible support truth", async () => {
  const { getSupportedRevenueUploadLabels, getSupportedRevenueUploadSummary } = await import(
    `${platformGuidanceModuleUrl}?t=${Date.now() + 1}`,
  );

  const labels = getSupportedRevenueUploadLabels();

  assert.deepEqual(labels, ["Patreon", "Substack", "YouTube"]);
  assert.equal(labels.includes("Instagram"), false);
  assert.equal(labels.includes("TikTok"), false);
  assert.equal(getSupportedRevenueUploadSummary(), "Patreon, Substack, and YouTube CSV exports");
});

test("support-matrix truth derives only supported-now visible upload platforms", async () => {
  const { buildVisibleUploadPlatformIdsFromSupportMatrix } = await import(`${supportSurfaceModuleUrl}?t=${Date.now() + 2}`);

  const visiblePlatformIds = buildVisibleUploadPlatformIdsFromSupportMatrix({
    families: [
      {
        family: "youtube_brandconnect",
        label: "YouTube BrandConnect",
        family_class: "native_report_driving",
        is_user_visible_supported: true,
        is_report_driving: true,
        support_status: "supported_now",
      },
      {
        family: "patreon_members_export",
        label: "Patreon Members Export",
        family_class: "native_report_driving",
        is_user_visible_supported: true,
        is_report_driving: true,
        support_status: "supported_now",
      },
      {
        family: "substack_subscribers_export",
        label: "Substack Subscribers Export",
        family_class: "native_report_driving",
        is_user_visible_supported: true,
        is_report_driving: true,
        support_status: "supported_now",
      },
      {
        family: "youtube_channel_analytics_export",
        label: "YouTube Channel Analytics Export",
        family_class: "native_report_driving",
        is_user_visible_supported: true,
        is_report_driving: true,
        support_status: "supported_now",
      },
      {
        family: "instagram_performance",
        label: "Instagram Performance",
        family_class: "native_report_driving",
        is_user_visible_supported: true,
        is_report_driving: true,
        support_status: "supported_now",
      },
    ],
  });

  assert.deepEqual(visiblePlatformIds, ["patreon", "substack", "youtube"]);
});

test("malformed support-matrix responses trigger the explicit fallback path", async () => {
  const { buildVisibleUploadPlatformIdsFromSupportMatrix } = await import(`${supportSurfaceModuleUrl}?t=${Date.now() + 3}`);

  assert.equal(buildVisibleUploadPlatformIdsFromSupportMatrix(null), null);
  assert.equal(buildVisibleUploadPlatformIdsFromSupportMatrix({}), null);
  assert.equal(buildVisibleUploadPlatformIdsFromSupportMatrix({ families: null }), null);
});
