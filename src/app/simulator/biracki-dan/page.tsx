import { Container } from "@/components/ui/container";
import { SimulationGame } from "@/components/simulation-game";

export const metadata = {
  title: "Simulator biračkog dana",
  description: "Interaktivna simulacija događaja i odluka tokom biračkog dana.",
  alternates: { canonical: "/simulator/biracki-dan" },
};

export default function SimulatorPage() {
  return <Container className="py-8 sm:py-12"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-wider text-brand">Simulator biračkog dana</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">Vežbaj reakciju na stvarne situacije</h1><p className="mt-3 text-base leading-relaxed text-ink-dim">Prođi kroz 30 događaja i donesi odluke koje utiču na rezultat, evidenciju i prelazak između faza. Istorija se čuva lokalno.</p></div><div className="mt-8"><SimulationGame /></div></Container>;
}
