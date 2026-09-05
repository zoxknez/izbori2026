"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import type { Rule } from "@/lib/types";
import { PHASE_META, PHASE_ORDER } from "@/lib/phases";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { Card } from "@/components/ui/card";
import { RuleDetail } from "@/components/rule-detail";
import { cn } from "@/lib/utils";

type Step = "phase" | "scenario" | "result";

export function ProblemWizard({ rules }: { rules: Rule[] }) {
  const [step, setStep] = useState<Step>("phase");
  const [phase, setPhase] = useState<string | null>(null);
  const [selected, setSelected] = useState<Rule | null>(null);

  const phasesPresent = useMemo(
    () => PHASE_ORDER.filter((p) => rules.some((r) => r.phase === p)),
    [rules]
  );

  const scenarios = useMemo(
    () => (phase ? rules.filter((r) => r.phase === phase).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []),
    [rules, phase]
  );

  const related = useMemo(() => {
    if (!selected) return [];
    return rules.filter((r) => selected.relatedSlugs.includes(r.slug));
  }, [rules, selected]);

  function reset() {
    setStep("phase");
    setPhase(null);
    setSelected(null);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-faint">
          <span className={cn(step === "phase" && "text-brand")}>1. Gde</span>
          <ChevronRight className="h-3 w-3" />
          <span className={cn(step === "scenario" && "text-brand")}>2. Šta vidiš</span>
          <ChevronRight className="h-3 w-3" />
          <span className={cn(step === "result" && "text-brand")}>3. Rezultat</span>
        </div>
        {step !== "phase" && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-dim hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Počni ispočetka
          </button>
        )}
      </div>

      {step === "phase" && (
        <div>
          <h2 className="text-xl font-bold">Gde se problem dešava?</h2>
          <p className="mt-1 text-sm text-ink-dim">Izaberi fazu izbornog dana koja najbliže opisuje situaciju.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {phasesPresent.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPhase(p);
                  setStep("scenario");
                }}
                className="text-left"
              >
                <Card className="p-4 transition-colors hover:border-brand/40 sm:p-5">
                  <p className="font-semibold text-ink">{PHASE_META[p]?.label ?? p}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-faint">{PHASE_META[p]?.hint}</p>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "scenario" && phase && (
        <div>
          <button
            onClick={() => setStep("phase")}
            className="mb-4 flex items-center gap-1.5 text-sm text-ink-dim hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Nazad
          </button>
          <h2 className="text-xl font-bold">{PHASE_META[phase]?.label}</h2>
          <p className="mt-1 text-sm text-ink-dim">Izaberi šta najbliže opisuje ono što si video/videla.</p>
          <div className="mt-5 space-y-2.5">
            {scenarios.map((rule) => (
              <button
                key={rule.id}
                onClick={() => {
                  setSelected(rule);
                  setStep("result");
                }}
                className="block w-full text-left"
              >
                <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:border-brand/40">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{rule.naziv}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-ink-faint">{rule.summary}</p>
                  </div>
                  <SeverityBadge severity={rule.severity} size="sm" className="shrink-0" />
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "result" && selected && (
        <div>
          <button
            onClick={() => setStep("scenario")}
            className="mb-6 flex items-center gap-1.5 text-sm text-ink-dim hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Nazad na listu situacija
          </button>
          <RuleDetail rule={selected} related={related} />
        </div>
      )}
    </div>
  );
}
