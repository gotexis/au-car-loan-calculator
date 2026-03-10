import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AU Car Loan Calculator — Monthly Repayments, Balloon Payments & Comparison",
  description:
    "Free Australian car loan calculator. Calculate monthly repayments, compare loan options, and estimate balloon payment savings. Updated for 2026.",
  keywords: [
    "car loan calculator australia",
    "car loan repayment calculator",
    "balloon payment calculator",
    "vehicle finance calculator",
    "auto loan calculator au",
  ],
  openGraph: {
    title: "AU Car Loan Calculator",
    description: "Calculate and compare Australian car loan repayments instantly.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="emerald">
      <body className="min-h-screen bg-base-200">{children}</body>
    </html>
  );
}
