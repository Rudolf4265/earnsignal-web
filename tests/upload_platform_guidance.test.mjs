import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/upload/support-surface.ts")).href;

test("fallback upload guidance stays Patreon, Substack, and YouTube in stable order", async () => {
  const { getFallbackVisibleUploadPlatformCards, getSupportedRevenueUploadSummaryFromCards } = await import(`${moduleUrl}?t=${Date.now()}`);
  const fallbackCards = getFallbackVisibleUploadPlatformCards();

  assert.deepEqual(
    fallbackCards.map((card) => card.label),
    ["Patreon", "Substack", "YouTube"],
  );
  assert.equal(
    getSupportedRevenueUploadSummaryFromCards(fallbackCards),
    "Patreon, Substack, and YouTube CSV exports",
  );
});

test("support-matrix truth derives only supported-now visible upload platforms", async () => {
  const { buildVisibleUploadPlatformIdsFromSupportMatrix } = await import(`${moduleUrl}?t=${Date.now() + 1}`);

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
  const { buildVisibleUploadPlatformIdsFromSupportMatrix } = await import(`${moduleUrl}?t=${Date.now() + 2}`);

  assert.equal(buildVisibleUploadPlatformIdsFromSupportMatrix(null), null);
  assert.equal(buildVisibleUploadPlatformIdsFromSupportMatrix({}), null);
  assert.equal(buildVisibleUploadPlatformIdsFromSupportMatrix({ families: null }), null);
});
