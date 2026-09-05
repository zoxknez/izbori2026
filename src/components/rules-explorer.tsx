"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Search,
  X,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import type { Rule, Severity } from "@/lib/types";
import { CATEGORY_META, SEVERITY_ORDER, SEVERITY_META } from "@/lib/types";
import { PHASE_META } from "@/lib/phases";
import { RuleCard } from "@/components/rule-card";
import { cn } from "@/lib/utils";

const SEVERITY_PRIORITY: Record<Severity, number> = {
  ponistavanje: 1,
  teska_nepravilnost: 2,
  krivicno_delo: 3,
  nepravilnost: 4,
  proveri: 5,
  info: 6,
  dozvoljeno: 7,
};

type SortOption = "priority" | "az" | "za" | "annulment";

export function RulesExplorer({
  rules,
  initialQuery = "",
  initialSeverity = null,
  initialPhase = null,
}: {
  rules: Rule[];
  initialQuery?: string;
  initialSeverity?: Severity | null;
  initialPhase?: string | null;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(initialSeverity);
  const [phase, setPhase] = useState<string | null>(initialPhase);
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [pageSize, setPageSize] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Extract available categories and counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rules) {
      counts[r.kategorija] = (counts[r.kategorija] || 0) + 1;
    }
    return counts;
  }, [rules]);

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rules) {
      counts[r.severity] = (counts[r.severity] || 0) + 1;
    }
    return counts;
  }, [rules]);

  const categories = useMemo(() => {
    return Object.keys(categoryCounts).sort((a, b) => (categoryCounts[b] ?? 0) - (categoryCounts[a] ?? 0));
  }, [categoryCounts]);

  // Filter rules
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rules.filter((r) => {
      if (category && r.kategorija !== category) return false;
      if (severity && r.severity !== severity) return false;
      if (phase && r.phase !== phase) return false;
      if (!q) return true;
      return (
        r.naziv.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.legalRule.toLowerCase().includes(q) ||
        (r.pravniOsnov && r.pravniOsnov.toLowerCase().includes(q))
      );
    });
  }, [rules, query, category, severity, phase]);

  // Sort filtered rules
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case "priority":
        return list.sort((a, b) => {
          const rankA = SEVERITY_PRIORITY[a.severity] ?? 99;
          const rankB = SEVERITY_PRIORITY[b.severity] ?? 99;
          if (rankA !== rankB) return rankA - rankB;
          return a.naziv.localeCompare(b.naziv, "sr");
        });
      case "annulment":
        return list.sort((a, b) => {
          if (a.isAutomaticAnnulment && !b.isAutomaticAnnulment) return -1;
          if (!a.isAutomaticAnnulment && b.isAutomaticAnnulment) return 1;
          return a.naziv.localeCompare(b.naziv, "sr");
        });
      case "az":
        return list.sort((a, b) => a.naziv.localeCompare(b.naziv, "sr"));
      case "za":
        return list.sort((a, b) => b.naziv.localeCompare(a.naziv, "sr"));
      default:
        return list;
    }
  }, [filtered, sortBy]);

  // Reset page to 1 whenever filters or sorting change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [query, category, severity, phase, sortBy, pageSize]);

  // Pagination calculation
  const totalItems = sorted.length;
  const isAll = pageSize === 0;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRules = useMemo(() => {
    if (isAll) return sorted;
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize, isAll]);

  const hasActiveFilters = Boolean(query || category || severity || phase);

  function resetFilters() {
    setQuery("");
    setCategory(null);
    setSeverity(null);
    setPhase(null);
  }

  function handlePageChange(newPage: number) {
    setCurrentPage(newPage);
    // Smooth scroll to top of list container
    const el = document.getElementById("rules-list-anchor");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="space-y-6">
      <div id="rules-list-anchor" className="scroll-mt-24" />

      {/* Top Search & Layout Controls Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search input */}
        <div className="relative flex-1 group">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint transition-colors group-focus-within:text-brand" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Pretraži situacije, npr. "paravan", "zapisnik", "UV lampa", "član 93"...'
            className="h-12 w-full rounded-xl border border-border/80 bg-surface/90 pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint shadow-xs transition-all focus:border-brand/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
              aria-label="Obriši unos"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sorting & Layout Toggles */}
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-ink-faint" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-12 appearance-none rounded-xl border border-border/80 bg-surface/90 pl-8 pr-8 text-xs font-semibold text-ink shadow-xs hover:border-brand/40 focus:border-brand/60 focus:outline-none cursor-pointer"
            >
              <option value="priority">Sort: Najkritičnije prvo</option>
              <option value="annulment">Sort: Poništavanja prvo</option>
              <option value="az">Sort: Po nazivu (A–Z)</option>
              <option value="za">Sort: Po nazivu (Z–A)</option>
            </select>
          </div>

          {/* Grid / List toggle */}
          <div className="hidden sm:flex items-center rounded-xl border border-border/80 bg-surface/90 p-1 shadow-xs">
            <button
              onClick={() => setLayout("grid")}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                layout === "grid" ? "bg-surface-2 text-brand shadow-xs" : "text-ink-faint hover:text-ink"
              )}
              title="Mrežni prikaz (Grid)"
              aria-label="Mrežni prikaz"
            >
              <LayoutGrid className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setLayout("list")}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                layout === "list" ? "bg-surface-2 text-brand shadow-xs" : "text-ink-faint hover:text-ink"
              )}
              title="Kompaktna lista"
              aria-label="Kompaktni prikaz"
            >
              <List className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex sm:hidden h-12 items-center gap-1.5 rounded-xl border border-border/80 bg-surface/90 px-3.5 text-xs font-semibold text-ink"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filteri</span>
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-brand" />
            )}
          </button>
        </div>
      </div>

      {/* Active Phase Banner */}
      {phase && (
        <div className="flex items-center justify-between rounded-xl border border-brand/40 bg-brand/10 px-4 py-2.5 text-sm text-brand">
          <span className="font-medium">
            Aktivna faza: <strong>{PHASE_META[phase]?.label ?? phase}</strong>
          </span>
          <button
            onClick={() => setPhase(null)}
            className="inline-flex items-center gap-1 rounded-md p-1 hover:bg-brand/20 transition-colors text-xs"
          >
            <X className="h-3.5 w-3.5" />
            Ukloni
          </button>
        </div>
      )}

      {/* Severity Filter Chips (Clean, horizontal scrollable) */}
      <div className={cn("space-y-3", !showMobileFilters && "hidden sm:block")}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Težina:
          </span>
          <button
            onClick={() => setSeverity(null)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              severity === null
                ? "border-brand/50 bg-brand/15 text-brand"
                : "border-border bg-surface-2 text-ink-dim hover:text-ink"
            )}
          >
            Sve ({rules.length})
          </button>
          {SEVERITY_ORDER.map((sev) => {
            const count = severityCounts[sev] || 0;
            const isSelected = severity === sev;
            return (
              <button
                key={sev}
                onClick={() => setSeverity(isSelected ? null : sev)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isSelected
                    ? SEVERITY_META[sev].className
                    : "border-border/80 bg-surface-2/80 text-ink-dim hover:text-ink hover:border-border"
                )}
              >
                <span>{SEVERITY_META[sev].emoji}</span>
                <span>{SEVERITY_META[sev].label}</span>
                <span className="text-[11px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Oblast:
          </span>
          <button
            onClick={() => setCategory(null)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === null
                ? "border-brand/50 bg-brand/15 text-brand"
                : "border-border bg-surface-2 text-ink-dim hover:text-ink"
            )}
          >
            Sve oblasti
          </button>
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(isSelected ? null : cat)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isSelected
                    ? "border-brand/50 bg-brand/15 text-brand"
                    : "border-border/80 bg-surface-2/80 text-ink-dim hover:text-ink hover:border-border"
                )}
              >
                <span>{CATEGORY_META[cat]?.label ?? cat}</span>
                <span className="text-[11px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Meta Bar: Results count, active filters reset & page size */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border-soft py-3 text-xs text-ink-faint">
        <div className="flex items-center gap-2">
          <span>
            Prikazano <strong>{totalItems === 0 ? 0 : isAll ? `1–${totalItems}` : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, totalItems)}`}</strong> od <strong>{totalItems}</strong> nepravilnosti
            {totalItems !== rules.length && (
              <span className="ml-1 text-ink-dim">(filtrirano od ukupno {rules.length})</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              Resetuj filtere
            </button>
          )}

          {/* Page size picker */}
          <div className="flex items-center gap-1">
            <span>Po strani:</span>
            {[12, 24, 0].map((size) => (
              <button
                key={size}
                onClick={() => setPageSize(size)}
                className={cn(
                  "rounded-md px-2 py-0.5 font-medium transition-colors",
                  pageSize === size
                    ? "bg-surface-2 text-ink border border-border"
                    : "text-ink-faint hover:text-ink"
                )}
              >
                {size === 0 ? "Sve" : size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rules Grid / List Content */}
      {paginatedRules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface/40 p-12 text-center">
          <p className="text-base font-semibold text-ink">Nema rezultata za zadate filtere</p>
          <p className="mt-1 text-xs text-ink-dim">
            Pokušaj sa blažim terminima ili resetuj izabrane kategorije.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-surface-2 border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-border transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Obriši sve filtere
          </button>
        </div>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {paginatedRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} layout="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {paginatedRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} layout="list" />
          ))}
        </div>
      )}

      {/* Pagination Controls - Replaces Endless Scroll */}
      {!isAll && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-soft pt-6">
          <p className="text-xs text-ink-dim">
            Stranica <strong>{safePage}</strong> od <strong>{totalPages}</strong>
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage <= 1}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border/80 bg-surface-2/80 px-3 text-xs font-semibold text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-2 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Prethodna
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show first, last, current, and neighbours
                  if (p === 1 || p === totalPages) return true;
                  if (Math.abs(p - safePage) <= 1) return true;
                  return false;
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const hasGap = prev && p - prev > 1;

                  return (
                    <div key={p} className="flex items-center">
                      {hasGap && <span className="px-1 text-ink-faint text-xs">...</span>}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={cn(
                          "h-9 w-9 rounded-lg text-xs font-semibold transition-colors",
                          p === safePage
                            ? "bg-brand text-canvas font-bold"
                            : "border border-border/80 bg-surface-2/80 text-ink hover:bg-surface-2"
                        )}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage >= totalPages}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border/80 bg-surface-2/80 px-3 text-xs font-semibold text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-2 transition-colors"
            >
              Sledeća
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
