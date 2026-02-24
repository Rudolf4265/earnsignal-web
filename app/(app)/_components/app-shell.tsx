import Link from "next/link";

const navLinks = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/upload", label: "Upload" },
  { href: "/app/report/demo", label: "Sample report" },
];

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <nav className="flex flex-wrap gap-3 text-sm text-zinc-300">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full border border-zinc-700 px-3 py-1.5 transition hover:border-zinc-500 hover:text-zinc-100">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">{children}</section>
    </main>
  );
}
