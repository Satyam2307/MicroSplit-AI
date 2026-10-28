import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import Analytics from "@/components/Analytics";
import ToastContainer from "@/components/Toast";
import { Suspense } from "react";

export const viewport: Viewport = {
  themeColor: "var(--primary)",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://microsplit.ai"),
  title: {
    default: "MicroSplit AI – Squad Revenue Attribution & Automated Settlements",
    template: "%s | MicroSplit AI",
  },
  description:
    "Autonomous squad revenue attribution platform. Proof-of-focus tracking, deterministic ledger verification, and single-click PayPal batch disbursements.",
  keywords: [
    "revenue splitting",
    "squad attribution",
    "freelance payouts",
    "PayPal batch payouts",
    "proof of focus",
    "fintech settlement",
    "open source collective funding",
    "microsplit",
  ],
  authors: [{ name: "MicroSplit AI Team", url: "https://microsplit.ai" }],
  creator: "MicroSplit AI",
  publisher: "MicroSplit AI Inc.",
  alternates: {
    canonical: "https://microsplit.ai",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://microsplit.ai",
    siteName: "MicroSplit AI",
    title: "MicroSplit AI – Squad Revenue Attribution & Automated Settlements",
    description:
      "Split squad revenue with better judgment. Objective proof-of-focus tracking, cryptographic audit trails, and instant PayPal batch disbursements.",
    images: [
      {
        url: "https://microsplit.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "MicroSplit AI – Squad Revenue Attribution & Automated Settlements",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MicroSplit AI – Squad Revenue Attribution & Automated Settlements",
    description:
      "Split squad revenue with better judgment. Objective proof-of-focus tracking and instant multi-currency batch disbursements.",
    images: ["https://microsplit.ai/og-image.png"],
    creator: "@microsplit_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/icon" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon" sizes="180x180" type="image/png" />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden" style={{ background: "var(--background)" }}>
        <Suspense fallback={<div className="h-[64px]" style={{ background: "var(--primary)", borderBottom: "1px solid color-mix(in srgb, var(--background) 8%, transparent)" }} />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
        <Footer />
        <WhatsAppButton />
        <Analytics />
        <ToastContainer />
      </body>
    </html>
  );
}
