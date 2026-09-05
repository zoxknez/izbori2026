"use client";

import { useState } from "react";
import type { SourceEntry } from "@/content/sources";

type EditableSource = {
  label: string;
  description: string;
  publisher: string;
  version: string;
  validFromDate: string;
  validUntilDate: string;
  status: NonNullable<SourceEntry["status"]>;
  supersedesId: string | null;
};

type SourceImpact = {
  rules: number;
  training: number;
  simulation: number;
  decisionBranches: number;
};

export function AdminSourceEditor({
  sources,
  role,
  impactBySource,
}: {
  sources: SourceEntry[];
  role: string;
  impactBySource: Record<string, SourceImpact>;
}) {
  const [selectedId, setSelectedId] = useState(sources[0]?.id ?? "");
  const [draft, setDraft] = useState<EditableSource | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canWrite = ["SUPER_ADMIN", "LEGAL_EDITOR"].includes(role);
  const selected = sources.find((source) => source.id === selectedId);
  const original: EditableSource | null = selected
    ? {
        label: selected.label,
        description: selected.description ?? "",
        publisher: selected.publisher ?? "",
        version: selected.version ?? "",
        validFromDate: selected.validFromDate ?? "",
        validUntilDate: selected.validUntilDate ?? "",
        status: selected.status ?? "active",
        supersedesId: selected.supersedesId ?? null,
      }
    : null;
  const current = draft ?? original;
  const changed = Boolean(original && current && JSON.stringify(original) !== JSON.stringify(current));
  const impact = selected ? impactBySource[selected.id] : undefined;

  function choose(id: string) {
    setSelectedId(id);
    setDraft(null);
    setMessage(null);
  }

  function updateDraft(next: Partial<EditableSource>) {
    if (current) setDraft({ ...current, ...next });
  }

  async function save() {
    if (!selected || !current || !changed || !canWrite) return;
    setMessage(null);
    const response = await fetch(`/api/admin/sources/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(current),
    });
    const body = (await response.json()) as { error?: string; ok?: boolean; stale?: { rules: number; decisionTrees: number } };
    if (response.ok && body.ok) {
      setDraft(null);
      setMessage(
        body.stale && (body.stale.rules > 0 || body.stale.decisionTrees > 0)
          ? `Sačuvano. Označeno stale: ${body.stale.rules} pravila i ${body.stale.decisionTrees} stabla.`
          : "Izvor je sačuvan i upisan u audit log.",
      );
    } else {
      setMessage(body.error ?? "Izvor nije sačuvan.");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.5fr)]">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="space-y-1">
          {sources.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => choose(source.id)}
              className={`w-full rounded-xl px-3 py-2 text-left ${source.id === selected?.id ? "bg-brand/10 text-brand" : "hover:bg-surface-2"}`}
            >
              <span className="block text-xs font-bold">{source.id}</span>
              <span className="block text-sm text-ink">{source.label}</span>
              <span className="block text-xs text-ink-faint">{source.status ?? "active"}</span>
            </button>
          ))}
        </div>
      </div>
      {selected && current && original ? (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">{selected.id} · Tier {selected.tier}</p>
          <h2 className="mt-1 text-xl font-extrabold text-ink">{selected.label}</h2>
          <a href={selected.url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-brand underline">{selected.url}</a>
          {impact && (
            <div className="mt-4 grid gap-2 rounded-xl border border-border bg-surface-2 p-3 text-xs text-ink-dim sm:grid-cols-4">
              <span>Pravila: <strong className="text-ink">{impact.rules}</strong></span>
              <span>Trening: <strong className="text-ink">{impact.training}</strong></span>
              <span>Simulator: <strong className="text-ink">{impact.simulation}</strong></span>
              <span>Tree grane: <strong className="text-ink">{impact.decisionBranches}</strong></span>
            </div>
          )}
          <label className="mt-6 block text-sm font-semibold text-ink">Naziv<input disabled={!canWrite} value={current.label} onChange={(event) => updateDraft({ label: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60" /></label>
          <label className="mt-4 block text-sm font-semibold text-ink">Izdavač<input disabled={!canWrite} value={current.publisher} onChange={(event) => updateDraft({ publisher: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60" /></label>
          <label className="mt-4 block text-sm font-semibold text-ink">Opis<textarea disabled={!canWrite} value={current.description} onChange={(event) => updateDraft({ description: event.target.value })} rows={4} className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 p-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60" /></label>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold text-ink">Verzija<input disabled={!canWrite} value={current.version} onChange={(event) => updateDraft({ version: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60" /></label>
            <label className="text-sm font-semibold text-ink">Važi od<input type="date" disabled={!canWrite} value={current.validFromDate} onChange={(event) => updateDraft({ validFromDate: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60" /></label>
            <label className="text-sm font-semibold text-ink">Važi do<input type="date" disabled={!canWrite} value={current.validUntilDate} onChange={(event) => updateDraft({ validUntilDate: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60" /></label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-ink">Status izvora<select disabled={!canWrite} value={current.status} onChange={(event) => updateDraft({ status: event.target.value as EditableSource["status"] })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink disabled:opacity-60"><option value="active">active</option><option value="superseded">superseded</option><option value="archived">archived</option></select></label>
            <label className="text-sm font-semibold text-ink">Zamenjuje izvor<select disabled={!canWrite} value={current.supersedesId ?? ""} onChange={(event) => updateDraft({ supersedesId: event.target.value || null })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink disabled:opacity-60"><option value="">Nije navedeno</option>{sources.filter((source) => source.id !== selected.id).map((source) => <option key={source.id} value={source.id}>{source.id} · {source.label}</option>)}</select></label>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" disabled={!canWrite || !changed} onClick={save} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink disabled:opacity-40">Sačuvaj izvor</button>{message && <p role="status" className="text-sm text-ink-dim">{message}</p>}</div>
          <p className="mt-4 text-xs leading-relaxed text-ink-faint">Uloga: {role}. Kada se izvor označi kao superseded, zavisna pravila i stabla se automatski označavaju za novu pravnu proveru. Publish dataseta je zaseban korak.</p>
        </div>
      ) : <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-ink-dim">Nema izvora.</div>}
    </div>
  );
}
