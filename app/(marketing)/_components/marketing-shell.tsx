import Link from "next/link";
import { BRAND_NAME } from "@earnsigma/brand";
import { footerLinks, marketingCtas, siteNavItems } from "@earnsigma/config";
import { Container, Logo } from "@earnsigma/ui";
import { appBaseUrl } from "@/src/lib/urls";

function resolveAppHref(path: string): string {
  return `${appBaseUrl}${path}`;
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      <header className="sticky top-0 z-20 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
        <Container className="flex items-center justify-between gap-4 py-4 sm:py-5">
          <Link href="/" className="inline-flex items-center" aria-label={BRAND_NAME}>
            <Logo
              priority
              className="inline-flex items-center gap-2.5"
              iconClassName="h-8 w-8 sm:h-9 sm:w-9"
              labelClassName="hidden text-base font-semibold leading-none tracking-tight text-white sm:inline"
            />
          </Link>
          <div className="flex items-center gap-2 text-sm sm:gap-4">
            <nav className="hidden items-center gap-5 md:flex">
              {siteNavItems.map((item) => (
                <Link key={item.key} href={item.href} className="text-brand-text-secondary transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
            <a
              href={resolveAppHref(marketingCtas.signIn.appPath)}
              className="hidden text-brand-text-secondary transition hover:text-white sm:inline-flex"
            >
              {marketingCtas.signIn.label}
            </a>
            <a
              href={resolveAppHref(marketingCtas.startTrial.appPath)}
              className="inline-flex items-center justify-center rounded-xl bg-brand-accent-blue px-3 py-2 text-xs font-medium text-white shadow-brand-glow transition hover:bg-brand-accent-blue-strong sm:px-5 sm:py-2.5 sm:text-sm"
            >
              {marketingCtas.startTrial.label}
            </a>
          </div>
        </Container>
      </header>

      <main>{children}</main>

      <footer id="about" className="border-t border-brand-border py-10 text-sm text-brand-text-muted">
        <Container className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span>(c) {new Date().getFullYear()} {BRAND_NAME}</span>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            {footerLinks.map((item) => (
              <Link key={item.key} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </Container>
      </footer>
    </div>
  );
}
