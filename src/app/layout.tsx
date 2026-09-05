import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://izborna-kontrola.vercel.app"),
  title: {
    default: "Izborna kontrola — vodič kroz izborne nepravilnosti u Srbiji",
    template: "%s — Izborna kontrola",
  },
  description:
    "Interaktivni građanski vodič za prepoznavanje, dokumentovanje i prijavljivanje izbornih nepravilnosti u Srbiji, sa pozivom na tačan član zakona.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b0d12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <SiteHeader />
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>
        <SiteFooter />
        <MobileTabBar />
      </body>
    </html>
  );
}
