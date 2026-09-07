import { Clock3, Gavel, ShieldCheck, Sparkles } from "lucide-react";
import { SimulatorModeSelector } from "@/components/simulator/simulator-mode-selector";
import { Container } from "@/components/ui/container";
import { SIMULATOR_CHOICE_COUNT, SIMULATOR_EVENT_COUNT } from "@/lib/domain/simulator/seed-events";

export const metadata = {
  title: "Izborni dan - simulator smene",
  description:
    "Interaktivna smena na biračkom mestu: izaberi ulogu, donosi proceduralne odluke i na kraju proveri tok, evidenciju i pravila za ponavljanje.",
  alternates: { canonical: "/izborni-dan" },
};

const HIGHLIGHTS = [
  {
    icon: Clock3,
    title: "Smena, ne kviz",
    body: `${SIMULATOR_EVENT_COUNT} situacija kroz hronološki tok dana, od pripreme biračkog mesta do zapisnika.`,
  },
  {
    icon: Gavel,
    title: "Odluke ostavljaju trag",
    body: `${SIMULATOR_CHOICE_COUNT} postupaka sa odloženim posledicama, vezanih za pravila iz baze.`,
  },
  {
    icon: ShieldCheck,
    title: "Praksa po ulozi",
    body: "Član odbora, akreditovani posmatrač i birač dobijaju samo odluke koje mogu da donesu.",
  },
];

export default function ElectionDayPage() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Interaktivni simulator izbornog dana</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">Izborni dan: vežbaj smenu pre stvarnog biračkog mesta</h1>
        <p className="mt-3 text-base leading-relaxed text-ink-dim sm:text-lg">
          Izaberi svoju ulogu, prati raspored biračkog mesta i odlučuj u situacijama koje se menjaju tokom dana. Simulator ne zamenjuje službeno uputstvo - pomaže da ga primeniš pod pritiskom vremena.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-brand"><Icon className="h-4.5 w-4.5" /></div>
              <h2 className="mt-3 text-sm font-bold text-ink">{item.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">{item.body}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8"><SimulatorModeSelector /></div>
    </Container>
  );
}
