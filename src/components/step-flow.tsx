import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export function StepFlow({
  steps,
  criticalSteps = [],
}: {
  steps: { step: number; title: string; body: string }[];
  criticalSteps?: number[];
}) {
  return (
    <div className="relative space-y-4">
      {steps.map((s, index) => {
        const isCritical = criticalSteps.includes(s.step);
        const isLast = index === steps.length - 1;

        return (
          <div key={s.step} className="relative flex items-start gap-4">
            {/* Left step connector column */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-extrabold shadow-xs transition-colors",
                  isCritical
                    ? "border-sev-ponistavanje/50 bg-sev-ponistavanje/15 text-sev-ponistavanje"
                    : "border-brand/40 bg-brand/10 text-brand"
                )}
              >
                {String(s.step).padStart(2, "0")}
              </div>

              {!isLast && (
                <div className="my-1.5 h-full min-h-[32px] w-0.5 bg-border-soft" />
              )}
            </div>

            {/* Step content card */}
            <div
              className={cn(
                "flex-1 rounded-2xl border p-4 sm:p-5 transition-all",
                isCritical
                  ? "border-sev-ponistavanje/30 bg-surface/90 hover:border-sev-ponistavanje/50"
                  : "border-border/80 bg-surface/80 hover:border-brand/40"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold text-ink">
                  {s.title}
                </h3>
                {isCritical && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sev-ponistavanje/15 px-2 py-0.5 text-[10px] font-bold text-sev-ponistavanje">
                    <AlertTriangle className="h-3 w-3" /> Kritična provera
                  </span>
                )}
              </div>

              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-ink-dim">
                {s.body}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
