import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const supportSurfaceModuleUrl = pathToFileURL(path.resolve("src/lib/upload/support-surface.ts")).href;
const platformGuidanceModuleUrl = pathToFileURL(path.resolve("src/lib/upload/platform-guidance.ts")).href;

test("fallback upload guidance exposes the public platform list in stable order", async () => {
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
    "Patreon and Substack use native CSV exports. YouTube uses a native CSV or supported Takeout ZIP. Instagram Performance and TikTok Performance use allowlisted ZIP exports only. Not every CSV or ZIP from a platform will work.",
  );
});

test("platform guidance summary mirrors the upload-page visible support truth", async () => {
  const { getSupportedRevenueUploadFormatGuidance, getSupportedRevenueUploadLabels, getSupportedRevenueUploadSummary } = await import(
    `${platformGuidanceModuleUrl}?t=${Date.now() + 1}`,
  );

  const labels = getSupportedRevenueUploadLabels();

  assert.deepEqual(labels, ["Patreon", "Substack", "YouTube", "Instagram Performance", "TikTok Performance"]);
  assert.equal(labels.includes("Instagram"), false);
  assert.equal(labels.includes("TikTok"), false);
  assert.equal(getSupportedRevenueUploadSummary(), "Patreon, Substack, YouTube, Instagram Performance, and TikTok Performance");
  assert.equal(
    getSupportedRevenueUploadFormatGuidance(),
    "Patreon and Substack use native CSV exports. YouTube uses a native CSV or supported Takeout ZIP. Instagram Performance and TikTok Performance use allowlisted ZIP exports only. Not every CSV or ZIP from a platform will work.",
  );
});

test("support-matrix truth derives only supported-now visible public upload platforms", async () => {
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
      {
        family: "tiktok_performance",
        label: "TikTok Performance",
        family_class: "native_report_driving",
        is_user_visible_supported: true,
        is_report_driving: true,
        support_status: "supported_now",
      },
      {
        family: "stripe",
        label: "Stripe",
        family_class: "native_report_driving",
        is_user_visible_supported: true,
        is_report_driving: true,
        support_status: "supported_now",
      },
      {
        family: "sponsorship_rollup",
        label: "Sponsorship Rollup",
        family_class: "native_report_driving",
        is_user_visible_supported: true,
        is_report_driving: true,
        support_status: "supported_now",
      },
    ],
  });

  assert.deepEqual(visiblePlatformIds, ["patreon", "substack", "youtube", "instagram", "tiktok"]);
});

test("partial support-matrix responses still preserve the full public upload grid", async () => {
  const { buildVisibleUploadPlatformIdsFromSupportMatrix } = await import(`${supportSurfaceModuleUrl}?t=${Date.now() + 21}`);

  const visiblePlatformIds = buildVisibleUploadPlatformIdsFromSupportMatrix({
    families: [
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
    ],
  });

  assert.deepEqual(visiblePlatformIds, ["patreon", "substack", "youtube", "instagram", "tiktok"]);
});

test("guidance helpers introduce zip language only for the bounded instagram and tiktok support surfaces", async () => {
  const { getFallbackVisibleUploadPlatformCards, getSupportedRevenueUploadFormatGuidanceFromCards } = await import(
    `${supportSurfaceModuleUrl}?t=${Date.now() + 3}`,
  );

  const guidance = getSupportedRevenueUploadFormatGuidanceFromCards(getFallbackVisibleUploadPlatformCards());

  assert.equal(
    guidance.includes("Instagram Performance and TikTok Performance use allowlisted ZIP exports only."),
    true,
  );
  assert.equal(guidance.includes("generic ZIP"), false);
  assert.equal(guidance.includes("template-based normalized CSV"), false);
  assert.equal(guidance.includes("Not every CSV or ZIP from a platform will work."), true);
});

test("malformed support-matrix responses trigger the explicit fallback path", async () => {
  const { buildVisibleUploadPlatformIdsFromSupportMatrix } = await import(`${supportSurfaceModuleUrl}?t=${Date.now() + 4}`);

  assert.equal(buildVisibleUploadPlatformIdsFromSupportMatrix(null), null);
  assert.equal(buildVisibleUploadPlatformIdsFromSupportMatrix({}), null);
  assert.equal(buildVisibleUploadPlatformIdsFromSupportMatrix({ families: null }), null);
});
