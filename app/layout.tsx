import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EarnSignal",
  description: "Revenue intelligence for creators.",
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
