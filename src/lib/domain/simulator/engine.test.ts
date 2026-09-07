import { describe, expect, it } from "vitest";
import { validateCounting } from "@/lib/domain/results-validator";
import {
  applyChoice,
  availableChoices,
  computeDebrief,
  createSimulationState,
  eventsForRole,
  runCountingMode,
} from "./engine";
import { simulationEvents, SIMULATOR_CHOICE_COUNT, SIMULATOR_EVENT_COUNT, SIMULATOR_RISK_SHARE } from "./seed-events";
import type { SimulationEvent, SimulationRole } from "./types";

function eventById(id: string): SimulationEvent {
  const event = simulationEvents.find((candidate) => candidate.id === id);
  if (!event) throw new Error(`Nepoznat događaj ${id}`);
  return event;
}

/** Odigra ceo dan biranjem prve dostupne odluke u svakom događaju. */
function playThrough(role: SimulationRole, choicePicker: (choices: ReturnType<typeof availableChoices>) => number = () => 0) {
  let state = createSimulationState(simulationEvents, { role });
  let guard = 0;
  while (!state.finished && guard < 200) {
    const event = eventById(state.currentEventId);
    const choices = availableChoices(event, state);
    state = applyChoice(state, event, choices[choicePicker(choices)], simulationEvents);
    guard += 1;
  }
  return state;
}

describe("simulator sadržaj", () => {
  it("pokriva ceo birački dan sa autorskim događajima i odlukama", () => {
    expect(SIMULATOR_EVENT_COUNT).toBeGreaterThanOrEqual(40);
    expect(SIMULATOR_CHOICE_COUNT).toBeGreaterThanOrEqual(100);
  });

  it("drži realističnu raspodelu rizika: većina dana je redovna procedura", () => {
    expect(SIMULATOR_RISK_SHARE.routine ?? 0).toBeGreaterThanOrEqual(15);
    expect(SIMULATOR_RISK_SHARE.criminal ?? 0).toBeLessThanOrEqual(20);
    expect(SIMULATOR_RISK_SHARE.annulment ?? 0).toBeLessThanOrEqual(15);
  });

  it("svaki događaj ima vreme, pravni osnov i obrazloženje za svaku odluku", () => {
    for (const event of simulationEvents) {
      expect(event.time).toMatch(/^\d{2}:\d{2}$/);
      expect(event.choices.length).toBeGreaterThanOrEqual(2);
      for (const choice of event.choices) {
        expect(choice.ruleIds.length).toBeGreaterThan(0);
        expect(choice.explanation.length).toBeGreaterThan(30);
      }
    }
  });

  it("hronološki je uređen po satu unutar autorskog toka", () => {
    const boardTimes = eventsForRole(simulationEvents, "clan_odbora").map((event) => event.time);
    expect([...boardTimes].sort((a, b) => a.localeCompare(b))).toEqual(boardTimes);
  });
});

describe("simulator engine", () => {
  it("filtrira događaje po ulozi: birač ne prolazi kroz odluke biračkog odbora", () => {
    const boardEvents = eventsForRole(simulationEvents, "clan_odbora");
    const voterEvents = eventsForRole(simulationEvents, "birac");
    expect(boardEvents.length).toBeGreaterThan(voterEvents.length);
    expect(voterEvents.every((event) => event.id.startsWith("B"))).toBe(true);
    expect(boardEvents.some((event) => event.id === "E05")).toBe(true);
    expect(voterEvents.some((event) => event.id === "E05")).toBe(false);
  });

  it("primenjuje efekte po kategorijama i beleži klasifikaciju odluke", () => {
    const state = createSimulationState(simulationEvents, { role: "clan_odbora" });
    const event = eventById(state.currentEventId);
    const next = applyChoice(state, event, event.choices[0], simulationEvents);
    expect(next.scores.procedure).toBeGreaterThan(0);
    expect(next.history[0].classification).toBe("correct");
    expect(next.flags).toContain("propaganda-uklonjena");
    expect(next.clock).not.toBe(state.clock);
  });

  it("udvostručuje kaznu u teškom režimu", () => {
    const event = eventById("E01");
    const wrong = event.choices.find((choice) => choice.classification === "wrong")!;
    const normal = applyChoice(createSimulationState(simulationEvents, { mode: "guided" }), event, wrong, simulationEvents);
    const hard = applyChoice(createSimulationState(simulationEvents, { mode: "hard" }), event, wrong, simulationEvents);
    expect(hard.scores.procedure).toBeLessThan(normal.scores.procedure);
  });

  it("odluka iz 14:13 menja koji se događaj zapisnika uopšte pojavljuje", () => {
    const withRecord = createSimulationState(simulationEvents, { role: "clan_odbora" });
    withRecord.flags = ["incident-evidentiran"];
    withRecord.phase = "zapisnik";
    expect(availableChoices(eventById("E33"), withRecord).length).toBeGreaterThan(0);
    expect(availableChoices(eventById("E34"), withRecord)).toHaveLength(0);

    const withoutRecord = createSimulationState(simulationEvents, { role: "clan_odbora" });
    withoutRecord.phase = "zapisnik";
    expect(availableChoices(eventById("E33"), withoutRecord)).toHaveLength(0);
    expect(availableChoices(eventById("E34"), withoutRecord).length).toBeGreaterThan(0);
  });

  it("ne dozvoljava odluku koja ne ispunjava uslov", () => {
    const state = createSimulationState(simulationEvents, { role: "clan_odbora" });
    const event = { ...eventById("E01"), conditions: { requiresFlags: ["nepostojeci-flag"] } };
    expect(availableChoices(event, state)).toHaveLength(0);
    expect(() => applyChoice(state, event, event.choices[0], simulationEvents)).toThrow("nije dostupna");
  });

  it("završava vođeni tok i računa debrief po kategorijama", () => {
    const state = playThrough("clan_odbora");
    expect(state.finished).toBe(true);
    expect(state.history.length).toBeGreaterThan(30);

    const debrief = computeDebrief(state);
    expect(debrief.totalPercentage).toBeGreaterThan(60);
    expect(debrief.categories.some((category) => category.max > 0)).toBe(true);
    expect(debrief.handledWell.length).toBeGreaterThan(0);
  });

  it("loše odluke spuštaju rezultat i pune listu za ponavljanje", () => {
    const state = playThrough("clan_odbora", (choices) => choices.length - 1);
    const debrief = computeDebrief(state);
    expect(debrief.mistakes.length).toBeGreaterThan(0);
    expect(debrief.rulesToReview.length).toBeGreaterThan(0);
    expect(debrief.totalPercentage).toBeLessThan(50);
  });

  it("randomizovani režim ne ponavlja isti događaj", () => {
    let state = createSimulationState(simulationEvents, { role: "clan_odbora", mode: "randomized", randomSeed: 17 });
    const seen = new Set<string>();
    let guard = 0;
    while (!state.finished && guard < 200) {
      expect(seen.has(state.currentEventId)).toBe(false);
      seen.add(state.currentEventId);
      const event = eventById(state.currentEventId);
      state = applyChoice(state, event, availableChoices(event, state)[0], simulationEvents);
      guard += 1;
    }
    expect(state.finished).toBe(true);
  });

  it("režim ponavljanja grešaka prolazi samo kroz zadate događaje", () => {
    const state = createSimulationState(simulationEvents, { role: "clan_odbora", onlyEventIds: ["E10", "E19"] });
    expect(state.currentEventId).toBe("E10");
    const next = applyChoice(state, eventById("E10"), eventById("E10").choices[0], simulationEvents);
    expect(next.currentEventId).toBe("E19");
  });

  it("counting mode koristi isti validator kao javni validator zapisnika", () => {
    const event = simulationEvents.find((candidate) => candidate.counting)!;
    expect(event.counting).toBeDefined();
    expect(runCountingMode(event.counting!)).toEqual(validateCounting(event.counting!));
    expect(runCountingMode(event.counting!).isAnnulmentFail).toBe(true);
  });
});
