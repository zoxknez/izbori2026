import type { ElectionPhase, Severity } from "@/lib/types";
import type { CountingInput, CountingResult } from "@/lib/domain/results-validator";

export type SimulationOutcome = "routine" | "prevented" | "serious" | "criminal" | "annulment";
export type SimulationMode = "guided" | "randomized";
export type SimulationRiskBand = "routine" | "irregularity" | "serious" | "criminal" | "annulment";

export interface SimulationCondition {
  requiresFlags?: string[];
  forbidsFlags?: string[];
  requiresPhase?: ElectionPhase;
}

export interface SimulationEffect {
  addFlags?: string[];
  removeFlags?: string[];
  scoreDelta?: number;
  evidenceDelta?: number;
  phase?: ElectionPhase;
}

export interface SimulationChoice {
  id: string;
  label: string;
  outcome: SimulationOutcome;
  ruleIds: string[];
  conditions?: SimulationCondition;
  effects: SimulationEffect;
  nextEventId?: string;
}

export interface SimulationEvent {
  id: string;
  phase: ElectionPhase;
  title: string;
  description: string;
  severity: Severity;
  riskBand: SimulationRiskBand;
  choices: SimulationChoice[];
  conditions?: SimulationCondition;
}

export interface SimulationState {
  currentEventId: string;
  phase: ElectionPhase;
  score: number;
  evidence: number;
  flags: string[];
  history: Array<{ eventId: string; choiceId: string; outcome: SimulationOutcome }>;
  finished: boolean;
  mode: SimulationMode;
  randomSeed: number;
}

export interface CountingModeState {
  input: CountingInput;
  result: CountingResult;
}
