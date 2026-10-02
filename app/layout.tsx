import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartHydration } from "@/components/cart/cart-hydration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PrimeCoat — Quality Paints. Professional Finishes.",
    template: "%s · PrimeCoat",
  },
  description:
    "Premium interior and exterior paints, primers, gloss and painting accessories, plus professional painting services for homes and businesses across Nigeria.",
  openGraph: {
    type: "website",
    siteName: "PrimeCoat",
    title: "PrimeCoat — Quality Paints. Professional Finishes.",
    description:
      "Premium paints and professional painting services for homes and businesses across Nigeria.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${inter.variable} ${fraunces.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <CartHydration />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
