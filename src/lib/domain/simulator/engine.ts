import type { CountingInput } from "@/lib/domain/results-validator";
import { validateCounting } from "@/lib/domain/results-validator";
import type { EvidenceRecord } from "./live-types";
import {
  SCORE_CATEGORIES,
  type CategoryResult,
  type ChoiceClassification,
  type ScoreBoard,
  type ScoreCategory,
  type SimulationChoice,
  type SimulationCondition,
  type SimulationDebrief,
  type SimulationEffect,
  type SimulationElectionType,
  type SimulationEvent,
  type SimulationMode,
  type SimulationRole,
  type SimulationState,
} from "./types";

export interface SimulationSetup {
  role?: SimulationRole;
  electionType?: SimulationElectionType;
  mode?: SimulationMode;
  randomSeed?: number;
  /** Kada je zadato, simulacija prolazi samo kroz ove događaje (režim „ponovi moje greške“). */
  onlyEventIds?: string[];
}

function emptyBoard(): ScoreBoard {
  return SCORE_CATEGORIES.reduce((board, category) => ({ ...board, [category]: 0 }), {} as ScoreBoard);
}

export function conditionMatches(
  condition: SimulationCondition | undefined,
  state: Pick<SimulationState, "flags" | "phase" | "role">,
): boolean {
  if (!condition) return true;
  if (condition.requiresPhase && condition.requiresPhase !== state.phase) return false;
  if (condition.roles && !condition.roles.includes(state.role)) return false;
  if (condition.requiresFlags?.some((flag) => !state.flags.includes(flag))) return false;
  if (condition.forbidsFlags?.some((flag) => state.flags.includes(flag))) return false;
  return true;
}

/** Događaji koje data uloga uopšte može da doživi. */
export function eventsForRole(events: SimulationEvent[], role: SimulationRole): SimulationEvent[] {
  return events.filter((event) => !event.roles || event.roles.includes(role));
}

export function availableChoices(event: SimulationEvent, state: SimulationState): SimulationChoice[] {
  if (!conditionMatches(event.conditions, state)) return [];
  return event.choices.filter(
    (choice) => (!choice.roles || choice.roles.includes(state.role)) && conditionMatches(choice.conditions, state),
  );
}

/** Najbolji mogući skor po kategoriji za dati događaj - osnova za procentualni rezultat. */
export function bestPossibleScores(choices: SimulationChoice[]): Partial<Record<ScoreCategory, number>> {
  const best: Partial<Record<ScoreCategory, number>> = {};
  for (const choice of choices) {
    for (const [category, value] of Object.entries(choice.effects.scores ?? {}) as [ScoreCategory, number][]) {
      best[category] = Math.max(best[category] ?? 0, value);
    }
  }
  return best;
}

export function createSimulationState(events: SimulationEvent[], setup: SimulationSetup = {}): SimulationState {
  const role = setup.role ?? "clan_odbora";
  const pool = setup.onlyEventIds?.length
    ? events.filter((event) => setup.onlyEventIds!.includes(event.id))
    : eventsForRole(events, role);
  const first = pool[0] ?? events[0];
  return {
    role,
    electionType: setup.electionType ?? "narodni_poslanici",
    mode: setup.mode ?? "guided",
    randomSeed: setup.randomSeed ?? 0,
    currentEventId: first.id,
    phase: first.phase,
    clock: first.time,
    allowedEventIds: setup.onlyEventIds?.length ? [...setup.onlyEventIds] : undefined,
    scores: emptyBoard(),
    maxScores: emptyBoard(),
    evidence: 0,
    flags: setup.onlyEventIds?.length ? ["retry-mode"] : [],
    history: [],
    startedAt: new Date().toISOString(),
    finished: false,
  };
}

function applyEffect(state: SimulationState, effect: SimulationEffect, penaltyMultiplier: number): SimulationState {
  const flags = new Set(state.flags);
  effect.addFlags?.forEach((flag) => flags.add(flag));
  effect.removeFlags?.forEach((flag) => flags.delete(flag));

  const scores = { ...state.scores };
  for (const [category, value] of Object.entries(effect.scores ?? {}) as [ScoreCategory, number][]) {
    scores[category] += value < 0 ? value * penaltyMultiplier : value;
  }

  return {
    ...state,
    flags: [...flags],
    scores,
    evidence: Math.max(0, state.evidence + (effect.evidenceDelta ?? 0)),
    phase: effect.phase ?? state.phase,
  };
}

function pickNextEvent(
  state: SimulationState,
  events: SimulationEvent[],
  choice: SimulationChoice,
  visited: Set<string>,
): SimulationEvent | undefined {
  const pool = eventsForRole(events, state.role).filter(
    (candidate) =>
      !visited.has(candidate.id) &&
      (!state.allowedEventIds || state.allowedEventIds.includes(candidate.id)) &&
      conditionMatches(candidate.conditions, state),
  );
  if (pool.length === 0) return undefined;

  if (state.mode === "randomized") {
    const index = Math.abs(state.randomSeed + state.history.length * 31 + state.scores.procedure) % pool.length;
    return pool[index];
  }

  // Vođeni i teški režim prate sat: sledeći je prvi neposećeni događaj po vremenu,
  // osim kada odluka eksplicitno grana tok.
  if (choice.nextEventId) {
    const explicit = pool.find((candidate) => candidate.id === choice.nextEventId);
    if (explicit) return explicit;
  }
  return [...pool].sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id))[0];
}

export function resolveChoice(
  state: SimulationState,
  event: SimulationEvent,
  choice: SimulationChoice,
  options?: { bypassRoleCheck?: boolean },
): SimulationState {
  if (!options?.bypassRoleCheck && !availableChoices(event, state).some((candidate) => candidate.id === choice.id)) {
    throw new Error(`Odluka ${choice.id} nije dostupna u događaju ${event.id}.`);
  }

  const penaltyMultiplier = state.mode === "hard" ? 2 : 1;
  const updated = applyEffect(state, choice.effects, penaltyMultiplier);

  const maxScores = { ...state.maxScores };
  const roleChoices = availableChoices(event, state);
  const scoringChoices = roleChoices.length > 0 ? roleChoices : event.choices;
  for (const [category, value] of Object.entries(bestPossibleScores(scoringChoices)) as [
    ScoreCategory,
    number,
  ][]) {
    maxScores[category] += value;
  }

  return {
    ...updated,
    maxScores,
    history: [
      ...state.history,
      {
        eventId: event.id,
        eventTitle: event.title,
        time: event.time,
        choiceId: choice.id,
        choiceLabel: choice.label,
        classification: choice.classification,
        outcome: choice.outcome,
        ruleIds: choice.ruleIds,
        explanation: choice.explanation,
      },
    ],
  };
}

/**
 * Evidence is a domain scoring input, not merely a UI note. The record keeps
 * its authored facts in the notebook while this pure function converts the
 * completeness checklist into documentation points for the debrief.
 */
export function applyEvidenceRecord(
  state: SimulationState,
  record: Pick<EvidenceRecord, "completeness">,
): SimulationState {
  const completeness = Object.values(record.completeness).filter(Boolean).length;
  const maxEvidencePoints = Object.keys(record.completeness).length;

  return {
    ...state,
    evidence: state.evidence + 1,
    scores: {
      ...state.scores,
      documentation: state.scores.documentation + completeness,
    },
    maxScores: {
      ...state.maxScores,
      documentation: state.maxScores.documentation + maxEvidencePoints,
    },
  };
}

export function advanceToNextEvent(
  state: SimulationState,
  nextEvent?: SimulationEvent,
  fallbackTime?: string,
): SimulationState {
  return {
    ...state,
    currentEventId: nextEvent?.id ?? "END",
    phase: nextEvent?.phase ?? state.phase,
    clock: nextEvent?.time ?? fallbackTime ?? state.clock,
    finished: !nextEvent,
  };
}

export function applyChoice(
  state: SimulationState,
  event: SimulationEvent,
  choice: SimulationChoice,
  events: SimulationEvent[],
): SimulationState {
  const resolved = resolveChoice(state, event, choice);
  const visited = new Set(resolved.history.map((item) => item.eventId));
  const nextEvent = pickNextEvent(resolved, events, choice, visited);
  return advanceToNextEvent(resolved, nextEvent, event.time);
}

const WEAK_CLASSIFICATIONS: ChoiceClassification[] = ["suboptimal", "wrong", "critical_error"];

export function computeDebrief(state: SimulationState): SimulationDebrief {
  const categories: CategoryResult[] = SCORE_CATEGORIES.map((category) => {
    const max = state.maxScores[category];
    const earned = Math.max(0, state.scores[category]);
    return { category, earned, max, percentage: max > 0 ? Math.round((earned / max) * 100) : 0 };
  });

  const scored = categories.filter((category) => category.max > 0);
  const totalMax = scored.reduce((sum, category) => sum + category.max, 0);
  const totalEarned = scored.reduce((sum, category) => sum + category.earned, 0);

  const criticalErrors = state.history.filter((decision) => decision.classification === "critical_error");
  const mistakes = state.history.filter((decision) => WEAK_CLASSIFICATIONS.includes(decision.classification));
  const handledWell = state.history.filter((decision) => decision.classification === "correct");

  const sorted = [...scored].sort((a, b) => b.percentage - a.percentage);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const narrative: string[] = [];
  if (handledWell.length > 0 && strongest) {
    narrative.push(`Najjača oblast: ${strongest.percentage}% u kategoriji koja nosi ${strongest.max} mogućih poena.`);
  }
  if (criticalErrors.length > 0) {
    narrative.push(`Kritičnih grešaka: ${criticalErrors.length}. Svaka od njih sama po sebi može ugroziti glasanje na biračkom mestu.`);
  }
  if (weakest && weakest.percentage < 70) {
    narrative.push(`Najveći rizik: ${weakest.percentage}% u najslabijoj kategoriji - vredi ponoviti pravila iz tih događaja.`);
  }
  if (state.evidence === 0) {
    narrative.push("Nijedna beleška nije sačuvana tokom dana, pa bi kasniji prigovor ostao bez činjenične podloge.");
  }

  return {
    totalPercentage: totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0,
    categories,
    strongest,
    weakest,
    criticalErrors,
    mistakes,
    handledWell,
    rulesToReview: [...new Set(mistakes.flatMap((decision) => decision.ruleIds))],
    evidence: state.evidence,
    narrative,
  };
}

export function runCountingMode(input: CountingInput) {
  return validateCounting(input);
}
