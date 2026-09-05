"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Flag, RotateCcw, ShieldAlert } from "lucide-react";
import { simulationEvents } from "@/lib/domain/simulator/seed-events";
import { applyChoice, availableChoices, createSimulationState } from "@/lib/domain/simulator/engine";
import type { SimulationMode, SimulationState } from "@/lib/domain/simulator/types";
import { setDraftInProgress, writeOfflineValue } from "@/lib/offline/indexed-db";
import { cn } from "@/lib/utils";

export function SimulationGame() {
  const eventMap = useMemo(() => new Map(simulationEvents.map((event) => [event.id, event])), []);
  const [state, setState] = useState<SimulationState>(() => createSimulationState(simulationEvents[0]));
  const event = eventMap.get(state.currentEventId);
  const choices = event ? availableChoices(event, state) : [];

  useEffect(() => {
    void setDraftInProgress("simulation", !state.finished);
    return () => { void setDraftInProgress("simulation", false); };
  }, [state.finished]);

  async function choose(choiceId: string) {
    if (!event) return;
    const choice = choices.find((item) => item.id === choiceId);
    if (!choice) return;
    const next = applyChoice(state, event, choice, simulationEvents);
    setState(next);
    await writeOfflineValue("simulationHistory", "latest", next.history);
  }

  function restart(nextMode: SimulationMode = state.mode) { setState(createSimulationState(simulationEvents[0], nextMode, Math.floor(Math.random() * 1_000_000))); }

  if (state.finished || !event) return <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-card sm:p-12"><CheckCircle2 className="mx-auto h-10 w-10 text-brand" /><p className="mt-4 text-xs font-bold uppercase tracking-wider text-brand">Birački dan završen</p><h2 className="mt-2 text-3xl font-extrabold text-ink">Rezultat: {state.score} poena</h2><p className="mt-2 text-sm text-ink-dim">Sačuvano je {state.evidence} dokaza/beleški. Istorija simulacije je dostupna offline.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><button type="button" onClick={() => restart("guided")} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-ink"><RotateCcw className="h-4 w-4" /> Vođeni tok</button><button type="button" onClick={() => restart("randomized")} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink">Randomizovani tok</button></div></div>;

  return <div className="mx-auto max-w-3xl space-y-4"><div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3"><span className="text-xs text-ink-dim">Izaberi tok simulacije</span><div className="flex gap-1 rounded-xl bg-surface-2 p-1"><button type="button" onClick={() => restart("guided")} className={cn("rounded-lg px-3 py-1.5 text-xs font-bold", state.mode === "guided" ? "bg-brand text-brand-ink" : "text-ink-dim")}>Vođeni</button><button type="button" onClick={() => restart("randomized")} className={cn("rounded-lg px-3 py-1.5 text-xs font-bold", state.mode === "randomized" ? "bg-brand text-brand-ink" : "text-ink-dim")}>Randomizovani</button></div></div><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-faint"><span>Događaj {state.history.length + 1} od {simulationEvents.length}</span><span>Režim: <strong className="text-ink">{state.mode === "randomized" ? "randomizovani" : "vođeni"}</strong> · Faza: <strong>{event.phase}</strong></span></div><div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand" style={{ width: `${state.history.length / simulationEvents.length * 100}%` }} /></div><div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-9"><div className="flex items-start gap-3"><div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", event.severity === "ponistavanje" ? "bg-rose-500/15 text-rose-500" : "bg-brand/10 text-brand")}><ShieldAlert className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-brand">{event.title}</p><h2 className="mt-2 text-xl font-extrabold leading-relaxed text-ink">{event.description}</h2></div></div><div className="mt-7 grid gap-3">{choices.map((choice) => <button key={choice.id} type="button" onClick={() => choose(choice.id)} className="group flex items-start gap-3 rounded-2xl border border-border bg-surface-2 p-4 text-left text-sm font-semibold text-ink transition-colors hover:border-brand"><Flag className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint group-hover:text-brand" />{choice.label}</button>)}</div><div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-ink-dim"><span>Score: <strong className="text-ink">{state.score}</strong></span><span>Beleške: <strong className="text-ink">{state.evidence}</strong></span></div></div></div>;
}
