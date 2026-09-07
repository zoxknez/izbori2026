"use client";

import { useEffect, useState } from "react";
import { CloudOff, Download, ShieldAlert, Wifi } from "lucide-react";
import { activateWaitingServiceWorker, registerServiceWorker } from "@/lib/offline/service-worker";
import { checkForDatasetUpdate, downloadAndActivateDataset, type DatasetUpdateInfo } from "@/lib/offline/dataset-manager";
import { cn } from "@/lib/utils";

export function OfflineStatus() {
  const [online, setOnline] = useState(true);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateBlocked, setUpdateBlocked] = useState(false);
  const [dataset, setDataset] = useState<DatasetUpdateInfo | null>(null);
  const [datasetBusy, setDatasetBusy] = useState(false);
  const [datasetMessage, setDatasetMessage] = useState<string | null>(null);
  const [datasetDismissed, setDatasetDismissed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    registerServiceWorker()
      .then((nextRegistration) => {
        if (!nextRegistration) return;
        setRegistration(nextRegistration);
        if (nextRegistration.waiting) setUpdateAvailable(true);
        nextRegistration.addEventListener("updatefound", () => {
          const worker = nextRegistration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdateAvailable(true);
          });
        });
      })
      .catch(() => undefined);

    // Provera nove verzije pravnog dataseta je odvojena od verzije aplikacije.
    void checkForDatasetUpdate().then((info) => {
      if (info?.hasUpdate) setDataset(info);
    });

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  async function updateApp() {
    if (!registration) return;
    const result = await activateWaitingServiceWorker(registration);
    if (result === "blocked") setUpdateBlocked(true);
    if (result === "activated") window.location.reload();
  }

  async function updateDataset() {
    setDatasetBusy(true);
    setDatasetMessage(null);
    try {
      const snapshot = await downloadAndActivateDataset();
      setDatasetMessage(`Pravila su ažurirana na verziju ${snapshot.version}.`);
      setDataset(null);
    } catch {
      setDatasetMessage("Ažuriranje nije uspelo. Prethodna verzija pravila ostaje aktivna.");
    } finally {
      setDatasetBusy(false);
    }
  }

  const criticalDataset = dataset?.updatePriority === "critical";

  return (
    <>
      {dataset && !datasetDismissed && (
        <div
          role="status"
          aria-live={criticalDataset ? "assertive" : "polite"}
          className={cn(
            "sticky top-16 z-30 border-b px-4 py-2.5 text-sm",
            criticalDataset
              ? "border-rose-500/40 bg-rose-500/15 text-rose-100"
              : "border-brand/30 bg-brand/10 text-ink",
          )}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2">
            {criticalDataset && <ShieldAlert className="h-4 w-4 shrink-0" />}
            <span className="font-semibold">
              {criticalDataset ? "Važna izmena izbornih pravila je dostupna." : "Nova verzija pravila je dostupna."}
            </span>
            <span className="text-xs opacity-80">
              {dataset.activeVersion ? `Trenutno: ${dataset.activeVersion} · ` : ""}
              Novo: {dataset.version}
              {dataset.legalReviewDate ? ` · provereno ${dataset.legalReviewDate}` : ""}
            </span>
            <span className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={updateDataset}
                disabled={datasetBusy}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50",
                  criticalDataset ? "bg-rose-500 text-white" : "bg-brand text-brand-ink",
                )}
              >
                {datasetBusy ? "Ažuriram…" : "Ažuriraj sada"}
              </button>
              {!criticalDataset && (
                <button
                  type="button"
                  onClick={() => setDatasetDismissed(true)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-dim"
                >
                  Kasnije
                </button>
              )}
            </span>
          </div>
        </div>
      )}

      <div role="status" aria-live="polite" className="fixed bottom-20 right-3 z-40 space-y-2 sm:bottom-4">
        {datasetMessage && (
          <span className="block max-w-xs rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-card">
            {datasetMessage}
          </span>
        )}
        {!online && (
          <span className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-surface px-3 py-2 text-xs font-semibold text-amber-400 shadow-card">
            <CloudOff className="h-3.5 w-3.5" /> Offline režim - lokalni podaci dostupni
          </span>
        )}
        {updateAvailable && (
          <div className="flex max-w-xs items-center gap-2 rounded-2xl border border-brand/30 bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-card">
            <Download className="h-4 w-4 shrink-0 text-brand" />
            <span>{updateBlocked ? "Završi ili sačuvaj otvoreni rad pre ažuriranja." : "Nova verzija aplikacije je dostupna."}</span>
            {!updateBlocked && (
              <button type="button" onClick={updateApp} className="shrink-0 rounded-lg bg-brand px-2.5 py-1.5 text-brand-ink">
                Ažuriraj
              </button>
            )}
          </div>
        )}
        {online && !updateAvailable && (
          <span className="sr-only">
            <Wifi /> Online
          </span>
        )}
      </div>
    </>
  );
}
