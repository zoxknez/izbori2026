"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Rule, Severity } from "@/lib/types";
import { CATEGORY_META, SEVERITY_ORDER, SEVERITY_META } from "@/lib/types";
import { PHASE_META } from "@/lib/phases";
import { RuleCard } from "@/components/rule-card";
import { cn } from "@/lib/utils";

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

  const categories = useMemo(() => {
    const set = new Set(rules.map((r) => r.kategorija));
    return Array.from(set);
  }, [rules]);

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
        r.legalRule.toLowerCase().includes(q)
      );
    });
  }, [rules, query, category, severity, phase]);

  const hasFilters = Boolean(query || category || severity || phase);

  return (
    <div>
      {phase && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-brand">
          <span>Faza: {PHASE_META[phase]?.label ?? phase}</span>
          <button onClick={() => setPhase(null)} className="ml-auto text-brand/70 hover:text-brand">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Pretraži, npr. "fotografisanje listića" ili "nema UV lampe"...'
          className="h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SEVERITY_ORDER.map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverity(severity === sev ? null : sev)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              severity === sev
                ? SEVERITY_META[sev].className
                : "border-border bg-surface-2 text-ink-dim hover:text-ink"
            )}
          >
            {SEVERITY_META[sev].emoji} {SEVERITY_META[sev].label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? null : cat)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === cat
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-border bg-surface-2 text-ink-dim hover:text-ink"
            )}
          >
            {CATEGORY_META[cat]?.label ?? cat}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-ink-faint">
          {filtered.length} od {rules.length} {rules.length === 1 ? "nepravilnosti" : "nepravilnosti"}
        </p>
        {hasFilters && (
          <button
            onClick={() => {
              setQuery("");
              setCategory(null);
              setSeverity(null);
              setPhase(null);
            }}
            className="flex items-center gap-1 text-xs font-medium text-ink-faint hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
            Obriši filtere
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-ink-faint">
            Nema rezultata za zadate filtere. Pokušaj drugačiju pretragu.
          </div>
        ) : (
          filtered.map((rule) => <RuleCard key={rule.id} rule={rule} />)
        )}
      </div>
    </div>
  );
}
