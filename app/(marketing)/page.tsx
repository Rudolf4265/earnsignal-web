import Image from "next/image";
import Link from "next/link";
import { MarketingShell } from "./_components/marketing-shell";
import { appBaseUrl } from "@/src/lib/urls";

const features = [
  {
    title: "Stability Index",
    description: "Quantify revenue concentration and long-term resilience.",
  },
  {
    title: "Churn Velocity",
    description: "Track the pace of subscriber loss before it impacts growth.",
  },
  {
    title: "Tier Migration Analysis",
    description: "Understand movement between pricing tiers and lifecycle health.",
  },
];

export default function MarketingHomePage() {
  return (
    <MarketingShell>
      <section className="py-28 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-tight">
                Revenue doesn&apos;t plateau{" "}
                <span className="bg-gradient-to-r from-brand-blue to-brand-teal bg-clip-text text-transparent">
                  randomly.
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-300 max-w-xl">
                EarnSigma reveals the structure behind creator revenue — stability, churn velocity,
                tier migration, and platform risk.
              </p>

              <div className="mt-10 flex items-center gap-4">
                <a
                  href={`${appBaseUrl}/signup`}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-blue px-6 py-3 text-sm font-medium text-white shadow-brandGlow transition hover:opacity-90"
                >
                  Start free trial
                </a>

                <Link
                  href="/example"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white hover:bg-white/5 transition"
                >
                  View example report
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/20 to-brand-teal/20 blur-3xl opacity-40" />
              <div className="relative rounded-2xl border border-white/10 bg-navy-900 shadow-2xl p-4">
                <Image
                  src="/brand/earnsigma-hero-lockup.png"
                  alt="EarnSigma dashboard preview"
                  width={800}
                  height={500}
                  className="rounded-lg"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-navy-900 p-6">
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
