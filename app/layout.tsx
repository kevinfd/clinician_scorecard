import type { Metadata, Viewport } from "next";
import "@fontsource/atkinson-hyperlegible-next/400.css";
import "@fontsource/atkinson-hyperlegible-next/500.css";
import "@fontsource/atkinson-hyperlegible-next/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clinician Scorecard",
  description: "Per-surgeon metrics with the records behind every number. Synthetic demonstration data.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eceef2" },
    { media: "(prefers-color-scheme: dark)", color: "#1d232d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
