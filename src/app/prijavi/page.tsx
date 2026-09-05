import { Container } from "@/components/ui/container";
import { IncidentForm } from "@/components/incident-form";

export const metadata = {
  title: "Prijavi incident",
  description: "Generator činjenične hronologije izborne nepravilnosti — bez naloga, bez slanja na server.",
};

export default function PrijaviPage() {
  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Generator hronologije incidenta</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Popuni samo ono što znaš. Rezultat je činjenična hronologija bez političkog zaključivanja —
        pogodna kao osnova za primedbu u zapisnik ili zahtev za poništavanje glasanja.
      </p>
      <div className="mt-8">
        <IncidentForm />
      </div>
    </Container>
  );
}
