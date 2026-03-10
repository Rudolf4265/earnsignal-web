import { publicUrls } from "./urls";

export type SiteNavItem = {
  key: "pricing";
  href: string;
  label: string;
};

export const siteNavItems: SiteNavItem[] = [
  { key: "pricing", href: publicUrls.pricing, label: "Pricing" },
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
