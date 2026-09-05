import { Container } from "@/components/ui/container";
import { ZapisnikValidator } from "@/components/zapisnik-validator";

export const metadata = {
  title: "Validator zapisnika",
  description: "Matematička kontrola brojeva iz zapisnika biračkog odbora — prepoznaje sva četiri zakonska razloga za poništavanje po službenoj dužnosti.",
};

export default function ValidatorPage() {
  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Validator zapisnika</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Unesi brojeve sa biračkog mesta i odmah proveri da li se računica slaže. Alat prepoznaje
        sve situacije za koje zakon izričito propisuje poništavanje glasanja po službenoj dužnosti.
        Sve se računa lokalno u tvom pregledaču — ništa se ne šalje na server.
      </p>
      <div className="mt-8">
        <ZapisnikValidator />
      </div>
    </Container>
  );
}
