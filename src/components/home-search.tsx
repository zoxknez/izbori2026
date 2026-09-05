"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";

const SUGGESTIONS = [
  "Bugarski voz",
  "Slikanje listića",
  "UV lampa",
  "Glasanje van BM",
  "Kontrolni list",
];

export function HomeSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSearch(q: string) {
    const trimmed = q.trim();
    router.push(trimmed ? `/pravila?q=${encodeURIComponent(trimmed)}` : "/pravila");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    handleSearch(value);
  }

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="relative group">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-faint transition-colors group-focus-within:text-brand" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Brza pretraga npr. "fotografisanje", "UV lampa", "bugarski voz"...'
          className="h-13 w-full rounded-xl border border-border/80 bg-surface/90 pl-11 pr-28 text-sm text-ink placeholder:text-ink-faint/80 shadow-xs transition-all focus:border-brand/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint hover:bg-surface-2 hover:text-ink"
              aria-label="Poništi unos"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="h-10 rounded-lg bg-surface-2 px-4 text-xs font-semibold text-ink border border-border/60 hover:bg-border/60 hover:text-white transition-colors"
          >
            Pretraži
          </button>
        </div>
      </form>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
        <span className="text-[11px] font-medium text-ink-faint/80">Često traženo:</span>
        {SUGGESTIONS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleSearch(tag)}
            className="rounded-md border border-border/60 bg-surface/40 px-2 py-0.5 text-[11px] font-medium text-ink-dim hover:border-brand/40 hover:bg-surface-2 hover:text-brand transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

