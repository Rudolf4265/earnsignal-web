import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/upload", label: "Start report" },
  { href: "/app/report/demo", label: "Sample report" },
];

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>

        <nav className="flex flex-wrap gap-3 text-sm">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/app" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full border px-3 py-1.5 transition ${
                  isActive
                    ? "border-zinc-400 text-zinc-100"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        {children}
      </section>
    </main>
  );
}