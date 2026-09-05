import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { StepFlow } from "@/components/step-flow";
import { TOK_GLASANJA, REDOSLED_BROJANJA } from "@/lib/flows";
import { PHASE_META } from "@/lib/phases";
import { PhaseIcon } from "@/components/phase-icon";
import { SeverityBadge } from "@/components/ui/severity-badge";

export const revalidate = 3600;

export const metadata = {
  title: "Kontrolor: kontrolna lista",
  description: "Propisani tok glasanja i brojanja, korak po korak, za članove biračkog odbora i posmatrače.",
};

const PHASE_OVERVIEW = [
  { phase: "pre_otvaranja", label: "Pre otvaranja" },
  { phase: "identifikacija", label: "Identitet i spisak" },
  { phase: "glasanje", label: "Tajnost i sloboda" },
  { phase: "zatvaranje", label: "Zatvaranje" },
  { phase: "brojanje", label: "Brojanje" },
  { phase: "zapisnik", label: "Zapisnik" },
];

export default async function KontrolorPage() {
  const rules = await getAllRules();
  const annulment = rules.filter((r) => r.isAutomaticAnnulment);

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Kontrolor: kontrolna lista</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Propisani redosled radnji na biračkom mestu. Ako nešto od ovoga izostane ili se uradi
        pogrešnim redosledom, potraži situaciju u{" "}
        <Link href="/pravila" className="text-brand hover:underline">bazi nepravilnosti</Link>.
      </p>

      <Card className="mt-8 border-sev-ponistavanje/25 bg-sev-ponistavanje/[0.04] p-6 sm:p-8">
        <p className="font-bold text-sev-ponistavanje">🚨 Četiri razloga za automatsko poništavanje</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">
          Za ove situacije zakon izričito propisuje poništavanje glasanja na biračkom mestu po
          službenoj dužnosti. Proveri ih prve.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {annulment.map((r) => (
            <Link key={r.id} href={`/pravila/${r.slug}`} className="group block">
              <Card className="flex h-full flex-col gap-2.5 border-sev-ponistavanje/20 bg-surface p-4 transition-colors hover:border-sev-ponistavanje/50">
                <div className="flex items-center justify-between">
                  <SeverityBadge severity="ponistavanje" size="sm" />
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-sev-ponistavanje" />
                </div>
                <p className="text-sm font-semibold leading-snug text-ink group-hover:text-sev-ponistavanje">
                  {r.naziv}
                </p>
                <p className="line-clamp-2 text-xs leading-relaxed text-ink-faint">{r.summary}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Card>

      <div id="tok-glasanja" className="mt-10 scroll-mt-20">
        <h2 className="text-lg font-bold text-ink">Propisani tok glasanja</h2>
        <p className="mt-1 text-sm text-ink-dim">Od ulaska birača do ubacivanja listića u kutiju.</p>
        <div className="mt-4">
          <StepFlow steps={TOK_GLASANJA} />
        </div>
      </div>

      <div id="brojanje" className="mt-10 scroll-mt-20">
        <h2 className="text-lg font-bold text-ink">Redosled brojanja glasova</h2>
        <p className="mt-1 text-sm text-ink-dim">
          Redosled je propisan: preskakanje koraka ili menjanje redosleda je nepravilnost.
        </p>
        <div className="mt-4">
          <StepFlow steps={REDOSLED_BROJANJA} />
        </div>
        <Link
          href="/validator"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
        >
          Otvori matematički validator zapisnika
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-ink">Pregled po fazama</h2>
        <p className="mt-1 text-sm text-ink-dim">Otvori bazu nepravilnosti filtriranu po fazi izbornog dana.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PHASE_OVERVIEW.map(({ phase, label }) => {
            const count = rules.filter((r) => r.phase === phase).length;
            return (
              <Link key={phase} href={`/pravila?faza=${phase}`} className="group block">
                <Card className="flex h-full flex-col gap-3 p-4 transition-colors hover:border-brand/40 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-brand">
                      <PhaseIcon icon={PHASE_META[phase]?.icon ?? "triangle-alert"} className="h-4.5 w-4.5" />
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink group-hover:text-brand">{label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-faint">{PHASE_META[phase]?.hint}</p>
                  </div>
                  <p className="mt-auto text-2xl font-bold text-ink">
                    {count}
                    <span className="ml-1.5 text-xs font-medium text-ink-faint">opisanih situacija</span>
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </Container>
  );
}
