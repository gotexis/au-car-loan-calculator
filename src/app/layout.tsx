import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AU Car Hub — Car Specs, Reviews & Tools for Australia",
    template: "%s | AU Car Hub",
  },
  description:
    "Compare car specs, fuel costs, emissions, and calculate car loans. Real data from the Australian Green Vehicle Guide. Free tools for Australian car buyers.",
  keywords: [
    "car specs australia",
    "car comparison australia",
    "green vehicle guide",
    "car fuel consumption",
    "car loan calculator australia",
    "ev range australia",
  ],
  openGraph: {
    title: "AU Car Hub",
    description: "Car specs, comparisons, and tools for Australian buyers.",
    type: "website",
  },
};

function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl">🚗 AU Car Hub</Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link href="/cars">All Cars</Link></li>
          <li><Link href="/makes">By Make</Link></li>
          <li><Link href="/ev">Electric Vehicles</Link></li>
          <li><Link href="/tools/car-loan">Loan Calculator</Link></li>
        </ul>
      </div>
      <div className="navbar-end lg:hidden">
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link href="/cars">All Cars</Link></li>
            <li><Link href="/makes">By Make</Link></li>
            <li><Link href="/ev">Electric Vehicles</Link></li>
            <li><Link href="/tools/car-loan">Loan Calculator</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="emerald">
      <body className="min-h-screen bg-base-200">
        <Navbar />
        <main className="container mx-auto px-4 py-8">{children}</main>
        <footer className="footer footer-center p-4 bg-base-300 text-base-content mt-8">
          <p>AU Car Hub — Data from Australian Green Vehicle Guide. Updated March 2026.</p>
        </footer>
      </body>
    </html>
  );
}
