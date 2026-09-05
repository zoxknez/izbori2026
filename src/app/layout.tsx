import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SidebarProvider } from "@/components/sidebar-context";
import { SiteSidebar } from "@/components/site-sidebar";
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
    default: "Izborna kontrola: vodič kroz izborne nepravilnosti u Srbiji",
    template: "%s · Izborna kontrola",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-ink">
        <SidebarProvider>
          <SiteSidebar />
          <div className="flex min-h-screen flex-col lg:pl-64">
            <SiteHeader />
            <main className="flex-1 pb-16 sm:pb-0">{children}</main>
            <SiteFooter />
          </div>
          <MobileTabBar />
        </SidebarProvider>
      </body>
    </html>
  );
}
