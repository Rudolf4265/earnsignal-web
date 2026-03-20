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

test("instagram and tiktok platform cards expose supported normalized-csv metadata", () => {
  const visibleCards = getUploadPlatformCardsByIds(["instagram", "tiktok"]);

  assert.deepEqual(
    visibleCards.map((item) => ({
      id: item.id,
      label: item.label,
      subtitle: item.subtitle,
      importMode: item.importMode,
      available: item.available,
      guidance: item.guidance,
    })),
    [
      {
        id: "instagram",
        label: "Instagram Performance",
        subtitle: "Template-based normalized CSV import",
        importMode: "normalized_csv",
        available: true,
        guidance: "Upload a template-based normalized Instagram performance CSV.",
      },
      {
        id: "tiktok",
        label: "TikTok Performance",
        subtitle: "Template-based normalized CSV import",
        importMode: "normalized_csv",
        available: true,
        guidance: "Upload a template-based normalized TikTok performance CSV.",
      },
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
