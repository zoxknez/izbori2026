import type { SimulationState } from "@/lib/domain/simulator/types";
import type { GameActionLogEntry, EvidenceRecord } from "@/game/machines/election-day.machine";
import type { CountingSession } from "@/lib/domain/simulator/counting-session";
import { readOfflineValue, writeOfflineValue } from "@/lib/offline/indexed-db";
import { simulationEvents } from "@/lib/domain/simulator/seed-events";
import { createSimulationState, resolveChoice } from "@/lib/domain/simulator/engine";

export const GAME_SAVE_STORAGE_KEY = "game_simulator_v1_active_save";

export interface GameSaveV1 {
  version: 1;
  runId: string;
  savedAt: string;
  seed: number;
  mode: "guided" | "realistic" | "stress";
  role: "clan_odbora" | "posmatrac" | "birac";
  simulationTimeMs: number;
  currentPhase: "pre_opening" | "voting" | "counting" | "closed";
  domainState: SimulationState;
  actionLog: GameActionLogEntry[];
  evidenceNotebook: EvidenceRecord[];
  countingSession?: CountingSession;
}

export function isValidGameSaveV1(data: unknown): data is GameSaveV1 {
  if (!data || typeof data !== "object") return false;
  const s = data as Partial<GameSaveV1>;
  return (
    s.version === 1 &&
    typeof s.runId === "string" &&
    typeof s.savedAt === "string" &&
    typeof s.seed === "number" &&
    typeof s.simulationTimeMs === "number" &&
    (s.mode === "guided" || s.mode === "realistic" || s.mode === "stress") &&
    (s.role === "clan_odbora" || s.role === "posmatrac" || s.role === "birac") &&
    (s.currentPhase === "pre_opening" ||
      s.currentPhase === "voting" ||
      s.currentPhase === "counting" ||
      s.currentPhase === "closed") &&
    !!s.domainState &&
    Array.isArray(s.actionLog) &&
    Array.isArray(s.evidenceNotebook)
  );
}

export async function saveGameSession(save: GameSaveV1): Promise<void> {
  if (typeof window === "undefined") return;
  await writeOfflineValue("simulationHistory", GAME_SAVE_STORAGE_KEY, save);
}

export async function loadGameSession(): Promise<GameSaveV1 | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = await readOfflineValue<unknown>("simulationHistory", GAME_SAVE_STORAGE_KEY);
    if (isValidGameSaveV1(raw)) {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearGameSession(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await writeOfflineValue("simulationHistory", GAME_SAVE_STORAGE_KEY, null);
  } catch {
    // tiho ignorišemo greške pri brisanju
  }
}

import type { ScoreBoard } from "@/lib/domain/simulator/types";

export interface ReplayStep {
  stepIndex: number;
  logEntry: GameActionLogEntry;
  domainState: SimulationState;
  scoreChange: {
    total: number;
    byCategory: Partial<ScoreBoard>;
  };
}

export interface ReplayResult {
  initialState: SimulationState;
  finalDomainState: SimulationState;
  steps: ReplayStep[];
  isDeterministicParity: boolean;
}

/**
 * Deterministički replay na osnovu seed-a i actionLog-a.
 * Reprodukuje stanje domen engina i proverava da li se poklapa sa očekivanim stanjem.
 */
export function replaySimulation(
  seed: number,
  mode: "guided" | "realistic" | "stress",
  role: "clan_odbora" | "posmatrac" | "birac",
  actionLog: GameActionLogEntry[],
  expectedFinalDomainState?: SimulationState
): ReplayResult {
  const domainMode = mode === "stress" ? "hard" : "guided";
  const initial = createSimulationState(simulationEvents, {
    role,
    mode: domainMode,
    randomSeed: seed,
  });

  let current = initial;
  const steps: ReplayStep[] = [];

  for (let i = 0; i < actionLog.length; i++) {
    const entry = actionLog[i];
    const prevScore = current.scores;

    if (entry.type === "world_action" || entry.type === "timeout") {
      const ev = simulationEvents.find((e) => e.id === entry.eventId);
      const choice = ev?.choices.find((c) => c.id === entry.choiceId);
      if (ev && choice) {
        current = resolveChoice(current, ev, choice);
      }
    } else if (entry.type === "role_change") {
      const details = entry.details ?? "";
      if (
        details.includes("clan_odbora") ||
        details.includes("posmatrac") ||
        details.includes("birac")
      ) {
        const newRole = details.includes("clan_odbora")
          ? "clan_odbora"
          : details.includes("posmatrac")
          ? "posmatrac"
          : "birac";
        current = {
          ...current,
          role: newRole,
        };
      }
    }

    const categoryDeltas: Partial<ScoreBoard> = {};
    let totalDelta = 0;
    for (const key of Object.keys(current.scores) as (keyof ScoreBoard)[]) {
      const delta = (current.scores[key] ?? 0) - (prevScore[key] ?? 0);
      if (delta !== 0) {
        categoryDeltas[key] = delta;
        totalDelta += delta;
      }
    }

    steps.push({
      stepIndex: i + 1,
      logEntry: entry,
      domainState: current,
      scoreChange: {
        total: totalDelta,
        byCategory: categoryDeltas,
      },
    });
  }

  let isDeterministicParity = true;
  if (expectedFinalDomainState) {
    isDeterministicParity =
      JSON.stringify(current.scores) === JSON.stringify(expectedFinalDomainState.scores) &&
      current.flags.length === expectedFinalDomainState.flags.length &&
      current.history.length === expectedFinalDomainState.history.length;
  }

  return {
    initialState: initial,
    finalDomainState: current,
    steps,
    isDeterministicParity,
  };
}
