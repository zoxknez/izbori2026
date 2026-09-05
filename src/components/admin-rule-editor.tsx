"use client";

import { useMemo, useState } from "react";
import type { AdminRole } from "@/lib/domain/admin/rbac";
import { SEVERITY_META, type Rule } from "@/lib/types";

export function AdminRuleEditor({ rules, role }: { rules: Rule[]; role: string }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(rules[0]?.id ?? "");
  const [draft, setDraft] = useState<Pick<Rule, "summary" | "legalRule" | "publicationStatus" | "reviewStatus"> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const filtered = useMemo(() => rules.filter((rule) => `${rule.id} ${rule.naziv} ${rule.slug}`.toLowerCase().includes(query.toLowerCase())), [rules, query]);
  const selected = rules.find((rule) => rule.id === selectedId) ?? filtered[0];
  const current = draft ?? (selected ? { summary: selected.summary, legalRule: selected.legalRule, publicationStatus: selected.publicationStatus ?? "published", reviewStatus: selected.reviewStatus ?? "legal_review" } : null);
  const canReview = ["SUPER_ADMIN", "LEGAL_EDITOR", "REVIEWER"].includes(role);

  function choose(id: string) { setSelectedId(id); setDraft(null); setMessage(null); }
  async function save() {
    if (!selected || !current) return;
    setMessage(null);
    const response = await fetch(`/api/admin/rules/${selected.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(current) });
    const body = await response.json() as { error?: string; ok?: boolean };
    setMessage(response.ok && body.ok ? "Izmena je sačuvana i upisana u audit log." : body.error ?? "Izmena nije sačuvana.");
  }

  return <div className="grid gap-5 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.5fr)]"><div className="rounded-2xl border border-border bg-surface p-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pretraži pravila…" className="h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink outline-none focus:border-brand" /><div className="mt-3 max-h-[32rem] space-y-1 overflow-y-auto">{filtered.map((rule) => <button key={rule.id} type="button" onClick={() => choose(rule.id)} className={`w-full rounded-xl px-3 py-2 text-left ${rule.id === selected?.id ? "bg-brand/10 text-brand" : "hover:bg-surface-2"}`}><span className="text-xs font-bold">{rule.id}</span><span className="ml-2 text-sm text-ink">{rule.naziv}</span></button>)}</div></div>{selected && current ? <div className="rounded-2xl border border-border bg-surface p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-brand">{selected.id} · {selected.slug}</p><h2 className="mt-1 text-xl font-extrabold text-ink">{selected.naziv}</h2></div><span className="rounded-lg border border-border px-2.5 py-1 text-xs text-ink-dim">{SEVERITY_META[selected.severity].label}</span></div><label className="mt-6 block text-sm font-semibold text-ink">Sažetak<textarea value={current.summary} onChange={(event) => setDraft({ ...current, summary: event.target.value })} rows={4} className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 p-3 text-sm text-ink outline-none focus:border-brand" /></label><label className="mt-4 block text-sm font-semibold text-ink">Pravno pravilo<textarea value={current.legalRule} onChange={(event) => setDraft({ ...current, legalRule: event.target.value })} rows={6} className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 p-3 text-sm text-ink outline-none focus:border-brand" /></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Objava<select value={current.publicationStatus} onChange={(event) => setDraft({ ...current, publicationStatus: event.target.value as Rule["publicationStatus"] })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink"><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></select></label><label className="text-sm font-semibold text-ink">Review<select disabled={!canReview} value={current.reviewStatus} onChange={(event) => setDraft({ ...current, reviewStatus: event.target.value as Rule["reviewStatus"] })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink"><option value="unreviewed">unreviewed</option><option value="content_review">content_review</option><option value="legal_review">legal_review</option><option value="verified">verified</option><option value="stale">stale</option></select></label></div><div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={save} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink">Sačuvaj izmenu</button>{message && <p role="status" className="text-sm text-ink-dim">{message}</p>}</div><p className="mt-4 text-xs leading-relaxed text-ink-faint">Uloga: {role as AdminRole}. Promena javnog/offline dataseta zahteva zaseban validiran publish korak.</p></div> : <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-ink-dim">Nema rezultata.</div>}</div>;
}
