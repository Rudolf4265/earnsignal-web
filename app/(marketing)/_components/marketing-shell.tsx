import Link from "next/link";
import { appBaseUrl } from "@/src/lib/urls";

const footerLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Example", href: "/example" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7">
        <Link href="/" className="text-sm font-semibold tracking-[0.14em] text-zinc-200 uppercase">
          EarnSignal
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="text-zinc-300 transition hover:text-white">
            Pricing
          </Link>
          <a
            href={`${appBaseUrl}/signup`}
            className="rounded-full border border-zinc-700 bg-zinc-100 px-4 py-2 font-medium text-zinc-950 transition hover:bg-white"
          >
            Start free trial
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16">{children}</main>

      <footer className="mx-auto mt-16 flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 border-t border-zinc-800 px-6 py-8 text-sm text-zinc-400">
        {footerLinks.map((link) => (
          <Link key={link.href} href={link.href} className="transition hover:text-zinc-100">
            {link.label}
          </Link>
        ))}
      </footer>
    </div>
  );
}
