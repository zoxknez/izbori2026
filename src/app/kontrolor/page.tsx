import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { StepFlow } from "@/components/step-flow";
import { TOK_GLASANJA, REDOSLED_BROJANJA } from "@/lib/flows";

export const revalidate = 3600;

export const metadata = {
  title: "Kontrolor: kontrolna lista",
  description: "Propisani tok glasanja i brojanja, korak po korak, za članove biračkog odbora i posmatrače.",
};

export default async function KontrolorPage() {
  const rules = await getAllRules();
  const annulment = rules.filter((r) => r.isAutomaticAnnulment);

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Kontrolor: kontrolna lista</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Propisani redosled radnji na biračkom mestu. Klikni na korak da vidiš tačno pravilo. Ako
        nešto od ovoga izostane ili se uradi pogrešnim redosledom, potraži situaciju u{" "}
        <Link href="/pravila" className="text-brand hover:underline">bazi nepravilnosti</Link>.
      </p>

      <Card className="mt-8 border-sev-ponistavanje/25 bg-sev-ponistavanje/[0.04] p-6 sm:p-8">
        <p className="font-bold text-sev-ponistavanje">🚨 Četiri razloga za automatsko poništavanje</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">
          Za ove situacije zakon izričito propisuje poništavanje glasanja na biračkom mestu po
          službenoj dužnosti. Proveri ih prve.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {annulment.map((r) => (
            <Link
              key={r.id}
              href={`/pravila/${r.slug}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3.5 py-3 text-sm hover:border-sev-ponistavanje/40"
            >
              <span className="text-ink">{r.naziv}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint" />
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { phase: "pre_otvaranja", label: "Pre otvaranja" },
            { phase: "identifikacija", label: "Identitet i spisak" },
            { phase: "glasanje", label: "Tajnost i sloboda" },
            { phase: "zatvaranje", label: "Zatvaranje" },
            { phase: "brojanje", label: "Brojanje" },
            { phase: "zapisnik", label: "Zapisnik" },
          ].map(({ phase, label }) => {
            const count = rules.filter((r) => r.phase === phase).length;
            return (
              <Link key={phase} href={`/pravila?faza=${phase}`}>
                <Card className="flex items-center justify-between p-4 transition-colors hover:border-ink-faint">
                  <div>
                    <p className="font-medium text-ink">{label}</p>
                    <p className="text-xs text-ink-faint">{count} opisanih situacija</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint" />
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </Container>
  );
}
