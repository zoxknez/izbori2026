"use client";

import { useEffect, useState } from "react";
import { CloudOff, Download, Wifi } from "lucide-react";
import { activateWaitingServiceWorker, registerServiceWorker } from "@/lib/offline/service-worker";

export function OfflineStatus() {
  const [online, setOnline] = useState(true);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateBlocked, setUpdateBlocked] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    registerServiceWorker().then((nextRegistration) => {
      if (!nextRegistration) return;
      setRegistration(nextRegistration);
      if (nextRegistration.waiting) setUpdateAvailable(true);
      nextRegistration.addEventListener("updatefound", () => {
        const worker = nextRegistration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdateAvailable(true);
        });
      });
    }).catch(() => undefined);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);
  async function updateApp() {
    if (!registration) return;
    const result = await activateWaitingServiceWorker(registration);
    if (result === "blocked") setUpdateBlocked(true);
    if (result === "activated") window.location.reload();
  }
  return <div role="status" aria-live="polite" className="fixed bottom-20 right-3 z-40 space-y-2 sm:bottom-4">
    {!online && <span className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-surface px-3 py-2 text-xs font-semibold text-amber-400 shadow-card"><CloudOff className="h-3.5 w-3.5" /> Offline režim - lokalni podaci dostupni</span>}
    {updateAvailable && <div className="flex max-w-xs items-center gap-2 rounded-2xl border border-brand/30 bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-card"><Download className="h-4 w-4 shrink-0 text-brand" /><span>{updateBlocked ? "Završi ili sačuvaj otvoreni rad pre ažuriranja." : "Nova verzija aplikacije je dostupna."}</span>{!updateBlocked && <button type="button" onClick={updateApp} className="shrink-0 rounded-lg bg-brand px-2.5 py-1.5 text-brand-ink">Ažuriraj</button>}</div>}
    {online && !updateAvailable && <span className="sr-only"><Wifi /> Online</span>}
  </div>;
}
