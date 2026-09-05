import { Clock, FileText } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";

export const metadata = {
  title: "Rokovi i pravni lekovi",
  description: "Rok od 72 časa za zahtev za poništavanje glasanja, i šta takav zahtev mora da sadrži.",
};

export default function RokoviPage() {
  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Rokovi i pravni lekovi</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Ovo nije pravni savet. Za konkretan slučaj obrati se lokalnoj izbornoj komisiji ili
        advokatu. Ovde je pregled osnovnog mehanizma i rokova.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-3 pt-5">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-bold text-ink">Parlamentarni izbori</h2>
            </div>
            <p className="text-sm leading-relaxed text-ink-dim">
              Birač može u roku od <strong className="text-ink">72 časa</strong> od zatvaranja
              biračkog mesta zahtevati poništavanje glasanja na biračkom mestu na kojem je upisan,
              ako ga je birački odbor neosnovano sprečio da glasa ili mu je povređeno pravo na
              slobodno i tajno glasanje.
            </p>
            <p className="text-sm leading-relaxed text-ink-dim">
              Podnosilac proglašene liste ima šire pravo: može zahtevati poništavanje zbog
              nepravilnosti tokom glasanja uopšte.
            </p>
            <p className="text-sm leading-relaxed text-ink-dim">
              O zahtevu odlučuje lokalna izborna komisija, takođe u roku od 72 časa.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3 pt-5">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-bold text-ink">Lokalni izbori</h2>
            </div>
            <p className="text-sm leading-relaxed text-ink-dim">
              Postoji sličan mehanizam: podnosilac proglašene liste, odnosno birač u propisanim
              slučajevima, ima rok od <strong className="text-ink">72 časa</strong> od zatvaranja
              biračkog mesta za prigovor.
            </p>
            <p className="text-sm leading-relaxed text-ink-dim">
              Lokalna izborna komisija odlučuje u roku od 72 časa od prijema prigovora.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardBody className="pt-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-bold text-ink">Šta zahtev/prigovor mora da sadrži</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {[
              "Tačno biračko mesto (opština/grad, broj biračkog mesta)",
              "Opis sporne radnje",
              "Ko je radnju izvršio",
              "Kada se radnja dogodila",
              "Činjenice na kojima se zahtev zasniva",
              "Dokazi (svedoci, beleške, primedbe unete u zapisnik)",
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-dim">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/70" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-dim">
            RIK objavljuje obrasce za prigovore i zahteve za poništavanje, uključujući obrazac{" "}
            <strong className="text-ink">ZP-4: Zahtev birača za poništavanje glasanja na
            biračkom mestu</strong>. Proveri{" "}
            <a
              href="https://www.rik.parlament.gov.rs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              zvaničan sajt RIK-a
            </a>{" "}
            za aktuelnu verziju obrasca.
          </p>
        </CardBody>
      </Card>

      <p className="mt-6 text-xs text-ink-faint">
        Za pripremu dokaza za ovakav zahtev koristi{" "}
        <a href="/prijavi" className="text-brand hover:underline">generator hronologije incidenta</a>.
      </p>
    </Container>
  );
}
