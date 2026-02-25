import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://earnsigma.com"),
  title: {
    default: "EarnSigma — Revenue Intelligence for Creator Teams",
    template: "%s | EarnSigma",
  },
  description:
    "EarnSigma reveals the structure behind creator revenue — stability, churn velocity, tier migration, and platform risk.",
  openGraph: {
    title: "EarnSigma — Revenue Intelligence",
    description:
      "Understand the structure behind your revenue. Stability. Churn. Tier migration.",
    url: "https://earnsigma.com",
    siteName: "EarnSigma",
    images: [
      {
        url: "/brand/earnsigma-lockup.svg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EarnSigma — Revenue Intelligence",
    description:
      "Stability, churn velocity, tier migration, and platform risk.",
    images: ["/brand/earnsigma-lockup.svg"],
  },
  icons: {
    icon: "/brand/earnsigma-mark.svg",
    apple: "/brand/earnsigma-mark.svg",
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
