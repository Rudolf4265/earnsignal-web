import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const metadataModuleUrl = pathToFileURL(path.resolve("src/lib/upload/platform-metadata.ts")).href;

const {
  getUploadPlatformCardsByIds,
  UPLOAD_PLATFORM_CARDS,
} = await import(`${metadataModuleUrl}?t=${Date.now()}`);

test("filtered upload platform cards preserve the public visible label order", () => {
  const visibleCards = getUploadPlatformCardsByIds(["youtube", "patreon", "substack", "instagram", "tiktok"]);

  assert.deepEqual(
    visibleCards.map((item) => item.id),
    ["patreon", "substack", "youtube", "instagram", "tiktok"],
  );
  assert.deepEqual(
    visibleCards.map((item) => item.label),
    ["Patreon", "Substack", "YouTube", "Instagram Performance", "TikTok Performance"],
  );
});

test("instagram and tiktok platform cards expose allowlisted-zip metadata", () => {
  const visibleCards = getUploadPlatformCardsByIds(["instagram", "tiktok"]);

  assert.deepEqual(
    visibleCards.map((item) => ({
      id: item.id,
      label: item.label,
      subtitle: item.subtitle,
      fileTypeLabel: item.fileTypeLabel,
      importMode: item.importMode,
      available: item.available,
      guidance: item.guidance,
    })),
    [
      {
        id: "instagram",
        label: "Instagram Performance",
        subtitle: "Social performance",
        fileTypeLabel: "Allowlisted ZIP",
        importMode: "allowlisted_zip",
        available: true,
        guidance: "Upload the supported Instagram export ZIP in the exact allowed format.",
      },
      {
        id: "tiktok",
        label: "TikTok Performance",
        subtitle: "Social performance",
        fileTypeLabel: "Allowlisted ZIP",
        importMode: "allowlisted_zip",
        available: true,
        guidance: "Upload the supported TikTok export ZIP in the exact allowed format.",
      },
    ],
  );
});

test("csv and csv-or-zip platform cards expose correct file type labels and guidance", () => {
  const visibleCards = getUploadPlatformCardsByIds(["patreon", "substack", "youtube"]);

  assert.deepEqual(
    visibleCards.map((item) => ({
      label: item.label,
      subtitle: item.subtitle,
      fileTypeLabel: item.fileTypeLabel,
      importMode: item.importMode,
      guidance: item.guidance,
    })),
    [
      { label: "Patreon", subtitle: "Membership revenue", fileTypeLabel: "CSV only", importMode: "direct_csv", guidance: "Upload the supported Patreon CSV for this platform." },
      { label: "Substack", subtitle: "Subscription revenue", fileTypeLabel: "CSV only", importMode: "direct_csv", guidance: "Upload your Substack subscriber export CSV." },
      { label: "YouTube", subtitle: "Creator earnings", fileTypeLabel: "CSV or ZIP", importMode: "csv_or_zip", guidance: "Upload your YouTube analytics CSV or supported YouTube Takeout ZIP." },
    ],
  );
});

test("filtered upload platform cards do not expose unselected internal-first platform cards", () => {
  const visibleCards = getUploadPlatformCardsByIds(["patreon", "youtube"]);

  assert.equal(visibleCards.some((item) => item.id === "instagram"), false);
  assert.equal(visibleCards.some((item) => item.id === "tiktok"), false);
  assert.equal(visibleCards.some((item) => item.id === "onlyfans"), false);
  assert.equal(UPLOAD_PLATFORM_CARDS.some((item) => item.id === "onlyfans"), false);
});
