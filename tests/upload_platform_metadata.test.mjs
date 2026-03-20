import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const metadataModuleUrl = pathToFileURL(path.resolve("src/lib/upload/platform-metadata.ts")).href;

const {
  getUploadPlatformCardsByIds,
  UPLOAD_PLATFORM_CARDS,
} = await import(`${metadataModuleUrl}?t=${Date.now()}`);

test("filtered upload platform cards preserve the existing visible label order", () => {
  const visibleCards = getUploadPlatformCardsByIds(["youtube", "patreon", "substack"]);

  assert.deepEqual(
    visibleCards.map((item) => item.id),
    ["patreon", "substack", "youtube"],
  );
  assert.deepEqual(
    visibleCards.map((item) => item.label),
    ["Patreon", "Substack", "YouTube"],
  );
});

test("filtered upload platform cards do not expose unselected platform cards", () => {
  const visibleCards = getUploadPlatformCardsByIds(["patreon", "youtube"]);

  assert.equal(visibleCards.some((item) => item.id === "instagram"), false);
  assert.equal(visibleCards.some((item) => item.id === "onlyfans"), false);
  assert.equal(UPLOAD_PLATFORM_CARDS.some((item) => item.id === "onlyfans"), false);
});
