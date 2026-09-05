import Link from "next/link";
import {
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Ban,
  Calculator,
  Vote,
  ClipboardList,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { ControllerChecklist } from "@/components/controller-checklist";
import { StepFlow } from "@/components/step-flow";
import { TOK_GLASANJA, REDOSLED_BROJANJA } from "@/lib/flows";
import { PHASE_META } from "@/lib/phases";
import { PhaseIcon } from "@/components/phase-icon";
import { SeverityBadge } from "@/components/ui/severity-badge";

export const revalidate = 3600;

export const metadata = {
  title: "Kontrolor: kontrolna lista i vodič",
  description: "Interaktivni protokol, hronološki redosled glasanja i brojanja, i pravni štit za članove biračkog odbora i posmatrače.",
};

const PHASE_OVERVIEW = [
  { phase: "pre_otvaranja", label: "Pre otvaranja BM" },
  { phase: "identifikacija", label: "Identitet i spisak" },
  { phase: "glasanje", label: "Tajnost i paravan" },
  { phase: "zatvaranje", label: "Zatvaranje u 20:00" },
  { phase: "brojanje", label: "Brojanje glasova" },
  { phase: "zapisnik", label: "Zapisnik i pakovanje" },
];

export default async function KontrolorPage() {
  const rules = await getAllRules();
  const annulment = rules.filter((r) => r.isAutomaticAnnulment);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 sm:pb-24">
      {/* Top Banner */}
      <section className="border-b border-border-soft bg-gradient-to-b from-surface/80 via-canvas to-canvas py-8 sm:py-14">
        <Container>
          <div className="flex flex-col gap-4 max-w-3xl">
            <div className="inline-flex max-w-max items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Vodič i operativni protokol za birački odbor</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Kontrolor: protokol i kontrolna lista
            </h1>

            <p className="text-base leading-relaxed text-ink-dim sm:text-lg">
              Sve što član biračkog odbora (u stalnom ili proširenom sastavu) i posmatrač moraju da znaju
              na dan izbora: od otvaranja u 06:00, preko toka glasanja i brojanja, do potpisivanja zapisnika.
            </p>

            {/* Quick anchors bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <a
                href="#interaktivna-lista"
                className="rounded-xl border border-border/80 bg-surface-2 px-3 py-1.5 font-semibold text-ink hover:border-brand/40 hover:text-brand transition-colors"
              >
                ✓ Kontrolna lista
              </a>
              <a
                href="#pravni-stit"
                className="rounded-xl border border-border/80 bg-surface-2 px-3 py-1.5 font-semibold text-ink hover:border-brand/40 hover:text-brand transition-colors"
              >
                ⚖️ Prava i zabrane
              </a>
              <a
                href="#tok-glasanja"
                className="rounded-xl border border-border/80 bg-surface-2 px-3 py-1.5 font-semibold text-ink hover:border-brand/40 hover:text-brand transition-colors"
              >
                🗳️ Tok glasanja (9 koraka)
              </a>
              <a
                href="#brojanje"
                className="rounded-xl border border-border/80 bg-surface-2 px-3 py-1.5 font-semibold text-ink hover:border-brand/40 hover:text-brand transition-colors"
              >
                📊 Redosled brojanja
              </a>
              <a
                href="#ponistavanje"
                className="rounded-xl border border-sev-ponistavanje/30 bg-sev-ponistavanje/10 px-3 py-1.5 font-semibold text-sev-ponistavanje hover:bg-sev-ponistavanje hover:text-canvas transition-colors"
              >
                🚨 Poništavanje BM
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* 1. Interactive Controller Checklist */}
      <Container id="interaktivna-lista" className="scroll-mt-24">
        <ControllerChecklist />
      </Container>

      {/* 2. Legal Shield: Rights vs. Prohibitions */}
      <Container id="pravni-stit" className="scroll-mt-24">
        <div className="rounded-3xl border border-border/80 bg-surface/80 p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Pravni štit na BM</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              Tvoja prava i crvene linije
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              Predsednik biračkog odbora i ostali članovi moraju poštovati Zakon o izboru narodnih poslanika.
              Ovo su tvoje garancije koje ti niko na biračkom mestu ne može oduzeti.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Left: What you HAVE RIGHT TO DO */}
            <div className="rounded-2xl border border-sev-dozvoljeno/30 bg-sev-dozvoljeno/[0.03] p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-sev-dozvoljeno">
                <ShieldCheck className="h-5 w-5" />
                Tvoja zakonska prava (Niko ne sme da ti uskrati)
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-xl border border-sev-dozvoljeno/20 bg-surface/80 p-3.5">
                  <span className="font-bold text-sev-dozvoljeno">1.</span>
                  <div>
                    <strong className="text-ink">Uvid u sav izborni materijal:</strong>
                    <p className="mt-0.5 text-xs text-ink-dim">Imaš pravo da vidiš spiskove, kutije, listiće i zapisnik u svakom trenutku rada biračkog odbora.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-sev-dozvoljeno/20 bg-surface/80 p-3.5">
                  <span className="font-bold text-sev-dozvoljeno">2.</span>
                  <div>
                    <strong className="text-ink">Upisivanje primedbe u zapisnik:</strong>
                    <p className="mt-0.5 text-xs text-ink-dim">Predsednik biračkog odbora <strong>MORA</strong> da ti omogući unos obrazložene primedbe. Odbijanje unosa je teška nepravilnost!</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-sev-dozvoljeno/20 bg-surface/80 p-3.5">
                  <span className="font-bold text-sev-dozvoljeno">3.</span>
                  <div>
                    <strong className="text-ink">Prisustvo na brojanju glasova:</strong>
                    <p className="mt-0.5 text-xs text-ink-dim">Imaš pravo da stojiš uz sto na kome se broji i da jasno vidiš kako je svaki pojedinačni listić zaokružen.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-sev-dozvoljeno/20 bg-surface/80 p-3.5">
                  <span className="font-bold text-sev-dozvoljeno">4.</span>
                  <div>
                    <strong className="text-ink">Kopija ili fotografija zapisnika:</strong>
                    <p className="mt-0.5 text-xs text-ink-dim">Svaki član odbora u proširenom sastavu ima zakonsko pravo na overenu kopiju ili fotografisanje potpisanog zapisnika.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Red Lines (What NOT to do) */}
            <div className="rounded-2xl border border-sev-teska/30 bg-sev-teska/[0.03] p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-sev-teska">
                <Ban className="h-5 w-5" />
                Crvene linije (Šta NIKADA ne smeš potpisati ili uraditi)
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-xl border border-sev-teska/20 bg-surface/80 p-3.5">
                  <span className="font-bold text-sev-teska">1.</span>
                  <div>
                    <strong className="text-ink">Nikada ne potpisuj blanko zapisnik:</strong>
                    <p className="mt-0.5 text-xs text-ink-dim">Nikada ne stavljaj potpis na prazan ili delimično popunjen obrazac zapisnika pre nego što su svi brojevi uneti i sračunati.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-sev-teska/20 bg-surface/80 p-3.5">
                  <span className="font-bold text-sev-teska">2.</span>
                  <div>
                    <strong className="text-ink">Ne dozvoli preuranjeno otvaranje kutije:</strong>
                    <p className="mt-0.5 text-xs text-ink-dim">Kutija se NIKAKO ne sme otvoriti pre nego što se prebroje i zapakuju svi neupotrebljeni listići i utvrdi broj birača iz spiska.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-sev-teska/20 bg-surface/80 p-3.5">
                  <span className="font-bold text-sev-teska">3.</span>
                  <div>
                    <strong className="text-ink">Ne potpisuj neistinit zapisnik:</strong>
                    <p className="mt-0.5 text-xs text-ink-dim">Ako se brojevi ne slažu ili je bilo neregularnosti, unesi izdvojeno mišljenje i primedbu, i odbij potpisivanje spornog dela.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-sev-teska/20 bg-surface/80 p-3.5">
                  <span className="font-bold text-sev-teska">4.</span>
                  <div>
                    <strong className="text-ink">Ne napuštaj biračko mesto bez primopredaje:</strong>
                    <p className="mt-0.5 text-xs text-ink-dim">Ako moraš da izađeš, tvoj zamenik mora preuzeti ulogu. U suprotnom, odbor može nastaviti rad bez tvoje kontrole.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* 3. Automatic Annulment Protocols */}
      <Container id="ponistavanje" className="scroll-mt-24">
        <div className="rounded-3xl border border-sev-ponistavanje/30 bg-gradient-to-br from-sev-ponistavanje/[0.08] via-surface-2/40 to-surface/90 p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sev-ponistavanje/40 bg-sev-ponistavanje/15 px-3.5 py-1 text-xs font-bold text-sev-ponistavanje">
                <ShieldAlert className="h-3.5 w-3.5" />
                Član 93. Zakona o izboru narodnih poslanika
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink">
                Automatsko poništavanje glasanja po službenoj dužnosti
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-dim">
                U ovim situacijama zakon ne ostavlja mogućnost kompromisa. Glasanje se mora poništiti,
                a kontrolor mora odmah zahtevati zvaničan unos u zapisnik pre brojanja glasova.
              </p>
            </div>

            <Link
              href="/pravila?ponistavanje=1"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-sev-ponistavanje/40 bg-sev-ponistavanje/20 px-4 py-2 text-xs font-bold text-sev-ponistavanje hover:bg-sev-ponistavanje hover:text-canvas transition-colors"
            >
              Baza poništavanja
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {annulment.map((r) => (
              <Link key={r.id} href={`/pravila/${r.slug}`} className="group block h-full">
                <div className="flex h-full flex-col justify-between rounded-2xl border border-sev-ponistavanje/25 bg-surface/80 p-5 transition-all hover:border-sev-ponistavanje/60 hover:bg-surface hover:shadow-md">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <SeverityBadge severity="ponistavanje" size="sm" />
                      <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-sev-ponistavanje" />
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-ink group-hover:text-sev-ponistavanje transition-colors">
                      {r.naziv}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-dim line-clamp-2">
                      {r.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-soft flex items-center justify-between text-[11px] text-sev-ponistavanje font-semibold">
                    <span>Šta raditi na licu mesta</span>
                    <span>Pogledaj protokol →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>

      {/* 4. Sequential Voting Flow (9 steps) */}
      <Container id="tok-glasanja" className="scroll-mt-24">
        <div className="rounded-3xl border border-border/80 bg-surface/80 p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border-soft">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand">Hronologija</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                Propisani tok glasanja (9 koraka)
              </h2>
              <p className="mt-1 text-sm text-ink-dim">
                Redosled radnji od trenutka kada birač uđe na biračko mesto do ubacivanja listića u kutiju.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              9 sekvencijalnih koraka
            </span>
          </div>

          <div className="mt-6">
            <StepFlow
              steps={TOK_GLASANJA}
              criticalSteps={[1, 4, 5, 7, 9]}
            />
          </div>
        </div>
      </Container>

      {/* 5. Sequential Counting Order (7 steps) + Validator Link */}
      <Container id="brojanje" className="scroll-mt-24">
        <div className="rounded-3xl border border-border/80 bg-surface/80 p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border-soft">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand">Nakon 20:00</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">
                Redosled brojanja glasova (7 koraka)
              </h2>
              <p className="mt-1 text-sm text-ink-dim">
                Redosled je zakonski propisan: menjanje redosleda ili otvaranje kutije pre brojanja neupotrebljenih listića je teška nepravilnost.
              </p>
            </div>

            <Link
              href="/validator"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-brand-ink shadow-sm hover:bg-brand-strong transition-all hover:-translate-y-0.5"
            >
              <Calculator className="h-4 w-4" />
              Otvori matematički validator zapisnika
            </Link>
          </div>

          <div className="mt-6">
            <StepFlow
              steps={REDOSLED_BROJANJA}
              criticalSteps={[1, 2, 4, 5]}
            />
          </div>

          <div className="mt-8 rounded-2xl border border-brand/30 bg-brand/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Završio si brojanje i unosiš brojeve u zapisnik?</h4>
                <p className="text-xs text-ink-dim">Proveri da li se matematičke formule i zbirovi birača i listića poklapaju pre potpisivanja.</p>
              </div>
            </div>
            <Link
              href="/validator"
              className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
            >
              Pokreni proveru zapisnika →
            </Link>
          </div>
        </div>
      </Container>

      {/* 6. Overview by Election Day Phases */}
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Registar situacija</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              Pregled nepravilnosti po fazama dana
            </h2>
          </div>
          <Link
            href="/pravila"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-dim hover:text-brand transition-colors"
          >
            Pogledaj celu bazu pravila
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {PHASE_OVERVIEW.map(({ phase, label }) => {
            const count = rules.filter((r) => r.phase === phase).length;
            return (
              <Link key={phase} href={`/pravila?faza=${phase}`} className="group block h-full">
                <div className="flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-surface/80 p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:bg-surface-2 hover:shadow-lg">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 border border-border/60 text-brand group-hover:bg-brand/10 group-hover:border-brand/30 transition-colors">
                        <PhaseIcon icon={PHASE_META[phase]?.icon ?? "triangle-alert"} className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-ink group-hover:text-brand transition-colors">
                      {label}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                      {PHASE_META[phase]?.hint}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-soft flex items-baseline justify-between">
                    <span className="text-2xl font-black text-ink">{count}</span>
                    <span className="text-[11px] font-medium text-ink-faint">situacija u bazi</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
