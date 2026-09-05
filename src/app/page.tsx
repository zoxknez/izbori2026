import Link from "next/link";
import {
  TriangleAlert,
  ClipboardCheck,
  Calculator,
  Vote,
  Home as HomeIcon,
  Gavel,
  ShieldQuestion,
  Scale,
  ArrowRight,
} from "lucide-react";
import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { HomeSearch } from "@/components/home-search";

export const revalidate = 3600;

const QUICK_LINKS = [
  { href: "/kontrolor", label: "Kontrolna lista", desc: "Za članove biračkog odbora", icon: ClipboardCheck },
  { href: "/validator", label: "Proveri zapisnik", desc: "Matematička kontrola brojeva", icon: Calculator },
  { href: "/kontrolor#tok-glasanja", label: "Kako se glasa", desc: "Propisani tok, korak po korak", icon: Vote },
  { href: "/rokovi", label: "Rokovi i pravni lekovi", desc: "72 časa za prigovor", icon: Gavel },
  { href: "/van-birackog-mesta", label: "Glasanje kod kuće", desc: "Poseban vodič i crvene zastavice", icon: HomeIcon },
  { href: "/mit-ili-cinjenica", label: "Mit ili činjenica", desc: "Testiraj svoje znanje", icon: ShieldQuestion },
  { href: "/krivicna-dela", label: "Krivična dela", desc: "Glava XV Krivičnog zakonika", icon: Scale },
  { href: "/prijavi", label: "Prijavi incident", desc: "Generator hronologije, lokalno", icon: TriangleAlert },
];

export default async function HomePage() {
  const rules = await getAllRules();
  const annulmentCount = rules.filter((r) => r.isAutomaticAnnulment).length;
  const criminalCount = rules.filter((r) => r.severity === "krivicno_delo").length;

  return (
    <div>
      <section className="border-b border-border-soft bg-gradient-to-b from-surface/60 to-transparent">
        <Container className="py-12 sm:py-20">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-ink-dim">
            Propisi provereni 5. septembra 2026. · nezavisan građanski vodič
          </p>
          <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Vidiš nešto čudno na biračkom mestu?
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-dim sm:text-lg">
            Za manje od minuta saznaj da li je situacija dozvoljena, sumnjiva ili nepravilnost,
            uz tačan član zakona i uputstvo šta konkretno da uradiš.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/vidim-problem"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-sev-teska px-7 text-base font-semibold text-canvas shadow-card transition-colors hover:bg-sev-teska/90"
            >
              <TriangleAlert className="h-5 w-5" />
              Vidim problem sada
            </Link>
            <Link
              href="/pravila"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-7 text-base font-semibold text-ink transition-colors hover:border-ink-faint"
            >
              Pretraži bazu nepravilnosti
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 max-w-xl">
            <HomeSearch />
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-faint">
            <span>
              <strong className="text-ink">{rules.length}</strong> opisanih situacija
            </span>
            <span>
              <strong className="text-ink">{annulmentCount}</strong> razloga za automatsko poništavanje
            </span>
            <span>
              <strong className="text-ink">{criminalCount}</strong> mogućih krivičnih dela
            </span>
            <span>Radi bez naloga i praćenja</span>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Brzi pristup</h2>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="group block">
                <Card className="flex h-full flex-col gap-3 p-4 transition-colors hover:border-ink-faint sm:p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-brand">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-snug text-ink group-hover:text-brand">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-faint">{item.desc}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </Container>

      <Container className="pb-16 sm:pb-24">
        <Card className="border-sev-ponistavanje/25 bg-sev-ponistavanje/[0.04] p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h2 className="text-lg font-bold text-ink">
                Četiri stvari koje zakon posebno izdvaja
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-dim">
                Za ove situacije zakon izričito propisuje poništavanje glasanja na biračkom mestu
                po službenoj dužnosti, nezavisno od bilo čije namere.
              </p>
              <Link
                href="/pravila?ponistavanje=1"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sev-ponistavanje hover:underline"
              >
                Pogledaj sve slučajeve automatskog poništavanja
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
