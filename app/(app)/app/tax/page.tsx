"use client";

import Link from "next/link";

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function IconCalculator({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="12" x2="10" y2="12" />
      <line x1="14" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="10" y2="16" />
      <line x1="14" y1="16" x2="16" y2="16" />
    </svg>
  );
}

function IconLock({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconWarning({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconTrending({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

// ─── Stat card (blurred preview) ─────────────────────────────────────────────

function PreviewStatCard({
  label,
  value,
  sub,
  subClassName = "text-slate-600",
}: {
  label: string;
  value: string;
  sub: string;
  subClassName?: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.12] bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-medium text-white">{value}</p>
      <p className={`mt-1 text-[11px] ${subClassName}`}>{sub}</p>
    </div>
  );
}

// ─── Coming soon feature card ─────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-accent-teal/20 bg-brand-accent-teal/10">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TaxPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">

      {/* Page header */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <IconCalculator className="text-brand-accent-teal" />
            <h1 className="text-3xl font-semibold text-white">Tax forecast</h1>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-brand-accent-teal/30 bg-brand-accent-teal/10 px-3 py-1 text-xs font-semibold text-teal-300">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
            Coming soon
          </span>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-slate-300">
          Most creators are self-employed — platforms don&apos;t withhold a cent. The IRS expects quarterly payments,
          and missing them triggers penalties on top of the bill. We&apos;ll use your earnings data to forecast exactly
          what you owe, so tax time is never a shock.
        </p>
      </section>

      {/* Blurred forecast preview */}
      <section className="rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-6">
        <h2 className="mb-5 text-lg font-semibold text-white">Your tax snapshot</h2>

        <div style={{ position: "relative" }}>
          {/* Blurred preview content */}
          <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none", opacity: 0.5 }}>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <PreviewStatCard
                label="Est. annual tax"
                value="$8,240"
                sub="Income + self-employment"
              />
              <PreviewStatCard
                label="Next quarterly due"
                value="$2,060"
                sub="Due Jun 15, 2026"
                subClassName="text-amber-400"
              />
              <PreviewStatCard
                label="Set aside monthly"
                value="$687"
                sub="~30% of monthly earnings"
              />
            </div>

            <div className="mb-3 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
              <IconWarning className="mt-0.5 shrink-0 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-white">Under-reserved for Q2</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-300">
                  You&apos;re on track to owe <span className="font-medium text-white">$8,240</span> this year but have only set aside <span className="font-medium text-white">$1,200</span> so far. Increase your monthly reserve to avoid a surprise bill.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-400/[0.04] p-4">
              <IconCalendar className="mt-0.5 shrink-0 text-rose-300" />
              <div>
                <p className="text-sm font-medium text-white">Q2 estimated payment due in 21 days</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-300">
                  Missing this IRS deadline triggers an underpayment penalty — even if you pay in full by April.
                </p>
              </div>
            </div>
          </div>

          {/* Lock overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              borderRadius: "16px",
              background: "rgba(7,18,37,0.75)",
            }}
          >
            <IconLock style={{ color: "var(--es-color-accent-teal)" }} />
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Unlocks after your first report</p>
              <p className="mt-1 text-xs text-slate-400">
                Run a report from the{" "}
                <Link href="/app/data" className="text-teal-400 underline underline-offset-4 hover:text-teal-300">
                  Data
                </Link>{" "}
                page and we&apos;ll estimate your obligations from real earnings.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/[0.06] pt-4">
          <p className="text-xs text-slate-600">
            Estimates are based on US self-employment tax rates (15.3% SE tax + federal income bracket). Not tax advice — consult a tax professional for your specific situation.
          </p>
        </div>
      </section>

      {/* What's coming */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">What you&apos;ll get</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<IconCalculator className="text-brand-accent-teal" />}
            title="Quarterly estimates"
            description="See your four IRS payment deadlines and the amount due at each one, calculated from your actual platform earnings."
          />
          <FeatureCard
            icon={<IconTrending className="text-brand-accent-teal" />}
            title="Monthly reserve guide"
            description="Know exactly how much to set aside each month so you're never scrambling when a payment date arrives."
          />
          <FeatureCard
            icon={<IconBell className="text-brand-accent-teal" />}
            title="Deadline reminders"
            description="Get a heads-up before each quarterly due date — Jan 15, Apr 15, Jun 15, and Sep 15 — so you're always ahead."
          />
        </div>
      </section>

      {/* The creator tax problem callout */}
      <section className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Why this matters</h2>
        <p className="max-w-2xl text-sm leading-7 text-slate-400">
          Unlike a salaried job, no one withholds taxes from your Patreon payouts, YouTube AdSense, or Substack revenue.
          On top of regular income tax, self-employed creators pay a <span className="font-medium text-slate-200">15.3% self-employment tax</span> that most people only discover at their first filing.
          The IRS also charges underpayment penalties if you don&apos;t pay quarterly — meaning waiting until April costs you extra even if you pay in full.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
          Tax forecast turns your existing earnings data into a running estimate, so you know your number at any point in the year — not just when it&apos;s too late to prepare.
        </p>
      </section>

    </div>
  );
}
