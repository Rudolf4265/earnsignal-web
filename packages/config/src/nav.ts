import { publicUrls } from "./urls";

export type SiteNavItem = {
  key: "features" | "pricing" | "about";
  href: string;
  label: string;
};

export const siteNavItems: SiteNavItem[] = [
  { key: "features", href: `${publicUrls.marketingHome}#features`, label: "Features" },
  { key: "pricing", href: publicUrls.pricing, label: "Pricing" },
  { key: "about", href: `${publicUrls.marketingHome}#about`, label: "About" },
];

export const marketingCtas = {
  signIn: {
    key: "sign_in",
    label: "Sign in",
    appPath: publicUrls.appLoginPath,
  },
  startTrial: {
    key: "start_trial",
    label: "Start free trial",
    appPath: publicUrls.appSignupPath,
  },
  viewExampleReport: {
    key: "view_example_report",
    label: "View example report",
    href: publicUrls.exampleReport,
  },
} as const;
