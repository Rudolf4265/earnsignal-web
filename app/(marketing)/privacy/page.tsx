/**
 * DOC_VERSION: privacy_v1_aggressive_2026-03-03
 * SOURCE: ChatGPT drafted (processor framing + AI disclosure + retention).
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | EarnSigma",
  description: "Privacy Policy for EarnSigma (Oakline Ventures LLC).",
};

export default function PrivacyPage() {
  return (
    <main className="relative">
      <section className="mx-auto max-w-5xl px-6 py-14 lg:py-16">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-white">PRIVACY POLICY</h1>
          <p className="mt-2 text-sm text-white/70">
            <span className="font-medium text-white/80">Effective Date:</span> March 2026
          </p>
          <p className="mt-1 text-sm text-white/70">
            <span className="font-medium text-white/80">Company:</span> Oakline Ventures LLC (d/b/a EarnSigma)
          </p>
          <p className="mt-1 text-sm text-white/70">
            <span className="font-medium text-white/80">Contact:</span> admin@earnsigma.com
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-white/80">Contents</p>
              <nav className="mt-3 space-y-2 text-sm text-white/70">
                <Link href="#overview" className="block transition hover:text-white">1. Overview</Link>
                <Link href="#information-we-collect" className="block transition hover:text-white">2. Information We Collect</Link>
                <Link href="#how-we-use-information" className="block transition hover:text-white">3. How We Use Information</Link>
                <Link href="#data-sharing-and-disclosure" className="block transition hover:text-white">4. Data Sharing and Disclosure</Link>
                <Link href="#ai-and-automated-processing" className="block transition hover:text-white">5. AI and Automated Processing</Link>
                <Link href="#data-retention" className="block transition hover:text-white">6. Data Retention</Link>
                <Link href="#data-security" className="block transition hover:text-white">7. Data Security</Link>
                <Link href="#international-users" className="block transition hover:text-white">8. International Users</Link>
                <Link href="#user-rights" className="block transition hover:text-white">9. User Rights</Link>
                <Link href="#childrens-privacy" className="block transition hover:text-white">10. Children’s Privacy</Link>
                <Link href="#limitation-of-liability" className="block transition hover:text-white">11. Limitation of Liability</Link>
                <Link href="#changes-to-this-privacy-policy" className="block transition hover:text-white">12. Changes to This Privacy Policy</Link>
                <Link href="#contact-information" className="block transition hover:text-white">13. Contact Information</Link>
              </nav>
            </div>
          </aside>

          <article className="prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-p:text-white/80 prose-li:text-white/80 prose-strong:text-white prose-a:text-cyan-300 hover:prose-a:text-cyan-200">
        <h2 id="overview">1. Overview</h2>
        <p>Oakline Ventures LLC, an Illinois limited liability company doing business as EarnSigma (“Company,” “we,” “us,” or “our”), operates a revenue analytics platform for creators.</p>
        <p>This Privacy Policy explains how we collect, use, disclose, and protect information when you access or use the EarnSigma platform (the “Service”).</p>
        <p>By using the Service, you agree to this Privacy Policy.</p>

        <h2 id="information-we-collect">2. Information We Collect</h2>
        <h3 id="account-information">2.1 Account Information</h3>
        <p>When you create an account, we may collect:</p>
        <ul>
          <li>Name</li>
          <li>Email address</li>
          <li>Account credentials</li>
          <li>Subscription plan information</li>
          <li>Communication preferences</li>
        </ul>
        <p>Authentication may be processed through third-party identity providers.</p>

        <h3 id="billing-information">2.2 Billing Information</h3>
        <p>Payments are processed through third-party payment processors (such as Stripe).</p>
        <p>We do not store full credit card numbers. We may store limited billing metadata such as:</p>
        <ul>
          <li>Subscription status</li>
          <li>Payment timestamps</li>
          <li>Invoice identifiers</li>
        </ul>

        <h3 id="uploaded-revenue-data">2.3 Uploaded Revenue Data</h3>
        <p>Users may upload CSV or similar files containing revenue-related data, including:</p>
        <ul>
          <li>Subscriber counts</li>
          <li>Revenue totals</li>
          <li>Pricing tiers</li>
          <li>Transaction timestamps</li>
          <li>Platform identifiers</li>
          <li>Other business analytics data</li>
        </ul>
        <p>You are solely responsible for ensuring you have lawful rights to upload and process this data.</p>
        <p>We act as a data processor with respect to uploaded data. You remain the data controller.</p>
        <p>We process uploaded data solely to provide analytics functionality.</p>

        <h3 id="automatically-collected-information">2.4 Automatically Collected Information</h3>
        <p>When you use the Service, we may collect:</p>
        <ul>
          <li>IP address</li>
          <li>Browser and device information</li>
          <li>Usage logs</li>
          <li>Session activity</li>
          <li>Error reports</li>
          <li>Performance metrics</li>
        </ul>

        <h2 id="how-we-use-information">3. How We Use Information</h2>
        <p>We use collected information to:</p>
        <ul>
          <li>Provide and operate the Service</li>
          <li>Generate analytics reports</li>
          <li>Improve functionality and performance</li>
          <li>Provide customer support</li>
          <li>Process subscriptions and billing</li>
          <li>Maintain security and prevent abuse</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>We do not sell personal information.</p>
        <p>We do not use uploaded revenue data for advertising.</p>

        <h2 id="data-sharing-and-disclosure">4. Data Sharing and Disclosure</h2>
        <p>We may share information only as necessary with:</p>
        <ul>
          <li>Hosting providers (e.g., Vercel)</li>
          <li>Database providers (e.g., Supabase/Postgres)</li>
          <li>Storage providers (e.g., Cloudflare R2 or compatible services)</li>
          <li>Payment processors (e.g., Stripe)</li>
          <li>Analytics and infrastructure services</li>
        </ul>
        <p>We do not share uploaded revenue data with third parties except as required to operate the Service or comply with legal obligations.</p>

        <h2 id="ai-and-automated-processing">5. AI and Automated Processing</h2>
        <p>If AI-assisted analysis features are enabled:</p>
        <ul>
          <li>Uploaded data may be processed using third-party AI infrastructure.</li>
          <li>Data is processed solely to generate analytical outputs.</li>
          <li>Uploaded data is not sold for training public AI models.</li>
          <li>We do not grant third parties rights to commercialize your uploaded data.</li>
        </ul>

        <h2 id="data-retention">6. Data Retention</h2>
        <p>We retain information:</p>
        <ul>
          <li>For as long as your account remains active</li>
          <li>As necessary to provide the Service</li>
          <li>As required by legal or regulatory obligations</li>
        </ul>
        <p>Upon account deletion, we will delete or anonymize uploaded data within a reasonable period, except where retention is legally required.</p>

        <h2 id="data-security">7. Data Security</h2>
        <p>We implement commercially reasonable safeguards including:</p>
        <ul>
          <li>Encrypted transmission (HTTPS)</li>
          <li>Access controls</li>
          <li>Secure hosting environments</li>
          <li>Authentication protections</li>
        </ul>
        <p>However, no system can guarantee absolute security. You acknowledge that you provide data at your own risk.</p>

        <h2 id="international-users">8. International Users</h2>
        <p>The Service is operated from the United States. If you access the Service from outside the U.S., you consent to transfer and processing of data in the United States.</p>

        <h2 id="user-rights">9. User Rights</h2>
        <p>Depending on your jurisdiction, you may request:</p>
        <ul>
          <li>Access to personal data</li>
          <li>Correction of inaccurate data</li>
          <li>Deletion of personal data</li>
          <li>Account termination</li>
        </ul>
        <p>Requests may be submitted to admin@earnsigma.com.</p>
        <p>We may require verification of identity before processing requests.</p>

        <h2 id="childrens-privacy">10. Children’s Privacy</h2>
        <p>The Service is not intended for individuals under 18. We do not knowingly collect personal information from children.</p>

        <h2 id="limitation-of-liability">11. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Oakline Ventures LLC shall not be liable for unauthorized access, data loss, or security breaches beyond its reasonable control.</p>
        <p>Use of the Service is at your own risk.</p>

        <h2 id="changes-to-this-privacy-policy">12. Changes to This Privacy Policy</h2>
        <p>We may update this Privacy Policy at any time.</p>
        <p>Material changes will be reflected by updating the Effective Date.</p>
        <p>Continued use of the Service constitutes acceptance of updates.</p>

        <h2 id="contact-information">13. Contact Information</h2>
        <p>
          Oakline Ventures LLC
          <br />
          Illinois, United States
          <br />
          admin@earnsigma.com
        </p>

          </article>
        </div>
      </section>
    </main>
  );
}
