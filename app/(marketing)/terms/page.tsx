/**
 * DOC_VERSION: terms_v1_aggressive_2026-03-03
 * SOURCE: ChatGPT drafted (founder-protective + arbitration + auto-renewal).
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | EarnSigma",
  description: "Terms of Service for EarnSigma (Oakline Ventures LLC).",
};

export default function TermsPage() {
  return (
    <main className="relative">
      <section className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          <div className="px-6 py-10 lg:px-10 lg:py-12">
            <header className="mb-10">
              <p className="text-xs font-semibold tracking-[0.18em] text-white/60">TERMS OF SERVICE</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Terms of Service
              </h1>
              <div className="mt-5 space-y-1 text-sm text-white/70">
                <p><span className="font-medium text-white/80">Effective Date:</span> March 2026</p>
                <p><span className="font-medium text-white/80">Company:</span> Oakline Ventures LLC (d/b/a EarnSigma)</p>
                <p><span className="font-medium text-white/80">Contact:</span> admin@earnsigma.com</p>
              </div>
            </header>

            <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="sticky top-24 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold tracking-wide text-white/80">Contents</p>
                  <nav className="mt-3 space-y-2 text-sm">
                    <Link href="#agreement-to-terms" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">1. Agreement to Terms</Link>
                    <Link href="#description-of-the-service" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">2. Description of the Service</Link>
                    <Link href="#eligibility" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">3. Eligibility</Link>
                    <Link href="#user-responsibilities" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">4. User Responsibilities</Link>
                    <Link href="#account-registration" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">5. Account Registration</Link>
                    <Link href="#subscription-billing" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">6. Subscription &amp; Billing</Link>
                    <Link href="#intellectual-property" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">7. Intellectual Property</Link>
                    <Link href="#data-processing-disclaimer" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">8. Data Processing Disclaimer</Link>
                    <Link href="#ai-processing-if-enabled" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">9. AI Processing (If Enabled)</Link>
                    <Link href="#disclaimer-of-warranties" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">10. Disclaimer of Warranties</Link>
                    <Link href="#limitation-of-liability" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">11. Limitation of Liability</Link>
                    <Link href="#indemnification" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">12. Indemnification</Link>
                    <Link href="#termination" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">13. Termination</Link>
                    <Link href="#governing-law" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">14. Governing Law</Link>
                    <Link href="#binding-arbitration" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">15. Binding Arbitration</Link>
                    <Link href="#changes-to-terms" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">16. Changes to Terms</Link>
                    <Link href="#contact-information" className="block rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/5 hover:text-white">17. Contact Information</Link>
                  </nav>
                </div>
              </aside>

              <article className="min-w-0">
                <div className="max-w-3xl">
                  <div className="prose prose-invert max-w-none prose-p:text-white/80 prose-li:text-white/80 prose-strong:text-white prose-a:text-cyan-300 hover:prose-a:text-cyan-200 prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:my-4 prose-p:leading-relaxed prose-li:my-2 prose-ul:my-4 prose-ol:my-4 prose-hr:my-10 prose-hr:border-white/10 prose-headings:scroll-mt-28">
        <h2 id="agreement-to-terms">1. Agreement to Terms</h2>
        <p>These Terms of Service (“Terms”) constitute a legally binding agreement between you (“User”, “you”) and Oakline Ventures LLC, an Illinois limited liability company, doing business as EarnSigma (“Company”, “we”, “us”).</p>
        <p>By accessing or using the EarnSigma platform (“Service”), you agree to be bound by these Terms. If you do not agree, you must not use the Service.</p>

        <h2 id="description-of-the-service">2. Description of the Service</h2>
        <p>EarnSigma provides analytical tools that process user-submitted revenue data to generate structured reports regarding:</p>
        <ul>
          <li>Revenue stability</li>
          <li>Churn velocity</li>
          <li>Tier migration</li>
          <li>Platform concentration and risk</li>
        </ul>
        <p>The Service is informational and analytical only.</p>

        <h3 id="no-professional-advice">No Professional Advice</h3>
        <p>The Service does <strong>not</strong> provide:</p>
        <ul>
          <li>Financial advice</li>
          <li>Investment advice</li>
          <li>Tax advice</li>
          <li>Legal advice</li>
          <li>Accounting advice</li>
          <li>Fiduciary services</li>
        </ul>
        <p>No fiduciary relationship is created. All decisions made based on outputs from the Service are solely your responsibility.</p>

        <h2 id="eligibility">3. Eligibility</h2>
        <p>You must be at least 18 years old to use the Service.</p>
        <p>You represent and warrant that you have the legal authority to upload and process all data submitted to the platform.</p>

        <h2 id="user-responsibilities">4. User Responsibilities</h2>
        <p>You agree:</p>
        <ul>
          <li>You own or have the lawful right to upload all data.</li>
          <li>Uploaded data does not violate any law or third-party rights.</li>
          <li>You will not attempt to reverse engineer, copy, or misuse the platform.</li>
          <li>You will not interfere with system integrity or security.</li>
          <li>You will not use the Service for unlawful purposes.</li>
        </ul>
        <p>You are solely responsible for the accuracy of all data uploaded.</p>

        <h2 id="account-registration">5. Account Registration</h2>
        <p>You are responsible for maintaining:</p>
        <ul>
          <li>Confidentiality of login credentials</li>
          <li>Accuracy of account information</li>
          <li>All activity under your account</li>
        </ul>
        <p>We are not liable for unauthorized account access resulting from your failure to secure credentials.</p>

        <h2 id="subscription-billing">6. Subscription &amp; Billing</h2>
        <h3 id="paid-plans">6.1 Paid Plans</h3>
        <p>Certain features require a paid subscription.</p>
        <p>Payments are processed by third-party providers such as Stripe. We do not store full payment card numbers.</p>

        <h3 id="automatic-renewal">6.2 Automatic Renewal</h3>
        <p>All paid subscriptions automatically renew at the end of each billing cycle unless canceled before renewal.</p>
        <p>By subscribing, you authorize recurring charges to your payment method until cancellation.</p>
        <p>You may cancel at any time via your account settings. Cancellation prevents future billing but does not entitle you to refunds for prior charges unless required by law.</p>

        <h3 id="pricing-changes">6.3 Pricing Changes</h3>
        <p>We may modify pricing upon reasonable notice. Continued use after such notice constitutes acceptance.</p>

        <h3 id="no-refund-policy">6.4 No Refund Policy</h3>
        <p>Except where required by law, subscription fees are non-refundable.</p>

        <h2 id="intellectual-property">7. Intellectual Property</h2>
        <p>The Service, including:</p>
        <ul>
          <li>Software</li>
          <li>Algorithms</li>
          <li>Analytical methodologies</li>
          <li>Visual reports</li>
          <li>Branding</li>
          <li>Design</li>
        </ul>
        <p>are the exclusive property of Oakline Ventures LLC.</p>
        <p>You retain ownership of uploaded data.</p>
        <p>You grant us a limited, non-exclusive license to process your data solely to provide the Service.</p>

        <h2 id="data-processing-disclaimer">8. Data Processing Disclaimer</h2>
        <p>We do not warrant:</p>
        <ul>
          <li>Accuracy of analytical outputs</li>
          <li>Completeness of reports</li>
          <li>Suitability for business decisions</li>
          <li>Business performance improvements</li>
        </ul>
        <p>Analytical outputs are dependent on the accuracy and completeness of user-submitted data.</p>

        <h2 id="ai-processing-if-enabled">9. AI Processing (If Enabled)</h2>
        <p>If AI-assisted analysis features are used:</p>
        <ul>
          <li>Data may be processed through third-party AI infrastructure</li>
          <li>Data is processed solely to provide analytics functionality</li>
          <li>Data is not sold for training external public AI models</li>
        </ul>

        <h2 id="disclaimer-of-warranties">10. Disclaimer of Warranties</h2>
        <p>THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.”</p>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING:</p>
        <ul>
          <li>IMPLIED WARRANTIES OF MERCHANTABILITY</li>
          <li>FITNESS FOR A PARTICULAR PURPOSE</li>
          <li>NON-INFRINGEMENT</li>
          <li>UNINTERRUPTED OR ERROR-FREE SERVICE</li>
        </ul>

        <h2 id="limitation-of-liability">11. Limitation of Liability</h2>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
        <p>OAKLINE VENTURES LLC SHALL NOT BE LIABLE FOR:</p>
        <ul>
          <li>INDIRECT DAMAGES</li>
          <li>INCIDENTAL DAMAGES</li>
          <li>CONSEQUENTIAL DAMAGES</li>
          <li>LOSS OF PROFITS</li>
          <li>LOSS OF BUSINESS</li>
          <li>LOSS OF DATA</li>
          <li>BUSINESS INTERRUPTION</li>
        </ul>
        <p>Total cumulative liability shall not exceed the greater of:</p>
        <ul>
          <li>$100 USD, OR</li>
          <li>The total fees paid by you in the six (6) months preceding the claim.</li>
        </ul>

        <h2 id="indemnification">12. Indemnification</h2>
        <p>You agree to indemnify, defend, and hold harmless Oakline Ventures LLC from any claims, liabilities, damages, losses, and expenses (including legal fees) arising from:</p>
        <ul>
          <li>Uploaded data</li>
          <li>Your use of the Service</li>
          <li>Violation of these Terms</li>
          <li>Violation of third-party rights</li>
        </ul>

        <h2 id="termination">13. Termination</h2>
        <p>We may suspend or terminate your account at our discretion for:</p>
        <ul>
          <li>Violation of these Terms</li>
          <li>Non-payment</li>
          <li>Security risks</li>
          <li>Abuse of the Service</li>
        </ul>
        <p>Upon termination, your right to use the Service ceases immediately.</p>

        <h2 id="governing-law">14. Governing Law</h2>
        <p>These Terms are governed by and construed under the laws of the State of Illinois, without regard to conflict of law principles.</p>

        <h2 id="binding-arbitration">15. Binding Arbitration</h2>
        <h3 id="agreement-to-arbitrate">15.1 Agreement to Arbitrate</h3>
        <p>Any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be resolved exclusively through binding arbitration.</p>
        <p>Arbitration shall be administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules.</p>
        <p>The arbitration shall take place in Illinois.</p>

        <h3 id="class-action-waiver">15.2 Class Action Waiver</h3>
        <p>YOU AGREE THAT ALL CLAIMS MUST BE BROUGHT IN AN INDIVIDUAL CAPACITY.</p>
        <p>YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION, COLLECTIVE ACTION, OR REPRESENTATIVE PROCEEDING.</p>

        <h3 id="small-claims-exception">15.3 Small Claims Exception</h3>
        <p>Either party may bring claims in small claims court if eligible.</p>

        <h3 id="arbitration-costs">15.4 Arbitration Costs</h3>
        <p>Each party shall bear its own costs unless otherwise determined by the arbitrator.</p>

        <h2 id="changes-to-terms">16. Changes to Terms</h2>
        <p>We may modify these Terms at any time. Continued use after updates constitutes acceptance.</p>

        <h2 id="contact-information">17. Contact Information</h2>
        <p>
          Oakline Ventures LLC
          <br />
          Illinois, United States
          <br />
          admin@earnsigma.com
        </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
