"use client";

import { useState } from "react";
import type { DecisionTree } from "@/lib/domain/decision-trees/types";

type EditableTree = Pick<DecisionTree, "title" | "description" | "publicationStatus" | "reviewStatus">;

export function AdminDecisionTreeEditor({ trees, role }: { trees: DecisionTree[]; role: string }) {
  const [selectedId, setSelectedId] = useState(trees[0]?.id ?? "");
  const [draft, setDraft] = useState<EditableTree | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selected = trees.find((tree) => tree.id === selectedId);
  const original = selected ? { title: selected.title, description: selected.description, publicationStatus: selected.publicationStatus, reviewStatus: selected.reviewStatus } : null;
  const current = draft ?? original;
  const canWrite = ["SUPER_ADMIN", "LEGAL_EDITOR", "CONTENT_EDITOR"].includes(role);
  const canReview = ["SUPER_ADMIN", "LEGAL_EDITOR", "REVIEWER"].includes(role);
  const changed = Boolean(original && current && JSON.stringify(original) !== JSON.stringify(current));

  async function save() {
    if (!selected || !current || !changed || (!canWrite && !canReview)) return;
    const response = await fetch(`/api/admin/decision-trees/${selected.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(current) });
    const body = (await response.json()) as { error?: string; ok?: boolean };
    setMessage(response.ok && body.ok ? "Stablo je sačuvano i upisano u audit log." : body.error ?? "Stablo nije sačuvano.");
    if (response.ok) setDraft(null);
  }

  return <div className="grid gap-5 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.5fr)]"><div className="rounded-2xl border border-border bg-surface p-4">{trees.map((tree) => <button key={tree.id} type="button" onClick={() => { setSelectedId(tree.id); setDraft(null); setMessage(null); }} className={`w-full rounded-xl px-3 py-2 text-left ${tree.id === selected?.id ? "bg-brand/10 text-brand" : "hover:bg-surface-2"}`}><span className="block text-xs font-bold">{tree.id}</span><span className="block text-sm text-ink">{tree.title}</span><span className="block text-xs text-ink-faint">{tree.nodes.length} čvorova · {tree.reviewStatus}</span></button>)}</div>{selected && current ? <div className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs font-bold uppercase tracking-wider text-brand">{selected.id} · {selected.slug}</p><label className="mt-5 block text-sm font-semibold text-ink">Naslov<input disabled={!canWrite} value={current.title} onChange={(event) => setDraft({ ...current, title: event.target.value })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink disabled:opacity-60" /></label><label className="mt-4 block text-sm font-semibold text-ink">Opis<textarea disabled={!canWrite} value={current.description} onChange={(event) => setDraft({ ...current, description: event.target.value })} rows={4} className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 p-3 text-sm text-ink disabled:opacity-60" /></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-ink">Objava<select disabled={!canReview} value={current.publicationStatus} onChange={(event) => setDraft({ ...current, publicationStatus: event.target.value as EditableTree["publicationStatus"] })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink disabled:opacity-60"><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></select></label><label className="text-sm font-semibold text-ink">Review<select disabled={!canReview} value={current.reviewStatus} onChange={(event) => setDraft({ ...current, reviewStatus: event.target.value as EditableTree["reviewStatus"] })} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm text-ink disabled:opacity-60"><option value="unreviewed">unreviewed</option><option value="content_review">content_review</option><option value="legal_review">legal_review</option><option value="verified">verified</option><option value="stale">stale</option></select></label></div><div className="mt-5 rounded-xl border border-border bg-surface-2 p-3 text-xs text-ink-dim"><p className="font-semibold text-ink">Graf čvorova</p><ul className="mt-2 space-y-1">{selected.nodes.map((node) => <li key={node.id}>{node.id} · {node.type} · {node.options.length} opcija · {node.ruleIds.length} direktnih pravila</li>)}</ul></div><div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" disabled={!changed || (!canWrite && !canReview)} onClick={save} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink disabled:opacity-40">Sačuvaj stablo</button>{message && <p role="status" className="text-sm text-ink-dim">{message}</p>}</div><p className="mt-4 text-xs text-ink-faint">Uloga: {role}. Promena statusa i objave prolazi kroz server-side RBAC i audit.</p></div> : <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-ink-dim">Nema stabala.</div>}</div>;
}
