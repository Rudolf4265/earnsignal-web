import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const metadataModuleUrl = pathToFileURL(path.resolve("src/lib/upload/platform-metadata.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${metadataModuleUrl}?t=${seed}`);
}

test("static source manifest snapshot preserves canonical backend platform order", async () => {
  const { getStaticSourceManifest, buildUploadPlatformCardsFromManifest } = await loadModule(Date.now() + 1);

  const manifest = getStaticSourceManifest();
  const cards = buildUploadPlatformCardsFromManifest(manifest);

  assert.deepEqual(
    manifest.platforms.map((item) => item.platform),
    ["patreon", "substack", "youtube", "instagram", "tiktok"],
  );
  assert.deepEqual(
    cards.map((item) => item.label),
    ["Patreon", "Substack", "YouTube", "Instagram", "TikTok"],
  );
});

test("manifest-driven platform cards expose canonical role, support, and accepted extensions", async () => {
  const { getStaticSourceManifest, getUploadPlatformCardsByIds } = await loadModule(Date.now() + 2);

  const manifest = getStaticSourceManifest();
  const cards = getUploadPlatformCardsByIds(["patreon", "youtube", "instagram", "tiktok"], manifest);

  assert.deepEqual(
    cards.map((item) => ({
      id: item.id,
      role: item.platformRole,
      publicSupportStatus: item.publicSupportStatus,
      fileTypeLabel: item.fileTypeLabel,
      acceptedExtensions: item.acceptedExtensions,
      businessMetricsCapable: item.businessMetricsCapable,
    })),
    [
      {
        id: "patreon",
        role: "report-driving",
        publicSupportStatus: "supported_now",
        fileTypeLabel: "Normalized CSV only",
        acceptedExtensions: [".csv"],
        businessMetricsCapable: true,
      },
      {
        id: "youtube",
        role: "report-driving",
        publicSupportStatus: "supported_now",
        fileTypeLabel: "Normalized CSV or YouTube Takeout ZIP",
        acceptedExtensions: [".csv", ".zip"],
        businessMetricsCapable: true,
      },
      {
        id: "instagram",
        role: "supporting",
        publicSupportStatus: "supported_now",
        fileTypeLabel: "Normalized CSV or exact allowlisted ZIP",
        acceptedExtensions: [".csv", ".zip"],
        businessMetricsCapable: false,
      },
      {
        id: "tiktok",
        role: "supporting",
        publicSupportStatus: "supported_now",
        fileTypeLabel: "Normalized CSV or exact allowlisted ZIP",
        acceptedExtensions: [".csv", ".zip"],
        businessMetricsCapable: false,
      },
    ],
  );
});

test("normalizeSourceManifestResponse accepts canonical backend fields", async () => {
  const { normalizeSourceManifestResponse } = await loadModule(Date.now() + 3);

  const manifest = normalizeSourceManifestResponse({
    version: 2,
    eligibility_rule: "Add at least one report-driving source.",
    business_metrics_rule: "Reports are strongest with revenue or subscriber data.",
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
    ],
  });

  assert.equal(manifest?.version, 2);
  assert.equal(manifest?.eligibilityRule, "Add at least one report-driving source.");
  assert.equal(manifest?.businessMetricsRule, "Reports are strongest with revenue or subscriber data.");
  assert.deepEqual(manifest?.platforms[0]?.acceptedExtensions, [".csv"]);
});

test("normalizeSourceManifestResponse rejects manifest payloads missing canonical readiness rules", async () => {
  const { normalizeSourceManifestResponse } = await loadModule(Date.now() + 4);

  const manifest = normalizeSourceManifestResponse({
    version: 1,
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
    ],
  });

  assert.equal(manifest, null);
});
