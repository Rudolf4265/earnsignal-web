"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const navLinks = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/upload", label: "Data" },
  { href: "/app/report", label: "Reports" },
  { href: "/app/settings", label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token =
    typeof window === "undefined" ? null : localStorage.getItem("supabase.auth.token");

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-navy-950 flex text-white">
      <aside className="w-64 border-r border-white/5 bg-navy-900 p-6 flex flex-col">
        <Link href="/" className="flex items-center gap-2 mb-10">
          <Image
            src="/brand/earnsigma-mark.svg"
            alt="EarnSigma"
            width={28}
            height={28}
          />
          <span className="font-semibold">EarnSigma</span>
        </Link>

        <nav className="space-y-3 text-sm">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/app" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg transition ${
                  isActive ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 text-xs text-gray-400">
          Revenue intelligence layer
        </div>
      </aside>

      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
