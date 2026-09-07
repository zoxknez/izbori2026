import {
  Sparkles,
  Gamepad2,
  FileCheck2,
  Users,
  Compass,
  Zap,
} from "lucide-react";
import { SimulatorModeSelector } from "@/components/simulator/simulator-mode-selector";
import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Izborni dan - 2D Simulator smene na biračkom mestu",
  description:
    "Interaktivna smena na biračkom mestu u realnom vremenu: izaberi ulogu, donosi proceduralne odluke, uoči nepravilnosti u 2D prostoru i prebroj glasove uz Zapisnik BO.",
  alternates: { canonical: "/izborni-dan" },
};

const STATS = [
  {
    icon: Gamepad2,
    label: "30 realnih situacija",
    desc: "Od pripreme u 06:00 do noćnog brojanja",
  },
  {
    icon: Users,
    label: "3 perspektive",
    desc: "Član biračkog odbora, Posmatrač, Birač",
  },
  {
    icon: FileCheck2,
    label: "Zapisnik & čl. 116",
    desc: "Validacija kontrolnog lista i rubrike 1-7",
  },
  {
    icon: Zap,
    label: "Phaser 4 + XState 5",
    desc: "Deterministički replay & offline spremnost",
  },
];

const TIMELINE_STEPS = [
  {
    time: "06:00 - 07:00",
    title: "Priprema biračkog mesta",
    subtitle: "Uklanjanje izbornog materijala, provera prazne kutije i kontrolnog lista sa prvim biračem.",
  },
  {
    time: "07:00 - 20:00",
    title: "Tok glasanja uživo",
    subtitle: "UV kontrola, provera isprava, birački spisak, nevidljivi sprej, paravani i ubacivanje listića.",
  },
  {
    time: "20:00+",
    title: "Prebrojavanje i Zapisnik BO",
    subtitle: "Zatvaranje, kontrola neupotrebljenih listića, provera kutije, razvrstavanje i overa rezultata.",
  },
];

export default function ElectionDayPage() {
  return (
    <Container className="py-6 sm:py-10">
      {/* Hero sekcija sa bogatim vizuelnim elementima */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-surface via-surface to-surface-2 p-6 sm:p-10 shadow-2xl">
        {/* Pozadinski sjaj */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand shadow-sm">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>IZBORI 2026 • 2D SIMULACIJA BIRAČKOG MESTA UŽIVO</span>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Izborni dan: <span className="text-brand">vežbaj smenu</span> u realnom vremenu
          </h1>

          <p className="mt-4 text-base leading-relaxed text-ink-dim sm:text-lg">
            Doživi rad biračkog mesta kroz interaktivni 2D prostor. Izaberi ulogu, prati kretanje birača kroz stanice, uočavaj proceduralne nepravilnosti pod pritiskom vremena i prebroj glasove uz službenu forenziku Zapisnika biračkog odbora.
          </p>

          {/* Brzi bedževi / statistike */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex flex-col gap-1 rounded-2xl border border-border/70 bg-surface-2/60 p-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 text-brand">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-bold text-ink">{s.label}</span>
                  </div>
                  <span className="text-[11px] text-ink-dim leading-tight">{s.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hronološki mini tok izbornog dana */}
        <div className="relative mt-8 pt-6 border-t border-border/60">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="h-4 w-4 text-brand" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink">
              Hronologija izbornog dana (06:00 - 20:00+)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {TIMELINE_STEPS.map((step, idx) => (
              <div
                key={step.time}
                className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-surface/80 p-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand">{step.time}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-ink-dim">
                    Korak {idx + 1}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-ink mt-0.5">{step.title}</h2>
                <p className="text-xs text-ink-dim leading-relaxed">{step.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulator Mode Selector i Glavni Simulator */}
      <div className="mt-8">
        <SimulatorModeSelector />
      </div>
    </Container>
  );
}
