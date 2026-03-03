"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
  const router = useRouter();
  const token =
    typeof window === "undefined" ? null : localStorage.getItem("supabase.auth.token");

  useEffect(() => {
    if (token) {
      router.replace("/app");
    }
  }, [router, token]);

  if (token) {
    return null;
  }

  return (
    <MarketingShell>
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Revenue doesn&apos;t plateau{" "}
                <span className="bg-gradient-to-r from-brand-blue to-brand-teal bg-clip-text text-transparent">
                  randomly.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-600">
                EarnSigma reveals the structure behind creator revenue — stability, churn velocity,
                tier migration, and platform risk.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <a
                  href={`${appBaseUrl}/signup`}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-blue px-6 py-3 text-sm font-medium text-white shadow-brandGlow transition hover:opacity-90"
                >
                  Start free trial
                </a>

                <Link
                  href="/example"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  View example report
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-tr from-brand-blue/20 via-sky-200/40 to-brand-teal/20 blur-3xl" />
              <div className="relative rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-lg shadow-slate-900/10 backdrop-blur">
                <Image
                  src="/brand/earnsigma-hero.svg"
                  alt="EarnSigma analytics preview"
                  width={1200}
                  height={720}
                  className="h-auto w-full rounded-lg"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
