import { publicUrls } from "./urls";

export type FooterLink = {
  key: "privacy" | "terms";
  href: string;
  label: string;
};

export const footerLinks: FooterLink[] = [
  { key: "privacy", href: publicUrls.privacy, label: "Privacy" },
  { key: "terms", href: publicUrls.terms, label: "Terms" },
];
