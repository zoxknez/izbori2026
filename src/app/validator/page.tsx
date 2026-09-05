import { Container } from "@/components/ui/container";
import { ZapisnikValidator } from "@/components/zapisnik-validator";
import { Calculator, ShieldCheck, Scale, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Validator zapisnika",
  description:
    "Matematička i pravna kontrola brojeva iz zapisnika biračkog odbora prema članu 116. Zakona o izboru narodnih poslanika.",
  alternates: { canonical: "/validator" },
};

export default function ValidatorPage() {
  return (
    <div className="space-y-10 sm:space-y-12 pb-16 sm:pb-24">
      {/* Top Banner */}
      <section className="border-b border-border-soft bg-gradient-to-b from-surface/80 via-canvas to-canvas py-8 sm:py-14">
        <Container>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
              <Calculator className="h-3.5 w-3.5" />
              <span>Matematičko-pravna forenzika biračkog mesta</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Validator zapisnika biračkog odbora
            </h1>

            <p className="mt-3 text-base leading-relaxed text-ink-dim sm:text-lg">
              Unesi brojeve iz zapisnika i proveri da li se računica u potpunosti poklapa. Alat
              automatski proverava dve računovodstvene situacije koje <strong>član 116. Zakona o izboru narodnih poslanika</strong> navodi kao razloge za poništavanje glasanja po službenoj dužnosti, uz dodatne matematičke kontrole zapisnika.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-faint">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-sev-dozvoljeno" />
                Računa se lokalno u pregledaču (radi offline)
              </span>
              <span className="flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-brand" />
                Usklađeno sa Zakonom o izboru narodnih poslanika
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Validator Tool */}
      <Container>
        <ZapisnikValidator />
      </Container>

      {/* Explanatory Legal Guide Note */}
      <Container>
        <div className="rounded-3xl border border-border/80 bg-surface/60 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sev-ponistavanje/10 text-sev-ponistavanje">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">
                Šta zakon nalaže ako validator pokaže neslaganje (Pravilo A ili B)?
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">
                Prema članu 116. stav 1. Zakona o izboru narodnih poslanika, ako se u glasačkoj kutiji nađe veći broj glasačkih listića od broja birača koji su glasali, ili ako zbir neupotrebljenih listića i listića u kutiji premašuje broj primljenih listića, <strong>lokalna izborna komisija poništava glasanje po službenoj dužnosti</strong>.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-dim">
                Član biračkog odbora u tom slučaju <strong>mora zahtevati da se tačan broj pronađenih listića i uočeno neslaganje unesu u zapisnik</strong> kao obrazložena primedba pre predaje materijala izbornoj komisiji.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
