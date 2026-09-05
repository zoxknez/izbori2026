"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Menu, Zap, Search, FileEdit, BookOpen, AlertCircle } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/": "Početna kontrolna tabla",
  "/vidim-problem": "Hitna dijagnostika na BM",
  "/pravila": "Baza izbornih nepravilnosti",
  "/kontrolor": "Vodič i checklista za kontrolore",
  "/validator": "Validator izbornog zapisnika",
  "/van-birackog-mesta": "Glasanje van biračkog mesta",
  "/krivicna-dela": "Krivična dela protiv izbornih prava",
  "/mit-ili-cinjenica": "Mit ili činjenica — Kviz znanja",
  "/prijavi": "Generator hronologije i primedbe",
  "/rokovi": "Izborni rokovi i pravni lekovi",
  "/izvori": "Zvanični pravni izvori i propisi",
};

export function SiteHeader() {
  const pathname = usePathname();
  const { toggle } = useSidebar();

  const currentTitle = PAGE_TITLES[pathname] || (pathname.startsWith("/pravila/") ? "Detalj nepravilnosti" : "Izborna kontrola");

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/65">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side: Hamburger on mobile, Page context on desktop */}
        <div className="flex items-center gap-3">
          {/* Hamburger toggle button (visible on mobile/tablet <lg) */}
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-2 text-ink-dim hover:text-ink lg:hidden"
            aria-label="Otvori navigacioni meni"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo on mobile (hidden on lg because it's in the permanent sidebar) */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-ink lg:hidden"
          >
            <ShieldCheck className="h-5 w-5 text-brand" strokeWidth={2.25} />
            <span className="text-sm">Izborna kontrola</span>
          </Link>

          {/* Page context on desktop (lg+) */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span className="font-semibold text-ink-dim">
              Izborna kontrola 2026
            </span>
            <span className="text-border-strong">/</span>
            <span className="font-bold text-ink">
              {currentTitle}
            </span>
          </div>
        </div>

        {/* Right side: Fast operational links & Emergency CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop quick shortcuts */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <Link
              href="/pravila"
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-medium transition-colors",
                pathname === "/pravila"
                  ? "bg-surface-2 text-ink font-semibold"
                  : "text-ink-dim hover:bg-surface-2 hover:text-ink"
              )}
            >
              Baza situacija
            </Link>

            <Link
              href="/prijavi"
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-medium transition-colors",
                pathname === "/prijavi"
                  ? "bg-surface-2 text-ink font-semibold"
                  : "text-ink-dim hover:bg-surface-2 hover:text-ink"
              )}
            >
              Prijavi incident
            </Link>
          </div>

          {/* Emergency CTA button */}
          <Link
            href="/vidim-problem"
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm",
              pathname === "/vidim-problem"
                ? "border-rose-600 bg-rose-600 text-white shadow-rose-600/25"
                : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:border-rose-600 hover:bg-rose-600 hover:text-white"
            )}
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span className="hidden sm:inline">Vidim problem sada</span>
            <span className="sm:hidden">Hitno</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
