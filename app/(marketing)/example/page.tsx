import { MarketingShell } from "../_components/marketing-shell";
import { appBaseUrl } from "@/src/lib/urls";

export default function ExamplePage() {
  return (
    <MarketingShell>
      <section className="py-18 sm:py-24">
        <h1 className="text-4xl font-semibold tracking-tight">Sample report preview</h1>
        <div className="mt-8 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
            <p className="text-sm text-zinc-500">Stability index</p>
            <p className="mt-2 text-2xl font-semibold">72 / 100</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
              <p className="text-sm text-zinc-500">Churn velocity</p>
              <p className="mt-2 text-xl font-semibold">Moderating</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
              <p className="text-sm text-zinc-500">Platform risk</p>
              <p className="mt-2 text-xl font-semibold">Medium concentration</p>
            </div>
          </div>
        </div>
        <a
          href={`${appBaseUrl}/signup`}
          className="mt-8 inline-flex rounded-full bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
        >
          Start free trial
        </a>
      </section>
    </MarketingShell>
  );
}
