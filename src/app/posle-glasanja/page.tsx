import Link from "next/link";
import { ArrowRight, ClipboardCheck, Eye, FileCheck2, ShieldAlert, Vote } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LEGAL_REFS } from "@/content/legal-references";

export const metadata = {
  title: "Posle glasanja: kontrola zapisnika i rezultata",
  description: "Vodič kroz zatvaranje biračkog mesta, brojanje, zapisnik, primopredaju i zakonsku kontrolu rezultata.",
  alternates: { canonical: "/posle-glasanja" },
};

const phases = [
  ["20:00", "Zatvaranje", "Birači koji su u redu u trenutku zatvaranja moraju dobiti priliku da glasaju."],
  ["01", "Brojanje", "Neupotrebljeni listići, broj birača koji su glasali, kontrolni list, pa tek onda kutija."],
  ["02", "Zapisnik", "Brojevi, prekidi, stanje kutije i primedbe moraju odgovarati stvarno utvrđenim činjenicama."],
  ["03", "Predaja", "Materijal se predaje bez odlaganja, najkasnije 12 časova od zatvaranja biračkog mesta."],
  ["04", "Kontrola", "Komisija proverava zapisnik; lake i teške greške imaju različit zakonski postupak."],
  ["05", "Rezultat", "Kada se rezultat ne može utvrditi ili postoji osnov iz čl. 116, odluka se donosi po službenoj dužnosti."],
] as const;

const modules = [
  { title: "Laka greška", article: LEGAL_REFS.lightErrors.article, tone: "text-sky-400", body: "Očigledne omaške u zapisniku mogu se ispraviti na osnovu izveštaja o kontroli." },
  { title: "Teška greška", article: LEGAL_REFS.heavyErrors.article, tone: "text-amber-400", body: "Gruba logičko-računska greška zahteva uvid u izborni materijal." },
  { title: "Rezultat se ne može utvrditi", article: LEGAL_REFS.resultUndetermined.article, tone: "text-orange-400", body: "Nema zapisnika, nema tri potpisa, glasanje nije održano/nastavljeno ili se greška ne može otkloniti." },
  { title: "Poništavanje", article: LEGAL_REFS.annulment.article, tone: "text-rose-400", body: "Četiri zakonska osnova: višak listića, birač van izvoda, kontrolni list i višak ukupnog materijala." },
] as const;

export default function PosleGlasanjaPage() {
  return (
    <div className="space-y-12 pb-16 sm:space-y-16 sm:pb-24">
      <section className="border-b border-border-soft bg-gradient-to-b from-surface via-canvas to-canvas py-10 sm:py-16">
        <Container>
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand"><Vote className="h-3.5 w-3.5" /> Postizborna kontrola</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">Glasanje je završeno. Kontrola tek počinje.</h1>
            <p className="mt-4 text-base leading-relaxed text-ink-dim sm:text-lg">Ovaj vodič razdvaja ono što birački odbor radi na biračkom mestu od onoga što nadležna komisija proverava pri predaji i kontroli zapisnika.</p>
          </div>
        </Container>
      </section>

      <Container>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Šest faza nakon zatvaranja biračkog mesta">
          {phases.map(([time, title, body]) => <li key={title} className="rounded-2xl border border-border/80 bg-surface/80 p-5 shadow-card"><span className="font-mono text-xs font-bold text-brand">{time}</span><h2 className="mt-2 text-lg font-bold text-ink">{title}</h2><p className="mt-2 text-sm leading-relaxed text-ink-dim">{body}</p></li>)}
        </ol>
      </Container>

      <Container>
        <div className="rounded-3xl border border-border/80 bg-surface/70 p-6 sm:p-8">
          <div className="flex items-start gap-3"><ClipboardCheck className="mt-0.5 h-6 w-6 text-brand" /><div><h2 className="text-2xl font-bold text-ink">Forenzika zapisnika</h2><p className="mt-1 text-sm text-ink-dim">Brojevi su samo prvi sloj. Pre potpisa proveri kontrolni list, prekide, stanje kutije, primedbe, potpise i predaju materijala.</p></div></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">{modules.map((item) => <article key={item.title} className="rounded-2xl border border-border/70 bg-surface-2/60 p-5"><p className={`text-xs font-bold uppercase tracking-wide ${item.tone}`}>{item.article}</p><h3 className="mt-2 font-bold text-ink">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-ink-dim">{item.body}</p></article>)}</div>
          <Link href="/validator" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand/90">Otvori validator zapisnika <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </Container>

      <Container>
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-border/80 bg-surface p-5"><FileCheck2 className="h-5 w-5 text-brand" /><h2 className="mt-3 font-bold text-ink">Kontrola uzorka</h2><p className="mt-2 text-sm leading-relaxed text-ink-dim">Opozicione liste pod zakonskim uslovima mogu tražiti kontrolu najviše 5% biračkih mesta u roku od 48 časova. Veće odstupanje može aktivirati dodatni uzorak.</p><p className="mt-3 text-xs font-semibold text-brand">{LEGAL_REFS.sampleCheck.article}</p></article>
          <article className="rounded-2xl border border-border/80 bg-surface p-5"><Eye className="h-5 w-5 text-brand" /><h2 className="mt-3 font-bold text-ink">Da li si evidentiran da si glasao?</h2><p className="mt-2 text-sm leading-relaxed text-ink-dim">Birač može od lokalne izborne komisije tražiti informaciju da li je u izvodu biračkog spiska evidentirano da je glasao. Aplikacija tu proveru ne radi umesto komisije.</p><p className="mt-3 text-xs font-semibold text-brand">{LEGAL_REFS.voterRecord.article}</p></article>
          <article className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-5"><ShieldAlert className="h-5 w-5 text-rose-400" /><h2 className="mt-3 font-bold text-ink">Ako postoji spor</h2><p className="mt-2 text-sm leading-relaxed text-ink-dim">Sačuvaj činjenice, vreme, lice koje je radnju preduzelo i dokaz. Pravni put i rok zavise od uloge, vrste radnje i objave odluke.</p><Link href="/rokovi" className="mt-3 inline-flex text-sm font-semibold text-rose-400 hover:underline">Rokovi i pravni lekovi <ArrowRight className="ml-1 h-4 w-4" /></Link></article>
        </div>
      </Container>
    </div>
  );
}
