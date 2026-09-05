import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { MythQuiz } from "@/components/myth-quiz";
import type { MythCheck, Rule } from "@/lib/types";

export const revalidate = 3600;

export const metadata = {
  title: "Mit ili činjenica",
  description: "Testiraj svoje znanje o tome šta je zaista izborna nepravilnost, a šta samo tako izgleda.",
};

export default async function MitIliCinjenicaPage() {
  const rules = await getAllRules();
  const withMyth = rules.filter((r): r is Rule & { mythCheck: MythCheck } => Boolean(r.mythCheck));

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-bold sm:text-3xl">Mit ili činjenica</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-dim">
        Neke stvari koje ljudi smatraju izbornom krađom su potpuno legalne, a neke naizgled bezazlene
        situacije su ozbiljna nepravilnost. Proveri koliko dobro razlikuješ jedno od drugog.
      </p>
      <div className="mx-auto mt-8 max-w-xl">
        <MythQuiz rules={withMyth} />
      </div>
    </Container>
  );
}
