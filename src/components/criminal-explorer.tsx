"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Gavel,
  Search,
  X,
  Scale,
  Copy,
  Check,
  TriangleAlert,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import type { CriminalArticle } from "@/content/criminal-articles";
import { cn } from "@/lib/utils";

const QUICK_TAGS = [
  { label: "Sva dela", query: "" },
  { label: "Mito i kupovina glasova", query: "156" },
  { label: "Pretnje i ucene", query: "155" },
  { label: "Falsifikovanje zapisnika", query: "161" },
  { label: "Glasanje pod tuđim imenom", query: "157" },
  { label: "Birački spiskovi", query: "158" },
];

export function CriminalExplorer({ articles }: { articles: CriminalArticle[] }) {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => {
      return (
        a.article.toLowerCase().includes(q) ||
        a.naziv.toLowerCase().includes(q) ||
        a.opis.toLowerCase().includes(q) ||
        a.primer.toLowerCase().includes(q) ||
        a.kazna.toLowerCase().includes(q)
      );
    });
  }, [articles, query]);

  function handleCopy(a: CriminalArticle) {
    const text = `Krivični zakonik Republike Srbije - Član ${a.article}: ${a.naziv}\n\nOpis: ${a.opis}\nPrimer: ${a.primer}\nZaprećena kazna: ${a.kazna}`;
    navigator.clipboard.writeText(text);
    setCopiedId(a.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Search and Quick Filters */}
      <div className="rounded-3xl border border-border/80 bg-surface/80 p-5 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint transition-colors group-focus-within:text-brand" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Pretraži po članu (npr. "156") ili pojmu ("mito", "pretnja poslom", "falsifikat")...'
              className="h-12 w-full rounded-xl border border-border/80 bg-surface-2/60 pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint shadow-xs transition-all focus:border-brand/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                aria-label="Obriši pretragu"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Tag Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink-faint font-medium">Brzi filteri:</span>
            {QUICK_TAGS.map((tag) => {
              const isSelected = query.toLowerCase() === tag.query.toLowerCase();
              return (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => setQuery(tag.query)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 font-medium transition-colors",
                    isSelected
                      ? "border-brand/50 bg-brand/15 text-brand"
                      : "border-border/80 bg-surface-2/80 text-ink-dim hover:border-border hover:text-ink"
                  )}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header Meta */}
      <div className="flex items-center justify-between text-xs text-ink-faint px-1">
        <span>
          Prikazano <strong>{filtered.length}</strong> od <strong>{articles.length}</strong> krivičnih dela
        </span>
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-brand font-medium hover:underline"
          >
            Obriši filter pretrage
          </button>
        )}
      </div>

      {/* Articles List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 bg-surface/40 p-12 text-center">
          <Scale className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 text-base font-bold text-ink">Nema pronađenih krivičnih dela</p>
          <p className="mt-1 text-xs text-ink-dim">
            Pokušaj sa brojem člana (npr. 155, 156) ili blažim pojmovima.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-2 text-xs font-semibold text-ink hover:bg-border"
          >
            Prikaži sva dela
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const isCopied = copiedId === a.id;
            return (
              <div
                key={a.id}
                className="group relative rounded-3xl border border-border/80 border-l-[4px] border-l-slate-400 bg-surface/85 p-6 sm:p-7 shadow-card transition-all duration-200 hover:border-brand/40 hover:bg-surface-2 hover:shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Article Label and Title */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-slate-500/40 bg-slate-500/15 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-200">
                        Član {a.article} KZ RS
                      </span>
                      <span className="text-xs text-ink-faint">
                        Krivični zakonik Republike Srbije
                      </span>
                    </div>

                    <h2 className="mt-2.5 text-xl font-bold text-ink group-hover:text-brand transition-colors">
                      {a.naziv}
                    </h2>
                  </div>

                  {/* Penalty Badge */}
                  <div className="self-start">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-sev-teska/30 bg-sev-teska/10 px-3 py-1.5 text-xs font-bold text-sev-teska">
                      <Gavel className="h-3.5 w-3.5" />
                      Zaprećena zatvorska kazna
                    </span>
                  </div>
                </div>

                {/* Legal Description */}
                <p className="mt-3 text-sm leading-relaxed text-ink font-medium">
                  {a.opis}
                </p>

                {/* Real-world Practical Example */}
                <div className="mt-4 rounded-2xl border border-border/70 bg-surface-2/60 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                    Primer iz prakse / Kako se prepoznaje:
                  </p>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-ink-dim italic">
                    {a.primer}
                  </p>
                </div>

                {/* What is NOT evidence by itself (if defined) */}
                {a.nijeDokaz && (
                  <div className="mt-3 rounded-2xl border border-sev-info/30 bg-sev-info/5 p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sev-info">
                      <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                      Pravna napomena: Šta NIJE dokaz sam po sebi
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                      {a.nijeDokaz}
                    </p>
                  </div>
                )}

                {/* Sanction Details */}
                <div className="mt-4 rounded-xl border border-sev-teska/20 bg-sev-teska/[0.04] p-3.5 text-xs">
                  <span className="font-bold text-sev-teska">Zakon propisuje kaznu: </span>
                  <span className="text-ink-dim font-medium">{a.kazna}</span>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 pt-4 border-t border-border-soft flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(a)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface-2 px-3 py-1.5 font-semibold text-ink hover:border-brand/40 hover:text-brand transition-colors"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-sev-dozvoljeno" /> : <Copy className="h-3.5 w-3.5" />}
                      {isCopied ? "Kopirano!" : "Kopiraj član za primedbu"}
                    </button>

                    <Link
                      href={`/pravila?q=clan+${a.article}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-surface-2 px-3 py-1.5 font-semibold text-ink-dim hover:text-ink hover:border-border transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Povezane situacije
                    </Link>
                  </div>

                  <Link
                    href={`/prijavi?rule=krivicno-delo-clan-${a.article}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-sev-teska hover:underline"
                  >
                    <TriangleAlert className="h-3.5 w-3.5" />
                    Prijavi ovo krivično delo →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
