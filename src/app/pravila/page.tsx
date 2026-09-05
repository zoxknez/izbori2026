import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { RulesExplorer } from "@/components/rules-explorer";

export const revalidate = 3600;

export const metadata = {
  title: "Baza nepravilnosti",
  description: "Kompletna baza izbornih nepravilnosti u Srbiji sa pravnim osnovom i uputstvom šta uraditi.",
};

export default async function PravilaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ponistavanje?: string; faza?: string }>;
}) {
  const rules = await getAllRules();
  const { q, ponistavanje, faza } = await searchParams;

  const annulmentCount = rules.filter((r) => r.isAutomaticAnnulment).length;
  const criminalCount = rules.filter((r) => r.severity === "krivicno_delo").length;

  return (
    <div className="pb-16 sm:pb-24">
      {/* Top Banner */}
      <section className="border-b border-border-soft bg-gradient-to-b from-surface/60 via-canvas to-canvas py-8 sm:py-12">
        <Container>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-2/80 px-3 py-1 text-xs font-medium text-ink-dim">
                <span>Pravni registar izbornog dana</span>
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Baza nepravilnosti
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-dim sm:text-base">
                Kompletan registar od <strong>{rules.length} situacija</strong> iz prakse: od dozvoljenih
                i informativnih radnji, preko proceduralnih nepravilnosti, do mogućih krivičnih dela sa tačnim članovima zakona.
              </p>
            </div>

            {/* Quick counters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-xl border border-sev-ponistavanje/30 bg-sev-ponistavanje/10 px-3 py-1.5 font-semibold text-sev-ponistavanje">
                🚨 {annulmentCount} automatskih poništavanja
              </span>
              <span className="rounded-xl border border-border/80 bg-surface-2 px-3 py-1.5 font-semibold text-ink-dim">
                ⚖️ {criminalCount} krivičnih dela
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Explorer Section */}
      <Container className="pt-8">
        <RulesExplorer
          rules={rules}
          initialQuery={q ?? ""}
          initialSeverity={ponistavanje ? "ponistavanje" : null}
          initialPhase={faza ?? null}
        />
      </Container>
    </div>
  );
}
