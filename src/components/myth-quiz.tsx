"use client";

import { useMemo, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import type { Rule, MythCheck } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const VERDICT_LABEL: Record<MythCheck["verdict"], string> = {
  mit: "MIT",
  cinjenica: "ČINJENICA",
  zavisi: "ZAVISI",
};

const VERDICT_STYLE: Record<MythCheck["verdict"], string> = {
  mit: "border-sev-teska/40 bg-sev-teska/10 text-sev-teska",
  cinjenica: "border-sev-dozvoljeno/40 bg-sev-dozvoljeno/10 text-sev-dozvoljeno",
  zavisi: "border-sev-proveri/40 bg-sev-proveri/10 text-sev-proveri",
};

const OPTIONS: { key: MythCheck["verdict"]; label: string }[] = [
  { key: "cinjenica", label: "Činjenica" },
  { key: "mit", label: "Mit" },
  { key: "zavisi", label: "Zavisi" },
];

export function MythQuiz({ rules }: { rules: (Rule & { mythCheck: MythCheck })[] }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<MythCheck["verdict"] | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = rules[index % rules.length];
  const finished = index >= rules.length;

  const progressLabel = useMemo(() => `${Math.min(index, rules.length)} / ${rules.length}`, [index, rules.length]);

  function pick(v: MythCheck["verdict"]) {
    if (answer) return;
    setAnswer(v);
    setScore((s) => ({ correct: s.correct + (v === current.mythCheck.verdict ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    setAnswer(null);
    setIndex((i) => i + 1);
  }

  function restart() {
    setAnswer(null);
    setIndex(0);
    setScore({ correct: 0, total: 0 });
  }

  if (finished) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-ink-faint">Rezultat</p>
        <p className="mt-2 text-4xl font-bold text-ink">
          {score.correct} / {score.total}
        </p>
        <p className="mt-2 text-sm text-ink-dim">tačnih odgovora</p>
        <button
          onClick={restart}
          className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-strong"
        >
          <RotateCcw className="h-4 w-4" />
          Igraj ponovo
        </button>
      </Card>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs font-medium text-ink-faint">{progressLabel}</p>
      <Card className="p-6 sm:p-8">
        <p className="text-lg font-medium leading-relaxed text-ink">„{current.mythCheck.claim}“</p>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {OPTIONS.map((opt) => {
            const isSelected = answer === opt.key;
            const isCorrectOpt = answer && opt.key === current.mythCheck.verdict;
            return (
              <button
                key={opt.key}
                onClick={() => pick(opt.key)}
                disabled={Boolean(answer)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-sm font-semibold transition-colors disabled:cursor-default",
                  isCorrectOpt
                    ? VERDICT_STYLE[opt.key]
                    : isSelected
                    ? "border-sev-teska/40 bg-sev-teska/10 text-sev-teska"
                    : "border-border bg-surface-2 text-ink-dim hover:text-ink"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {answer && (
          <div className="mt-5 animate-fade-up rounded-xl border border-border-soft bg-surface-2 p-4">
            <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-bold", VERDICT_STYLE[current.mythCheck.verdict])}>
              {VERDICT_LABEL[current.mythCheck.verdict]}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">{current.mythCheck.explanation}</p>
            <button
              onClick={next}
              className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
            >
              Sledeće pitanje
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
