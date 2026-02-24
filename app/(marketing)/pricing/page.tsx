import { MarketingShell } from "../_components/marketing-shell";
import { appBaseUrl, stripeCancelUrl, stripeSuccessUrl } from "@/src/lib/urls";

const tiers = [
  {
    name: "Creator",
    price: "$39/month",
    details: ["1 platform", "Monthly refresh", "Stability + churn + narrative"],
  },
  {
    name: "Creator Pro",
    price: "$59/month",
    details: ["Multi-platform", "Migration flows", "Dependence tracking", "Priority signals"],
  },
];

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="py-18 sm:py-24">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Pricing</h1>
        <p className="mt-4 text-zinc-300">14-day free trial • Cancel anytime</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {tiers.map((tier) => (
            <article key={tier.name} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
              <h2 className="text-2xl font-semibold">{tier.name}</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight">{tier.price}</p>
              <ul className="mt-6 space-y-2 text-sm text-zinc-300">
                {tier.details.map((detail) => (
                  <li key={detail}>• {detail}</li>
                ))}
              </ul>
              <a
                href={`${appBaseUrl}/signup`}
                className="mt-8 inline-flex rounded-full bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-white"
              >
                Start free trial
              </a>
            </article>
          ))}
        </div>

        <p className="mt-10 text-xs text-zinc-500">
          Stripe placeholders: success URL {stripeSuccessUrl} and cancel URL {stripeCancelUrl}
        </p>
      </section>
    </MarketingShell>
  );
}
