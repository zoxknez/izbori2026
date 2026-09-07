import { Clock, Gavel, ShieldCheck, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SimulationGame } from "@/components/simulation-game";
import { SIMULATOR_CHOICE_COUNT, SIMULATOR_EVENT_COUNT } from "@/lib/domain/simulator/seed-events";

export const metadata = {
  title: "Simulator biračkog dana",
  description:
    "Odigraj ceo birački dan: od preuzimanja materijala u 06:15 do predaje zapisnika posle ponoći. Odluke imaju posledice, a svaka se vezuje za tačno pravilo.",
  alternates: { canonical: "/simulator/biracki-dan" },
};

const HIGHLIGHTS = [
  {
    icon: Clock,
    title: "Ceo dan po satu",
    body: `${SIMULATOR_EVENT_COUNT} događaja od 06:15 do 22:45, hronološki, bez unapred otkrivenog toka.`,
  },
  {
    icon: Gavel,
    title: "Odluke sa posledicama",
    body: `${SIMULATOR_CHOICE_COUNT} odluka; ono što propustiš ujutru vraća ti se uveče kod zapisnika.`,
  },
  {
    icon: ShieldCheck,
    title: "Bez izmišljenog prava",
    body: "Svaka odluka referencira pravilo iz baze; brojanje koristi isti validator kao javni alat.",
  },
];

export default function SimulatorPage() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Interaktivna simulacija izbornog dana</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Odigraj birački dan pre nego što ga doživiš
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-dim sm:text-lg">
          Biraš ulogu i režim, pa kroz ceo dan donosiš odluke pod pritiskom vremena. Većina dana je
          redovna procedura — baš zato je važno prepoznati trenutak kada to prestane da bude.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-brand">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <h2 className="mt-3 text-sm font-bold text-ink">{item.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">{item.body}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <SimulationGame />
      </div>
    </Container>
  );
}
