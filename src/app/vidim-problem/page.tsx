import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { ProblemWizard } from "@/components/problem-wizard";
import { Zap, Clock, ShieldAlert, FileEdit } from "lucide-react";

export const revalidate = 3600;

export const metadata = {
  title: "Vidim problem sada — Hitna dijagnostika nepravilnosti",
  description:
    "Interaktivni vodič za hitnu intervenciju na biračkom mestu. Unesite šta vidite i saznajte tačnu zakonsku proceduru, korake za kontrolora i način unošenja u zapisnik.",
  alternates: { canonical: "/vidim-problem" },
};

export default async function VidimProblemPage() {
  const rules = await getAllRules();

  return (
    <Container className="py-8 sm:py-12">
      {/* Hero section */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Zap className="h-3.5 w-3.5" />
          <span>Hitna intervencija na biračkom mestu</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-ink">
          Vidim problem sada
        </h1>
        <p className="mt-2 text-base leading-relaxed text-ink-dim sm:text-lg">
          Nalazite se na biračkom mestu i uočili ste nepravilnost? Pronađite situaciju u dva klika
          ili pretražite po ključnoj reči. Saznajte šta odmah proveriti, šta tačno preduzeti i
          kako zahtevati unos u Zapisnik.
        </p>
      </div>

      {/* 3 Quick operational reminders */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              Reagujte odmah
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">
              Upozorite predsednika odbora u trenutku dešavanja nepravilnosti. Naknadne usmene primedbe se u praksi teže dokazuju.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              Zabeležite svedoke
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">
              Zapišite tačno vreme i imena drugih članova biračkog odbora ili akreditovanih posmatrača koji su posmatrali događaj.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileEdit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              Primedba u Zapisnik
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">
              Izborna komisija priznaje samo ono što je uneto u zvanični Zapisnik o radu biračkog odbora pre potpisivanja.
            </p>
          </div>
        </div>
      </div>

      {/* Main interactive wizard */}
      <div className="mt-8">
        <ProblemWizard rules={rules} />
      </div>
    </Container>
  );
}
