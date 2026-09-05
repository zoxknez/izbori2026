"use client";

import { useEffect, useState } from "react";
import { CloudOff, Wifi } from "lucide-react";
import { registerServiceWorker } from "@/lib/offline/service-worker";

export function OfflineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    registerServiceWorker().catch(() => undefined);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);
  return <div role="status" aria-live="polite" className="fixed bottom-20 right-3 z-40 sm:bottom-4">{online ? <span className="sr-only"><Wifi /> Online</span> : <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-surface px-3 py-2 text-xs font-semibold text-amber-400 shadow-card"><CloudOff className="h-3.5 w-3.5" /> Offline režim — lokalni podaci dostupni</span>}</div>;
}
