import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const metadataModuleUrl = pathToFileURL(path.resolve("src/lib/upload/platform-metadata.ts")).href;

const {
  DIRECT_FAN_PLATFORM_CARD_ID,
  DIRECT_FAN_PLATFORMS,
  UPLOAD_PLATFORM_CARDS,
  groupPlatformCards,
  resolveDirectFanBackendId,
} = await import(`${metadataModuleUrl}?t=${Date.now()}`);

test("platform metadata groups cards into supported, creator, and additional sections", () => {
  const grouped = groupPlatformCards();

  assert.deepEqual(
    grouped.map((section) => section.label),
    ["Supported", "Creator Platforms", "Additional Platforms"],
  );
  assert.deepEqual(
    grouped.find((section) => section.category === "supported")?.items.map((item) => item.id),
    ["patreon", "substack"],
  );
  assert.deepEqual(
    grouped.find((section) => section.category === "creator")?.items.map((item) => item.id),
    ["youtube", "instagram", "tiktok"],
  );
  assert.deepEqual(
    grouped.find((section) => section.category === "additional")?.items.map((item) => item.id),
    [DIRECT_FAN_PLATFORM_CARD_ID],
  );
  assert.equal(UPLOAD_PLATFORM_CARDS.some((item) => item.id === "onlyfans"), false);
});

test("supported platform metadata keeps Patreon and Substack selectable", () => {
  const selectableIds = UPLOAD_PLATFORM_CARDS.filter((item) => item.available).map((item) => item.id);
  assert.equal(selectableIds.includes("patreon"), true);
  assert.equal(selectableIds.includes("substack"), true);
});

test("direct-fan mapping preserves onlyfans backend identifier", () => {
  assert.equal(resolveDirectFanBackendId("onlyfans"), "onlyfans");
});

test("coming-soon platform metadata stays non-selectable", () => {
  const youtube = UPLOAD_PLATFORM_CARDS.find((item) => item.id === "youtube");
  const instagram = UPLOAD_PLATFORM_CARDS.find((item) => item.id === "instagram");
  const tiktok = UPLOAD_PLATFORM_CARDS.find((item) => item.id === "tiktok");
  const fansly = DIRECT_FAN_PLATFORMS.find((item) => item.id === "fansly");
  const fanfix = DIRECT_FAN_PLATFORMS.find((item) => item.id === "fanfix");

  assert.equal(youtube?.available, false);
  assert.equal(instagram?.available, false);
  assert.equal(tiktok?.available, false);
  assert.equal(fansly?.available, false);
  assert.equal(fanfix?.available, false);
});

