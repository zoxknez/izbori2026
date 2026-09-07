import { describe, expect, it } from "vitest";
import { createActor } from "xstate";
import {
  createElectionDayMachine,
  evaluateDelayedConsequences,
} from "@/game/machines/election-day.machine";
import { createSimulationState } from "./engine";
import { simulationEvents } from "./seed-events";
import type { EvidenceRecord } from "./live-types";

describe("Milestone 4: Delayed Consequences & Evidence Evaluation", () => {
  it("evaluateDelayedConsequences detektuje zakonski osnov za poništavanje kada je kontrolni list neuredan", () => {
    const baseState = createSimulationState(simulationEvents);
    const stateWithBadControl = {
      ...baseState,
      flags: ["kontrolni-list-neuredan"],
    };

    const analysis = evaluateDelayedConsequences(stateWithBadControl, []);
    expect(analysis.hasAnnulmentRisk).toBe(true);
    expect(analysis.annulmentReasons).toContainEqual(
      expect.stringContaining("Kontrolni list u kutiji nije uredan i potpisan"),
    );
    expect(analysis.documentationWeakness).toBe(true);
  });

  it("evaluateDelayedConsequences detektuje poništavanje glasanja kada je glasalo lice van biračkog spiska", () => {
    const baseState = createSimulationState(simulationEvents);
    const stateWithBadVoter = {
      ...baseState,
      flags: ["glasao-van-izvoda"],
    };

    const analysis = evaluateDelayedConsequences(stateWithBadVoter, []);
    expect(analysis.hasAnnulmentRisk).toBe(true);
    expect(analysis.annulmentReasons).toContainEqual(
      expect.stringContaining("Birač koji nije upisan u izvod je glasao"),
    );
  });

  it("evaluateDelayedConsequences nagrađuje kvalitetan dokazni trag sa činjenicama i svedocima", () => {
    const baseState = createSimulationState(simulationEvents);
    const solidEvidence: EvidenceRecord[] = [
      {
        id: "ev-1",
        simulationTimeMs: 25000000,
        timestamp: "07:38",
        locationId: "uv-station",
        observedFacts: ["Član biračkog odbora #2 je propustio birača bez UV lampe"],
        assumptions: ["Žurio je jer je birač bio nestrpljiv"],
        witnesses: ["Predsednik biračkog odbora", "Posmatrač #1"],
        relatedRuleIds: ["I01"],
        createdByRole: "posmatrac",
        source: "manual",
        completeness: { time: true, location: true, facts: true, witnesses: true },
      },
    ];

    const analysis = evaluateDelayedConsequences(baseState, solidEvidence);
    expect(analysis.hasAnnulmentRisk).toBe(false);
    expect(analysis.documentationWeakness).toBe(false);
  });

  it("ElectionDayMachine automatski prebacuje istekli incident u missedIncidents", () => {
    // Postavljamo sat na 06:14, incident E01 se okida u 06:15 sa trajanjem 45s (45000ms)
    const machine = createElectionDayMachine({ startTime: "06:14" });
    const actor = createActor(machine);
    actor.start();

    // 1. Minut prolazi (60s real = 360 sim sekundi): okida se 06:15
    actor.send({ type: "TICK", deltaRealMs: 10000 }); // napreduje 60s simulaciono
    const snap1 = actor.getSnapshot().context;
    // Incident E01 je aktivan
    expect(snap1.activeIncidents.some((i) => i.eventId === "E01")).toBe(true);

    // 2. Prolazi vreme veće od timeout-a (npr. 50 realnih sekundi = 300 sim sekundi) bez reakcije igrača
    actor.send({ type: "TICK", deltaRealMs: 50000 });
    const snap2 = actor.getSnapshot().context;

    // Incident je uklonjen iz aktivnih i prebačen u missedIncidents
    expect(snap2.activeIncidents.some((i) => i.eventId === "E01")).toBe(false);
    expect(snap2.missedIncidents.some((i) => i.eventId === "E01")).toBe(true);

    // Domain state je primenio timeout izbor E01-c (propaganda-ostala)
    expect(snap2.domainState.flags).toContain("propaganda-ostala");

    actor.stop();
  });
});
