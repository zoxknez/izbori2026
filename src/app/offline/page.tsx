import Link from "next/link";
import { OfflineDataManager } from "@/components/offline-data-manager";

export const metadata = { title: "Offline režim" };

export default function OfflinePage() {
  return <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-5 py-12"><div className="w-full rounded-3xl border border-border bg-surface p-8 text-center shadow-card"><p className="text-xs font-bold uppercase tracking-wider text-brand">Offline režim</p><h1 className="mt-3 text-3xl font-extrabold text-ink">Veza trenutno nije dostupna</h1><p className="mt-3 text-sm leading-relaxed text-ink-dim">Otvori keširane alate za pravila, validator, trening ili simulator. Tvoje lokalne beleške i progres ostaju na uređaju.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Link href="/pravila" className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-brand-ink">Pravila</Link><Link href="/validator" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink">Validator</Link><Link href="/trening/kviz" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink">Trening</Link></div><OfflineDataManager /></div></main>;
}
