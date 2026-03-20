import type { ReactNode } from "react";
import { Card, Container, Section, cn } from "@earnsigma/ui";
import { MarketingShell } from "./marketing-shell";

export const LEGAL_PLACEHOLDER_DATE = "[Month Day, Year]";
export const LEGAL_COMPANY_NAME = "Oakline Ventures LLC";
export const LEGAL_CONTACT_EMAIL = "admin@earnsigma.com";

type LegalAsideItem = {
  label: string;
  value: ReactNode;
};

export type LegalPageSection = {
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  pageKey: string;
  eyebrow: string;
  title: string;
  intro: ReactNode;
  asideLabel: string;
  asideTitle: string;
  asideItems: ReadonlyArray<LegalAsideItem>;
  sections: ReadonlyArray<LegalPageSection>;
};

export function LegalBulletList({ items }: { items: ReadonlyArray<ReactNode> }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={`bullet-${index}`} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-accent-teal/80" aria-hidden="true" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalCallout({
  label,
  tone = "default",
  children,
}: {
  label: string;
  tone?: "default" | "blue" | "teal";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-brand-panel/65 p-4",
        tone === "blue" && "border-brand-accent-blue/30 bg-brand-accent-blue/10",
        tone === "teal" && "border-brand-accent-teal/30 bg-brand-accent-teal/10",
        tone === "default" && "border-brand-border/70",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.14em]",
          tone === "blue" && "text-brand-accent-blue",
          tone === "teal" && "text-brand-accent-teal",
          tone === "default" && "text-brand-text-muted",
        )}
      >
        {label}
      </p>
      <div className="mt-3 space-y-2.5 text-sm leading-7 text-brand-text-secondary">{children}</div>
    </div>
  );
}

export function LegalPage({
  pageKey,
  eyebrow,
  title,
  intro,
  asideLabel,
  asideTitle,
  asideItems,
  sections,
}: LegalPageProps) {
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
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            <div className="relative" data-testid={`${pageKey}-page-hero`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">{eyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2.35rem]">{title}</h1>
              <div className="mt-4 max-w-3xl text-base leading-relaxed text-brand-text-secondary sm:text-lg">{intro}</div>
            </div>

            <Card className="overflow-hidden border-brand-border/75 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">{asideLabel}</p>
              <h2 className="mt-3 text-lg font-semibold tracking-tight text-white">{asideTitle}</h2>
              <dl className="mt-5 space-y-4">
                {asideItems.map((item) => (
                  <div key={item.label}>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">{item.label}</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-brand-border/55 pb-20 pt-10 sm:pb-24 sm:pt-12">
        <Container>
          <div className="mx-auto max-w-4xl space-y-4" data-testid={`${pageKey}-page-sections`}>
            {sections.map((section, index) => (
              <Card
                key={section.title}
                className="overflow-hidden border-brand-border/75 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-5 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                  <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full border border-brand-border-strong/65 bg-brand-panel text-sm font-semibold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold tracking-tight text-white">{section.title}</h2>
                    <div className="mt-4 space-y-3.5 text-sm leading-7 text-brand-text-secondary sm:text-[0.97rem]">
                      {section.content}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </MarketingShell>
  );
}
