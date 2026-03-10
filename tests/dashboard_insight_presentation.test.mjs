import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const presentationModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/insight-presentation.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${presentationModuleUrl}?t=${seed}`);
}

test("insight presentation maps positive variant to success visuals", async () => {
  const { getInsightCardPresentation } = await loadModule(Date.now() + 1);
  const presentation = getInsightCardPresentation("positive");

  assert.equal(presentation.badgeLabel, "Positive");
  assert.equal(presentation.badgeVariant, "good");
  assert.equal(presentation.cardClassName.includes("emerald"), true);
});

test("insight presentation maps warning variant to caution visuals", async () => {
  const { getInsightCardPresentation } = await loadModule(Date.now() + 2);
  const presentation = getInsightCardPresentation("warning");

  assert.equal(presentation.badgeLabel, "Warning");
  assert.equal(presentation.badgeVariant, "warn");
  assert.equal(presentation.cardClassName.includes("amber"), true);
});

test("insight presentation maps neutral variant to neutral visuals", async () => {
  const { getInsightCardPresentation } = await loadModule(Date.now() + 3);
  const presentation = getInsightCardPresentation("neutral");

  assert.equal(presentation.badgeLabel, "Neutral");
  assert.equal(presentation.badgeVariant, "neutral");
  assert.equal(presentation.cardClassName.includes("brand"), true);
});
