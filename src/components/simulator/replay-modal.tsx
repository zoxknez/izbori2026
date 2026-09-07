"use client";

import { useMemo, useState } from "react";
import {
  X,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  History,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimulationState } from "@/lib/domain/simulator/types";
import {
  SCORE_CATEGORIES,
  SCORE_CATEGORY_LABELS,
} from "@/lib/domain/simulator/types";
import type { GameActionLogEntry } from "@/lib/domain/simulator/live-types";
import { replaySimulation, type ReplayResult } from "@/lib/domain/simulator/game-save";

interface ReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  seed: number;
  mode: "guided" | "realistic" | "stress";
  role: "clan_odbora" | "posmatrac" | "birac";
  actionLog: GameActionLogEntry[];
  currentDomainState: SimulationState;
}

export function ReplayModal({
  isOpen,
  onClose,
  seed,
  mode,
  role,
  actionLog,
  currentDomainState,
}: ReplayModalProps) {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const replayResult: ReplayResult = useMemo(() => {
    return replaySimulation(seed, mode, role, actionLog, currentDomainState);
  }, [seed, mode, role, actionLog, currentDomainState]);

  if (!isOpen) return null;

  const currentStep =
    selectedStepIndex !== null && replayResult.steps[selectedStepIndex]
      ? replayResult.steps[selectedStepIndex]
      : replayResult.steps.length > 0
      ? replayResult.steps[replayResult.steps.length - 1]
      : null;

  const activeIndex =
    selectedStepIndex !== null
      ? selectedStepIndex
      : Math.max(0, replayResult.steps.length - 1);

  const handleCopyJson = () => {
    const data = {
      seed,
      mode,
      role,
      actionLog,
      finalScores: currentDomainState.scores,
      flags: currentDomainState.flags,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalStepScore = currentStep
    ? Object.values(currentStep.domainState.scores).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div
      data-testid="replay-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-border bg-surface p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink">Replay &amp; Revizija toka glasanja</h2>
                {replayResult.isDeterministicParity ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>100% Deterministički paritet</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Odstupanje u toku</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-dim">
                Seed: <span className="font-mono text-ink">{seed}</span> • Režim: {mode} • Ukupno akcija: {actionLog.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-ink hover:bg-surface-2"
              title="Kopiraj JSON podatak o toku"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-ink-dim" />}
              <span>{copied ? "Kopirano" : "Kopiraj JSON"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-ink-dim hover:bg-surface-2 hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action timeline / Stepper */}
        {replayResult.steps.length === 0 ? (
          <div className="my-10 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-ink">Nema zabeleženih akcija u ovoj smeni.</p>
            <p className="mt-1 text-xs text-ink-dim">
              Izvršite akciju na interaktivnim hotspotovima u biračkom mestu kako biste videli analizu toka.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {/* Navigacione kontrole koraka */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-surface-2/60 p-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStepIndex(0)}
                  disabled={activeIndex === 0}
                  className="rounded-lg p-1.5 text-ink-dim hover:bg-surface hover:text-ink disabled:opacity-40"
                  title="Početak smene"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStepIndex(Math.max(0, activeIndex - 1))}
                  disabled={activeIndex === 0}
                  className="rounded-lg p-1.5 text-ink-dim hover:bg-surface hover:text-ink disabled:opacity-40"
                  title="Prethodni korak"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-ink">
                  Korak {activeIndex + 1} od {replayResult.steps.length}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStepIndex(Math.min(replayResult.steps.length - 1, activeIndex + 1))}
                  disabled={activeIndex === replayResult.steps.length - 1}
                  className="rounded-lg p-1.5 text-ink-dim hover:bg-surface hover:text-ink disabled:opacity-40"
                  title="Sledeći korak"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {currentStep && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-brand">{currentStep.logEntry.timestamp}</span>
                  <span className="text-ink-dim">•</span>
                  <span className="font-semibold text-ink truncate max-w-xs">{currentStep.logEntry.details}</span>
                </div>
              )}
            </div>

            {/* Detalji koraka: Score diff i promene stanja */}
            {currentStep && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Bodovni uticaj odluke */}
                <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-ink-dim">
                      Bodovi u ovom koraku
                    </h4>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        currentStep.scoreChange.total > 0
                          ? "bg-emerald-500/10 text-emerald-400"
                          : currentStep.scoreChange.total < 0
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-surface-2 text-ink-dim",
                      )}
                    >
                      {currentStep.scoreChange.total > 0 ? "+" : ""}
                      {currentStep.scoreChange.total} poena
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {SCORE_CATEGORIES.map((cat) => {
                      const score = currentStep.domainState.scores[cat] ?? 0;
                      const delta = currentStep.scoreChange.byCategory[cat];
                      return (
                        <div key={cat} className="rounded-xl border border-border/80 bg-surface p-2 text-center">
                          <span className="text-[9px] uppercase font-bold text-ink-dim truncate block">
                            {SCORE_CATEGORY_LABELS[cat]}
                          </span>
                          <div className="text-sm font-bold text-ink">{score}</div>
                          {delta !== undefined && (
                            <span
                              className={cn(
                                "text-[9px] font-bold",
                                delta > 0 ? "text-emerald-400" : "text-rose-400",
                              )}
                            >
                              {delta > 0 ? "+" : ""}
                              {delta}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Aktivni flegovi i pravni kontekst */}
                <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-ink-dim">
                    Pravni flegovi u ovom koraku ({currentStep.domainState.flags.length})
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {currentStep.domainState.flags.length === 0 ? (
                      <span className="text-xs text-ink-dim italic">Nema aktivnih flegova nepravilnosti.</span>
                    ) : (
                      currentStep.domainState.flags.map((flag) => (
                        <span
                          key={flag}
                          className="rounded-lg bg-surface px-2 py-1 text-[10px] font-mono text-ink border border-border"
                        >
                          {flag}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Kompletna hronološka lista akcija */}
            <div className="rounded-2xl border border-border bg-surface-2/40 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wide text-ink-dim">
                Hronološki niz odluka
              </h4>
              <div className="mt-3 flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {replayResult.steps.map((step, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <button
                      key={step.logEntry.id}
                      type="button"
                      onClick={() => setSelectedStepIndex(idx)}
                      className={cn(
                        "flex items-center justify-between rounded-xl p-2.5 text-left text-xs transition border",
                        isCurrent
                          ? "border-brand bg-brand/10 text-ink font-bold shadow-sm"
                          : "border-border/60 bg-surface text-ink-dim hover:bg-surface-2 hover:text-ink",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-brand text-[11px]">{step.logEntry.timestamp}</span>
                        <span className="text-ink">{step.logEntry.details}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        {step.scoreChange.total !== 0 && (
                          <span className={step.scoreChange.total > 0 ? "text-emerald-400" : "text-rose-400"}>
                            {step.scoreChange.total > 0 ? "+" : ""}{step.scoreChange.total}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-end border-t border-border/80 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-surface px-5 py-2 text-xs font-semibold text-ink hover:bg-surface-2"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}
