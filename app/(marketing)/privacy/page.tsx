import type { Metadata } from "next";
import {
  LEGAL_COMPANY_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LAST_UPDATED,
  LegalBulletList,
  LegalCallout,
  LegalPage,
  type LegalPageSection,
} from "../_components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const sections: ReadonlyArray<LegalPageSection> = [
  {
    title: "Information We Collect",
    content: (
      <>
        <p>
          We collect information you provide directly to EarnSigma, information created through your use of the Services,
          and limited information collected automatically when you access the website, application, and related tools.
        </p>
        <LegalBulletList
          items={[
            "Account and contact information, such as your name, email address, company or creator-business name, account credentials, and support communications.",
            "Uploaded files and Customer Content, including CSV files, creator platform exports, audience and performance metrics, subscriber, tier, and revenue data, and related business information you choose to submit.",
            "Derived analytics and reports, including normalized datasets, dashboards, report outputs, summaries, scores, visualizations, and other analytics generated from your uploads.",
            "Billing and transaction information, such as plan selection, subscription status, invoices, billing contacts, payment records, and limited payment metadata provided by payment processors.",
            "Device, usage, and log information, such as IP address, browser type, operating system, timestamps, feature interactions, pages viewed, and error or diagnostic logs.",
            "Cookies and similar technologies used to remember preferences, support authentication, understand usage patterns, and improve performance and reliability.",
          ]}
        />
      </>
    ),
  },
  {
    title: "How We Use Information",
    content: (
      <>
        <p>We use information to run the Services responsibly across uploads, analytics generation, dashboards, subscriptions, support, and core operations.</p>
        <LegalBulletList
          items={[
            "Provide, operate, maintain, and improve the Services.",
            "Authenticate users, protect accounts, and maintain workspace security.",
            "Process uploads, normalize submitted data, and generate analytics, dashboards, reports, and related outputs.",
            "Provide customer support, respond to requests, and troubleshoot product issues.",
            "Send billing, subscription, service, and administrative communications.",
            "Detect, investigate, and prevent abuse, fraud, and other security issues.",
            "Comply with legal obligations and enforce our policies and agreements.",
            "Improve performance, reliability, product quality, and operational resilience.",
          ]}
        />
        <LegalCallout label="Important commitments" tone="teal">
          <p>EarnSigma does not sell Customer Content.</p>
          <p>EarnSigma does not use uploaded Customer Content to train public AI models.</p>
        </LegalCallout>
      </>
    ),
  },
  {
    title: "Benchmark Aggregation",
    content: (
      <>
        <p>
          We may aggregate anonymised, de-identified performance data derived from Customer Content to compute industry benchmark
          ranges used in our reports and analytics tools. This processing is described in our Terms of Service under
          the "Benchmark Data and Aggregation" section. Key privacy protections include:
        </p>
        <LegalBulletList
          items={[
            "No creator identifiers are retained in aggregated outputs.",
            "Cohorts require a minimum of 10 contributors before any aggregate is computed.",
            "Only statistical summaries (medians, ranges, percentiles) are surfaced, never individual values.",
            "You may opt out at any time by contacting us at the address below.",
          ]}
        />
      </>
    ),
  },
  {
    title: "How We Share Information",
    content: (
      <>
        <p>We share information only in limited circumstances necessary to operate the Services, respond to lawful requests, or complete a transaction or business event.</p>
        <LegalBulletList
          items={[
            "With service providers and vendors that help us host, secure, store, support, analyze, and bill for the Services, subject to contractual and operational safeguards.",
            "At your direction or with your permission, including when you ask us to provide support or coordinate with third-party tools or advisors.",
            "When required for legal, compliance, safety, fraud prevention, or security reasons.",
            "In connection with an actual or proposed merger, acquisition, financing, reorganization, sale of assets, or similar business transfer.",
          ]}
        />
      </>
    ),
  },
  {
    title: "Data Retention",
    content: (
      <p>
        We retain information for as long as reasonably necessary to provide the Services, preserve account history and report access,
        support troubleshooting and customer requests, maintain security, and satisfy legal, accounting, tax, or compliance obligations.
        Retention periods may vary based on the nature of the data, the status of your account, and our operational needs.
      </p>
    ),
  },
  {
    title: "Data Security",
    content: (
      <p>
        We use reasonable administrative, technical, and organizational safeguards designed to protect information from unauthorized access,
        loss, misuse, alteration, or disclosure. No method of transmission or storage is completely secure, and we cannot guarantee absolute
        security.
      </p>
    ),
  },
  {
    title: "Your Choices and Rights",
    content: (
      <>
        <p>
          Depending on where you are located and applicable law, you may have certain rights regarding your personal information. We honor
          these rights regardless of whether they are required in your jurisdiction.
        </p>
        <LegalBulletList
          items={[
            "Access — request a copy of the personal information we hold about you.",
            "Correction — ask us to correct inaccurate or incomplete information.",
            "Deletion — request that we delete your personal information, subject to certain legal and operational exceptions.",
            "Portability — request that we provide your personal information in a structured, machine-readable format where technically feasible.",
            "Restriction — ask us to limit how we process your information in certain circumstances.",
            "Objection — object to processing based on legitimate interests where applicable law permits.",
            "Non-discrimination — we will not discriminate against you for exercising any of these rights.",
          ]}
        />
        <p>
          California residents may also exercise rights under the California Consumer Privacy Act (CCPA/CPRA), including the right to know,
          delete, and opt out of sale. We do not sell personal information.
        </p>
        <p>
          To submit a privacy or data request, contact{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-brand-accent-teal transition hover:text-white">
            {LEGAL_CONTACT_EMAIL}
          </a>
          . We will respond within 30 days or as required by applicable law. We may need to verify your identity before completing a request.
        </p>
      </>
    ),
  },
  {
    title: "Data Breach Notification",
    content: (
      <p>
        In the event of a security incident involving your personal information, we will notify affected users and relevant authorities as
        required by applicable law. Where required, we will notify supervisory authorities within 72 hours of becoming aware of a breach.
        We will also notify affected individuals without undue delay when the breach is likely to result in a high risk to their rights and
        freedoms. Notifications will describe the nature of the incident, the categories of information involved, steps we are taking, and
        what you can do to protect yourself.
      </p>
    ),
  },
  {
    title: "Children's Privacy",
    content: (
      <p>
        The Services are not directed to children under 13, and we do not knowingly collect personal information from children under 13. If
        you believe a child has provided information to us, please contact us so we can review and address the situation.
      </p>
    ),
  },
  {
    title: "International Transfers",
    content: (
      <p>
        Information may be processed or stored in the United States and other jurisdictions where we or our service providers operate. Those
        jurisdictions may have data protection laws that differ from the laws of your location.
      </p>
    ),
  },
  {
    title: "Third-Party Services and Links",
    content: (
      <p>
        The Services may contain links to third-party websites, products, integrations, or payment services. Those third-party services are
        governed by their own terms and privacy policies, and we are not responsible for their practices.
      </p>
    ),
  },
  {
    title: "Changes to This Privacy Policy",
    content: (
      <p>
        We may update this Privacy Policy from time to time to reflect changes in the Services, legal requirements, or operational practices.
        If we make material changes, we may provide notice through the Services or by other appropriate means.
      </p>
    ),
  },
  {
    title: "Contact Us",
    content: (
      <>
        <p>If you have questions about this Privacy Policy or how EarnSigma handles information, contact us at:</p>
        <LegalCallout label="Contact Us" tone="blue">
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

export default function PrivacyPage() {
  return (
    <LegalPage
      pageKey="privacy"
      eyebrow="LEGAL"
      title="Privacy Policy"
      intro={
        <p>
          This Privacy Policy explains how EarnSigma collects, uses, discloses, retains, and protects information in connection with the
          Services.
        </p>
      }
      asideLabel="Document details"
      asideTitle="Current policy information"
      asideItems={[
        { label: "Effective Date", value: LEGAL_EFFECTIVE_DATE },
        { label: "Last Updated", value: LEGAL_LAST_UPDATED },
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
