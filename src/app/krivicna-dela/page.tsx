import { Gavel, Scale, ShieldAlert, AlertTriangle } from "lucide-react";
import { getCriminalArticles } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { CriminalExplorer } from "@/components/criminal-explorer";

export const revalidate = 3600;

export const metadata = {
  title: "Krivična dela protiv izbornih prava (Glava XV KZ RS)",
  description:
    "Glava XV Krivičnog zakonika Republike Srbije (čl. 154-161): kupovina glasova, pretnje, falsifikovanje i zloupotrebe na biračkom mestu sa zaprećenim zatvorskim kaznama.",
  alternates: { canonical: "/krivicna-dela" },
};

export default async function KrivicnaDelaPage() {
  const articles = await getCriminalArticles();

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 sm:pb-24">
      {/* Top Banner */}
      <section className="border-b border-border-soft bg-gradient-to-b from-surface/80 via-canvas to-canvas py-8 sm:py-14">
        <Container>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-500/10 px-3.5 py-1 text-xs font-semibold text-slate-300">
              <Scale className="h-3.5 w-3.5" />
              <span>Krivični zakonik Republike Srbije · Glava XV (čl. 154-161)</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Krivična dela protiv izbornih prava
            </h1>

            <p className="mt-3 text-base leading-relaxed text-ink-dim sm:text-lg">
              Izborne neregularnosti nisu samo proceduralne greške - najteže zloupotrebe predstavljaju{" "}
              <strong>krivična dela za koja je zaprećena višegodišnja zatvorska kazna</strong>. Sva ova
              dela se gone <strong>po službenoj dužnosti</strong> od strane javnog tužilaštva.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-faint">
              <span className="flex items-center gap-1.5">
                <Gavel className="h-4 w-4 text-sev-teska" />
                Zatvorske kazne do 5 godina zatvora
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-sev-ponistavanje" />
                Stroža odgovornost za članove biračkog odbora
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Protocol Banner: What to do when a crime is observed */}
      <Container>
        <div className="rounded-3xl border border-border/80 bg-surface/80 p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Operativni protokol</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Šta uraditi ako posumnjaš na krivično delo?
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-ink-dim">
              Ako prisustvuješ kupovini glasova, ucenama, pretnjama ili falsifikovanju zapisnika:
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-surface-2/40 p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand text-sm font-bold">
                1
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink">Bezbedno prikupi činjenice</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                Lična bezbednost je na prvom mestu - ne ulazi u fizički sukob. Zapiši tačno vreme, imena učesnika, registarske tablice vozila i obezbedi svedoke.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface-2/40 p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand text-sm font-bold">
                2
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink">Unos primedbe u zapisnik</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                Ako se delo dešava na biračkom mestu, član odbora MORA zahtevati da se događaj unese u zapisnik biračkog odbora kao obrazložena primedba pre zaključenja.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-surface-2/40 p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sev-teska/15 text-sev-teska text-sm font-bold">
                3
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink">Prijava tužiocu i policiji</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                Pozovi Policiju na <strong>192</strong> ili se obrati dežurnom zameniku javnog tužioca u Osnovnom javnom tužilaštvu (OJT) koji je dežuran tokom izbornog dana.
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* Main Interactive Explorer */}
      <Container>
        <CriminalExplorer articles={articles} />
      </Container>

      {/* Legal Disclaimer Box */}
      <Container>
        <div className="rounded-2xl border border-border/80 bg-surface/50 p-5 text-xs text-ink-dim leading-relaxed flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-ink-faint shrink-0 mt-0.5" />
          <div>
            <strong className="text-ink">Pravna napomena:</strong> Ovaj pregled služi za edukaciju birača i kontrolora o zakonskim normama Krivičnog zakonika Republike Srbije. Podnošenje krivične prijave vrši se pred nadležnim javnim tužilaštvom ili policijom. Za pravno formulisanje prijave preporučuje se konsultacija sa advokatom.
          </div>
        </div>
      </Container>
    </div>
  );
}
