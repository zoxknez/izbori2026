"use client";

import { useState, useMemo } from "react";
import { ExternalLink, Search, X, BookOpen, ShieldCheck, Globe, Users, CheckCircle2 } from "lucide-react";
import type { SourceEntry } from "@/content/sources";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TIER_META: Record<
  number,
  {
    title: string;
    badge: string;
    icon: typeof BookOpen;
    desc: string;
    badgeColor: string;
  }
> = {
  1: {
    title: "Tier 1: Normativni i zvanični državni izvori",
    badge: "Tier 1: Zvanični propisi",
    icon: BookOpen,
    desc: "Ustav Republike Srbije, Zakon o izboru narodnih poslanika (ZINP), Zakon o lokalnim izborima, Krivični zakonik i obavezujuća uputstva RIK-a.",
    badgeColor: "bg-brand/10 text-brand border-brand/30",
  },
  2: {
    title: "Tier 2: Međunarodna tela i institucionalna analiza",
    badge: "Tier 2: Međunarodna tela",
    icon: Globe,
    desc: "Zvanični konačni izveštaji posmatračke misije OEBS/ODIHR i standardi Venecijanske komisije Saveta Evrope o slobodnim i poštenim izborima.",
    badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  },
  3: {
    title: "Tier 3: Akreditovane domaće posmatračke misije",
    badge: "Tier 3: Posmatrači",
    icon: Users,
    desc: "Nezavisne organizacije civilnog društva koje vrše sveobuhvatan terenski monitoring na biračkim mestima u skladu sa međunarodnim standardima.",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
};

export function SourcesExplorer({ sources }: { sources: SourceEntry[] }) {
  const [selectedTier, setSelectedTier] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return sources.filter((s) => {
      const matchTier = selectedTier === "all" || s.tier === selectedTier;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.label.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q));
      return matchTier && matchSearch;
    });
  }, [sources, selectedTier, search]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<number, SourceEntry[]>>((acc, s) => {
      (acc[s.tier] ??= []).push(s);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Controls: Search and Tier Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tier Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedTier("all")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
              selectedTier === "all"
                ? "bg-brand text-white shadow-sm"
                : "bg-surface-2 text-ink-dim hover:text-ink"
            )}
          >
            Svi izvori ({sources.length})
          </button>
          {[1, 2, 3].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                selectedTier === t
                  ? "bg-brand text-white shadow-sm"
                  : "bg-surface-2 text-ink-dim hover:text-ink"
              )}
            >
              Tier {t} ({sources.filter((s) => s.tier === t).length})
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraži izvore i propise..."
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-8 text-xs text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grouped results */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-xs text-ink-dim">
          Nema pronađenih izvora za uneti kriterijum pretrage.
        </div>
      ) : (
        <div className="space-y-8">
          {[1, 2, 3].map((tierNum) => {
            const items = grouped[tierNum];
            if (!items || items.length === 0) return null;
            const meta = TIER_META[tierNum];
            const Icon = meta.icon;

            return (
              <div key={tierNum} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-2 text-ink-dim">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-ink">{meta.title}</h2>
                    <p className="text-[11px] text-ink-dim">{meta.desc}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((s) => (
                    <Card
                      key={s.id}
                      className="group flex flex-col justify-between border-border bg-surface p-4 transition-all hover:border-brand hover:shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                              meta.badgeColor
                            )}
                          >
                            {meta.badge}
                          </span>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-faint group-hover:text-brand transition-colors"
                          >
                            <span>Otvori</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>

                        <h3 className="mt-2.5 text-sm font-bold text-ink group-hover:text-brand transition-colors">
                          {s.label}
                        </h3>

                        {s.description && (
                          <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">
                            {s.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 border-t border-border/60 pt-2 text-[11px] text-ink-faint truncate">
                        {s.url}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
