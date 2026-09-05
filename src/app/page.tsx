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
  ArrowUpRight,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { HomeSearch } from "@/components/home-search";
import { SeverityBadge } from "@/components/ui/severity-badge";

export const revalidate = 3600;

const QUICK_LINKS = [
  {
    href: "/vidim-problem",
    label: "Vodič kroz problem",
    desc: "Interaktivni čarobnjak: prepoznaj situaciju i saznaj šta odmah preduzeti",
    icon: TriangleAlert,
    badge: "Hitno",
    badgeColor: "bg-sev-teska/15 text-sev-teska border-sev-teska/25",
  },
  {
    href: "/kontrolor",
    label: "Kontrolna lista",
    desc: "Protokol korak po korak za članove biračkog odbora i posmatrače",
    icon: ClipboardCheck,
    badge: "Za BM",
    badgeColor: "bg-brand/15 text-brand border-brand/25",
  },
  {
    href: "/validator",
    label: "Validator zapisnika",
    desc: "Matematička i logička kontrola brojeva pre potpisivanja zapisnika",
    icon: Calculator,
    badge: "Alat",
    badgeColor: "bg-sev-info/15 text-sev-info border-sev-info/25",
  },
  {
    href: "/van-birackog-mesta",
    label: "Glasanje van BM",
    desc: "Glasanje kod kuće: pravila poverenika, spiskovi i crvene zastavice",
    icon: HomeIcon,
  },
  {
    href: "/kontrolor#tok-glasanja",
    label: "Tok glasanja",
    desc: "Propisana procedura: otvaranje, identifikacija, glasanje i brojanje",
    icon: Vote,
  },
  {
    href: "/rokovi",
    label: "Rokovi i prigovori",
    desc: "Rok od 72 časa za prigovor izbornoj komisiji i pravni lekovi",
    icon: Gavel,
  },
  {
    href: "/krivicna-dela",
    label: "Krivična dela",
    desc: "Glava XV Krivičnog zakonika: sankcije i zaprećene zatvorske kazne",
    icon: Scale,
  },
  {
    href: "/prijavi",
    label: "Prijavi incident",
    desc: "Generator hronologije i dokaza — podaci ostaju na tvom uređaju",
    icon: ShieldQuestion,
  },
];

export default async function HomePage() {
  const rules = await getAllRules();
  const annulment = rules.filter((r) => r.isAutomaticAnnulment);
  const annulmentCount = annulment.length;
  const criminalCount = rules.filter((r) => r.severity === "krivicno_delo").length;
  const example = annulment[0] ?? rules[0];
  const categoryCount = new Set(rules.map((r) => r.kategorija)).size;

  return (
    <div className="flex flex-col gap-12 sm:gap-16 lg:gap-20 pb-16 sm:pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border-soft bg-gradient-to-b from-surface/80 via-canvas to-canvas pt-8 sm:pt-14 pb-14 sm:pb-20">
        {/* Glow background accents */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand/5 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute top-10 right-0 w-[400px] h-[350px] bg-sev-ponistavanje/5 blur-[100px] rounded-full" />

        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left Content Area (7 cols on desktop) */}
            <div className="flex flex-col lg:col-span-7">
              {/* Trust & Date Badge */}
              <div className="inline-flex max-w-max items-center gap-2 rounded-full border border-border/80 bg-surface-2/90 px-3.5 py-1.5 text-xs font-medium text-ink-dim shadow-xs backdrop-blur-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                </span>
                <span>
                  Propisi provereni: <strong className="text-ink font-semibold">5. septembar 2026.</strong> · Građanski vodič
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] leading-[1.12]">
                Vidiš nešto sumnjivo na{" "}
                <span className="bg-gradient-to-r from-brand via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  biračkom mestu?
                </span>
              </h1>

              {/* Subheading */}
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-dim sm:text-lg">
                Za manje od minuta saznaj da li je situacija dozvoljena, sumnjiva ili teška nepravilnost,
                uz tačan član zakona i precizno uputstvo šta odmah da preduzmeš.
              </p>

              {/* Primary Action Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/vidim-problem"
                  className="inline-flex h-13 items-center justify-center gap-2.5 rounded-xl bg-sev-teska px-7 text-base font-semibold text-canvas shadow-lg shadow-sev-teska/20 transition-all hover:bg-sev-teska/90 hover:shadow-sev-teska/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <TriangleAlert className="h-5 w-5 shrink-0" />
                  Vidim problem sada
                </Link>
                <Link
                  href="/pravila"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-border/90 bg-surface-2 px-6 text-base font-semibold text-ink transition-all hover:border-brand/40 hover:bg-surface hover:-translate-y-0.5"
                >
                  Pretraži bazu nepravilnosti
                  <ArrowRight className="h-4 w-4 text-ink-dim" />
                </Link>
              </div>

              {/* Smart Search with Filter Chips */}
              <div className="mt-8 max-w-xl">
                <HomeSearch />
              </div>

              {/* Key Highlights / Trust notes */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-faint">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sev-dozvoljeno" />
                  Radi offline i bez instalacije
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sev-dozvoljeno" />
                  Bez naloga i praćenja
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sev-dozvoljeno" />
                  Podaci ostaju na tvom uređaju
                </span>
              </div>
            </div>

            {/* Right Card (5 cols on desktop) - Solves Image 1 Issues */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-border/90 bg-surface/80 p-5 sm:p-6 shadow-2xl backdrop-blur-md">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b border-border-soft pb-3.5">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sev-ponistavanje opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-sev-ponistavanje" />
                    </span>
                    Primer iz baze
                  </p>
                  <SeverityBadge severity={example.severity} size="sm" />
                </div>

                {/* Example Content */}
                <div className="mt-4">
                  <Link href={`/pravila/${example.slug}`} className="group block">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-ink group-hover:text-brand transition-colors">
                        {example.naziv}
                      </h3>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-dim line-clamp-3">
                      {example.summary}
                    </p>
                    {example.pravniOsnov && (
                      <p className="mt-2.5 text-[11px] font-mono text-brand/90 truncate">
                        § {example.pravniOsnov}
                      </p>
                    )}
                  </Link>
                </div>

                {/* Redesigned Metrics Grid - Clean horizontal cards with zero awkward text wrap */}
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border-soft pt-5">
                  {/* Situacije */}
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-2/50 p-2.5 sm:p-3 transition-colors hover:border-border">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <ListChecks className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg sm:text-xl font-bold tracking-tight text-ink leading-none">{rules.length}</p>
                      <p className="mt-1 text-xs text-ink-dim truncate">opisanih situacija</p>
                    </div>
                  </div>

                  {/* Poništavanje */}
                  <div className="flex items-center gap-3 rounded-xl border border-sev-ponistavanje/25 bg-sev-ponistavanje/[0.05] p-2.5 sm:p-3 transition-colors hover:border-sev-ponistavanje/40">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sev-ponistavanje/15 text-sev-ponistavanje">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg sm:text-xl font-bold tracking-tight text-ink leading-none">{annulmentCount}</p>
                      <p className="mt-1 text-xs text-ink-dim truncate">poništavanje BM</p>
                    </div>
                  </div>

                  {/* Krivična dela */}
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-2/50 p-2.5 sm:p-3 transition-colors hover:border-border">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sev-krivicno/15 text-sev-krivicno">
                      <Gavel className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg sm:text-xl font-bold tracking-tight text-ink leading-none">{criminalCount}</p>
                      <p className="mt-1 text-xs text-ink-dim truncate">krivična dela</p>
                    </div>
                  </div>

                  {/* Kategorije */}
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-2/50 p-2.5 sm:p-3 transition-colors hover:border-border">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sev-dozvoljeno/15 text-sev-dozvoljeno">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg sm:text-xl font-bold tracking-tight text-ink leading-none">{categoryCount}</p>
                      <p className="mt-1 text-xs text-ink-dim truncate">kategorija pravila</p>
                    </div>
                  </div>
                </div>

                {/* Direct link footer */}
                <div className="mt-4 pt-3 text-center border-t border-border-soft">
                  <Link
                    href={`/pravila/${example.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                  >
                    Pročitaj detaljno proceduru za ovaj slučaj
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Quick Links Section */}
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Vodiči i alati</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Brzi pristup resursima
            </h2>
          </div>
          <Link
            href="/pravila"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-dim hover:text-brand transition-colors"
          >
            Sva pravila i procedure ({rules.length})
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="group block">
                <div className="flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-surface/70 p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:bg-surface-2 hover:shadow-lg">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 border border-border/60 text-brand group-hover:bg-brand/10 group-hover:border-brand/30 transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      {item.badge ? (
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-ink-faint opacity-0 transition-all group-hover:opacity-100 group-hover:text-brand" />
                      )}
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-ink group-hover:text-brand transition-colors">
                      {item.label}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-soft flex items-center gap-1 text-[11px] font-medium text-ink-faint group-hover:text-ink transition-colors">
                    <span>Otvori vodič</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>

      {/* 4 Automatic Annulments Highlight Section - Redesigned, full width, responsive, no ugly truncations */}
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-sev-ponistavanje/30 bg-gradient-to-br from-sev-ponistavanje/[0.08] via-surface-2/50 to-surface/90 p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            {/* Info column */}
            <div className="lg:max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full border border-sev-ponistavanje/30 bg-sev-ponistavanje/10 px-3 py-1 text-xs font-semibold text-sev-ponistavanje">
                <ShieldAlert className="h-3.5 w-3.5" />
                Zakon o izboru narodnih poslanika · Čl. 93
              </div>
              <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-ink">
                Automatsko poništavanje glasanja
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-dim">
                Za ove nepravilnosti zakon ne ostavlja diskreciono pravo odboru. Glasanje na biračkom mestu
                se <strong>poništava po službenoj dužnosti</strong>, nezavisno od bilo čije namere ili rezultata.
              </p>
              <div className="mt-6">
                <Link
                  href="/pravila?ponistavanje=1"
                  className="inline-flex items-center gap-2 rounded-xl bg-sev-ponistavanje/20 border border-sev-ponistavanje/40 px-5 py-2.5 text-xs font-semibold text-sev-ponistavanje hover:bg-sev-ponistavanje hover:text-canvas transition-colors"
                >
                  Pogledaj svih {annulmentCount} razloga za poništavanje
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* List of critical situations - Responsive cards, legible without truncations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {annulment.slice(0, 4).map((r) => (
                <Link
                  key={r.id}
                  href={`/pravila/${r.slug}`}
                  className="group flex flex-col justify-between rounded-xl border border-sev-ponistavanje/20 bg-surface/70 p-4 transition-all hover:border-sev-ponistavanje/60 hover:bg-surface hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sev-ponistavanje/15 text-sev-ponistavanje text-xs font-bold">
                        !
                      </span>
                      <SeverityBadge severity={r.severity} size="sm" />
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-snug text-ink group-hover:text-sev-ponistavanje transition-colors">
                      {r.naziv}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-border-soft text-[11px] text-ink-faint">
                    <span>{r.pravniOsnov ?? "Zakon"}</span>
                    <span className="font-medium text-sev-ponistavanje group-hover:underline">
                      Proveri proceduru →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
