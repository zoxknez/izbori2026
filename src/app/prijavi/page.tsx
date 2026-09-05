import { Suspense } from "react";
import { FileText, CheckCircle2, Lock, Scale } from "lucide-react";
import { Container } from "@/components/ui/container";
import { IncidentForm } from "@/components/incident-form";

export const metadata = {
  title: "Prijavi incident — Generator hronologije i primedbe",
  description:
    "Generator činjenične hronologije izborne nepravilnosti, bez naloga i bez slanja na server. Spremno za unošenje u Zapisnik ili pravni tim.",
  alternates: { canonical: "/prijavi" },
};

export default function PrijaviPage() {
  return (
    <Container className="py-8 sm:py-12">
      {/* Header section */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
          <FileText className="h-3.5 w-3.5" />
          <span>Službeni alat za kontrolore i birače</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-ink">
          Generator hronologije incidenta
        </h1>
        <p className="mt-2 text-base leading-relaxed text-ink-dim sm:text-lg">
          Popunite samo ono što pouzdano znate. Alat automatski generiše činjeničnu, pravno
          preciznu hronologiju bez politizacije — spremnu za unošenje u Zapisnik o radu biračkog
          odbora ili slanje pravnom timu.
        </p>
      </div>

      {/* 3 Golden Advice Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              Zlatno pravilo zapisnika
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">
              Svaka primedba mora biti zavedena u zvanični Zapisnik pre njegovog potpisivanja. Ako predsednik odbora odbije, to se izričito navodi.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              Činjenice, ne utisci
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">
              Zapišite tačno vreme, ko je šta uradio i ko je prisustvovao. Izbegavajte pretpostavke i opšte političke ocene.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              Privatno i lokalno
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">
              Podaci se čuvaju lokalno u ovom pregledaču i aplikacija ih ne šalje na server.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form wrapped in Suspense for searchParams */}
      <div className="mt-8">
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-surface text-ink-dim">
              <span className="text-sm font-medium">Učitavanje forme...</span>
            </div>
          }
        >
          <IncidentForm />
        </Suspense>
      </div>
    </Container>
  );
}
