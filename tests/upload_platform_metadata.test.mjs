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
  const { getStaticSourceManifest, getUploadPlatformCardsByIds, getPlatformRoleBadgeLabel, getPlatformRoleDetail } = await loadModule(Date.now() + 2);

  const manifest = getStaticSourceManifest();
  const cards = getUploadPlatformCardsByIds(["patreon", "youtube", "instagram", "tiktok"], manifest);

  assert.equal(cards.find((item) => item.id === "youtube")?.subtitle, "Revenue and content performance");

  assert.deepEqual(
    cards.map((item) => ({
      id: item.id,
      role: item.platformRole,
      publicSupportStatus: item.publicSupportStatus,
      fileTypeLabel: item.fileTypeLabel,
      acceptedExtensions: item.acceptedExtensions,
      businessMetricsCapable: item.businessMetricsCapable,
      contributionLabel: item.contributionLabel,
    })),
    [
      {
        id: "patreon",
        role: "report-driving",
        publicSupportStatus: "supported_now",
        fileTypeLabel: "Normalized CSV only",
        acceptedExtensions: [".csv"],
        businessMetricsCapable: true,
        contributionLabel: "Revenue + subscriber data",
      },
      {
        id: "youtube",
        role: "report-driving",
        publicSupportStatus: "supported_now",
        fileTypeLabel: "Normalized CSV or YouTube Studio content analytics ZIP",
        acceptedExtensions: [".csv", ".zip"],
        businessMetricsCapable: true,
        contributionLabel: "Revenue + growth insights",
      },
      {
        id: "instagram",
        role: "supporting",
        publicSupportStatus: "supported_now",
        fileTypeLabel: "Normalized CSV or exact allowlisted Instagram ZIP",
        acceptedExtensions: [".csv", ".zip"],
        businessMetricsCapable: false,
        contributionLabel: "Growth insights + report coverage",
      },
      {
        id: "tiktok",
        role: "supporting",
        publicSupportStatus: "supported_now",
        fileTypeLabel: "Normalized CSV or exact allowlisted ZIP",
        acceptedExtensions: [".csv", ".zip"],
        businessMetricsCapable: false,
        contributionLabel: "Growth insights + report coverage",
      },
    ],
  );

  assert.equal(getPlatformRoleBadgeLabel("report-driving"), "Report-driving");
  assert.equal(getPlatformRoleBadgeLabel("supporting"), "Growth + report");
  assert.equal(getPlatformRoleDetail("report-driving"), "Used for core revenue/subscriber analysis.");
  assert.equal(getPlatformRoleDetail("supporting"), "Used in combined reports and growth insights.");
  assert.equal(manifest.platforms.find((item) => item.platform === "youtube")?.publicContractIds.includes("youtube_studio_zip"), true);
  assert.equal(manifest.platforms.find((item) => item.platform === "youtube")?.publicContractIds.includes("youtube_takeout_zip"), false);
  assert.equal(manifest.platforms.find((item) => item.platform === "instagram")?.standaloneReportEligible, false);
  assert.equal(manifest.platforms.find((item) => item.platform === "tiktok")?.standaloneReportEligible, false);
});

test("static source manifest locks current YouTube Instagram and TikTok source truth", async () => {
  const { getStaticSourceManifest } = await loadModule(Date.now() + 5);

  const manifest = getStaticSourceManifest();
  const byPlatform = Object.fromEntries(manifest.platforms.map((item) => [item.platform, item]));

  assert.deepEqual(byPlatform.youtube.publicContractIds, ["youtube_normalized_csv", "youtube_studio_zip"]);
  assert.equal(byPlatform.youtube.acceptedFileTypesLabel, "Normalized CSV or YouTube Studio content analytics ZIP");
  assert.equal(byPlatform.youtube.reportRole, "report-driving");
  assert.equal(byPlatform.youtube.standaloneReportEligible, true);
  assert.equal(byPlatform.youtube.uploadHelpText.includes("Table data.csv"), true);
  assert.equal(byPlatform.youtube.uploadHelpText.includes("Chart data.csv"), true);
  assert.equal(byPlatform.youtube.uploadHelpText.includes("Totals.csv"), true);
  assert.equal(byPlatform.youtube.uploadHelpText.includes("Google Takeout ZIPs are not supported"), true);
  assert.equal(byPlatform.youtube.publicContractIds.includes("youtube_takeout_zip"), false);
  assert.equal(byPlatform.youtube.knownLimitations.includes("Unknown contract."), false);

  assert.deepEqual(byPlatform.instagram.publicContractIds, [
    "instagram_allowlisted_zip",
    "instagram_performance_monthly_csv",
  ]);
  assert.equal(byPlatform.instagram.acceptedFileTypesLabel, "Normalized CSV or exact allowlisted Instagram ZIP");
  assert.equal(byPlatform.instagram.reportRole, "supporting");
  assert.equal(byPlatform.instagram.standaloneReportEligible, false);
  assert.equal(
    byPlatform.instagram.uploadHelpText.includes("logged_information/past_instagram_insights/posts.json"),
    true,
  );
  assert.equal(byPlatform.instagram.uploadHelpText.includes("content_interactions.json"), true);

  assert.deepEqual(byPlatform.tiktok.publicContractIds, [
    "tiktok_allowlisted_zip",
    "tiktok_performance_monthly_csv",
  ]);
  assert.equal(byPlatform.tiktok.acceptedFileTypesLabel, "Normalized CSV or exact allowlisted ZIP");
  assert.equal(byPlatform.tiktok.reportRole, "supporting");
  assert.equal(byPlatform.tiktok.standaloneReportEligible, false);
  assert.equal(byPlatform.tiktok.uploadHelpText.includes("Followers, Viewers, or Overview"), true);
  assert.equal(byPlatform.tiktok.uploadHelpText.includes("Content ZIP is not supported"), true);
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
