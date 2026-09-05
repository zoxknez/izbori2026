"use client";

import { useState } from "react";

export function AdminPublishButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function publish() {
    if (!window.confirm("Objaviti trenutno validiran sadržaj kao novu produkcionu offline verziju?")) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/publish", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const body = await response.json() as { version?: string; error?: string };
      setMessage(response.ok ? `Objavljeno: ${body.version}` : body.error ?? "Publish nije uspeo.");
    } catch { setMessage("Mrežna greška tokom publish-a."); }
    finally { setBusy(false); }
  }

  return <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4"><p className="text-sm font-bold text-ink">Produkcioni dataset</p><p className="mt-1 text-xs leading-relaxed text-ink-dim">Validira sadržaj iz baze, kreira immutable snapshot i beleži promenu u audit log.</p><button type="button" disabled={busy} onClick={publish} className="mt-3 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink disabled:opacity-50">{busy ? "Objavljujem…" : "Objavi trenutni dataset"}</button>{message && <p role="status" className="mt-2 text-xs text-ink-dim">{message}</p>}</div>;
}
