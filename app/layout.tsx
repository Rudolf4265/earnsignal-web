import type { Metadata } from "next";
import { BRAND_DOMAIN, BRAND_NAME } from "@/src/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: "Revenue intelligence for creators.",
  metadataBase: new URL(`https://${BRAND_DOMAIN}`),
  openGraph: {
    title: BRAND_NAME,
    description: "Revenue intelligence for creators.",
    url: `https://${BRAND_DOMAIN}`,
    siteName: BRAND_NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
