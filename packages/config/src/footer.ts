import { publicUrls } from "./urls";

export type FooterLink = {
  key: "privacy" | "terms" | "dataPrivacy";
  href: string;
  label: string;
};

export const footerLinks: FooterLink[] = [
  { key: "privacy", href: publicUrls.privacy, label: "Privacy" },
  { key: "terms", href: publicUrls.terms, label: "Terms" },
  { key: "dataPrivacy", href: publicUrls.dataPrivacy, label: "Data Use & Privacy" },
];
