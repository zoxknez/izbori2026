import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isValidGameSaveV1,
  saveGameSession,
  loadGameSession,
  clearGameSession,
  replaySimulation,
  type GameSaveV1,
} from "./game-save";
import { createSimulationState, resolveChoice } from "@/lib/domain/simulator/engine";
import { simulationEvents } from "@/lib/domain/simulator/seed-events";
import type { GameActionLogEntry } from "@/game/machines/election-day.machine";

describe("GameSaveV1 & Deterministic Replay (Milestone 7)", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
  });
  it("proverava validnost GameSaveV1 formata", () => {
    const valid: GameSaveV1 = {
      version: 1,
      runId: "run-12345",
      savedAt: new Date().toISOString(),
      seed: 42,
      mode: "guided",
      role: "clan_odbora",
      simulationTimeMs: 25200000,
      currentPhase: "voting",
      domainState: createSimulationState(simulationEvents, {
        role: "clan_odbora",
        mode: "guided",
        randomSeed: 42,
      }),
      actionLog: [],
      evidenceNotebook: [],
    };

    expect(isValidGameSaveV1(valid)).toBe(true);

    expect(isValidGameSaveV1(null)).toBe(false);
    expect(isValidGameSaveV1({})).toBe(false);
    expect(isValidGameSaveV1({ ...valid, version: 2 })).toBe(false);
    expect(isValidGameSaveV1({ ...valid, mode: "invalid_mode" })).toBe(false);
  });

  it("uspešno upisuje u IndexedDB, učitava i briše sesiju", async () => {
    const saveObj: GameSaveV1 = {
      version: 1,
      runId: "run-test-idb",
      savedAt: new Date().toISOString(),
      seed: 9999,
      mode: "realistic",
      role: "posmatrac",
      simulationTimeMs: 28800000, // 08:00
      currentPhase: "voting",
      domainState: createSimulationState(simulationEvents, {
        role: "posmatrac",
        mode: "guided",
        randomSeed: 9999,
      }),
      actionLog: [
        {
          id: "act-1",
          simulationTimeMs: 25200000,
          timestamp: "07:00",
          type: "world_action",
          eventId: "E01",
          choiceId: "E01-C1",
          details: "Uklanjanje plakata",
        },
      ],
      evidenceNotebook: [],
    };

    await saveGameSession(saveObj);
    const loaded = await loadGameSession();

    expect(loaded).not.toBeNull();
    expect(loaded?.runId).toBe("run-test-idb");
    expect(loaded?.seed).toBe(9999);
    expect(loaded?.actionLog).toHaveLength(1);

    await clearGameSession();
    const afterClear = await loadGameSession();
    expect(afterClear).toBeNull();
  });

  it("deterministički reprodukuje tok igre iz seed-a i actionLog-a sa 100% paritetom", () => {
    const seed = 12345;
    const role = "clan_odbora";
    const mode = "guided";

    // 1. Kreiramo početno stanje i izvršavamo dva izbora
    let state = createSimulationState(simulationEvents, {
      role,
      mode,
      randomSeed: seed,
    });

    const e01 = simulationEvents.find((e) => e.id === "E01")!;
    const c01 = e01.choices[0]; // zakonit izbor
    state = resolveChoice(state, e01, c01);

    const e07 = simulationEvents.find((e) => e.id === "E07")!;
    const c07 = e07.choices[0];
    state = resolveChoice(state, e07, c07);

    // 2. Kreiramo actionLog koji odgovara ovim akcijama
    const actionLog: GameActionLogEntry[] = [
      {
        id: "a1",
        simulationTimeMs: 22000000,
        timestamp: "06:06",
        type: "world_action",
        eventId: "E01",
        choiceId: c01.id,
        details: c01.label,
      },
      {
        id: "a2",
        simulationTimeMs: 26000000,
        timestamp: "07:13",
        type: "world_action",
        eventId: "E07",
        choiceId: c07.id,
        details: c07.label,
      },
    ];

    // 3. Pokrećemo replaySimulation
    const replay = replaySimulation(seed, mode, role, actionLog, state);

    expect(replay.isDeterministicParity).toBe(true);
    expect(replay.steps).toHaveLength(2);
    expect(replay.finalDomainState.scores).toEqual(state.scores);
    expect(replay.finalDomainState.flags).toEqual(state.flags);
    expect(replay.finalDomainState.history).toHaveLength(2);
  });
});
