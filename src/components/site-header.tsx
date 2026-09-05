"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { NAV_LINKS, NAV_CTA } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <ShieldCheck className="h-5 w-5 text-brand" strokeWidth={2.25} />
          <span className="hidden sm:inline">Izborna kontrola</span>
        </Link>

        <nav className="scrollbar-thin flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-surface-2 text-ink" : "text-ink-dim hover:bg-surface-2 hover:text-ink"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href={NAV_CTA.href}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
            pathname === NAV_CTA.href
              ? "bg-sev-teska text-canvas"
              : "bg-sev-teska/15 text-sev-teska hover:bg-sev-teska hover:text-canvas"
          )}
        >
          {NAV_CTA.label}
        </Link>
      </div>
    </header>
  );
}
