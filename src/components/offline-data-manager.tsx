"use client";

import { useEffect, useState } from "react";
import { Database, Download, Trash2 } from "lucide-react";
import { clearOfflineUserData, getOfflineStorageSummary } from "@/lib/offline/indexed-db";
import { downloadAndActivateDataset } from "@/lib/offline/dataset-manager";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function OfflineDataManager() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getOfflineStorageSummary>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() { try { setSummary(await getOfflineStorageSummary()); } catch { setSummary(null); } }
  // Initial IndexedDB read is an external synchronization, not a render-derived value.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, []);

  async function download() {
    setBusy(true); setMessage(null);
    try { const snapshot = await downloadAndActivateDataset(); setMessage(`Dataset ${snapshot.version} je validiran i aktiviran offline.`); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Preuzimanje nije uspelo."); }
    finally { setBusy(false); }
  }

  async function clear() {
    if (!window.confirm("Obrisati lokalne incidente, mastery, istoriju i draft flagove? Dataset ostaje sačuvan.")) return;
    setBusy(true); setMessage(null);
    try { await clearOfflineUserData(); setMessage("Lokalne beleške i progres su obrisani. Aktivni dataset je sačuvan."); await refresh(); }
    catch { setMessage("Brisanje lokalnih podataka nije uspelo."); }
    finally { setBusy(false); }
  }

  return <section className="mt-6 rounded-2xl border border-border bg-surface p-5 text-left"><div className="flex items-start gap-3"><Database className="mt-0.5 h-5 w-5 text-brand" /><div><h2 className="text-lg font-bold text-ink">Lokalni podaci</h2><p className="mt-1 text-sm leading-relaxed text-ink-dim">Dataset se proverava hash-om i cross-reference pravilima pre aktiviranja. Beleške i progres ostaju samo na ovom uređaju.</p></div></div>{summary && <div className="mt-4 grid gap-2 text-xs text-ink-dim sm:grid-cols-2"><span>Aktivna verzija: <strong className="text-ink">{summary.activeDatasetVersion ?? "nije preuzeta"}</strong></span><span>Prostor: <strong className="text-ink">{formatBytes(summary.usage)}</strong>{summary.quota ? ` / ${formatBytes(summary.quota)}` : ""}</span><span>Incidenti: <strong className="text-ink">{summary.incidentCount}</strong></span><span>Mastery zapisi: <strong className="text-ink">{summary.knowledgeCount}</strong> · simulacije: <strong className="text-ink">{summary.simulationCount}</strong></span></div>}<div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={download} className="inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-bold text-brand-ink disabled:opacity-50"><Download className="h-4 w-4" />{busy ? "Radim…" : "Preuzmi aktuelni dataset"}</button><button type="button" disabled={busy} onClick={clear} className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-xs font-semibold text-ink disabled:opacity-50"><Trash2 className="h-4 w-4" />Obriši beleške i progres</button></div>{message && <p role="status" className="mt-3 text-xs text-ink-dim">{message}</p>}</section>;
}
