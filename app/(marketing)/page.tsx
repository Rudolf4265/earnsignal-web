import Image from "next/image";
import Link from "next/link";
import { MarketingShell } from "./_components/marketing-shell";
import { BRAND_NAME } from "@/src/lib/brand";
import { appBaseUrl } from "@/src/lib/urls";

const features = [
  "Stability Index",
  "Tier Migration Map",
  "Churn Velocity",
  "Platform Dependence",
  "Executive Narrative",
];

const steps = ["Upload export", "Normalize + model", "View diagnostic"];

export default function MarketingHomePage() {
  return (
    <MarketingShell>
      <section className="py-18 overflow-visible sm:py-24">
        <Image
          src="/brand/earnsigma-hero-lockup.png"
          alt={BRAND_NAME}
          priority
          width={677}
          height={135}
          className="mb-8 h-auto w-full max-w-[300px] sm:max-w-[460px]"
        />
        <p className="mb-6 inline-flex rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs font-medium tracking-wider text-zinc-300 uppercase">
          Quiet intelligence for creator teams
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Revenue doesn&apos;t plateau randomly.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-300">
          {BRAND_NAME} reveals the structure behind creator revenue—stability, churn velocity, tier migration, and platform risk.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href={`${appBaseUrl}/signup`}
            className="rounded-full bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
          >
            Start free trial
          </a>
          <Link
            href="/example"
            className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
          >
            View example report
          </Link>
        </div>
      </section>

      <section className="grid gap-4 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article key={feature} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="text-lg font-semibold text-zinc-100">{feature}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Built to explain what changed, why it changed, and where revenue quality is heading next.
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 sm:p-10">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
              <p className="text-xs tracking-[0.14em] text-zinc-500 uppercase">Step {index + 1}</p>
              <p className="mt-2 text-base font-medium text-zinc-100">{step}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
