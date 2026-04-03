import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const marketingPagePath = path.resolve("app/(marketing)/page.tsx");
const marketingSectionsPath = path.resolve("app/(marketing)/_components/marketing-sections.tsx");
const featuresPagePath = path.resolve("app/(marketing)/features/page.tsx");

test("marketing hero keeps the private business diagnosis positioning", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes("Know what&apos;s driving your income,"), true);
  assert.equal(source.includes("Stop guessing what&apos;s driving your income."), true);
  assert.equal(source.includes("Generate My Private Report"), true);
  assert.equal(source.includes("Patreon, Substack, YouTube, Instagram, and TikTok"), true);
  assert.equal(source.includes("clear, private business diagnosis"), true);
  assert.equal(source.includes("No spreadsheet stitching"), true);
  assert.equal(source.includes("upload anything"), false);
});

test("supported-today section is visual, logo-based, and includes a non-supported Snapchat roadmap card", async () => {
  const source = await readFile(marketingSectionsPath, "utf8");

  assert.equal(source.includes("SUPPORTED TODAY"), true);
  assert.equal(source.includes("Built around the platforms your business runs on"), true);
  assert.equal(source.includes("No new tools. No new workflows. Just your existing data."), true);
  assert.equal(source.includes("Support is currently limited to specific export formats by platform."), true);

  assert.equal(source.includes('icon: "/platforms/patreon.svg"'), true);
  assert.equal(source.includes('icon: "/platforms/substack.svg"'), true);
  assert.equal(source.includes('icon: "/platforms/youtube.png"'), true);
  assert.equal(source.includes('icon: "/platforms/instagram.svg"'), true);
  assert.equal(source.includes('icon: "/platforms/tiktok.svg"'), true);
  assert.equal(source.includes('icon: "/platforms/snapchat.svg"'), true);

  assert.equal(source.includes('platform: "Snapchat"'), true);
  assert.equal(source.includes('description: "Audience & performance data"'), true);
  assert.equal(source.includes('format: "Coming soon"'), true);
  assert.equal(source.includes('note: "Expanding platform support"'), true);
  assert.equal(source.includes("Coming Soon"), true);
  assert.equal(source.includes("Expanding platform support"), true);

  assert.equal(source.includes("Upload real exports from the platforms you already use"), false);
  assert.equal(source.includes("See income drivers, subscriber health, and platform risk in one report"), false);
  assert.equal(source.includes("Spot concentration risk and growth opportunities faster"), false);
  assert.equal(source.includes("Upload your exports. See the patterns public tools cannot surface."), false);
});

test("homepage sample output includes a narrative report excerpt and the moved product-depth sections now live on the Features page", async () => {
  const [homeSource, featuresSource] = await Promise.all([
    readFile(marketingPagePath, "utf8"),
    readFile(featuresPagePath, "utf8"),
  ]);

  assert.equal(homeSource.includes("What a real EarnSigma report sounds like"), true);
  assert.equal(homeSource.includes("Not just charts. Clear business findings based on your data."), true);
  assert.equal(homeSource.includes("You&apos;re losing 42% of churn from your $8 tier."), true);
  assert.equal(homeSource.includes("Your top 5% of supporters drive 46% of revenue."), true);
  assert.equal(homeSource.includes("Raising a mid-tier offer could increase revenue by +18%."), true);
  assert.equal(homeSource.includes("<MarketingSupportedTodaySection />"), true);
  assert.equal(homeSource.includes("What your data reveals about your business"), false);
  assert.equal(homeSource.includes("One workspace. Two lenses."), false);
  assert.equal(homeSource.includes('id="features"'), false);

  assert.equal(featuresSource.includes('data-testid="marketing-features-page"'), true);
  assert.equal(featuresSource.includes("See what EarnSigma actually helps you understand"), true);
  assert.equal(featuresSource.includes("From subscriber loss and income concentration to growth signals and next actions"), true);
  assert.equal(featuresSource.includes("business, clearly explained."), true);
  assert.equal(featuresSource.includes("<MarketingDataRevealsSection />"), true);
  assert.equal(featuresSource.includes('data-testid="marketing-features-mid-cta"'), true);
  assert.equal(featuresSource.includes("Start with your first report"), true);
  assert.equal(featuresSource.includes("<MarketingTwoLensesSection />"), true);
  assert.equal(featuresSource.includes("Generate My Private Report"), true);
  assert.equal(featuresSource.includes("See Pricing"), true);
});
