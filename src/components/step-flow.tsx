import { Card } from "@/components/ui/card";

export function StepFlow({ steps }: { steps: { step: number; title: string; body: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((s) => (
        <Card
          key={s.step}
          className="relative flex flex-col gap-2 overflow-hidden p-5 transition-colors hover:border-brand/30"
        >
          <span className="pointer-events-none absolute -right-3 -top-3 text-6xl font-black text-white/[0.03]">
            {String(s.step).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
              {s.step}
            </span>
            <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
          </div>
          <p className="relative text-sm leading-relaxed text-ink-dim">{s.body}</p>
        </Card>
      ))}
    </div>
  );
}
