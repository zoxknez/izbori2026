"use client";

import { useMemo, useState } from "react";
import { SEVERITY_META, type Rule } from "@/lib/types";

type EditableRule = {
  summary: string;
  legalRule: string;
  publicationStatus: NonNullable<Rule["publicationStatus"]>;
  reviewStatus: NonNullable<Rule["reviewStatus"]>;
};

type RuleImpact = { decisionBranches: number; trainingQuestions: number; simulationChoices: number };

export function AdminRuleEditor({ rules, role, impactByRule }: { rules: Rule[]; role: string; impactByRule: Record<string, RuleImpact> }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(rules[0]?.id ?? "");
  const [draft, setDraft] = useState<EditableRule | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const filtered = useMemo(() => rules.filter((rule) => `${rule.id} ${rule.naziv} ${rule.slug}`.toLowerCase().includes(query.toLowerCase())), [rules, query]);
  const selected = rules.find((rule) => rule.id === selectedId) ?? filtered[0];
  const original: EditableRule | null = selected ? { summary: selected.summary, legalRule: selected.legalRule, publicationStatus: selected.publicationStatus ?? "published", reviewStatus: selected.reviewStatus ?? "legal_review" } : null;
  const current = draft ?? original;
  const impact = selected ? impactByRule[selected.id] : undefined;
  const canReview = ["SUPER_ADMIN", "LEGAL_EDITOR", "REVIEWER"].includes(role);
  const canWriteContent = ["SUPER_ADMIN", "LEGAL_EDITOR", "CONTENT_EDITOR"].includes(role);
  const changed = Boolean(original && current && (original.summary !== current.summary || original.legalRule !== current.legalRule || original.publicationStatus !== current.publicationStatus || original.reviewStatus !== current.reviewStatus));

  function choose(id: string) { setSelectedId(id); setDraft(null); setShowDiff(false); setMessage(null); }
  function updateDraft(next: Partial<EditableRule>) { if (current) setDraft({ ...current, ...next }); }

  async function save() {
    if (!selected || !current || !changed) return;
    setMessage(null);
    const response = await fetch(`/api/admin/rules/${selected.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(current) });
    const body = await response.json() as { error?: string; ok?: boolean };
    setMessage(response.ok && body.ok ? "Izmena je sačuvana i upisana u audit log." : body.error ?? "Izmena nije sačuvana.");
    if (response.ok) { setDraft(null); setShowDiff(false); }
  }

  return <div className="grid gap-5 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.5fr)]">
    <div className="rounded-2xl border border-border bg-surface p-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pretraži pravila…" className="h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink outline-none focus:border-brand" /><div className="mt-3 max-h-[32rem] space-y-1 overflow-y-auto">{filtered.map((rule) => <button key={rule.id} type="button" onClick={() => choose(rule.id)} className={`w-full rounded-xl px-3 py-2 text-left ${rule.id === selected?.id ? "bg-brand/10 text-brand" : "hover:bg-surface-2"}`}><span className="text-xs font-bold">{rule.id}</span><span className="ml-2 text-sm text-ink">{rule.naziv}</span></button>)}</div></div>
    {selected && current && original ? <div className="rounded-2xl border border-border bg-surface p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-brand">{selected.id} · {selected.slug}</p><h2 className="mt-1 text-xl font-extrabold text-ink">{selected.naziv}</h2></div><span className="rounded-lg border border-border px-2.5 py-1 text-xs text-ink-dim">{SEVERITY_META[selected.severity].label}</span></div>
      {impact && <div className="mt-4 grid gap-2 rounded-xl border border-border bg-surface-2 p-3 text-xs text-ink-dim sm:grid-cols-3"><span>Decision grane: <strong className="text-ink">{impact.decisionBranches}</strong></span><span>Training pitanja: <strong className="text-ink">{impact.trainingQuestions}</strong></span><span>Simulation izbora: <strong className="text-ink">{impact.simulationChoices}</strong></span></div>}
      <label className="mt-6 block text-sm font-semibold text-ink">Sažetak<textarea disabled={!canWriteContent} value={current.summary} onChange={(event) => updateDraft({ summary: event.target.value })} rows={4} className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 p-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60" /></label>
      <label className="mt-4 block text-sm font-semibold text-ink">Pravno pravilo<textarea disabled={!canWriteContent} value={current.legalRule} onChange={(event) => updateDraft({ legalRule: event.target.value })} rows={6} className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 p-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60" /></label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Objava<select disabled={!canReview} value={current.publicationStatus} onChange={(event) => updateDraft({ publicationStatus: event.target.value as EditableRule["publicationStatus"] })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink disabled:opacity-60"><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></select></label><label className="text-sm font-semibold text-ink">Review<select disabled={!canReview} value={current.reviewStatus} onChange={(event) => updateDraft({ reviewStatus: event.target.value as EditableRule["reviewStatus"] })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink disabled:opacity-60"><option value="unreviewed">unreviewed</option><option value="content_review">content_review</option><option value="legal_review">legal_review</option><option value="verified">verified</option><option value="stale">stale</option></select></label></div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" disabled={!changed} onClick={() => setShowDiff(true)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-40">Pregled diff-a</button><button type="button" disabled={!changed} onClick={save} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink disabled:opacity-40">Sačuvaj izmenu</button>{message && <p role="status" className="text-sm text-ink-dim">{message}</p>}</div>
      <p className="mt-4 text-xs leading-relaxed text-ink-faint">Uloga: {role}. Promena javnog/offline dataseta zahteva zaseban validiran publish korak.</p>
      {showDiff && <div role="dialog" aria-modal="true" aria-label="Pregled izmene" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-ink">Pregled izmene pre čuvanja</h3><button type="button" onClick={() => setShowDiff(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink">Zatvori</button></div><div className="mt-4 space-y-4 text-sm"><div><p className="font-semibold text-ink">Sažetak</p><div className="mt-1 grid gap-2 sm:grid-cols-2"><pre className="whitespace-pre-wrap rounded-xl border border-border bg-red-500/5 p-3 text-xs text-ink-dim">{original.summary}</pre><pre className="whitespace-pre-wrap rounded-xl border border-border bg-emerald-500/5 p-3 text-xs text-ink-dim">{current.summary}</pre></div></div><div><p className="font-semibold text-ink">Pravno pravilo</p><div className="mt-1 grid gap-2 sm:grid-cols-2"><pre className="whitespace-pre-wrap rounded-xl border border-border bg-red-500/5 p-3 text-xs text-ink-dim">{original.legalRule}</pre><pre className="whitespace-pre-wrap rounded-xl border border-border bg-emerald-500/5 p-3 text-xs text-ink-dim">{current.legalRule}</pre></div></div><p className="text-xs text-ink-faint">Levo je prethodna vrednost, desno nova. Publish će ponovo validirati kompletan snapshot.</p></div><button type="button" onClick={save} className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink">Potvrdi i sačuvaj</button></div></div>}
    </div> : <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-ink-dim">Nema rezultata.</div>}
  </div>;
}
