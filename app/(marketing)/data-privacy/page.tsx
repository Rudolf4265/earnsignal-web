import { Card, Container, Section } from "@earnsigma/ui";
import { MarketingShell } from "../_components/marketing-shell";

const contentSections = [
  {
    title: "Your business data stays yours",
    body:
      "The files and account details you share with EarnSigma remain your business information. We use that data only to provide the service, generate your reports, and support your workspace.",
  },
  {
    title: "What data we use",
    body:
      "We use the information needed to run the product, process uploads, deliver reporting, and respond to support needs. Uploaded files are not used to train public AI models.",
  },
  {
    title: "How your data is stored",
    body:
      "Storage is limited to product, reporting, and support needs. That means we keep the data required to operate your workspace and make your reports and support history available when needed.",
  },
  {
    title: "What we do not do",
    body:
      "We do not sell your data, and we do not turn customer uploads into a public dataset. Your information is handled for service delivery, not for resale or broad reuse.",
  },
  {
    title: "Retention and deletion",
    body:
      "We retain data for as long as it is needed to operate the product, preserve reporting access, and handle support. When data is no longer needed, deletion is handled through our normal product and support workflow.",
  },
] as const;

export default function DataPrivacyPage() {
  return (
    <MarketingShell>
      <Section className="relative overflow-hidden pb-10 pt-16 sm:pb-12 sm:pt-20">
        <div
          className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-brand-accent-blue/12 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 top-8 h-64 w-64 rounded-full bg-brand-accent-teal/10 blur-3xl"
          aria-hidden="true"
        />
        <Container>
          <div className="mx-auto max-w-3xl" data-testid="data-privacy-page-hero">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">DATA &amp; PRIVACY</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
              Clear, practical handling of your business data
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-text-secondary sm:text-lg">
              EarnSigma is built for sensitive creator and business information. We keep our data approach plain: use it only to provide the service, keep it limited to real product needs, and handle it with care.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-brand-border/55 pb-20 pt-10 sm:pb-24 sm:pt-12">
        <Container>
          <div className="mx-auto max-w-3xl space-y-4" data-testid="data-privacy-page-sections">
            {contentSections.map((section) => (
              <Card
                key={section.title}
                className="overflow-hidden border-brand-border/75 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-5 sm:p-6"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">EarnSigma</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-brand-text-secondary sm:text-[0.97rem]">{section.body}</p>
              </Card>
            ))}

            <div className="rounded-2xl border border-brand-accent-teal/25 bg-[linear-gradient(155deg,rgba(13,32,60,0.9),rgba(14,42,61,0.72))] p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">Confidentiality</p>
              <p className="mt-3 text-sm leading-7 text-brand-text-secondary sm:text-[0.97rem]">
                Customer uploads, generated reports, and account details are treated as confidential business information within the product and support workflow.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </MarketingShell>
  );
}
