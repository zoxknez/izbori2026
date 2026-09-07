import { describe, expect, it } from "vitest";
import {
  advanceToNextEvent,
  applyChoice,
  createSimulationState,
  resolveChoice,
} from "./engine";
import { simulationEvents } from "./seed-events";
import {
  validateIncidentBindings,
  WORLD_INCIDENT_BINDINGS,
} from "./incident-binding";
import { SeededRNG } from "@/game/random/seeded-rng";
import {
  findExpiredIncidents,
  msToTimeString,
  tickClock,
  timeStringToMs,
} from "@/game/clock/simulation-clock";
import type { ActiveIncident } from "./live-types";

function getEvent(id: string) {
  const event = simulationEvents.find((e) => e.id === id);
  if (!event) throw new Error(`Događaj ${id} nije pronađen.`);
  return event;
}

describe("Milestone 0: Domain readiness for live concurrent simulation", () => {
  it("resolveChoice primenjuje efekte identično kao applyChoice, ali bez promene događaja", () => {
    const state = createSimulationState(simulationEvents, { role: "clan_odbora" });
    const e01 = getEvent("E01");
    const choice = e01.choices[0]; // E01-a (correct)

    const resolved = resolveChoice(state, e01, choice);

    // Odluka je primenjena
    expect(resolved.scores.procedure).toBe(3);
    expect(resolved.scores.documentation).toBe(2);
    expect(resolved.evidence).toBe(1);
    expect(resolved.flags).toContain("propaganda-uklonjena");
    expect(resolved.history).toHaveLength(1);
    expect(resolved.history[0].choiceId).toBe("E01-a");

    // Ali currentEventId i sat još uvek NISU automatski pomereni
    expect(resolved.currentEventId).toBe(state.currentEventId);
    expect(resolved.clock).toBe(state.clock);

    // advanceToNextEvent dovršava prelazak u sekvencijalnom režimu
    const e02 = getEvent("E02");
    const advanced = advanceToNextEvent(resolved, e02);
    expect(advanced.currentEventId).toBe("E02");
    expect(advanced.clock).toBe(e02.time);
  });

  it("dva istovremena (paralelna) incidenta mogu da se razreše u proizvoljnom redosledu", () => {
    const e01 = getEvent("E01");
    const e02 = getEvent("E02");
    const choice01 = e01.choices[0]; // E01-a: procedure +3, doc +2, flag: propaganda-uklonjena
    const choice02 = e02.choices[0]; // E02-a: procedure +3, doc +1

    // Redosled A: E01 pa E02
    const stateA = createSimulationState(simulationEvents, { role: "clan_odbora" });
    const resolvedA1 = resolveChoice(stateA, e01, choice01);
    const resolvedA2 = resolveChoice(resolvedA1, e02, choice02);

    // Redosled B: E02 pa E01
    const stateB = createSimulationState(simulationEvents, { role: "clan_odbora" });
    const resolvedB1 = resolveChoice(stateB, e02, choice02);
    const resolvedB2 = resolveChoice(resolvedB1, e01, choice01);

    // Obe putanje daju identične krajnje rezultate i flagove
    expect(resolvedA2.scores.procedure).toBe(resolvedB2.scores.procedure);
    expect(resolvedA2.scores.documentation).toBe(resolvedB2.scores.documentation);
    expect(resolvedA2.flags).toEqual(expect.arrayContaining(["propaganda-uklonjena"]));
    expect(resolvedB2.flags).toEqual(expect.arrayContaining(["propaganda-uklonjena"]));
    expect(resolvedA2.evidence).toBe(resolvedB2.evidence);
  });

  it("istek vremena incidenta (timeout) se mapira na autorski choiceId bez sintetičkih kazni", () => {
    const state = createSimulationState(simulationEvents, { role: "clan_odbora" });
    const bindingE07 = WORLD_INCIDENT_BINDINGS.E07;
    expect(bindingE07).toBeDefined();
    expect(bindingE07.timeout).toBeDefined();

    const e07 = getEvent("E07");
    const timeoutChoiceId = bindingE07.timeout!.choiceId;
    const authorChoice = e07.choices.find((c) => c.id === timeoutChoiceId);
    expect(authorChoice).toBeDefined();

    // Razrešavanje propuštenog incidenta kroz njegov definisani timeout izbor
    const resolved = resolveChoice(state, e07, authorChoice!);
    expect(resolved.flags).toContain("uv-preskakana");
    expect(resolved.scores.procedure).toBe(-3);
  });

  it("sva autorska mapiranja u incident-binding.ts su validna i referenciraju postojeće entitete", () => {
    const result = validateIncidentBindings();
    expect(result.valid, `Greške u incident bindings: ${result.errors.join("; ")}`).toBe(true);
    expect(result.errors).toHaveLength(0);

    // Potvrda da su pokriveni E01 do E30
    const expectedEvents = Array.from({ length: 30 }, (_, i) => `E${String(i + 1).padStart(2, "0")}`);
    for (const id of expectedEvents) {
      expect(WORLD_INCIDENT_BINDINGS[id], `Binding za ${id} mora postojati`).toBeDefined();
    }
  });

  it("E08 razlikuje dozvoljene akcije za posmatrača i člana biračkog odbora", () => {
    const bindingE08 = WORLD_INCIDENT_BINDINGS.E08;
    expect(bindingE08).toBeDefined();

    const observerActions = bindingE08.actions.filter(
      (a) => !a.requiredRole || a.requiredRole === "posmatrac",
    );
    const boardActions = bindingE08.actions.filter(
      (a) => !a.requiredRole || a.requiredRole === "clan_odbora",
    );

    // Posmatrač ima pravo na prigovor (E08-b), ali ne sme da izda listić bez isprave (E08-c)
    expect(observerActions.some((a) => a.choiceId === "E08-b")).toBe(true);
    expect(observerActions.some((a) => a.choiceId === "E08-c")).toBe(false);

    // Član odbora može da izda listić na poverenje (E08-c) ili traži ispravu (E08-a), ali ne unosi posmatrački prigovor (E08-b)
    expect(boardActions.some((a) => a.choiceId === "E08-c")).toBe(true);
    expect(boardActions.some((a) => a.choiceId === "E08-b")).toBe(false);
  });

  it("SeededRNG obezbeđuje determinističku ponovljivost i serijalizaciju stanja", () => {
    const seed = 12345678;
    const rng1 = new SeededRNG(seed);
    const rng2 = new SeededRNG(seed);

    // Dva generatora sa istim seed-om daju identične brojeve
    const values1 = [rng1.next(), rng1.integer(1, 100), rng1.next()];
    const values2 = [rng2.next(), rng2.integer(1, 100), rng2.next()];
    expect(values1).toEqual(values2);

    // Save/restore stanja
    const savedState = rng1.getState();
    const nextVal1 = rng1.next();

    const rngRestored = new SeededRNG(0);
    rngRestored.setState(savedState);
    const nextValRestored = rngRestored.next();

    expect(nextVal1).toBe(nextValRestored);
  });

  it("simulacioni sat ispravno pretvara vreme, računa korake i detektuje istekle incidente", () => {
    const ms0615 = timeStringToMs("06:15");
    expect(msToTimeString(ms0615)).toBe("06:15");

    const ms2000 = timeStringToMs("20:00");
    expect(msToTimeString(ms2000)).toBe("20:00");

    // Pauzirani sat ne napreduje
    const pausedMs = tickClock({
      currentMs: ms0615,
      deltaRealMs: 1000,
      speed: 1,
      paused: true,
    });
    expect(pausedMs).toBe(ms0615);

    // Sat sa 1x brzinom i podrazumevanim odnosom (1s real = 6s sim)
    const ticked1x = tickClock({
      currentMs: ms0615,
      deltaRealMs: 1000,
      speed: 1,
      paused: false,
    });
    expect(ticked1x).toBe(ms0615 + 6000);

    // Sat sa 2x brzinom
    const ticked2x = tickClock({
      currentMs: ms0615,
      deltaRealMs: 1000,
      speed: 2,
      paused: false,
    });
    expect(ticked2x).toBe(ms0615 + 12000);

    // Detekcija isteklih incidenata
    const sampleIncident: ActiveIncident = {
      instanceId: "inc-1",
      eventId: "E01",
      binding: WORLD_INCIDENT_BINDINGS.E01,
      spawnedAtSimulationTimeMs: ms0615,
      expiresAtSimulationTimeMs: ms0615 + 30000,
      locationId: "entrance",
      isInspected: false,
    };

    // Pre isteka
    expect(findExpiredIncidents([sampleIncident], ms0615 + 10000)).toHaveLength(0);
    // Nakon isteka
    expect(findExpiredIncidents([sampleIncident], ms0615 + 35000)).toEqual([sampleIncident]);
  });
});
