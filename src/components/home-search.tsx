"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

export function HomeSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/pravila?q=${encodeURIComponent(q)}` : "/pravila");
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='npr. "fotografisanje listića", "nema UV lampe"...'
        className="h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-24 text-sm text-ink placeholder:text-ink-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1.5 h-9 rounded-lg bg-surface-2 px-4 text-xs font-semibold text-ink hover:bg-border"
      >
        Pretraži
      </button>
    </form>
  );
}
