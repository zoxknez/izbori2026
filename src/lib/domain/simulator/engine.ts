import type { CountingInput } from "@/lib/domain/results-validator";
import { validateCounting } from "@/lib/domain/results-validator";
import type { SimulationChoice, SimulationCondition, SimulationEffect, SimulationEvent, SimulationState } from "./types";

export function conditionMatches(condition: SimulationCondition | undefined, state: SimulationState): boolean {
  if (!condition) return true;
  if (condition.requiresPhase && condition.requiresPhase !== state.phase) return false;
  if (condition.requiresFlags?.some((flag) => !state.flags.includes(flag))) return false;
  if (condition.forbidsFlags?.some((flag) => state.flags.includes(flag))) return false;
  return true;
}

export function createSimulationState(firstEvent: SimulationEvent): SimulationState {
  return { currentEventId: firstEvent.id, phase: firstEvent.phase, score: 0, evidence: 0, flags: [], history: [], finished: false };
}

export function availableChoices(event: SimulationEvent, state: SimulationState): SimulationChoice[] {
  if (!conditionMatches(event.conditions, state)) return [];
  return event.choices.filter((choice) => conditionMatches(choice.conditions, state));
}

function applyEffect(state: SimulationState, effect: SimulationEffect): SimulationState {
  const flags = new Set(state.flags);
  effect.addFlags?.forEach((flag) => flags.add(flag));
  effect.removeFlags?.forEach((flag) => flags.delete(flag));
  return { ...state, flags: [...flags], score: state.score + (effect.scoreDelta ?? 0), evidence: Math.max(0, state.evidence + (effect.evidenceDelta ?? 0)), phase: effect.phase ?? state.phase };
}

export function applyChoice(state: SimulationState, event: SimulationEvent, choice: SimulationChoice, events: SimulationEvent[]): SimulationState {
  if (!availableChoices(event, state).some((candidate) => candidate.id === choice.id)) throw new Error(`Odluka ${choice.id} nije dostupna u događaju ${event.id}.`);
  const nextEvent = events.find((candidate) => candidate.id === choice.nextEventId);
  const updated = applyEffect(state, choice.effects);
  return {
    ...updated,
    currentEventId: nextEvent?.id ?? "END",
    phase: nextEvent?.phase ?? updated.phase,
    history: [...state.history, { eventId: event.id, choiceId: choice.id, outcome: choice.outcome }],
    finished: !nextEvent,
  };
}

export function runCountingMode(input: CountingInput) {
  return validateCounting(input);
}
