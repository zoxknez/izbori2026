import { ChevronDown } from "lucide-react";

export function StepFlow({ steps }: { steps: { step: number; title: string; body: string }[] }) {
  return (
    <ol className="space-y-2.5">
      {steps.map((s) => (
        <li key={s.step}>
          <details className="group rounded-xl border border-border bg-surface open:border-brand/30 open:bg-surface-2">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4 select-none">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-brand group-open:bg-brand group-open:text-brand-ink">
                {s.step}
              </span>
              <span className="flex-1 text-sm font-semibold text-ink">{s.title}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-4 pb-4 pl-[3.25rem] text-sm leading-relaxed text-ink-dim">{s.body}</p>
          </details>
        </li>
      ))}
    </ol>
  );
}
