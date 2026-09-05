"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, Calculator, ClipboardCheck, Menu } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const pathname = usePathname();
  const { toggle, isOpen } = useSidebar();

  const TABS = [
    { href: "/", label: "Početna", icon: Home },
    { href: "/vidim-problem", label: "Hitno", icon: Zap, urgent: true },
    { href: "/kontrolor", label: "Kontrolor", icon: ClipboardCheck },
    { href: "/validator", label: "Validator", icon: Calculator },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid h-14 grid-cols-5 items-center">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-95",
                active
                  ? tab.urgent
                    ? "text-rose-600 dark:text-rose-400 font-bold"
                    : "text-brand font-bold"
                  : tab.urgent
                  ? "text-rose-500/80 font-medium"
                  : "text-ink-faint hover:text-ink"
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "h-5 w-5",
                    tab.urgent && "fill-current"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {tab.urgent && (
                  <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                  </span>
                )}
              </div>
              <span className="leading-tight">{tab.label}</span>
            </Link>
          );
        })}

        {/* 5th Tab: "Meni" Button (Opens Sidebar Drawer) */}
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-95",
            isOpen ? "text-brand font-bold" : "text-ink-faint hover:text-ink"
          )}
          aria-label="Otvori navigacioni meni"
        >
          <Menu className="h-5 w-5" strokeWidth={isOpen ? 2.5 : 2} />
          <span className="leading-tight">Meni</span>
        </button>
      </div>
    </nav>
  );
}
