import { Gavel } from "lucide-react";
import { getCriminalArticles } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";

export const revalidate = 3600;

export const metadata = {
  title: "Krivična dela protiv izbornih prava",
  description: "Glava XV Krivičnog zakonika Republike Srbije (čl. 154–161), objašnjeni jednostavnim jezikom.",
};

export default async function KrivicnaDelaPage() {
  const articles = await getCriminalArticles();

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Krivična dela protiv izbornih prava</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Glava XV Krivičnog zakonika Republike Srbije (čl. 154–161). Ovo je pregled radi
        prepoznavanja situacija. Za konkretan slučaj obrati se advokatu ili nadležnom
        tužilaštvu.
      </p>

      <div className="mt-8 space-y-4">
        {articles.map((a) => (
          <Card key={a.id}>
            <CardBody className="pt-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-brand">
                  <Gavel className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    Član {a.article}
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold text-ink">{a.naziv}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">{a.opis}</p>

                  <div className="mt-3 rounded-lg border border-border bg-surface-2 p-3">
                    <p className="text-xs font-semibold text-ink-faint">PRIMER</p>
                    <p className="mt-1 text-sm text-ink-dim">{a.primer}</p>
                  </div>

                  {a.nijeDokaz && (
                    <div className="mt-2 rounded-lg border border-sev-info/25 bg-sev-info/5 p-3">
                      <p className="text-xs font-semibold text-sev-info">OVO NIJE SAMO PO SEBI DOKAZ</p>
                      <p className="mt-1 text-sm text-ink-dim">{a.nijeDokaz}</p>
                    </div>
                  )}

                  <p className="mt-3 text-sm font-medium text-sev-teska">Kazna: {a.kazna}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </Container>
  );
}
