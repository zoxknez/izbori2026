import Link from "next/link";
import { Clock, FileText, Scale, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeadlinesCalculator } from "@/components/deadlines-calculator";

export const metadata = {
  title: "Izborni rokovi i pravni lekovi — Zaštita izbornog prava",
  description:
    "Kompletan vodič kroz zakonske rokove od 72 časa, podnošenje zahteva za poništavanje glasanja, nadležnosti izbornih komisija i sudsku zaštitu.",
};

const MANDATORY_ELEMENTS = [
  {
    title: "Oznaka organa i biračkog mesta",
    desc: "Nadležna lokalna izborna komisija (OIK/GIK), tačan naziv opštine/grada i zvaničan broj biračkog mesta.",
  },
  {
    title: "Činjenični opis nepravilnosti",
    desc: "Tačan opis događaja: ko je šta uradio, u koje vreme (sat i minut) i na koji način je povređen zakon.",
  },
  {
    title: "Pravni osnov (Član zakona)",
    desc: "Pozivanje na konkretan član ZINP (npr. čl. 93 za tajnost glasanja, čl. 116 za poništavanje) ili Krivičnog zakonika.",
  },
  {
    title: "Dokazi i materijalni prilozi",
    desc: "Prepis primedbe unete u Zapisnik o radu biračkog odbora, izjave prisutnih svedoka ili akreditovanih posmatrača.",
  },
  {
    title: "Podaci i svojeručni potpis podnosioca",
    desc: "Ime, prezime, JMBG, adresa prebivališta i svojeručni potpis birača ili ovlašćenog lica izborne liste.",
  },
];

export default function RokoviPage() {
  return (
    <Container className="py-8 sm:py-12">
      {/* Hero section */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
          <Scale className="h-3.5 w-3.5" />
          <span>Pravna zaštita i rokovi</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-ink">
          Izborni rokovi i pravni lekovi
        </h1>
        <p className="mt-2 text-base leading-relaxed text-ink-dim sm:text-lg">
          U izbornom pravu vreme je presudan faktor. Propuštanje roka od samo jednog minuta znači
          trajan gubitak prava na pravnu zaštitu (prekluzija). Upoznajte se sa procedurama i
          izračunajte tačne termine.
        </p>
      </div>

      {/* Interactive Deadlines Calculator */}
      <div className="mt-8">
        <DeadlinesCalculator />
      </div>

      {/* Comparison: Birač vs. Izborna lista */}
      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-ink">Ko i šta može da zahteva?</h2>
          <p className="text-xs text-ink-dim">
            Zakon o izboru narodnih poslanika pravi jasnu razliku između aktivne legitimacije birača i proglašene liste.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Birač */}
          <Card className="flex flex-col justify-between border-border bg-surface p-5 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">
                  Uloga: Birač
                </span>
                <span className="text-xs font-semibold text-ink-faint">Član 102. ZINP</span>
              </div>
              <h3 className="text-base font-bold text-ink">Zahtev za poništavanje glasanja</h3>
              <p className="text-xs leading-relaxed text-ink-dim">
                Birač ima pravo da podnese zahtev za poništavanje glasanja <strong>isključivo na biračkom mestu na kojem je upisan u birački spisak</strong>, i to u dva zakonom taksativno navedena slučaja:
              </p>
              <ul className="space-y-2 text-xs text-ink-dim">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>Ako ga je birački odbor <strong>neosnovano sprečio da glasa</strong> (npr. pogrešno tvrde da ima sprej na prstu ili odbijaju važeću ličnu kartu).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>Ako mu je na biračkom mestu <strong>povređeno pravo na slobodno i tajno glasanje</strong> (npr. prisila, narušavanje paravana).</span>
                </li>
              </ul>
            </div>
            <div className="mt-5 rounded-xl border border-border bg-surface-2 p-3 text-xs text-ink-dim">
              <strong>Zvanični obrazac:</strong> RIK Obrazac <strong>ZP-4</strong> (Zahtev birača za poništavanje glasanja).
            </div>
          </Card>

          {/* Card 2: Podnosilac proglašene liste */}
          <Card className="flex flex-col justify-between border-border bg-surface p-5 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Uloga: Izborna lista
                </span>
                <span className="text-xs font-semibold text-ink-faint">Član 103. ZINP</span>
              </div>
              <h3 className="text-base font-bold text-ink">Široka aktivna legitimacija</h3>
              <p className="text-xs leading-relaxed text-ink-dim">
                Podnosilac proglašene izborne liste ima zakonsko ovlašćenje da zahteva poništavanje glasanja na <strong>bilo kom biračkom mestu</strong> na teritoriji opštine/republike, zbog <strong>bilo koje nepravilnosti</strong> koja se dogodila:
              </p>
              <ul className="space-y-2 text-xs text-ink-dim">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>Povrede pravila o kontrolnom listu, glasačkoj kutiji ili brojanju glasova.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>Falsifikovanje potpisa, paralelni spiskovi ili prisustvo neovlašćenih lica.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>Računsko neslaganje broja listića u kutiji i broja izašlih birača (čl. 116).</span>
                </li>
              </ul>
            </div>
            <div className="mt-5 rounded-xl border border-border bg-surface-2 p-3 text-xs text-ink-dim">
              <strong>Podnošenje:</strong> Podnosi ovlašćeno lice izborne liste ili stranački pravni tim.
            </div>
          </Card>
        </div>
      </div>

      {/* Mandatory Elements Checklist */}
      <div className="mt-10">
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-surface-2/70 px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand" />
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Obavezna sadržina pravno valjanog zahteva / prigovora
                </h3>
                <p className="text-xs text-ink-dim">
                  Nedostatak bilo kog od ovih elemenata može dovesti do formalnog odbacivanja zahteva bez razmatranja suštine.
                </p>
              </div>
            </div>
          </div>
          <CardBody className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MANDATORY_ELEMENTS.map((el, i) => (
                <div
                  key={el.title}
                  className="rounded-xl border border-border bg-surface p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
                      {i + 1}
                    </span>
                    <h4 className="text-xs font-bold text-ink">{el.title}</h4>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-dim">{el.desc}</p>
                </div>
              ))}

              <div className="flex flex-col justify-between rounded-xl border border-brand/30 bg-brand/5 p-4">
                <div>
                  <h4 className="text-xs font-bold text-brand uppercase tracking-wider">
                    Priprema dokaza
                  </h4>
                  <p className="mt-1.5 text-xs text-ink-dim leading-relaxed">
                    Iskoristite naš automatizovani generator da sastavite činjeničnu hronologiju spremnu za prilaganje.
                  </p>
                </div>
                <Link href="/prijavi" className="mt-3">
                  <Button variant="primary" size="sm" className="w-full justify-center text-xs font-semibold">
                    Otvori generator hronologije
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Footer warning */}
      <div className="mt-8 rounded-2xl border border-border bg-surface-2 p-4 text-xs text-ink-faint leading-relaxed">
        <strong>Odricanje od odgovornosti:</strong> Ovaj vodič ima isključivo informativnu i edukativnu svrhu i ne predstavlja zamenu za profesionalni pravni savet advokata. Zvanične obrasce i uputstva potražite na zvaničnom portalu{" "}
        <a
          href="https://www.rik.parlament.gov.rs/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand hover:underline inline-flex items-center gap-0.5"
        >
          Republičke izborne komisije (RIK) <ExternalLink className="h-3 w-3" />
        </a>.
      </div>
    </Container>
  );
}
