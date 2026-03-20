import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataPrivacyPagePath = path.resolve("app/(marketing)/data-privacy/page.tsx");
const footerSourcePath = path.resolve("packages/config/src/footer.ts");
const legalComponentPath = path.resolve("app/(marketing)/_components/legal-page.tsx");
const privacyPagePath = path.resolve("app/(marketing)/privacy/page.tsx");
const marketingPagePath = path.resolve("app/(marketing)/page.tsx");
const termsPagePath = path.resolve("app/(marketing)/terms/page.tsx");
const trustMicrocopyPath = path.resolve("src/components/ui/trust-microcopy.tsx");
const urlsSourcePath = path.resolve("packages/config/src/urls.ts");

test("marketing footer includes Privacy, Terms, and Data Use & Privacy destinations", async () => {
  const urlsSource = await readFile(urlsSourcePath, "utf8");
  const footerSource = await readFile(footerSourcePath, "utf8");

  assert.equal(urlsSource.includes('dataPrivacy: "/data-privacy"'), true);
  assert.equal(footerSource.includes('{ key: "privacy", href: publicUrls.privacy, label: "Privacy" }'), true);
  assert.equal(footerSource.includes('{ key: "terms", href: publicUrls.terms, label: "Terms" }'), true);
  assert.equal(footerSource.includes('{ key: "dataPrivacy", href: publicUrls.dataPrivacy, label: "Data Use & Privacy" }'), true);
});

test("privacy page includes core policy copy and contact routing", async () => {
  const source = await readFile(privacyPagePath, "utf8");
  const legalSource = await readFile(legalComponentPath, "utf8");

  assert.equal(source.includes("<LegalPage"), true);
  assert.equal(source.includes('pageKey="privacy"'), true);
  assert.equal(source.includes("Privacy Policy"), true);
  assert.equal(source.includes("EarnSigma does not sell Customer Content."), true);
  assert.equal(source.includes("EarnSigma does not use uploaded Customer Content to train public AI models."), true);
  assert.equal(source.includes("LEGAL_COMPANY_NAME"), true);
  assert.equal(source.includes("LEGAL_CONTACT_EMAIL"), true);
  assert.equal(legalSource.includes('LEGAL_COMPANY_NAME = "Oakline Ventures LLC"'), true);
  assert.equal(legalSource.includes('LEGAL_CONTACT_EMAIL = "admin@earnsigma.com"'), true);
});

test("terms page includes title and legal contact details", async () => {
  const source = await readFile(termsPagePath, "utf8");

  assert.equal(source.includes("<LegalPage"), true);
  assert.equal(source.includes('pageKey="terms"'), true);
  assert.equal(source.includes("Terms of Service"), true);
  assert.equal(source.includes("Oakline Ventures LLC"), true);
  assert.equal(source.includes("LEGAL_CONTACT_EMAIL"), true);
  assert.equal(source.includes("&quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;"), true);
});

test("data privacy page keeps the marketing shell and trust commitments", async () => {
  const source = await readFile(dataPrivacyPagePath, "utf8");

  assert.equal(source.includes("<LegalPage"), true);
  assert.equal(source.includes('pageKey="data-privacy"'), true);
  assert.equal(source.includes("Data Use & Privacy"), true);
  assert.equal(source.includes("Your business data stays yours"), true);
  assert.equal(source.includes("What data you upload to EarnSigma"), true);
  assert.equal(source.includes("What we use your data for"), true);
  assert.equal(source.includes("What we do not do"), true);
  assert.equal(source.includes("How long we keep data"), true);
  assert.equal(source.includes("We do not sell your uploaded business data."), true);
  assert.equal(source.includes("We do not use uploaded business data to train public AI models."), true);
  assert.equal(source.includes("LEGAL_CONTACT_EMAIL"), true);
  assert.equal(source.includes("treated as confidential business information"), true);
});

test("marketing home page includes the trust strip and data privacy link", async () => {
  const [source, trustSource] = await Promise.all([
    readFile(marketingPagePath, "utf8"),
    readFile(trustMicrocopyPath, "utf8"),
  ]);

  assert.equal(source.includes("<TrustMicrocopy"), true);
  assert.equal(source.includes('testId="marketing-trust-strip"'), true);
  assert.equal(source.includes("MARKETING_TRUST_MICROCOPY_BODY"), true);
  assert.equal(trustSource.includes('TRUST_MICROCOPY_HEADING = "Your data stays private"'), true);
  assert.equal(
    trustSource.includes(
      'MARKETING_TRUST_MICROCOPY_BODY =\n  "Used only to generate your reports and operate the service. Never sold. Never used to train public AI models."',
    ),
    true,
  );
  assert.equal(trustSource.includes('TRUST_MICROCOPY_LINK_TEXT = "Learn how we handle your data"'), true);
  assert.equal(trustSource.includes("href={publicUrls.dataPrivacy}"), true);
});
