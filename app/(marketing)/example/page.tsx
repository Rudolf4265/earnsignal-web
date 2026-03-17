import Link from "next/link";
import { marketingCtas, publicUrls } from "@earnsigma/config";
import { Card, Container, Section, buttonClassName } from "@earnsigma/ui";
import { MarketingShell } from "../_components/marketing-shell";
import { appBaseUrl } from "@/src/lib/urls";

const primaryCtaHref = `${appBaseUrl}${marketingCtas.startTrial.appPath}?plan=report`;

export default function ExamplePage() {
  return (
    <MarketingShell>
      <Section className="pb-20 pt-16 sm:pb-24 sm:pt-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">
              SAMPLE OUTPUT
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
              Sample private report
            </h1>
            <p className="mt-4 text-base leading-relaxed text-brand-text-secondary">
              This is illustrative output only. Your actual report is built from your own exports
              and reflects your real creator business data.
            </p>
          </div>

          <div className="mt-10 max-w-2xl space-y-4">
            <Card className="overflow-hidden rounded-2xl border border-brand-border-strong/65 bg-[linear-gradient(162deg,rgba(11,24,49,0.97),rgba(15,31,64,0.95),rgba(9,21,43,0.98))] p-0">
              <div className="border-b border-brand-border/70 bg-brand-panel-muted/35 px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
                    Private Business Report
                  </p>
                  <span className="inline-flex rounded-full border border-brand-border-strong/60 bg-brand-panel px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-brand-text-secondary">
                    Sample Output
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold tracking-tight text-white">
                  Revenue Diagnostics Snapshot
                </h2>
              </div>

              <div className="space-y-3.5 p-5 sm:p-6">
                <div className="rounded-xl border border-brand-border/70 bg-[linear-gradient(165deg,rgba(17,34,69,0.9),rgba(12,26,55,0.84))] p-4 sm:p-5">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-brand-text-muted">Revenue Stability Index</p>
                  <p className="mt-2 text-xl font-semibold text-white">72 / 100</p>
                  <p className="mt-1.5 text-sm text-brand-text-secondary">Healthy baseline with moderate week-to-week variance.</p>
                  <div className="mt-3.5 h-1.5 rounded-full bg-brand-panel-muted/80">
                    <div className="h-full w-[72%] rounded-full bg-[var(--es-color-accent-emerald)]" aria-hidden="true" />
                  </div>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="rounded-xl border border-brand-border/70 bg-[linear-gradient(165deg,rgba(17,34,69,0.9),rgba(12,26,55,0.84))] p-4">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-brand-text-muted">Churn Velocity</p>
                    <p className="mt-2 text-base font-semibold text-white">Moderating</p>
                    <p className="mt-1.5 text-sm text-brand-text-secondary">Cancellations slowing after tier adjustment.</p>
                  </div>
                  <div className="rounded-xl border border-brand-border/70 bg-[linear-gradient(165deg,rgba(17,34,69,0.9),rgba(12,26,55,0.84))] p-4">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-brand-text-muted">Platform Risk</p>
                    <p className="mt-2 text-base font-semibold text-white">Medium concentration</p>
                    <p className="mt-1.5 text-sm text-brand-text-secondary">71% of revenue tied to a single platform.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-brand-accent-emerald/35 bg-[linear-gradient(160deg,rgba(20,56,70,0.5),rgba(13,36,63,0.35))] p-4">
                  <p className="text-sm font-semibold text-white">Next best action</p>
                  <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
                    Adding a $15 tier could reduce $8-tier churn and increase monthly revenue by ~18%.
                  </p>
                </div>
              </div>

              <div className="border-t border-brand-border/65 bg-brand-panel-muted/25 px-5 py-3.5 text-xs text-brand-text-muted sm:px-6">
                Sample output only — your report reflects your actual creator business data
              </div>
            </Card>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3.5 sm:gap-4">
            <a
              href={primaryCtaHref}
              className={buttonClassName({
                variant: "primary",
                className:
                  "rounded-xl border-brand-accent-emerald/50 bg-[linear-gradient(120deg,rgba(29,78,216,0.98),rgba(47,217,197,0.9))] px-6 py-3 text-sm font-semibold text-white shadow-brand-glow hover:border-brand-accent-emerald/70 hover:brightness-110 sm:px-7 sm:py-3.5",
              })}
            >
              Generate My Private Report
            </a>
            <Link
              href={publicUrls.pricing}
              className={buttonClassName({
                variant: "secondary",
                className:
                  "rounded-xl border-brand-border-strong/70 bg-brand-panel/70 px-5 py-3 text-sm text-brand-text-secondary hover:bg-brand-panel hover:text-white sm:px-6",
              })}
            >
              See Pricing
            </Link>
          </div>
        </Container>
      </Section>
    </MarketingShell>
  );
}
