import Link from "next/link";
import { BRAND_NAME } from "@earnsigma/brand";
import { footerLinks, marketingCtas, siteNavItems } from "@earnsigma/config";
import { Container, Logo } from "@earnsigma/ui";
import { appBaseUrl } from "@/src/lib/urls";

const SHOW_PRELAUNCH_AUTH_ACTIONS = false;

function resolveAppHref(path: string): string {
  return `${appBaseUrl}${path}`;
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      <header className="sticky top-0 z-20 border-b border-brand-border/70 bg-brand-bg/78 backdrop-blur-xl">
        <Container className="flex items-center justify-between gap-4 py-3.5 sm:py-4">
          <Link href="/" className="inline-flex items-center" aria-label={BRAND_NAME}>
            <Logo
              priority
              className="inline-flex items-center gap-2"
              iconClassName="h-8 w-8 sm:h-9 sm:w-9"
              labelClassName="hidden text-[0.98rem] font-semibold leading-none tracking-[-0.01em] text-white sm:inline"
            />
          </Link>
          <div className="flex items-center gap-3 text-sm sm:gap-5">
            <nav className="flex items-center gap-4 sm:gap-6">
              {siteNavItems.map((item) => (
                <Link key={item.key} href={item.href} className="text-sm text-brand-text-secondary transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
            {SHOW_PRELAUNCH_AUTH_ACTIONS ? (
              <>
                <a
                  href={resolveAppHref(marketingCtas.signIn.appPath)}
                  className="hidden text-sm text-brand-text-secondary transition hover:text-white sm:inline-flex"
                >
                  {marketingCtas.signIn.label}
                </a>
                <a
                  href={resolveAppHref(marketingCtas.startTrial.appPath)}
                  className="inline-flex items-center justify-center rounded-xl border border-brand-border-strong/65 bg-brand-panel px-3.5 py-2 text-xs font-medium text-white transition hover:border-brand-accent-blue/45 hover:bg-brand-panel-muted sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  {marketingCtas.startTrial.label}
                </a>
              </>
            ) : null}
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
