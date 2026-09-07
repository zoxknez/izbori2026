import type { SimulationState } from "@/lib/domain/simulator/types";
import type {
  GameActionLogEntry,
  EvidenceRecord,
  PollSchedule,
  LegalVotingInterruption,
  BoardProtocol,
  ObserverPresenceRecord,
  ElectionDayPhase,
} from "@/game/machines/election-day.machine";
import type { CountingSession } from "@/lib/domain/simulator/counting-session";
import { readOfflineValue, writeOfflineValue } from "@/lib/offline/indexed-db";
import { simulationEvents } from "@/lib/domain/simulator/seed-events";
import { createSimulationState, resolveChoice } from "@/lib/domain/simulator/engine";

export const GAME_SAVE_STORAGE_KEY_V2 = "game_simulator_v2_active_save";
export const GAME_SAVE_STORAGE_KEY_V1 = "game_simulator_v1_active_save";

export interface SerializedVoterEntity {
  id: string;
  name: string;
  gender: "m" | "z";
  ageCategory: "young" | "middle" | "senior";
  walkSpeed: number;
  currentStation: string;
  timeAtStationMs: number;
  assignedBoothIndex?: number;
  progress: number;
  x: number;
  y: number;
}

export interface WorldSimulationSaveState {
  rngState: number;
  deterministicCounter?: number;
  nextEntityId: number;
  /** Scene-owned entities including profile and persisted voter actor snapshot. */
  activeVoters: unknown[];
  queueOrder: string[];
  nextSpawnAtMs: number;
  legalInterruptions: LegalVotingInterruption[];
  voterPool?: unknown[];
  completedVoterIds?: string[];
}

export interface GameSaveV2 {
  version: 2;
  runId: string;
  savedAt: string;
  seed: number;
  mode: "guided" | "realistic" | "stress";
  role: "clan_odbora" | "posmatrac" | "birac";
  simulationTimeMs: number;
  currentPhase: ElectionDayPhase;
  machineSnapshot?: unknown;
  domainState: SimulationState;
  worldSimulation: WorldSimulationSaveState;
  pollSchedule: PollSchedule;
  actionLog: GameActionLogEntry[];
  evidenceNotebook: EvidenceRecord[];
  boardProtocol?: BoardProtocol;
  observerRecord?: ObserverPresenceRecord;
  countingSession?: CountingSession;
  stateHash: string;
}

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

/**
 * Deterministički SHA-256 hash na osnovu kanonski sortiranog JSON representation-a
 * za verifikaciju integriteta sačuvanog stanja i detekciju desinhronizacije.
 */
export async function computeCanonicalStateHash(data: {
  runId: string;
  seed: number;
  simulationTimeMs: number;
  scores: Record<string, number>;
  flags: string[];
  actionLogLength: number;
  pollSchedule: PollSchedule;
  decisionHistory?: Array<{ eventId: string; choiceId: string }>;
  activeIncidentIds?: string[];
  missedIncidentIds?: string[];
  boardProtocol?: BoardProtocol;
  rngState?: number;
}): Promise<string> {
  const canonicalPayload = JSON.stringify({
    runId: data.runId,
    seed: data.seed,
    simulationTimeMs: data.simulationTimeMs,
    scores: Object.keys(data.scores)
      .sort()
      .reduce((acc, k) => {
        acc[k] = data.scores[k];
        return acc;
      }, {} as Record<string, number>),
    flags: [...data.flags].sort(),
    actionLogLength: data.actionLogLength,
    decisionHistory: (data.decisionHistory ?? []).map((d) => ({
      choiceId: d.choiceId,
      eventId: d.eventId,
    })),
    activeIncidentIds: [...(data.activeIncidentIds ?? [])].sort(),
    missedIncidentIds: [...(data.missedIncidentIds ?? [])].sort(),
    rngState: data.rngState ?? null,
    boardProtocol: data.boardProtocol
      ? {
          isSigned: data.boardProtocol.isSigned,
          signedByMembers: [...data.boardProtocol.signedByMembers].sort(),
          remarksCount: data.boardProtocol.boardMemberRemarks.length,
        }
      : null,
    pollSchedule: {
      scheduledOpenTimeMs: data.pollSchedule.scheduledOpenTimeMs,
      actualOpenTimeMs: data.pollSchedule.actualOpenTimeMs,
      scheduledCloseTimeMs: data.pollSchedule.scheduledCloseTimeMs,
      openingDelayMs: data.pollSchedule.openingDelayMs,
      qualifyingInterruptionMs: data.pollSchedule.qualifyingInterruptionMs,
      legalExtensionMs: data.pollSchedule.legalExtensionMs,
      effectiveCloseTimeMs: data.pollSchedule.effectiveCloseTimeMs,
      earlyCloseAtMs: data.pollSchedule.earlyCloseAtMs ?? null,
      resultsPublicationEmbargoUntilMs: data.pollSchedule.resultsPublicationEmbargoUntilMs,
    },
  });

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(canonicalPayload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Node fallback or non-crypto environment: FNV-1a 64-bit hex hash
  let h1 = 0x811c9dc5;
  for (let i = 0; i < canonicalPayload.length; i++) {
    h1 ^= canonicalPayload.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0");
}

export function isValidGameSaveV2(data: unknown): data is GameSaveV2 {
  if (!data || typeof data !== "object") return false;
  const s = data as Partial<GameSaveV2>;
  return (
    s.version === 2 &&
    typeof s.runId === "string" &&
    typeof s.savedAt === "string" &&
    typeof s.seed === "number" &&
    typeof s.simulationTimeMs === "number" &&
    (s.mode === "guided" || s.mode === "realistic" || s.mode === "stress") &&
    (s.role === "clan_odbora" || s.role === "posmatrac" || s.role === "birac") &&
    typeof s.currentPhase === "string" &&
    !!s.domainState &&
    !!s.worldSimulation &&
    typeof s.worldSimulation.rngState === "number" &&
    Array.isArray(s.worldSimulation.activeVoters) &&
    Array.isArray(s.worldSimulation.queueOrder) &&
    !!s.pollSchedule &&
    typeof s.pollSchedule.effectiveCloseTimeMs === "number" &&
    Array.isArray(s.actionLog) &&
    Array.isArray(s.evidenceNotebook) &&
    typeof s.stateHash === "string"
  );
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

export async function saveGameSession(save: GameSaveV2 | GameSaveV1): Promise<void> {
  if (typeof window === "undefined") return;
  if (save.version === 2) {
    await writeOfflineValue("simulationHistory", GAME_SAVE_STORAGE_KEY_V2, save);
  } else {
    await writeOfflineValue("simulationHistory", GAME_SAVE_STORAGE_KEY_V1, save);
  }
}

export async function loadGameSession(): Promise<GameSaveV2 | GameSaveV1 | null> {
  if (typeof window === "undefined") return null;
  try {
    const rawV2 = await readOfflineValue<unknown>("simulationHistory", GAME_SAVE_STORAGE_KEY_V2);
    if (isValidGameSaveV2(rawV2)) {
      return rawV2;
    }
    const rawV1 = await readOfflineValue<unknown>("simulationHistory", GAME_SAVE_STORAGE_KEY_V1);
    if (isValidGameSaveV1(rawV1)) {
      return rawV1;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearGameSession(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await writeOfflineValue("simulationHistory", GAME_SAVE_STORAGE_KEY_V2, null);
    await writeOfflineValue("simulationHistory", GAME_SAVE_STORAGE_KEY_V1, null);
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
  expectedFinalDomainState?: SimulationState,
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
        current = resolveChoice(current, ev, choice, { bypassRoleCheck: true });
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
