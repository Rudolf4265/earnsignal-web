import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const marketingPagePath = path.resolve("app/(marketing)/page.tsx");
const marketingSectionsPath = path.resolve("app/(marketing)/_components/marketing-sections.tsx");
const featuresPagePath = path.resolve("app/(marketing)/features/page.tsx");

test("marketing hero keeps the private business diagnosis positioning", async () => {
  const source = await readFile(marketingPagePath, "utf8");

  assert.equal(source.includes("Know exactly what&apos;s driving your income"), true);
  assert.equal(source.includes("and what&apos;s quietly hurting it."), true);
  assert.equal(source.includes("Diagnosis, not another dashboard."), true);
  assert.equal(source.includes("Get My Free Preview"), true);
  assert.equal(source.includes("Patreon, Substack, YouTube, Instagram, and TikTok"), true);
  assert.equal(source.includes("private business diagnosis with clear next steps"), true);
  assert.equal(source.includes("No spreadsheet stitching"), true);
  assert.equal(source.includes("Confirm your data before payment"), true);
  assert.equal(source.includes("Only your own exports are used"), true);
  assert.equal(source.includes("upload anything"), false);
});

test("supported-today section is visual, logo-based, and includes a non-supported Snapchat roadmap card", async () => {
  const source = await readFile(marketingSectionsPath, "utf8");

  assert.equal(source.includes("SUPPORTED TODAY"), true);
  assert.equal(source.includes("Your data is already there."), true);
  assert.equal(source.includes("No new integrations. No API keys. Just export what you already have."), true);
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

test("homepage sample output and early diagnostics align with the sample-report information architecture", async () => {
  const [homeSource, sectionsSource, featuresSource] = await Promise.all([
    readFile(marketingPagePath, "utf8"),
    readFile(marketingSectionsPath, "utf8"),
    readFile(featuresPagePath, "utf8"),
  ]);

  assert.equal(homeSource.includes("What a real EarnSigma report actually shows"), true);
  assert.equal(homeSource.includes("Plain language. Specific findings. Not just data"), true);
  assert.equal(homeSource.includes("Anonymized example findings"), true);
  assert.equal(homeSource.includes("You&apos;re losing 42% of churn from your $8 tier."), true);
  assert.equal(homeSource.includes("Your top 5% of supporters drive 46% of revenue."), true);
  assert.equal(homeSource.includes("Raising a mid-tier offer could increase revenue by +18%."), true);
  assert.equal(homeSource.includes("<MarketingDataRevealsSection />"), true);
  assert.equal(homeSource.includes("<MarketingSupportedTodaySection />"), true);
  assert.equal(sectionsSource.includes("EXAMPLE DIAGNOSTICS"), true);
  assert.equal(sectionsSource.includes("What creators usually discover"), true);
  assert.equal(sectionsSource.includes("Example signal"), true);
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
