import { setup, assign } from "xstate";
import type { SimulationState } from "@/lib/domain/simulator/types";
import {
  createSimulationState,
  resolveChoice,
} from "@/lib/domain/simulator/engine";
import { simulationEvents } from "@/lib/domain/simulator/seed-events";
import type {
  ActiveIncident,
  EvidenceRecord,
  GameActionLogEntry,
} from "@/lib/domain/simulator/live-types";
export type { ActiveIncident, EvidenceRecord, GameActionLogEntry };
import {
  findExpiredIncidents,
  msToTimeString,
  tickClock,
  timeStringToMs,
  type SimulationSpeed,
} from "@/game/clock/simulation-clock";
import { SeededRNG } from "@/game/random/seeded-rng";
import { WORLD_INCIDENT_BINDINGS } from "@/lib/domain/simulator/incident-binding";
import {
  initializeCountingSession,
  type CountingSession,
} from "@/lib/domain/simulator/counting-session";
import type { GameSaveV1 } from "@/lib/domain/simulator/game-save";

export interface ElectionGameContext {
  runId: string;
  seed: number;
  rngState: number;
  mode: "guided" | "realistic" | "stress";
  currentPhase: "pre_opening" | "voting" | "counting" | "closed";
  /**
   * Jedini izvor istine za pravni domen i rezultate.
   * XState NE duplira flags, scores ili history.
   */
  domainState: SimulationState;
  simulationTimeMs: number;
  speed: SimulationSpeed;
  paused: boolean;
  activeIncidents: ActiveIncident[];
  missedIncidents: ActiveIncident[];
  evidenceNotebook: EvidenceRecord[];
  actionLog: GameActionLogEntry[];
  selectedHotspotId?: string;
  worldReady: boolean;
  countingSession?: CountingSession;
}

export type ElectionGameEvent =
  | { type: "WORLD_READY" }
  | { type: "TICK"; deltaRealMs: number }
  | { type: "SET_SPEED"; speed: SimulationSpeed }
  | { type: "TOGGLE_PAUSE" }
  | { type: "SELECT_HOTSPOT"; hotspotId?: string }
  | {
      type: "TRIGGER_WORLD_ACTION";
      eventId: string;
      choiceId: string;
      worldActionId: string;
    }
  | { type: "ADD_EVIDENCE"; record: EvidenceRecord }
  | { type: "CHANGE_ROLE"; role: "clan_odbora" | "posmatrac" | "birac" }
  | { type: "START_COUNTING" }
  | { type: "UPDATE_COUNTING_SESSION"; session: CountingSession }
  | { type: "SIGN_PROTOCOL" };

export interface CreateElectionMachineOptions {
  seed?: number;
  role?: "clan_odbora" | "posmatrac" | "birac";
  mode?: "guided" | "realistic" | "stress";
  startTime?: string;
  save?: GameSaveV1;
}

export function createElectionDayMachine(options: CreateElectionMachineOptions = {}) {
  const save = options.save;
  const seed = save ? save.seed : (options.seed ?? Date.now());
  const rng = new SeededRNG(seed);
  const startTime = options.startTime ?? "06:00";
  const startMs = save ? save.simulationTimeMs : timeStringToMs(startTime);

  const mode = save ? save.mode : (options.mode ?? "guided");
  const domainMode = mode === "stress" ? "hard" : "guided";
  const initialDomainState = save
    ? save.domainState
    : createSimulationState(simulationEvents, {
        role: options.role ?? "clan_odbora",
        mode: domainMode,
        randomSeed: seed,
      });

  const initialPhase = save
    ? save.currentPhase
    : startMs < 25200000
    ? "pre_opening"
    : startMs < 72000000
    ? "voting"
    : "counting";

  return setup({
    types: {
      context: {} as ElectionGameContext,
      events: {} as ElectionGameEvent,
    },
    actions: {
      setWorldReady: assign({
        worldReady: true,
      }),
      togglePause: assign({
        paused: ({ context }) => !context.paused,
      }),
      setSpeed: assign({
        speed: (_, params: { speed: SimulationSpeed }) => params.speed,
      }),
      selectHotspot: assign({
        selectedHotspotId: (_, params: { hotspotId?: string }) => params.hotspotId,
      }),
      addEvidence: assign({
        evidenceNotebook: ({ context }, params: { record: EvidenceRecord }) => [
          ...context.evidenceNotebook,
          params.record,
        ],
        actionLog: ({ context }, params: { record: EvidenceRecord }) => [
          ...context.actionLog,
          {
            id: `act-${Date.now()}`,
            simulationTimeMs: context.simulationTimeMs,
            timestamp: msToTimeString(context.simulationTimeMs),
            type: "evidence_recorded",
            locationId: params.record.locationId,
            details: `Evidentirano: ${params.record.observedFacts.join(", ")}`,
          },
        ],
      }),
    },
  }).createMachine({
    id: "electionDay",
    initial: initialPhase,
    context: {
      runId: save ? save.runId : `run-${seed}`,
      seed,
      rngState: rng.getState(),
      mode,
      currentPhase: initialPhase,
      domainState: initialDomainState,
      simulationTimeMs: startMs,
      speed: 1,
      paused: false,
      activeIncidents: [],
      missedIncidents: [],
      evidenceNotebook: save ? save.evidenceNotebook : [],
      actionLog: save ? save.actionLog : [],
      selectedHotspotId: undefined,
      worldReady: false,
      countingSession: save
        ? save.countingSession
        : startMs >= 72000000
        ? initializeCountingSession(initialDomainState)
        : undefined,
    },
    states: {
      pre_opening: {
        on: {
          WORLD_READY: { actions: "setWorldReady" },
          TOGGLE_PAUSE: { actions: "togglePause" },
          SET_SPEED: { actions: { type: "setSpeed", params: ({ event }) => ({ speed: event.speed }) } },
          SELECT_HOTSPOT: { actions: { type: "selectHotspot", params: ({ event }) => ({ hotspotId: event.hotspotId }) } },
          ADD_EVIDENCE: { actions: { type: "addEvidence", params: ({ event }) => ({ record: event.record }) } },
          TICK: {
            actions: assign(({ context, event }) => {
              const newMs = tickClock({
                currentMs: context.simulationTimeMs,
                deltaRealMs: event.deltaRealMs,
                speed: context.speed,
                paused: context.paused,
              });

              // Provera isteklih incidenata (timeout mapira na autorski choiceId)
              const expired = findExpiredIncidents(context.activeIncidents, newMs);
              let updatedDomainState = context.domainState;
              const newActionLog = [...context.actionLog];

              for (const exp of expired) {
                if (exp.binding.timeout) {
                  const ev = simulationEvents.find((e) => e.id === exp.eventId);
                  const choice = ev?.choices.find((c) => c.id === exp.binding.timeout!.choiceId);
                  if (ev && choice) {
                    updatedDomainState = resolveChoice(updatedDomainState, ev, choice);
                    newActionLog.push({
                      id: `timeout-${exp.instanceId}`,
                      simulationTimeMs: newMs,
                      timestamp: msToTimeString(newMs),
                      type: "timeout",
                      eventId: exp.eventId,
                      choiceId: choice.id,
                      locationId: exp.locationId,
                      details: exp.binding.timeout.label,
                    });
                  }
                }
              }

              // Uklanjanje isteklih incidenata
              const remainingIncidents = context.activeIncidents.filter(
                (inc) => !expired.some((e) => e.instanceId === inc.instanceId),
              );

              // Spawn novih incidenata na osnovu vremena
              const timeString = msToTimeString(newMs);
              for (const [bindingId, binding] of Object.entries(WORLD_INCIDENT_BINDINGS)) {
                if (
                  binding.trigger.type === "time" &&
                  binding.trigger.simulationTime === timeString &&
                  (!binding.roleFilter || binding.roleFilter.includes(updatedDomainState.role)) &&
                  !remainingIncidents.some((i) => i.eventId === binding.eventId) &&
                  !updatedDomainState.history.some((h) => h.eventId === binding.eventId)
                ) {
                  const durationMs = (binding.timeout?.simulationSeconds ?? 60) * 1000;
                  remainingIncidents.push({
                    instanceId: `${bindingId}-${Date.now()}`,
                    eventId: binding.eventId,
                    binding,
                    spawnedAtSimulationTimeMs: newMs,
                    expiresAtSimulationTimeMs: binding.timeout ? newMs + durationMs : undefined,
                    locationId: binding.locationId,
                    isInspected: false,
                  });
                }
              }

              let currentPhase = context.currentPhase;
              let countingSession = context.countingSession;
              if (newMs >= 72000000 && currentPhase !== "counting" && currentPhase !== "closed") {
                currentPhase = "counting";
                if (!countingSession) {
                  countingSession = initializeCountingSession(updatedDomainState);
                }
              } else if (newMs >= 25200000 && currentPhase === "pre_opening") {
                currentPhase = "voting";
              }

              return {
                simulationTimeMs: newMs,
                currentPhase,
                countingSession,
                domainState: updatedDomainState,
                activeIncidents: remainingIncidents,
                missedIncidents: [...context.missedIncidents, ...expired],
                actionLog: newActionLog,
              };
            }),
          },
          TRIGGER_WORLD_ACTION: {
            actions: assign(({ context, event }) => {
              const ev = simulationEvents.find((e) => e.id === event.eventId);
              const choice = ev?.choices.find((c) => c.id === event.choiceId);
              if (!ev || !choice) return {};

              // Provera dozvole uloge za ovu akciju
              const binding = Object.values(WORLD_INCIDENT_BINDINGS).find((b) => b.eventId === event.eventId);
              const action = binding?.actions.find((a) => a.worldActionId === event.worldActionId);
              if (action?.requiredRole && action.requiredRole !== context.domainState.role) {
                return {};
              }

              const updatedDomain = resolveChoice(context.domainState, ev, choice);
              const remaining = context.activeIncidents.filter((inc) => inc.eventId !== event.eventId);

              return {
                domainState: updatedDomain,
                activeIncidents: remaining,
                actionLog: [
                  ...context.actionLog,
                  {
                    id: `act-${Date.now()}`,
                    simulationTimeMs: context.simulationTimeMs,
                    timestamp: msToTimeString(context.simulationTimeMs),
                    type: "world_action",
                    eventId: event.eventId,
                    choiceId: event.choiceId,
                    details: choice.label,
                  },
                ],
              };
            }),
          },
          CHANGE_ROLE: {
            actions: assign(({ context, event }) => {
              return {
                domainState: {
                  ...context.domainState,
                  role: event.role,
                },
                selectedHotspotId: undefined,
                actionLog: [
                  ...context.actionLog,
                  {
                    id: `role-${Date.now()}`,
                    simulationTimeMs: context.simulationTimeMs,
                    timestamp: msToTimeString(context.simulationTimeMs),
                    type: "role_change",
                    details: `Promenjena uloga u: ${event.role}`,
                  },
                ],
              };
            }),
          },
          START_COUNTING: {
            actions: assign(({ context }) => {
              const countMs = Math.max(context.simulationTimeMs, 72000000);
              const session = context.countingSession ?? initializeCountingSession(context.domainState);
              return {
                simulationTimeMs: countMs,
                currentPhase: "counting" as const,
                countingSession: session,
                actionLog: [
                  ...context.actionLog,
                  {
                    id: `phase-${Date.now()}`,
                    simulationTimeMs: countMs,
                    timestamp: msToTimeString(countMs),
                    type: "phase_change" as const,
                    details: "Biračko mesto zatvoreno u 20:00. Započeto prebrojavanje glasova.",
                  },
                ],
              };
            }),
          },
          UPDATE_COUNTING_SESSION: {
            actions: assign(({ event }) => {
              const e = event as { type: "UPDATE_COUNTING_SESSION"; session: CountingSession };
              return {
                countingSession: e.session,
              };
            }),
          },
          SIGN_PROTOCOL: {
            actions: assign(({ context }) => {
              if (!context.countingSession) return {};
              const updated: CountingSession = {
                ...context.countingSession,
                isProtocolSigned: true,
                signedByAtLeastThree: true,
                signedByMembers: [
                  ...context.countingSession.signedByMembers,
                  `Član BO (${context.domainState.role})`,
                  "Predsednik BO",
                  "Zamenik predsednika BO",
                ],
              };
              return {
                countingSession: updated,
                actionLog: [
                  ...context.actionLog,
                  {
                    id: `protocol-${Date.now()}`,
                    simulationTimeMs: context.simulationTimeMs,
                    timestamp: msToTimeString(context.simulationTimeMs),
                    type: "protocol_signed" as const,
                    details: "Zapisnik o radu biračkog odbora overen i potpisan.",
                  },
                ],
              };
            }),
          },
        },
      },
    },
  });
}

export interface DelayedConsequenceAnalysis {
  hasAnnulmentRisk: boolean;
  annulmentReasons: string[];
  documentationWeakness: boolean;
  secrecyBreaches: string[];
}

/**
 * Analizira odložene posledice na osnovu akumuliranih flagova i beležnice dokaza.
 * Otkriva propuste tek na kraju dana ili tokom brojanja (ne kao instant feedback).
 */
export function evaluateDelayedConsequences(
  state: SimulationState,
  evidenceNotebook: EvidenceRecord[],
): DelayedConsequenceAnalysis {
  const annulmentReasons: string[] = [];
  const secrecyBreaches: string[] = [];

  if (state.flags.includes("kontrolni-list-neuredan")) {
    annulmentReasons.push(
      "Kontrolni list u kutiji nije uredan i potpisan — zakonski osnov za poništavanje glasanja na biračkom mestu po službenoj dužnosti.",
    );
  }
  if (state.flags.includes("glasao-van-izvoda")) {
    annulmentReasons.push(
      "Birač koji nije upisan u izvod je glasao — zakonski osnov za poništavanje glasanja na biračkom mestu po službenoj dužnosti.",
    );
  }
  if (state.flags.includes("paravan-neispravan")) {
    secrecyBreaches.push("Paravan je omogućavao uvid u popunjavanje glasačkog listića trećim licima.");
  }
  if (state.flags.includes("propaganda-ostala")) {
    secrecyBreaches.push("Izborni propagandni materijal je ostao izložen pred ulazom tokom glasanja.");
  }

  const documentationWeakness =
    evidenceNotebook.length === 0 || evidenceNotebook.every((e) => e.witnesses.length === 0);

  return {
    hasAnnulmentRisk: annulmentReasons.length > 0,
    annulmentReasons,
    documentationWeakness,
    secrecyBreaches,
  };
}
