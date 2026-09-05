import { describe, expect, it } from "vitest";
import { validateCounting } from "@/lib/domain/results-validator";
import { applyChoice, availableChoices, createSimulationState, runCountingMode } from "./engine";
import { simulationEvents, SIMULATOR_CHOICE_COUNT, SIMULATOR_EVENT_COUNT, SIMULATOR_RISK_DISTRIBUTION } from "./seed-events";

describe("simulator engine", () => {
  it("ima 30 događaja i 80 odluka", () => {
    expect(SIMULATOR_EVENT_COUNT).toBe(30);
    expect(SIMULATOR_CHOICE_COUNT).toBe(80);
  });

  it("ima planiranu 50/25/15/7/3 raspodelu rizika", () => {
    const actual = Object.fromEntries(Object.keys(SIMULATOR_RISK_DISTRIBUTION).map((band) => [band, simulationEvents.filter((event) => event.riskBand === band).length]));
    expect(actual).toEqual(SIMULATOR_RISK_DISTRIBUTION);
  });

  it("primenjuje efekte, score i prelaz faze kroz odluku", () => {
    const state = createSimulationState(simulationEvents[0]);
    const next = applyChoice(state, simulationEvents[0], simulationEvents[0].choices[0], simulationEvents);
    expect(next.score).toBe(3);
    expect(next.evidence).toBe(1);
    expect(next.history).toHaveLength(1);
    expect(next.currentEventId).toBe("E02");
  });

  it("poziva isti counting validator", () => {
    const input = { R: 100, U: 20, G: 80, B: 80, V: 75, N: 5, listVotes: [75] };
    expect(runCountingMode(input)).toEqual(validateCounting(input));
  });

  it("ne dozvoljava izbor koji ne ispunjava uslov", () => {
    const event = { ...simulationEvents[0], conditions: { requiresFlags: ["missing"] } };
    const state = createSimulationState(simulationEvents[0]);
    expect(availableChoices(event, state)).toHaveLength(0);
    expect(() => applyChoice(state, event, event.choices[0], simulationEvents)).toThrow("nije dostupna");
  });

  it("randomizovani režim bira samo neposećene događaje koji ispunjavaju uslov", () => {
    const state = createSimulationState(simulationEvents[0], "randomized", 17);
    const next = applyChoice(state, simulationEvents[0], simulationEvents[0].choices[0], simulationEvents);
    expect(next.currentEventId).not.toBe("E01");
    expect(next.history).toHaveLength(1);
    expect(simulationEvents.some((event) => event.id === next.currentEventId)).toBeTruthy();
  });
});
