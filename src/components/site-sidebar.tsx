"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Zap,
  ClipboardList,
  Calculator,
  FileEdit,
  Home,
  BookOpen,
  Gavel,
  HelpCircle,
  Clock,
  ExternalLink,
  X,
  Lock,
  ChevronRight,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  badge?: string;
  icon: typeof ShieldCheck;
  highlight?: boolean;
}

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "Operativni alati za teren",
    items: [
      {
        href: "/kontrolor",
        label: "Kontrolor na BM",
        badge: "Checklista",
        icon: ClipboardList,
      },
      {
        href: "/validator",
        label: "Validator zapisnika",
        badge: "Član 116",
        icon: Calculator,
      },
      {
        href: "/prijavi",
        label: "Prijavi incident",
        badge: "Memorandum",
        icon: FileEdit,
      },
      {
        href: "/van-birackog-mesta",
        label: "Glasanje van BM",
        badge: "Poverenici",
        icon: Home,
      },
    ],
  },
  {
    group: "Pravna baza i edukacija",
    items: [
      {
        href: "/pravila",
        label: "Baza nepravilnosti",
        icon: BookOpen,
      },
      {
        href: "/krivicna-dela",
        label: "Krivična dela (KZ)",
        badge: "Zatvor",
        icon: Gavel,
      },
      {
        href: "/mit-ili-cinjenica",
        label: "Mit ili činjenica",
        badge: "Kviz",
        icon: HelpCircle,
      },
    ],
  },
  {
    group: "Zaštita prava i izvori",
    items: [
      {
        href: "/rokovi",
        label: "Rokovi i prigovori",
        badge: "72h",
        icon: Clock,
      },
      {
        href: "/izvori",
        label: "Zvanični izvori",
        badge: "RIK",
        icon: BookOpen,
      },
    ],
  },
];

export function SiteSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto p-4 sm:p-5">
      {/* Top Branding & Close Button */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-2.5 font-extrabold tracking-tight text-ink group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors">
              <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-black text-ink">Izborna kontrola</span>
                <span className="rounded bg-brand/15 px-1 py-0.2 text-[10px] font-bold text-brand">
                  2026
                </span>
              </div>
              <span className="text-[10px] font-medium text-ink-faint">
                Građanski pravni štit
              </span>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-2 hover:text-ink lg:hidden"
            aria-label="Zatvori meni"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* HIGH-PRIORITY EMERGENCY CTA */}
        <Link
          href="/vidim-problem"
          onClick={close}
          className={cn(
            "group relative flex items-center justify-between overflow-hidden rounded-xl border p-3 text-xs font-bold transition-all shadow-sm",
            pathname === "/vidim-problem"
              ? "border-rose-500 bg-rose-600 text-white shadow-rose-500/20 shadow-md"
              : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:border-rose-500 hover:bg-rose-500 hover:text-white"
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/20 text-current">
              <Zap className="h-3.5 w-3.5 fill-current" />
            </span>
            <span>Vidim problem sada</span>
          </div>
          <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-extrabold uppercase">
            Hitno
          </span>
        </Link>

        {/* NAVIGATION GROUPS */}
        <div className="space-y-5 pt-2">
          {NAV_GROUPS.map((grp) => (
            <div key={grp.group} className="space-y-1.5">
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                {grp.group}
              </p>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className={cn(
                        "group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all",
                        active
                          ? "bg-brand text-white shadow-sm font-bold"
                          : "text-ink-dim hover:bg-surface-2 hover:text-ink"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            active
                              ? "text-white"
                              : "text-ink-faint group-hover:text-ink"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase shrink-0",
                            active
                              ? "bg-white/20 text-white"
                              : "bg-surface-2 text-ink-faint group-hover:text-ink-dim"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom info & Privacy notice */}
      <div className="border-t border-border/70 pt-4 mt-6">
        <div className="flex items-center gap-2 rounded-xl bg-surface-2 p-2.5 text-[11px] text-ink-dim">
          <Lock className="h-3.5 w-3.5 shrink-0 text-brand" />
          <span className="leading-tight">
            100% lokalno. Nijedan podatak se ne šalje na server.
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between px-1 text-[10px] text-ink-faint">
          <span>Izborna Kontrola · v2.4</span>
          <Link href="/" className="hover:text-ink" onClick={close}>
            Početna
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP PERMANENT SIDEBAR (Visible on lg+) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-border bg-surface/95 backdrop-blur shadow-sm">
        {sidebarContent}
      </aside>

      {/* 2. MOBILE & TABLET SLIDE-OVER DRAWER (Visible when isOpen is true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div
            className="fixed inset-y-0 left-0 w-[85vw] max-w-[310px] bg-surface shadow-2xl border-r border-border flex flex-col z-10 animate-in slide-in-from-left duration-250 ease-out"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
