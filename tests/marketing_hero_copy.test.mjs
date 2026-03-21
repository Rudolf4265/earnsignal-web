import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const marketingPagePath = path.resolve("app/(marketing)/page.tsx");

test("marketing hero headline reflects real export positioning", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  // Headline is split across two <span> blocks
  assert.equal(source.includes("Turn your creator exports"), true);
  assert.equal(source.includes("into one clear business report."), true);
  assert.equal(source.includes("See what public"), false);
  assert.equal(source.includes("creator stats miss"), false);
});

test("marketing hero supporting copy names all five supported platforms", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes("Patreon, Substack, YouTube, Instagram, and TikTok"), true);
  assert.equal(source.includes("one report"), true);
  assert.equal(source.includes("revenue, subscriber growth, platform mix, risk, and growth opportunities"), true);
});

test("marketing hero sub-badge reflects no-stitching positioning", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes("No spreadsheet stitching"), true);
  assert.equal(source.includes("Upload real exports"), true);
  assert.equal(source.includes("One combined report"), true);
  assert.equal(source.includes("Private workspace · Real exports · Actionable diagnostics"), false);
});

test("marketing how-it-works upload step mentions all five platforms", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes("Patreon, Substack, YouTube, Instagram, and TikTok"), true);
  assert.equal(source.includes("Patreon, Instagram, and other creator exports"), false);
});

test("marketing supported-today section is present with correct platform matrix", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes('data-testid="marketing-supported-today"'), true);
  assert.equal(source.includes("SUPPORTED TODAY"), true);
  assert.equal(source.includes("Upload your real platform exports"), true);
  assert.equal(source.includes("Support is limited to specific export formats for each platform."), true);

  // All six supported export lanes
  assert.equal(source.includes('"Patreon"'), true);
  assert.equal(source.includes('"Substack"'), true);
  assert.equal(source.includes('"YouTube"'), true);
  assert.equal(source.includes('"Instagram"'), true);
  assert.equal(source.includes('"TikTok"'), true);

  // Format labels
  assert.equal(source.includes("CSV only"), true);
  assert.equal(source.includes("Allowlisted ZIP"), true);
  assert.equal(source.includes("Analytics CSV or Takeout ZIP"), true);
});

test("marketing value framing bullets are present", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes("Upload real exports from the platforms you already use"), true);
  assert.equal(source.includes("See revenue, subscriber trends, and platform mix in one report"), true);
  assert.equal(source.includes("Spot concentration risk and growth opportunities faster"), true);
});

test("marketing page contains no stale template-only or generic-upload language", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes("upload anything"), false);
  assert.equal(source.includes("generic ZIP"), false);
  assert.equal(source.includes("template-only"), false);
  assert.equal(source.includes("normalize your data"), false);
  assert.equal(source.includes("format your files"), false);
  assert.equal(source.includes("CSV fallback"), false);
});
