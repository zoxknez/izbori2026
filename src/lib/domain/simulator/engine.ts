import type { CountingInput } from "@/lib/domain/results-validator";
import { validateCounting } from "@/lib/domain/results-validator";
import type { SimulationChoice, SimulationCondition, SimulationEffect, SimulationEvent, SimulationMode, SimulationState } from "./types";

export function conditionMatches(condition: SimulationCondition | undefined, state: SimulationState): boolean {
  if (!condition) return true;
  if (condition.requiresPhase && condition.requiresPhase !== state.phase) return false;
  if (condition.requiresFlags?.some((flag) => !state.flags.includes(flag))) return false;
  if (condition.forbidsFlags?.some((flag) => state.flags.includes(flag))) return false;
  return true;
}

export function createSimulationState(firstEvent: SimulationEvent, mode: SimulationMode = "guided", randomSeed = 0): SimulationState {
  return { currentEventId: firstEvent.id, phase: firstEvent.phase, score: 0, evidence: 0, flags: [], history: [], finished: false, mode, randomSeed };
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
  const updated = applyEffect(state, choice.effects);
  const visited = new Set(state.history.map((item) => item.eventId).concat(event.id));
  const randomizedCandidates = events.filter((candidate) => !visited.has(candidate.id) && conditionMatches(candidate.conditions, updated));
  const nextEvent = state.mode === "randomized"
    ? randomizedCandidates.length > 0
      ? randomizedCandidates[Math.abs(state.randomSeed + state.history.length * 31 + updated.score) % randomizedCandidates.length]
      : undefined
    : events.find((candidate) => candidate.id === choice.nextEventId);
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
