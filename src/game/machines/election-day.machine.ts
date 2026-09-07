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
  PollSchedule,
  LegalVotingInterruption,
  BoardProtocol,
  ObserverPresenceRecord,
} from "@/lib/domain/simulator/live-types";
export type {
  ActiveIncident,
  EvidenceRecord,
  GameActionLogEntry,
  PollSchedule,
  LegalVotingInterruption,
  BoardProtocol,
  ObserverPresenceRecord,
};
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
import type { GameSaveV1, GameSaveV2 } from "@/lib/domain/simulator/game-save";

export enum SchedulerPriority {
  PLAYER_ACTION = 10,
  LEGAL_PHASE_BOUNDARY = 20,
  FLAG_TRIGGER = 30,
  INCIDENT_TRIGGER = 40,
  NPC_ARRIVAL = 50,
  INCIDENT_TIMEOUT = 60,
}

export type ElectionDayPhase =
  | "pre_opening"
  | "voting"
  | "closing"
  | "counting"
  | "protocol"
  | "handover"
  | "debrief"
  | "closed";

export interface ElectionGameContext {
  runId: string;
  seed: number;
  deterministicCounter: number;
  mode: "guided" | "realistic" | "stress";
  currentPhase: ElectionDayPhase;
  domainState: SimulationState;
  simulationTimeMs: number;
  speed: SimulationSpeed;
  paused: boolean;
  systemPaused: boolean;
  pollSchedule: PollSchedule;
  legalInterruptions: LegalVotingInterruption[];
  activeIncidents: ActiveIncident[];
  missedIncidents: ActiveIncident[];
  evidenceNotebook: EvidenceRecord[];
  actionLog: GameActionLogEntry[];
  boardProtocol: BoardProtocol;
  observerRecord: ObserverPresenceRecord;
  selectedHotspotId?: string;
  worldReady: boolean;
  countingSession?: CountingSession;
  activeVoterCount: number;
  queueLength: number;
  simulatorDatasetVersion: string;
  legalDatasetVersion: string;
}

export type ElectionGameEvent =
  | { type: "WORLD_READY" }
  | { type: "TICK"; deltaRealMs: number }
  | { type: "SYSTEM_PAUSE" }
  | { type: "SYSTEM_RESUME" }
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
  | { type: "START_VOTING" }
  | { type: "CLOSE_POLLS" }
  | { type: "FINISH_CLOSING" }
  | { type: "START_COUNTING" }
  | { type: "UPDATE_COUNTING_SESSION"; session: CountingSession }
  | { type: "SIGN_PROTOCOL"; memberName?: string }
  | {
      type: "ADD_BOARD_REMARK";
      member: string;
      text: string;
    }
  | {
      type: "ADD_OBSERVER_REMARK";
      observerId: string;
      organization: string;
      text: string;
    }
  | { type: "FINALIZE_PROTOCOL" }
  | { type: "COMPLETE_HANDOVER" }
  | { type: "FINISH_SESSION" }
  | { type: "UPDATE_NPC_METRICS"; activeVoterCount: number; queueLength: number }
  | { type: "ADVANCE_SIMULATION_TO"; targetMs: number };

export interface CreateElectionMachineOptions {
  seed?: number;
  role?: "clan_odbora" | "posmatrac" | "birac";
  mode?: "guided" | "realistic" | "stress";
  startTime?: string;
  save?: GameSaveV2 | GameSaveV1;
  snapshot?: unknown;
}

export function createInitialPollSchedule(openMs: number = 25_200_000): PollSchedule {
  const scheduledOpen = 25_200_000; // 07:00
  const scheduledClose = 72_000_000; // 20:00
  const openingDelayMs = Math.max(0, openMs - scheduledOpen);
  const qualifyingInterruptionMs = 0;
  const legalExtensionMs = openingDelayMs + qualifyingInterruptionMs;
  return {
    scheduledOpenTimeMs: scheduledOpen,
    actualOpenTimeMs: openMs,
    scheduledCloseTimeMs: scheduledClose,
    openingDelayMs,
    qualifyingInterruptionMs,
    legalExtensionMs,
    effectiveCloseTimeMs: scheduledClose + legalExtensionMs,
    resultsPublicationEmbargoUntilMs: scheduledClose,
  };
}

export function createElectionDayMachine(options: CreateElectionMachineOptions = {}) {
  const save = options.save;
  const seed = save ? save.seed : (options.seed ?? 123456);
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

  const initialBoardProtocol: BoardProtocol =
    save && "boardProtocol" in save && save.boardProtocol
      ? save.boardProtocol
      : {
          isSigned: false,
          signedByMembers: [],
          boardMemberRemarks: [],
          controlSheetStatus: "valid",
          rubrics: {},
        };

  const initialObserverRecord: ObserverPresenceRecord =
    save && "observerRecord" in save && save.observerRecord
      ? save.observerRecord
      : {
          observers: [
            {
              id: "obs-1",
              organization: "CRTA posmatračka misija",
              accreditationNumber: "AC-2026-041",
              arrivedAtMs: 21_600_000,
            },
          ],
          remarks: [],
        };

  const initialSchedule =
    save && "pollSchedule" in save && save.pollSchedule
      ? save.pollSchedule
      : createInitialPollSchedule(Math.max(25_200_000, startMs));

  const initialInterruptions: LegalVotingInterruption[] =
    save && "worldSimulation" in save && save.worldSimulation?.legalInterruptions
      ? save.worldSimulation.legalInterruptions
      : [];

  const initialPhase: ElectionDayPhase = save
    ? (save.currentPhase as ElectionDayPhase)
    : startMs < 25_200_000
    ? "pre_opening"
    : startMs < initialSchedule.effectiveCloseTimeMs
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
      systemPause: assign({
        systemPaused: true,
      }),
      systemResume: assign({
        systemPaused: false,
      }),
      setSpeed: assign({
        speed: (_, params: { speed: SimulationSpeed }) => params.speed,
      }),
      selectHotspot: assign({
        selectedHotspotId: (_, params: { hotspotId?: string }) => params.hotspotId,
      }),
      addEvidence: assign(({ context }, params: { record: EvidenceRecord }) => {
        const nextCount = context.deterministicCounter + 1;
        return {
          deterministicCounter: nextCount,
          evidenceNotebook: [...context.evidenceNotebook, params.record],
          actionLog: [
            ...context.actionLog,
            {
              id: `ev-log-${nextCount}`,
              simulationTimeMs: context.simulationTimeMs,
              timestamp: msToTimeString(context.simulationTimeMs),
              type: "evidence_recorded" as const,
              locationId: params.record.locationId,
              details: `Evidentirano: ${params.record.observedFacts.join(", ")}`,
            },
          ],
        };
      }),
    },
  }).createMachine({
    id: "electionDay",
    initial: initialPhase,
    context: {
      runId: save ? save.runId : `run-${seed}`,
      seed,
      deterministicCounter: 0,
      mode,
      currentPhase: initialPhase,
      domainState: initialDomainState,
      simulationTimeMs: startMs,
      speed: 1,
      paused: false,
      systemPaused: false,
      pollSchedule: initialSchedule,
      legalInterruptions: initialInterruptions,
      activeIncidents: [],
      missedIncidents: [],
      evidenceNotebook: save ? save.evidenceNotebook : [],
      actionLog: save ? save.actionLog : [],
      boardProtocol: initialBoardProtocol,
      observerRecord: initialObserverRecord,
      selectedHotspotId: undefined,
      worldReady: false,
      countingSession: save
        ? save.countingSession
        : startMs >= 72_000_000
        ? initializeCountingSession(initialDomainState)
        : undefined,
      activeVoterCount: 0,
      queueLength: 0,
      simulatorDatasetVersion: "2026.09.07-simulator-v1",
      legalDatasetVersion: "2026.09.07-zinp-v1",
    },
    states: {
      pre_opening: {
        on: {
          START_VOTING: {
            target: "voting",
            guard: ({ context }) =>
              context.simulationTimeMs >= context.pollSchedule.actualOpenTimeMs,
            actions: assign(({ context }) => ({
              currentPhase: "voting" as const,
              actionLog: [
                ...context.actionLog,
                {
                  id: `phase-${context.deterministicCounter + 1}`,
                  simulationTimeMs: context.simulationTimeMs,
                  timestamp: msToTimeString(context.simulationTimeMs),
                  type: "phase_change" as const,
                  details: "Biračko mesto zvanično otvoreno za glasanje (član 91 ZINP).",
                },
              ],
            })),
          },
          TICK: [
            {
              target: "voting",
              guard: ({ context, event }) => {
                if (context.paused || context.systemPaused) return false;
                const nextMs = tickClock({
                  currentMs: context.simulationTimeMs,
                  deltaRealMs: event.deltaRealMs,
                  speed: context.speed,
                  paused: false,
                });
                return nextMs >= context.pollSchedule.actualOpenTimeMs;
              },
              actions: [
                assign(({ context, event }) => {
                  const update = processTickLogic(context, event.deltaRealMs);
                  return {
                    ...update,
                    currentPhase: "voting" as const,
                  };
                }),
              ],
            },
            {
              actions: assign(({ context, event }) => processTickLogic(context, event.deltaRealMs)),
            },
          ],
        },
      },
      voting: {
        on: {
          CLOSE_POLLS: {
            target: "closing",
            guard: ({ context }) => {
              const isScheduledClose = context.simulationTimeMs >= context.pollSchedule.effectiveCloseTimeMs;
              const isEarlyCloseLegal = context.pollSchedule.earlyCloseAtMs !== undefined;
              return isScheduledClose || isEarlyCloseLegal;
            },
            actions: assign(({ context }) => ({
              currentPhase: "closing" as const,
              pollSchedule: {
                ...context.pollSchedule,
                actualClosingStartedAtMs: context.simulationTimeMs,
              },
              actionLog: [
                ...context.actionLog,
                {
                  id: `phase-${context.deterministicCounter + 1}`,
                  simulationTimeMs: context.simulationTimeMs,
                  timestamp: msToTimeString(context.simulationTimeMs),
                  type: "phase_change" as const,
                  details:
                    "Nastupilo vreme zatvaranja (čl. 99 ZINP): označavanje kraja reda i omogućavanje glasanja zatečenim biračima.",
                },
              ],
            })),
          },
          TICK: {
            actions: assign(({ context, event }) => {
              const update = processTickLogic(context, event.deltaRealMs);
              if (
                update.simulationTimeMs &&
                update.simulationTimeMs > context.pollSchedule.effectiveCloseTimeMs
              ) {
                update.simulationTimeMs = context.pollSchedule.effectiveCloseTimeMs;
              }
              return update;
            }),
          },
        },
      },
      closing: {
        on: {
          FINISH_CLOSING: {
            target: "counting",
            guard: ({ context }) => context.queueLength === 0 && context.activeVoterCount === 0,
            actions: assign(({ context }) => {
              const session =
                context.countingSession ?? initializeCountingSession(context.domainState);
              return {
                currentPhase: "counting" as const,
                countingSession: session,
                actionLog: [
                  ...context.actionLog,
                  {
                    id: `phase-${context.deterministicCounter + 1}`,
                    simulationTimeMs: context.simulationTimeMs,
                    timestamp: msToTimeString(context.simulationTimeMs),
                    type: "phase_change" as const,
                    details:
                      "Svi zatečeni birači su glasali. Biračko mesto je zatvoreno, počinje brojanje (čl. 100+ ZINP).",
                  },
                ],
              };
            }),
          },
          TICK: {
            actions: assign(({ context, event }) => processTickLogic(context, event.deltaRealMs)),
          },
        },
      },
      counting: {
        on: {
          START_COUNTING: {
            actions: assign(({ context }) => {
              const session =
                context.countingSession ?? initializeCountingSession(context.domainState);
              return {
                countingSession: session,
              };
            }),
          },
          SIGN_PROTOCOL: {
            guard: ({ context }) => context.domainState.role === "clan_odbora",
            actions: assign(({ context, event }) => {
              const signer = event.memberName ?? `Član BO (${context.domainState.role})`;
              const updatedMembers = Array.from(
                new Set([
                  ...context.boardProtocol.signedByMembers,
                  signer,
                ]),
              );
              const isSigned = updatedMembers.length >= 3;

              const updatedCounting = context.countingSession
                ? {
                    ...context.countingSession,
                    isProtocolSigned: isSigned,
                    signedByAtLeastThree: isSigned,
                    signedByMembers: updatedMembers,
                  }
                : undefined;

              return {
                countingSession: updatedCounting,
                boardProtocol: {
                  ...context.boardProtocol,
                  isSigned,
                  signedAtMs: isSigned ? (context.boardProtocol.signedAtMs ?? context.simulationTimeMs) : undefined,
                  signedByMembers: updatedMembers,
                },
                actionLog: [
                  ...context.actionLog,
                  {
                    id: `protocol-${context.deterministicCounter + 1}`,
                    simulationTimeMs: context.simulationTimeMs,
                    timestamp: msToTimeString(context.simulationTimeMs),
                    type: "protocol_signed" as const,
                    details: `Zapisnik o radu biračkog odbora overen i potpisan od strane: ${signer} (potpisa: ${updatedMembers.length}/3).`,
                  },
                ],
              };
            }),
          },
          UPDATE_COUNTING_SESSION: {
            guard: ({ context }) => context.domainState.role === "clan_odbora",
            actions: assign(({ event }) => ({
              countingSession: event.session,
            })),
          },
          FINALIZE_PROTOCOL: {
            target: "protocol",
            actions: assign(({ context }) => ({
              currentPhase: "protocol" as const,
            })),
          },
          TICK: {
            actions: assign(({ context, event }) => processTickLogic(context, event.deltaRealMs)),
          },
        },
      },
      protocol: {
        on: {
          SIGN_PROTOCOL: {
            guard: ({ context }) => context.domainState.role === "clan_odbora",
            actions: assign(({ context, event }) => {
              const signer = event.memberName ?? `Član BO (${context.domainState.role})`;
              const updatedMembers = Array.from(
                new Set([...context.boardProtocol.signedByMembers, signer]),
              );
              const isSigned = updatedMembers.length >= 3;

              const updatedCounting = context.countingSession
                ? {
                    ...context.countingSession,
                    isProtocolSigned: isSigned,
                    signedByAtLeastThree: isSigned,
                    signedByMembers: updatedMembers,
                  }
                : undefined;

              return {
                countingSession: updatedCounting,
                boardProtocol: {
                  ...context.boardProtocol,
                  isSigned,
                  signedAtMs: isSigned ? (context.boardProtocol.signedAtMs ?? context.simulationTimeMs) : undefined,
                  signedByMembers: updatedMembers,
                },
                actionLog: [
                  ...context.actionLog,
                  {
                    id: `protocol-${context.deterministicCounter + 1}`,
                    simulationTimeMs: context.simulationTimeMs,
                    timestamp: msToTimeString(context.simulationTimeMs),
                    type: "protocol_signed" as const,
                    details: `Zapisnik o radu biračkog odbora overen i potpisan od strane: ${signer} (potpisa: ${updatedMembers.length}/3).`,
                  },
                ],
              };
            }),
          },
          ADD_BOARD_REMARK: {
            guard: ({ context }) => context.domainState.role === "clan_odbora",
            actions: assign(({ context, event }) => ({
              boardProtocol: {
                ...context.boardProtocol,
                boardMemberRemarks: [
                  ...context.boardProtocol.boardMemberRemarks,
                  {
                    member: event.member,
                    role: context.domainState.role,
                    text: event.text,
                    timestampMs: context.simulationTimeMs,
                  },
                ],
              },
            })),
          },
          ADD_OBSERVER_REMARK: {
            guard: ({ context }) => context.domainState.role === "posmatrac",
            actions: assign(({ context, event }) => ({
              observerRecord: {
                ...context.observerRecord,
                remarks: [
                  ...context.observerRecord.remarks,
                  {
                    observerId: event.observerId,
                    organization: event.organization,
                    text: event.text,
                    timestampMs: context.simulationTimeMs,
                  },
                ],
              },
            })),
          },
          COMPLETE_HANDOVER: {
            target: "handover",
            actions: assign(({ context }) => ({
              currentPhase: "handover" as const,
            })),
          },
          TICK: {
            actions: assign(({ context, event }) => processTickLogic(context, event.deltaRealMs)),
          },
        },
      },
      handover: {
        on: {
          FINISH_SESSION: {
            target: "debrief",
            actions: assign(({ context }) => ({
              currentPhase: "debrief" as const,
            })),
          },
          TICK: {
            actions: assign(({ context, event }) => processTickLogic(context, event.deltaRealMs)),
          },
        },
      },
      debrief: {
        on: {
          FINISH_SESSION: {
            target: "closed",
            actions: assign(({ context }) => ({
              currentPhase: "closed" as const,
            })),
          },
        },
      },
      closed: {
        type: "final",
      },
    },
    // Globalni handler-i dostupni u svim fazama
    on: {
      WORLD_READY: { actions: "setWorldReady" },
      TOGGLE_PAUSE: { actions: "togglePause" },
      SYSTEM_PAUSE: { actions: "systemPause" },
      SYSTEM_RESUME: { actions: "systemResume" },
      SET_SPEED: { actions: { type: "setSpeed", params: ({ event }) => ({ speed: event.speed }) } },
      SELECT_HOTSPOT: { actions: { type: "selectHotspot", params: ({ event }) => ({ hotspotId: event.hotspotId }) } },
      ADD_EVIDENCE: { actions: { type: "addEvidence", params: ({ event }) => ({ record: event.record }) } },
      UPDATE_NPC_METRICS: {
        actions: assign(({ event }) => ({
          activeVoterCount: event.activeVoterCount,
          queueLength: event.queueLength,
        })),
      },
      ADD_BOARD_REMARK: {
        guard: ({ context }) => context.domainState.role === "clan_odbora",
        actions: assign(({ context, event }) => ({
          boardProtocol: {
            ...context.boardProtocol,
            boardMemberRemarks: [...context.boardProtocol.boardMemberRemarks, {
              member: event.member,
              role: "clan_odbora",
              text: event.text,
              timestampMs: context.simulationTimeMs,
            }],
          },
        })),
      },
      ADD_OBSERVER_REMARK: {
        guard: ({ context }) => context.domainState.role === "posmatrac",
        actions: assign(({ context, event }) => ({
          observerRecord: {
            ...context.observerRecord,
            remarks: [...context.observerRecord.remarks, {
              observerId: event.observerId,
              organization: event.organization,
              text: event.text,
              timestampMs: context.simulationTimeMs,
            }],
          },
        })),
      },
      CHANGE_ROLE: {
        actions: assign(({ context, event }) => {
          const nextCount = context.deterministicCounter + 1;
          return {
            deterministicCounter: nextCount,
            domainState: {
              ...context.domainState,
              role: event.role,
            },
            selectedHotspotId: undefined,
            actionLog: [
              ...context.actionLog,
              {
                id: `role-${nextCount}`,
                simulationTimeMs: context.simulationTimeMs,
                timestamp: msToTimeString(context.simulationTimeMs),
                type: "role_change" as const,
                details: `Promenjena uloga u: ${event.role}`,
              },
            ],
          };
        }),
      },
      TRIGGER_WORLD_ACTION: {
        actions: assign(({ context, event }) => {
          // P0 ZAŠTITA 1: Proveri da li je incident trenutno aktivan u prostoru!
          const activeInc = context.activeIncidents.find((i) => i.eventId === event.eventId);
          if (!activeInc) {
            return {};
          }

          // P0 ZAŠTITA 2: Proveri da akcija tačno pripada ovom incidentu i ima validan choiceId
          const action = activeInc.binding.actions.find(
            (a) => a.worldActionId === event.worldActionId,
          );
          if (!action || action.choiceId !== event.choiceId) {
            return {};
          }

          // P0 ZAŠTITA 3: Proveri dozvolu trenutne uloge
          if (action.requiredRole && action.requiredRole !== context.domainState.role) {
            return {};
          }

          const ev = simulationEvents.find((e) => e.id === event.eventId);
          const choice = ev?.choices.find((c) => c.id === event.choiceId);
          if (!ev || !choice) return {};

          const updatedDomain = resolveChoice(context.domainState, ev, choice);
          const remaining = context.activeIncidents.filter((inc) => inc.eventId !== event.eventId);
          const nextCount = context.deterministicCounter + 1;

          return {
            deterministicCounter: nextCount,
            domainState: updatedDomain,
            activeIncidents: remaining,
            actionLog: [
              ...context.actionLog,
              {
                id: `act-${nextCount}`,
                simulationTimeMs: context.simulationTimeMs,
                timestamp: msToTimeString(context.simulationTimeMs),
                type: "world_action" as const,
                eventId: event.eventId,
                choiceId: event.choiceId,
                details: choice.label,
              },
            ],
          };
        }),
      },
      ADVANCE_SIMULATION_TO: {
        actions: assign(({ context, event }) => {
          if (event.targetMs <= context.simulationTimeMs) return {};
          const update = advanceSimulationInternal(context, event.targetMs);
          return {
            ...update,
            simulationTimeMs: event.targetMs,
            currentPhase: update.currentPhase ?? context.currentPhase,
          };
        }),
      },
    },
  });
}

/**
 * Interni procesor diskretnog TICK-a.
 */
function processTickLogic(
  context: ElectionGameContext,
  deltaRealMs: number,
  ignorePause: boolean = false,
  forcedDeltaSimMs?: number,
) {
  if (!ignorePause && (context.paused || context.systemPaused)) {
    return {};
  }

  const oldMs = context.simulationTimeMs;
  const newMs =
    forcedDeltaSimMs !== undefined
      ? oldMs + forcedDeltaSimMs
      : tickClock({
          currentMs: oldMs,
          deltaRealMs,
          speed: context.speed,
          paused: false,
        });

  // 1. Proveri istekle incidente (timeout mapira na autorski choiceId)
  const expired = findExpiredIncidents(context.activeIncidents, newMs);
  let updatedDomain = context.domainState;
  const newActionLog = [...context.actionLog];
  let nextCount = context.deterministicCounter;

  for (const exp of expired) {
    if (exp.binding.timeout) {
      const ev = simulationEvents.find((e) => e.id === exp.eventId);
      const choice = ev?.choices.find((c) => c.id === exp.binding.timeout!.choiceId);
      if (ev && choice) {
        updatedDomain = resolveChoice(updatedDomain, ev, choice, { bypassRoleCheck: true });
        nextCount++;
        newActionLog.push({
          id: `timeout-${nextCount}`,
          simulationTimeMs: newMs,
          timestamp: msToTimeString(newMs),
          type: "timeout" as const,
          eventId: exp.eventId,
          choiceId: choice.id,
          locationId: exp.locationId,
          details: exp.binding.timeout.label,
        });
      }
    }
  }

  const remainingIncidents = context.activeIncidents.filter(
    (inc) => !expired.some((e) => e.instanceId === inc.instanceId),
  );

  // 2. Interval-based spawn novih incidenata (podržava vremenske skokove)
  for (const [bindingId, binding] of Object.entries(WORLD_INCIDENT_BINDINGS)) {
    if (binding.trigger.type === "time" && binding.trigger.simulationTime) {
      const triggerMs = timeStringToMs(binding.trigger.simulationTime);
      const inInterval = oldMs < triggerMs && triggerMs <= newMs;

      if (
        inInterval &&
        (!binding.roleFilter || binding.roleFilter.includes(updatedDomain.role)) &&
        !remainingIncidents.some((i) => i.eventId === binding.eventId) &&
        !updatedDomain.history.some((h) => h.eventId === binding.eventId)
      ) {
        const baseSeconds = binding.timeout?.simulationSeconds ?? 60;
        const scale = context.mode === "stress" ? 0.6 : 1.0;
        const durationMs = Math.round(baseSeconds * scale) * 1000;
        nextCount++;
        remainingIncidents.push({
          instanceId: `${bindingId}-${nextCount}`,
          eventId: binding.eventId,
          binding,
          spawnedAtSimulationTimeMs: newMs,
          expiresAtSimulationTimeMs: binding.timeout ? newMs + durationMs : undefined,
          locationId: binding.locationId,
          isInspected: false,
        });
      }
    }
  }

  return {
    simulationTimeMs: newMs,
    domainState: updatedDomain,
    deterministicCounter: nextCount,
    activeIncidents: remainingIncidents,
    missedIncidents: [...context.missedIncidents, ...expired],
    actionLog: newActionLog,
  };
}

/**
 * Deterministički scheduler za vremenske skokove koji obrađuje kaskadne događaje
 * hronološki redom, uključujući timeout-e koji nastanu tokom samog skoka.
 */
function advanceSimulationInternal(
  context: ElectionGameContext,
  targetMs: number,
): Partial<ElectionGameContext> {
  let currentCtx: ElectionGameContext = { ...context };

  // Identifikujemo sve diskretne vremenske tačke interesa sortirane hronološki
  interface ScheduledPoint {
    timeMs: number;
    priority: SchedulerPriority;
    type: string;
  }

  const points: ScheduledPoint[] = [];

  // Granica otvaranja i zatvaranja
  if (currentCtx.pollSchedule.actualOpenTimeMs > currentCtx.simulationTimeMs && currentCtx.pollSchedule.actualOpenTimeMs <= targetMs) {
    points.push({ timeMs: currentCtx.pollSchedule.actualOpenTimeMs, priority: SchedulerPriority.LEGAL_PHASE_BOUNDARY, type: "open" });
  }
  if (currentCtx.pollSchedule.effectiveCloseTimeMs > currentCtx.simulationTimeMs && currentCtx.pollSchedule.effectiveCloseTimeMs <= targetMs) {
    points.push({ timeMs: currentCtx.pollSchedule.effectiveCloseTimeMs, priority: SchedulerPriority.LEGAL_PHASE_BOUNDARY, type: "close" });
  }

  // Tačke nastanka incidenata
  for (const binding of Object.values(WORLD_INCIDENT_BINDINGS)) {
    if (binding.trigger.type === "time" && binding.trigger.simulationTime) {
      const tMs = timeStringToMs(binding.trigger.simulationTime);
      if (tMs > currentCtx.simulationTimeMs && tMs <= targetMs) {
        points.push({ timeMs: tMs, priority: SchedulerPriority.FLAG_TRIGGER, type: `incident-${binding.eventId}` });
      }
    }
  }

  // Sortiramo primarno po vremenu, sekundarno po definisanim prioritetima
  points.sort((a, b) => a.timeMs - b.timeMs || a.priority - b.priority);

  const STEP_MS = 60_000;
  let cursor = currentCtx.simulationTimeMs;

  while (cursor < targetMs) {
    // Sledeća statična tačka interesa ili dinamički timeout aktivnog incidenta.
    const staticInterest = points.find((p) => p.timeMs > cursor && p.timeMs <= targetMs);
    const timeoutMs = currentCtx.activeIncidents
      .map((incident) => incident.expiresAtSimulationTimeMs)
      .filter((time): time is number => time !== undefined && time > cursor && time <= targetMs)
      .sort((a, b) => a - b)[0];
    const nextInterest = timeoutMs !== undefined && (!staticInterest || timeoutMs <= staticInterest.timeMs)
      ? { timeMs: timeoutMs, priority: SchedulerPriority.INCIDENT_TIMEOUT, type: "incident-timeout" }
      : staticInterest;
    const nextStep = nextInterest ? nextInterest.timeMs : Math.min(cursor + STEP_MS, targetMs);
    const deltaMs = nextStep - cursor;

    const update = processTickLogic(currentCtx, 0, true, deltaMs);
    currentCtx = { ...currentCtx, ...update, simulationTimeMs: nextStep };
    cursor = nextStep;
  }

  return currentCtx;
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
      "Kontrolni list u kutiji nije uredan i potpisan - zakonski osnov za poništavanje glasanja na biračkom mestu po službenoj dužnosti (čl. 116 ZINP).",
    );
  }
  if (state.flags.includes("glasao-van-izvoda")) {
    annulmentReasons.push(
      "Birač koji nije upisan u izvod je glasao - zakonski osnov za poništavanje glasanja na biračkom mestu po službenoj dužnosti.",
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
