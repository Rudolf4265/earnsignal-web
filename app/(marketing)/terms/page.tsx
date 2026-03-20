import type { Metadata } from "next";
import {
  LEGAL_COMPANY_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_PLACEHOLDER_DATE,
  LegalBulletList,
  LegalCallout,
  LegalPage,
  type LegalPageSection,
} from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
};

const sections: ReadonlyArray<LegalPageSection> = [
  {
    title: "Eligibility and Accounts",
    content: (
      <>
        <p>
          You must be at least 18 years old and capable of forming a binding contract to use the Services. You agree to provide accurate,
          current, and complete account information and to keep that information updated.
        </p>
        <p>
          You are responsible for safeguarding your login credentials, for all activity that occurs under your account, and for promptly
          notifying us of any unauthorized use or security incident involving your account.
        </p>
      </>
    ),
  },
  {
    title: "The Services",
    content: (
      <>
        <p>
          EarnSigma provides software tools for uploads, creator and business analytics, dashboards, reports, and related website,
          application, and support services. The Services may evolve over time and may include automated or AI-assisted product functionality.
        </p>
        <p>
          We may change, update, suspend, or discontinue any part of the Services at any time, including features, limits, interfaces, or
          integrations.
        </p>
      </>
    ),
  },
  {
    title: "Subscription Plans, Billing, and Payments",
    content: (
      <>
        <p>Certain features may require a paid plan or separate purchase. By purchasing a plan, you agree to the pricing, limits, and billing terms presented at the time of purchase.</p>
        <LegalBulletList
          items={[
            "You agree to pay all applicable fees, taxes, and other charges associated with your plan or purchase.",
            "Where applicable, you authorize recurring billing using your selected payment method until you cancel in accordance with the applicable plan terms.",
            "Fees are billed in advance unless otherwise stated at the time of purchase.",
            "Payments are non-refundable except where required by law.",
            "Plan features, usage limits, and entitlements vary by tier and may change prospectively with notice.",
            "If a payment fails or remains overdue, we may suspend or terminate access to paid features.",
          ]}
        />
      </>
    ),
  },
  {
    title: "Customer Content",
    content: (
      <>
        <p>
          You retain ownership of Customer Content that you upload, submit, or otherwise make available through the Services. As between you
          and us, your uploaded files, exports, business data, and related materials remain yours.
        </p>
        <p>
          You grant Oakline Ventures LLC a limited, non-exclusive, worldwide license to host, store, process, reproduce, display, create
          derivative outputs from, and otherwise use Customer Content solely as necessary to operate the Services, process uploads, generate
          reports and analytics, maintain service integrity, provide support, comply with law, and enforce these Terms.
        </p>
        <p>You represent and warrant that you have all rights, permissions, and lawful authority needed to provide Customer Content to the Services.</p>
      </>
    ),
  },
  {
    title: "Our Intellectual Property",
    content: (
      <p>
        The Services, including the software, design, workflows, analytics presentation, branding, and related materials, are owned by
        Oakline Ventures LLC or its licensors and are protected by intellectual property and other applicable laws. Except for the limited
        rights expressly granted in these Terms, no rights are transferred to you.
      </p>
    ),
  },
  {
    title: "Acceptable Use",
    content: (
      <>
        <p>You may not use the Services in a way that is unlawful, abusive, or harmful to the Services, other users, or third parties.</p>
        <LegalBulletList
          items={[
            "Use the Services for unlawful, fraudulent, infringing, or deceptive activity.",
            "Upload or transmit malware, malicious code, or harmful content.",
            "Access or attempt to access systems, accounts, or data without authorization.",
            "Interfere with or disrupt the Services, networks, or security protections.",
            "Scrape, reverse engineer, decompile, or otherwise attempt to derive source code or underlying models except as permitted by law.",
            "Infringe, misappropriate, or violate the rights of others.",
            "Resell, sublicense, or provide unauthorized third-party access to the Services.",
            "Use improper access to build, benchmark, or train a competing product or service.",
          ]}
        />
      </>
    ),
  },
  {
    title: "AI and Automated Features",
    content: (
      <>
        <p>
          The Services may include AI-assisted or automated features that support analytics generation, report creation, summarization, or
          other product functionality. You are responsible for reviewing outputs and exercising judgment before relying on them for business,
          financial, or operational decisions.
        </p>
        <p>Uploaded Customer Content is not used to train public AI models unless we clearly disclose otherwise and provide updated terms or notices.</p>
      </>
    ),
  },
  {
    title: "Beta Features",
    content: (
      <p>
        We may offer features identified as beta, preview, pilot, or similar. Beta features may be incomplete, changed, suspended, or
        discontinued at any time and are provided as-is.
      </p>
    ),
  },
  {
    title: "Confidentiality",
    content: (
      <p>
        We treat Customer Content as confidential business information and limit access to it based on operational need, support, security,
        compliance, and service delivery requirements, subject to our Privacy Policy and the use of subprocessors and infrastructure providers
        that help us operate the Services.
      </p>
    ),
  },
  {
    title: "Suspension and Termination",
    content: (
      <>
        <p>
          We may suspend or terminate your access to some or all of the Services if you violate these Terms, fail to pay amounts due, create
          legal, security, or operational risk, or where suspension or termination is required by law.
        </p>
        <p>
          You may stop using the Services at any time. Upon termination, provisions that by their nature should survive will continue to
          apply, including provisions relating to payment obligations, intellectual property, disclaimers, limitation of liability,
          indemnification, governing law, and dispute resolution.
        </p>
      </>
    ),
  },
  {
    title: "Disclaimers",
    content: (
      <>
        <p>The Services are designed to support analysis and decision-making, but they are not a guarantee of outcomes, performance, or results.</p>
        <LegalCallout label="Disclaimer" tone="default">
          <p className="font-medium uppercase tracking-[0.04em] text-white">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
            WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE,
            ACCURATE, COMPLETE, SECURE, OR FIT FOR A PARTICULAR PURPOSE, AND WE DO NOT GUARANTEE ANY BUSINESS, REVENUE, OR STRATEGIC
            OUTCOME.
          </p>
        </LegalCallout>
      </>
    ),
  },
  {
    title: "Limitation of Liability",
    content: (
      <>
        <p>To the fullest extent permitted by law, our liability is limited so the Services can be offered on a commercially reasonable basis.</p>
        <LegalCallout label="Liability Cap" tone="default">
          <p className="font-medium uppercase tracking-[0.04em] text-white">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OAKLINE VENTURES LLC AND ITS AFFILIATES, LICENSORS, AND SERVICE PROVIDERS WILL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS,
            REVENUE, DATA, GOODWILL, OR BUSINESS INTERRUPTION. OUR AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE
            SERVICES WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID FOR THE SERVICES IN THE 12 MONTHS BEFORE THE CLAIM AROSE OR $100.
          </p>
        </LegalCallout>
      </>
    ),
  },
  {
    title: "Indemnification",
    content: (
      <p>
        You will defend, indemnify, and hold harmless Oakline Ventures LLC, EarnSigma, and their officers, directors, employees, contractors,
        and service providers from and against claims, liabilities, damages, losses, and expenses arising out of or relating to your Customer
        Content, your use of the Services, or your violation of these Terms or applicable law.
      </p>
    ),
  },
  {
    title: "Governing Law and Disputes",
    content: (
      <p>
        These Terms and any dispute arising out of or relating to the Services will be governed by the laws of [State], without regard to its
        conflict of laws principles. The parties agree to the exclusive jurisdiction and venue of the state or federal courts located in
        [County, State].
      </p>
    ),
  },
  {
    title: "Changes to These Terms",
    content: (
      <p>
        We may update these Terms from time to time. Updated Terms will become effective when posted or as otherwise indicated. Your continued
        use of the Services after an update becomes effective constitutes acceptance of the updated Terms.
      </p>
    ),
  },
  {
    title: "Contact",
    content: (
      <>
        <p>If you have questions about these Terms or the Services, contact us at:</p>
        <LegalCallout label="Contact" tone="blue">
          <p className="font-medium text-white">{LEGAL_COMPANY_NAME}</p>
          <p>
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-brand-accent-teal transition hover:text-white">
              {LEGAL_CONTACT_EMAIL}
            </a>
          </p>
        </LegalCallout>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      pageKey="terms"
      eyebrow="LEGAL"
      title="Terms of Service"
      intro={
        <p>
          These Terms govern access to and use of the EarnSigma website, application, analytics tools, uploads, reports, and related services
          offered by Oakline Ventures LLC.
        </p>
      }
      asideLabel="Document details"
      asideTitle="Current terms information"
      asideItems={[
        { label: "Effective Date", value: LEGAL_PLACEHOLDER_DATE },
        { label: "Last Updated", value: LEGAL_PLACEHOLDER_DATE },
        { label: "Company", value: LEGAL_COMPANY_NAME },
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
