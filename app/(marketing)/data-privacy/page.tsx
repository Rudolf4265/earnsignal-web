import type { Metadata } from "next";
import Link from "next/link";
import {
  LEGAL_CONTACT_EMAIL,
  LegalBulletList,
  LegalCallout,
  LegalPage,
  type LegalPageSection,
} from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Data Use & Privacy",
};

const sections: ReadonlyArray<LegalPageSection> = [
  {
    title: "Your business data stays yours",
    content: (
      <>
        <p>
          EarnSigma helps creators and creator-focused businesses turn uploaded data into analytics, dashboards, and reports. Your files
          remain your business data, and we use them to serve your workspace and outputs.
        </p>
        <p>
          This page is a plain-English summary. The full legal details live in our{" "}
          <Link href="/privacy" className="text-brand-accent-teal transition hover:text-white">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-brand-accent-teal transition hover:text-white">
            Terms of Service
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    title: "What data you upload to EarnSigma",
    content: (
      <>
        <p>What you upload depends on how you use the product, but it commonly includes creator and business reporting inputs such as:</p>
        <LegalBulletList
          items={[
            "Creator platform exports and related CSV files.",
            "Performance, engagement, and audience metrics.",
            "Subscriber, membership, tier, payout, or revenue data.",
            "Supporting business information used to validate inputs and generate reports.",
          ]}
        />
      </>
    ),
  },
  {
    title: "What we use your data for",
    content: (
      <>
        <p>We use uploaded data to run the product for you, not to repurpose it for unrelated commercial uses.</p>
        <LegalBulletList
          items={[
            "Validate and process uploads.",
            "Normalize, organize, and structure data for analysis.",
            "Generate dashboards, analytics, reports, and related outputs.",
            "Preserve report history and account outputs where applicable.",
            "Provide support and troubleshoot issues you report.",
            "Maintain service security, reliability, and operational integrity.",
          ]}
        />
      </>
    ),
  },
  {
    title: "What we do not do",
    content: (
      <>
        <p>There are a few clear lines in how EarnSigma handles uploaded business data:</p>
        <LegalBulletList
          items={[
            "We do not sell your uploaded business data.",
            "We do not share your private creator or business data with other customers.",
            "We do not use uploaded business data to train public AI models.",
            "We do not use uploaded files for advertising targeting.",
          ]}
        />
      </>
    ),
  },
  {
    title: "Who can access your data",
    content: (
      <>
        <p>Access is limited to the people and systems needed to run the service and support your account.</p>
        <LegalBulletList
          items={[
            "You and the authorized users on your account.",
            "Systems and infrastructure needed to host, process, secure, and deliver the service.",
            "Limited authorized personnel for support, troubleshooting, security, compliance, and core operations.",
          ]}
        />
      </>
    ),
  },
  {
    title: "How long we keep data",
    content: (
      <p>
        We retain uploaded files, derived analytics, and reports for as long as needed to deliver the service, preserve account history,
        respond to support or data requests, and meet legal, security, accounting, or compliance obligations.
      </p>
    ),
  },
  {
    title: "AI-related commitments",
    content: (
      <LegalCallout label="AI-related commitments" tone="teal">
        <p>Uploaded business data is used to serve your experience inside EarnSigma.</p>
        <p>It is not sold.</p>
        <p>It is not used to train public AI models unless we clearly disclose that separately.</p>
      </LegalCallout>
    ),
  },
  {
    title: "Your control",
    content: (
      <p>
        You decide what data to upload. You can stop uploading data, close your account subject to the applicable terms, or contact{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-brand-accent-teal transition hover:text-white">
          {LEGAL_CONTACT_EMAIL}
        </a>{" "}
        for data-related requests.
      </p>
    ),
  },
  {
    title: "Confidentiality commitment",
    content: (
      <LegalCallout label="Confidentiality commitment" tone="blue">
        <p>
          Uploaded creator performance, revenue, subscriber, and business files are treated as confidential business information and used
          only to provide and support the EarnSigma service.
        </p>
      </LegalCallout>
    ),
  },
];

export default function DataPrivacyPage() {
  return (
    <LegalPage
      pageKey="data-privacy"
      eyebrow="DATA & PRIVACY"
      title="Data Use & Privacy"
      intro={<p>Plain-English overview of how EarnSigma handles uploaded business and creator data.</p>}
      asideLabel="Trust summary"
      asideTitle="How we handle uploaded data"
      asideItems={[
        { label: "Data sales", value: "We do not sell uploaded business data." },
        { label: "AI training", value: "Uploaded business data is not used to train public AI models." },
        {
          label: "Contact",
          value: (
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-brand-accent-teal transition hover:text-white">
              {LEGAL_CONTACT_EMAIL}
            </a>
          ),
        },
      ]}
      sections={sections}
    />
  );
}
