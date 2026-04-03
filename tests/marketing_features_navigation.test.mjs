import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const urlsPath = path.resolve("packages/config/src/urls.ts");
const navPath = path.resolve("packages/config/src/nav.ts");
const shellPath = path.resolve("app/(marketing)/_components/marketing-shell.tsx");
const featuresPagePath = path.resolve("app/(marketing)/features/page.tsx");
const homePagePath = path.resolve("app/(marketing)/page.tsx");

test("marketing nav routes Features to its dedicated page and keeps Pricing/About stable", async () => {
  const [urlsSource, navSource, shellSource] = await Promise.all([
    readFile(urlsPath, "utf8"),
    readFile(navPath, "utf8"),
    readFile(shellPath, "utf8"),
  ]);

  assert.equal(urlsSource.includes('features: "/features"'), true);
  assert.equal(navSource.includes('{ key: "features", href: publicUrls.features, label: "Features" }'), true);
  assert.equal(navSource.includes('{ key: "pricing", href: publicUrls.pricing, label: "Pricing" }'), true);
  assert.equal(navSource.includes('{ key: "about", href: `${publicUrls.marketingHome}#about`, label: "About" }'), true);
  assert.equal(navSource.includes('#features'), false);
  assert.equal(shellSource.includes("{siteNavItems.map((item) => ("), true);
});

test("features page owns the richer product explanation while the homepage no longer anchors to it", async () => {
  const [featuresSource, homeSource] = await Promise.all([
    readFile(featuresPagePath, "utf8"),
    readFile(homePagePath, "utf8"),
  ]);

  assert.equal(featuresSource.includes('title: "Features - EarnSigma"'), true);
  assert.equal(featuresSource.includes('data-testid="marketing-features-page"'), true);
  assert.equal(featuresSource.includes("See what EarnSigma actually helps you understand"), true);
  assert.equal(featuresSource.includes("From subscriber loss and income concentration to growth signals and next actions"), true);
  assert.equal(featuresSource.includes("business, clearly explained."), true);
  assert.equal(featuresSource.includes('data-testid="marketing-features-mid-cta"'), true);
  assert.equal(featuresSource.includes("Start with your first report"), true);
  assert.equal(featuresSource.includes("href={publicUrls.pricing}"), true);
  assert.equal(featuresSource.includes("Turn your data into a private business diagnosis"), true);

  assert.equal(homeSource.includes('id="features"'), false);
  assert.equal(homeSource.includes("What your data reveals about your business"), false);
  assert.equal(homeSource.includes("One workspace. Two lenses."), false);
});
