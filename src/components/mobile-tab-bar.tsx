"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TriangleAlert, BookOpen, Calculator, ClipboardCheck } from "lucide-react";
import { MOBILE_TAB_LINKS } from "@/lib/nav";
import { cn } from "@/lib/utils";

const ICONS = {
  home: Home,
  alert: TriangleAlert,
  book: BookOpen,
  calculator: Calculator,
  check: ClipboardCheck,
};

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/85 sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {MOBILE_TAB_LINKS.map((link) => {
          const Icon = ICONS[link.icon];
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-brand" : "text-ink-faint"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
