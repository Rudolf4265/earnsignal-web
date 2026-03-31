import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const sourceDisplayPath = path.resolve("src/lib/workspace/source-display.ts");
const sourceDisplayModuleUrl = pathToFileURL(sourceDisplayPath).href;

test("workspace source display uses upload-first copy for staged and missing sources", async () => {
  const source = await readFile(sourceDisplayPath, "utf8");

  assert.equal(source.includes('return "Uploaded";'), true);
  assert.equal(source.includes('label: "Uploaded"'), true);
  assert.equal(source.includes('return "Not uploaded";'), true);
  assert.equal(source.includes('label: "Not uploaded"'), true);
  assert.equal(source.includes('label: "Retry upload"'), true);
  assert.equal(source.includes('return "Connected";'), false);
  assert.equal(source.includes('label: "Connected"'), false);
  assert.equal(source.includes('return "Not connected";'), false);
  assert.equal(source.includes('label: "Not connected"'), false);
});

test("your data sources only includes attempted sources and keeps failed attempts actionable", async () => {
  const { buildSourceListItems } = await import(`${sourceDisplayModuleUrl}?t=${Date.now()}`);

  const cards = [
    {
      id: "youtube",
      label: "YouTube",
      subtitle: "Revenue and content performance",
      contributionLabel: "Revenue + subscriber data",
      fileTypeLabel: "Normalized CSV or YouTube Takeout ZIP",
      icon: "/platforms/youtube.png",
      category: "supported",
      available: true,
      guidance: "Upload a supported YouTube file.",
      platformRole: "report-driving",
      publicSupportStatus: "supported_now",
      standaloneReportEligible: true,
      businessMetricsCapable: true,
      acceptedExtensions: [".csv", ".zip"],
      acceptedFileTypesLabel: "Normalized CSV or YouTube Takeout ZIP",
      roleSummary: "Can generate a report.",
      knownLimitations: [],
      dataDomains: ["revenue", "subscribers"],
    },
    {
      id: "instagram",
      label: "Instagram",
      subtitle: "Social performance",
      contributionLabel: "Audience/performance context",
      fileTypeLabel: "Normalized CSV or exact allowlisted ZIP",
      icon: "/platforms/instagram.svg",
      category: "supported",
      available: true,
      guidance: "Upload a supported Instagram file.",
      platformRole: "supporting",
      publicSupportStatus: "supported_now",
      standaloneReportEligible: false,
      businessMetricsCapable: false,
      acceptedExtensions: [".csv", ".zip"],
      acceptedFileTypesLabel: "Normalized CSV or exact allowlisted ZIP",
      roleSummary: "Performance data only.",
      knownLimitations: [],
      dataDomains: ["performance"],
    },
    {
      id: "tiktok",
      label: "TikTok",
      subtitle: "Social performance",
      contributionLabel: "Audience/performance context",
      fileTypeLabel: "Normalized CSV or exact allowlisted ZIP",
      icon: "/platforms/tiktok.svg",
      category: "supported",
      available: true,
      guidance: "Upload a supported TikTok file.",
      platformRole: "supporting",
      publicSupportStatus: "supported_now",
      standaloneReportEligible: false,
      businessMetricsCapable: false,
      acceptedExtensions: [".csv", ".zip"],
      acceptedFileTypesLabel: "Normalized CSV or exact allowlisted ZIP",
      roleSummary: "Performance data only.",
      knownLimitations: [],
      dataDomains: ["performance"],
    },
  ];

  const items = buildSourceListItems(cards, [
    {
      platform: "youtube",
      label: "YouTube",
      descriptor: "Revenue and content performance",
      acceptedFileTypesLabel: "Normalized CSV or YouTube Takeout ZIP",
      reportRole: "report_driving",
      standaloneReportEligible: true,
      businessMetricsCapable: true,
      roleSummary: "Can generate a report.",
      state: "ready",
      includedInNextReport: true,
      lastUploadAt: "2026-03-29T12:00:00Z",
      lastReadyAt: "2026-03-29T12:30:00Z",
      statusMessage: "ready",
      actionLabel: "Replace",
    },
    {
      platform: "instagram",
      label: "Instagram",
      descriptor: "Social performance",
      acceptedFileTypesLabel: "Normalized CSV or exact allowlisted ZIP",
      reportRole: "supporting",
      standaloneReportEligible: false,
      businessMetricsCapable: false,
      roleSummary: "Performance data only.",
      state: "missing",
      includedInNextReport: false,
      lastUploadAt: null,
      lastReadyAt: null,
      statusMessage: null,
      actionLabel: "Upload",
    },
    {
      platform: "tiktok",
      label: "TikTok",
      descriptor: "Social performance",
      acceptedFileTypesLabel: "Normalized CSV or exact allowlisted ZIP",
      reportRole: "supporting",
      standaloneReportEligible: false,
      businessMetricsCapable: false,
      roleSummary: "Performance data only.",
      state: "failed",
      includedInNextReport: false,
      lastUploadAt: "2026-03-30T09:00:00Z",
      lastReadyAt: null,
      statusMessage: "Upload failed",
      actionLabel: "Retry",
    },
  ]);

  assert.deepEqual(items.map((item) => item.id), ["youtube", "tiktok"]);
  assert.equal(items.some((item) => item.id === "instagram"), false);
  assert.equal(items.find((item) => item.id === "youtube")?.status, "connected");
  assert.equal(items.find((item) => item.id === "tiktok")?.status, "fix_needed");
  assert.equal(items.find((item) => item.id === "tiktok")?.primaryAction.label, "Retry upload");
});
