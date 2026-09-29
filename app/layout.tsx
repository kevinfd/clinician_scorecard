import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { TourProvider } from "@/components/tour/TourProvider";
import { buildTours } from "@/lib/tours";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clinician Scorecard",
  description: "Per-surgeon metrics with the records behind every number. Synthetic demonstration data.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans text-slate-700 antialiased">
        {children}
        <Suspense fallback={null}>
          <TourProvider tours={buildTours()} />
        </Suspense>
      </body>
    </html>
  );
}
