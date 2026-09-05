import { getAllRules } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { MythQuiz } from "@/components/myth-quiz";
import type { MythCheck, Rule } from "@/lib/types";
import { HelpCircle, Sparkles, BookOpen } from "lucide-react";

export const revalidate = 3600;

export const metadata = {
  title: "Mit ili činjenica: izborne zablude i istine",
  description:
    "Testiraj svoje znanje: šta je zaista izborna nepravilnost, a šta samo tako deluje? Interaktivni kviz i katalog mitova sa tačnim pravnim osnovom.",
};

export default async function MitIliCinjenicaPage() {
  const rules = await getAllRules();
  const withMyth = rules.filter((r): r is Rule & { mythCheck: MythCheck } => Boolean(r.mythCheck));

  return (
    <div className="space-y-10 sm:space-y-12 pb-16 sm:pb-24">
      {/* Top Banner */}
      <section className="border-b border-border-soft bg-gradient-to-b from-surface/80 via-canvas to-canvas py-8 sm:py-14">
        <Container>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Edukativni vodič kroz izborne zablude</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Mit ili činjenica?
            </h1>

            <p className="mt-3 text-base leading-relaxed text-ink-dim sm:text-lg">
              Neke stvari koje birači i posmatrači smatraju izbornom krađom su po zakonu potpuno
              dozvoljene, dok su druge, naizgled bezazlene radnje — ozbiljne nepravilnosti.
              Proveri svoje znanje kroz kviz ili prelistaj ceo katalog.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Interactive Quiz & Browse Section */}
      <Container>
        <MythQuiz rules={withMyth} />
      </Container>
    </div>
  );
}
