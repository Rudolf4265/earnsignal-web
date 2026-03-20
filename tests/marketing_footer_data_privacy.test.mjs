import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const urlsModuleUrl = pathToFileURL(path.resolve("packages/config/src/urls.ts")).href;
const footerModuleUrl = pathToFileURL(path.resolve("packages/config/src/footer.ts")).href;
const dataPrivacyPagePath = path.resolve("app/(marketing)/data-privacy/page.tsx");
const marketingPagePath = path.resolve("app/(marketing)/page.tsx");

test("marketing footer includes Privacy, Terms, and Data Use & Privacy destinations", async () => {
  const { publicUrls } = await import(`${urlsModuleUrl}?t=${Date.now()}`);
  const { footerLinks } = await import(`${footerModuleUrl}?t=${Date.now()}`);

  assert.equal(publicUrls.dataPrivacy, "/data-privacy");
  assert.deepEqual(footerLinks, [
    { key: "privacy", href: "/privacy", label: "Privacy" },
    { key: "terms", href: "/terms", label: "Terms" },
    { key: "dataPrivacy", href: "/data-privacy", label: "Data Use & Privacy" },
  ]);
});

test("data privacy page keeps the marketing shell and trust copy", async () => {
  const source = await readFile(dataPrivacyPagePath, "utf8");

  assert.equal(source.includes("<MarketingShell>"), true);
  assert.equal(source.includes('data-testid="data-privacy-page-hero"'), true);
  assert.equal(source.includes("Clear, practical handling of your business data"), true);
  assert.equal(source.includes("Your business data stays yours"), true);
  assert.equal(source.includes("What data we use"), true);
  assert.equal(source.includes("How your data is stored"), true);
  assert.equal(source.includes("What we do not do"), true);
  assert.equal(source.includes("Retention and deletion"), true);
  assert.equal(source.includes("data only to provide the service"), true);
  assert.equal(source.includes("Uploaded files are not used to train public AI models."), true);
  assert.equal(source.includes("We do not sell your data"), true);
  assert.equal(source.includes("Storage is limited to product, reporting, and support needs."), true);
  assert.equal(source.includes("treated as confidential business information"), true);
});

test("marketing home page includes the trust strip and data privacy link", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes('data-testid="marketing-trust-strip"'), true);
  assert.equal(source.includes("Your data stays private"), true);
  assert.equal(
    source.includes("Used only to generate your reports and operate the service. Never sold. Never used to train public AI models."),
    true,
  );
  assert.equal(source.includes("Learn how we handle your data"), true);
  assert.equal(source.includes("href={publicUrls.dataPrivacy}"), true);
});
