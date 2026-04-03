import type { Metadata } from "next";
import { pricingPlans } from "@earnsigma/config";
import { Badge, Container, Section, buttonClassName, cn } from "@earnsigma/ui";
import { MarketingShell } from "../_components/marketing-shell";
import { appBaseUrl } from "@/src/lib/urls";

export const metadata: Metadata = {
  title: "Pricing — EarnSigma",
  description:
    "Free validation, one-time Report, or ongoing Pro access. EarnSigma turns your creator data into a clear, private business diagnosis.",
};

const comparisonRows: Array<{ label: string; free: boolean; report: boolean; pro: boolean }> = [
  { label: "Upload creator data", free: true, report: true, pro: true },
  { label: "Validate data readiness", free: true, report: true, pro: true },
  { label: "Signal teaser preview", free: true, report: true, pro: true },
  { label: "Full business diagnosis report", free: false, report: true, pro: true },
  { label: "Biggest opportunity and platform risk", free: false, report: true, pro: true },
  { label: "Strengths, risks, and next 3 actions", free: false, report: true, pro: true },
  { label: "Downloadable PDF", free: false, report: true, pro: true },
  { label: "Owned purchased report access", free: false, report: true, pro: true },
  { label: "Full-history analysis", free: false, report: false, pro: true },
  { label: "Report history and period comparisons", free: false, report: false, pro: true },
  { label: "Ongoing dashboard monitoring", free: false, report: false, pro: true },
];

function resolvePlanCta(key: string): string {
  if (key === "report") return `${appBaseUrl}/signup?plan=report`;
  if (key === "pro") return `${appBaseUrl}/signup?plan=pro`;
  return `${appBaseUrl}/signup`;
}

function cadenceLabel(cadence: string): string {
  if (cadence === "one_time") return "one-time";
  if (cadence === "monthly") return "/ month";
  return "";
}

function CheckIcon({ included }: { included: boolean }) {
  if (included) {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="mx-auto h-4 w-4 text-brand-accent-teal" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return <span className="mx-auto block h-px w-3 bg-brand-border-strong/55" aria-hidden="true" />;
}

export default function PricingPage() {
  return (
    <MarketingShell>
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <Section className="relative overflow-hidden pb-16 pt-16 sm:pb-20 sm:pt-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_50%_0%,rgba(29,78,216,0.18),rgba(9,18,35,0))]"
          aria-hidden="true"
        />
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="accent"
              className="border-brand-border-strong/65 bg-brand-panel/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-brand-accent-blue"
            >
              PRICING
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-[2.5rem] sm:leading-[1.1]">
              One clear diagnosis.<br className="hidden sm:block" /> Priced to match where you are.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-brand-text-secondary sm:text-lg">
              Start free to validate your data. Buy a one-time Report when you&apos;re ready. Upgrade to Pro
              for ongoing visibility as your business evolves.
            </p>
          </div>
        </Container>
      </Section>

      {/* ── PLAN CARDS ───────────────────────────────────────────────────────── */}
      <Section className="border-t border-brand-border/55 pb-16 pt-0 sm:pb-20">
        <Container>
          <div className="grid gap-5 sm:grid-cols-3">
            {pricingPlans.map((plan) => {
              const isFeatured = plan.emphasis === "featured";
              return (
                <article
                  key={plan.key}
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-6",
                    isFeatured
                      ? "border-brand-accent-blue/45 bg-[linear-gradient(162deg,rgba(15,34,75,0.98),rgba(19,47,107,0.94),rgba(12,28,62,0.98))] shadow-[0_0_50px_-10px_rgba(29,78,216,0.35)]"
                      : "border-brand-border/65 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))]",
                  )}
                >
                  {isFeatured ? (
                    <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-brand-accent-blue/80 via-brand-accent-teal/50 to-transparent" />
                  ) : null}

                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                    {plan.badge ? (
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                          isFeatured
                            ? "border-brand-accent-blue/50 bg-brand-accent-blue/18 text-brand-accent-blue"
                            : "border-brand-border-strong/65 bg-brand-panel text-brand-text-muted",
                        )}
                      >
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <span className="text-3xl font-semibold tracking-tight text-white">{plan.price}</span>
                    {plan.cadence !== "forever" ? (
                      <span className="ml-1.5 text-sm text-brand-text-muted">{cadenceLabel(plan.cadence)}</span>
                    ) : (
                      <span className="ml-1.5 text-sm text-brand-text-muted">free</span>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">{plan.description}</p>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-brand-text-secondary">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-accent-teal/70"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={resolvePlanCta(plan.key)}
                    className={buttonClassName({
                      variant: isFeatured ? "primary" : "secondary",
                      className: cn(
                        "mt-6 w-full justify-center text-center",
                        isFeatured && "border-brand-accent-emerald/50 bg-[linear-gradient(120deg,rgba(29,78,216,0.98),rgba(47,217,197,0.9))] shadow-brand-glow hover:brightness-110",
                      ),
                    })}
                  >
                    {plan.ctaLabel}
                  </a>
                </article>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* ── REPORT vs PRO CALLOUT ────────────────────────────────────────────── */}
      <Section className="border-t border-brand-border/55 pb-16 pt-16 sm:pb-20 sm:pt-20">
        <Container>
          <div className="mx-auto max-w-3xl rounded-2xl border border-brand-border/65 bg-[linear-gradient(165deg,rgba(17,34,69,0.92),rgba(11,24,50,0.86))] p-7 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text-muted">REPORT vs PRO</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Report gives you ownership. Pro gives you continuity.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary sm:text-base">
              A Report gives you a point-in-time diagnosis you keep. Pro keeps your business health visible as it
              evolves — full history, period comparisons, and ongoing monitoring.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-brand-border/65 bg-brand-panel/60 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-secondary">Report — $79 one-time</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                  Best for creators who want a clear snapshot of their business right now — owned forever.
                </p>
              </div>
              <div className="rounded-xl border border-brand-accent-blue/35 bg-brand-accent-blue/8 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-blue">Pro — $59 / month</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                  Best for creators who want ongoing visibility into how their business changes and whether actions are working.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────────── */}
      <Section className="border-t border-brand-border/55 pb-20 pt-16 sm:pb-24 sm:pt-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Included at a glance</h2>
            <div className="mt-8 overflow-hidden rounded-2xl border border-brand-border/65">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-brand-border/65 bg-brand-panel-muted/35 text-[11px] uppercase tracking-[0.14em] text-brand-text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-medium">Feature</th>
                    <th scope="col" className="px-4 py-4 text-center font-medium">Free</th>
                    <th scope="col" className="px-4 py-4 text-center font-medium">Report</th>
                    <th scope="col" className="px-5 py-4 text-center font-medium text-brand-text-primary">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/55 bg-[linear-gradient(165deg,rgba(14,30,62,0.85),rgba(11,24,50,0.80))]">
                  {comparisonRows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row" className="px-5 py-3.5 text-left text-xs font-medium text-brand-text-primary">
                        {row.label}
                      </th>
                      <td className="px-4 py-3.5 text-center">
                        <CheckIcon included={row.free} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <CheckIcon included={row.report} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <CheckIcon included={row.pro} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 text-center">
              <p className="text-base font-semibold text-white">Understand your creator business like a business.</p>
              <p className="mt-1.5 text-sm text-brand-text-secondary">No guesswork. No public estimates. Just your data — clearly explained.</p>
              <a
                href={`${appBaseUrl}/signup?plan=report`}
                className={buttonClassName({
                  variant: "primary",
                  className:
                    "mt-6 inline-flex border-brand-accent-emerald/50 bg-[linear-gradient(120deg,rgba(29,78,216,0.98),rgba(47,217,197,0.9))] px-8 py-3 text-sm font-semibold shadow-brand-glow hover:brightness-110",
                })}
              >
                Generate My Private Report
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </MarketingShell>
  );
}
