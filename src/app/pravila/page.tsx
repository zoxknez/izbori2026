import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { RulesExplorer } from "@/components/rules-explorer";

export const revalidate = 3600;

export const metadata = {
  title: "Baza nepravilnosti",
  description: "Kompletna baza izbornih nepravilnosti u Srbiji sa pravnim osnovom i uputstvom šta uraditi.",
};

export default async function PravilaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ponistavanje?: string; faza?: string }>;
}) {
  const rules = await getAllRules();
  const { q, ponistavanje, faza } = await searchParams;

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Baza nepravilnosti</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        {rules.length} situacija iz prakse izbornog dana, od dozvoljenih i informativnih, preko
        proceduralnih nepravilnosti, do mogućih krivičnih dela. Svaka kartica ima tačan pravni
        osnov i uputstvo šta da radiš.
      </p>
      <div className="mt-8">
        <RulesExplorer
          rules={rules}
          initialQuery={q ?? ""}
          initialSeverity={ponistavanje ? "ponistavanje" : null}
          initialPhase={faza ?? null}
        />
      </div>
    </Container>
  );
}
