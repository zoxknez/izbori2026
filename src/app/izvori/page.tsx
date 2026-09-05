import { getSources } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { SourcesExplorer } from "@/components/sources-explorer";
import { BookOpen, ShieldCheck, Scale, FileText, CheckCircle2 } from "lucide-react";

export const revalidate = 3600;

export const metadata = {
  title: "Pravni izvori i propisi — Zvanična dokumentacija",
  description:
    "Zvanični pravni i institucionalni izvori: Zakon o izboru narodnih poslanika, Krivični zakonik, uputstva RIK-a i izveštaji posmatračkih misija OEBS/ODIHR i CRTA.",
  alternates: { canonical: "/izvori" },
};

export default async function IzvoriPage() {
  const sources = await getSources();

  return (
    <Container className="py-8 sm:py-12">
      {/* Hero section */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Pravna utemeljenost i transparentnost</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-ink">
          Zvanični pravni izvori i propisi
        </h1>
        <p className="mt-2 text-base leading-relaxed text-ink-dim sm:text-lg">
          Ovaj vodič kao primarne izvore koristi važeće propise Republike Srbije i zvanične
          obrasce Republičke izborne komisije, a nalaze posmatračkih misija koristi kao kontekst.
          Svaku konkretnu situaciju treba proveriti prema propisu i uputstvu koji važe za dati izborni ciklus.
        </p>
      </div>

      {/* 3 Pillars of Legal Integrity */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              1. Pozitivno izborno pravo
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">
              Ustav RS, ZINP, Zakon o lokalnim izborima, Zakon o JBS i Krivični zakonik Srbije (čl. 154–161).
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              2. Zvanična podzakonska akta
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">
              Pravilnik o radu biračkih odbora, uputstva o glasanju i zvanični obrasci RIK-a (uključujući ZP-4).
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              3. Verifikovani monitoring
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">
              Nalazi međunarodnih posmatrača (OEBS / ODIHR) i akreditovanih domaćih organizacija (CRTA).
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Sources Explorer */}
      <div className="mt-10">
        <SourcesExplorer sources={sources} />
      </div>

      {/* Methodological Box */}
      <div className="mt-12 rounded-2xl border border-border bg-surface-2 p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand" />
          <h2 className="text-sm font-bold text-ink">
            Metodologija pravne obrade i ažuriranja baze
          </h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-dim">
          Pravne reference su vezane za konkretne članove propisa i zvanične izvore. Pre svake upotrebe
          proverite da li je zakon izmenjen, da li se primenjuje odgovarajući izborni nivo i da li je RIK
          objavio novo uputstvo ili obrazac za konkretne izbore. Ovaj sajt je informativni alat, ne pravno mišljenje.
        </p>
      </div>
    </Container>
  );
}
