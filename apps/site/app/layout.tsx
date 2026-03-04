import type { Metadata } from "next";
import "./globals.css";
import { PRIMARY_DOMAIN } from "@/src/lib/config/domains";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${PRIMARY_DOMAIN}`),
  title: {
    default: "EarnSigma — Revenue Intelligence for Creator Teams",
    template: "%s | EarnSigma",
  },
  description:
    "EarnSigma reveals the structure behind creator revenue — stability, churn velocity, tier migration, and platform risk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
