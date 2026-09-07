import { Check, Minus, ShieldCheck, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LEGAL_REFS } from "@/content/legal-references";

export const metadata = { title: "Uloge na biračkom mestu", description: "Šta član biračkog odbora, zamenik, posmatrač i birač mogu da rade na dan izbora.", alternates: { canonical: "/uloge" } };

const rows = [
  ["Učestvuje u radu biračkog odbora", true, true, false, false],
  ["Posmatra otvaranje, brojanje i predaju", true, true, true, false],
  ["Rukuje izbornim materijalom", true, true, false, false],
  ["Unosi primedbu kao član BO", true, true, false, false],
  ["Može tražiti informaciju da li je evidentiran da je glasao", false, false, false, true],
] as const;

export default function UlogePage() {
  return <Container className="space-y-10 py-8 sm:py-12"><section className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand"><Users className="h-3.5 w-3.5" /> Uloge i granice ovlašćenja</span><h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Ko šta sme na biračkom mestu?</h1><p className="mt-3 text-base leading-relaxed text-ink-dim">Uloge nisu zamenljive: posmatrač prati, član biračkog odbora sprovodi radnje, a birač ostvaruje i štiti svoje biračko pravo.</p></section><section className="overflow-x-auto rounded-3xl border border-border/80 bg-surface p-3 sm:p-6"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint"><th className="p-3">Radnja</th><th className="p-3">Član BO</th><th className="p-3">Zamenik</th><th className="p-3">Posmatrač</th><th className="p-3">Birač</th></tr></thead><tbody>{rows.map(([action, ...rights]) => <tr key={action} className="border-b border-border-soft last:border-0"><td className="p-3 font-medium text-ink">{action}</td>{rights.map((right, index) => <td key={index} className="p-3">{right ? <Check className="h-5 w-5 text-emerald-400" aria-label="Da" /> : <Minus className="h-5 w-5 text-ink-faint" aria-label="Ne" />}</td>)}</tr>)}</tbody></table></section><section className="rounded-3xl border border-brand/30 bg-brand/5 p-6 sm:p-8"><div className="flex gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-brand" /><div><h2 className="text-xl font-bold text-ink">Ako si član ili zamenik predložen od opozicione liste</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-dim">Imaš pravo da budeš uključen u sve aktivnosti odbora, naročito primopredaju materijala, brojanje, popunjavanje i kontrolu zapisnika. Pri glasanju van biračkog mesta najmanje jedan poverenik mora biti predstavnik opozicione liste.</p><p className="mt-3 text-xs font-semibold text-brand">{LEGAL_REFS.oppositionBoard.article}</p></div></div></section><p className="text-xs leading-relaxed text-ink-faint">Za akreditovanog posmatrača važi pravo na nesmetano praćenje svake izborne radnje, uz obavezu poštovanja reda na biračkom mestu. {LEGAL_REFS.observer.article}.</p></Container>;
}
