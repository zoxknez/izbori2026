import { describe, expect, it } from "vitest";
import { createActor } from "xstate";
import { createElectionDayMachine } from "./election-day.machine";

describe("Milestone 1: ElectionDayMachine (XState 5)", () => {
  it("inicijalizuje se u stanju pre_opening sa 06:00 satom i početnim domain state-om", () => {
    const machine = createElectionDayMachine({ role: "clan_odbora", startTime: "06:00" });
    const actor = createActor(machine);
    actor.start();

    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe("pre_opening");
    expect(snapshot.context.domainState.role).toBe("clan_odbora");
    expect(snapshot.context.paused).toBe(false);
    expect(snapshot.context.speed).toBe(1);
    expect(snapshot.context.evidenceNotebook).toHaveLength(0);

    actor.stop();
  });

  it("TICK unapređuje simulaciono vreme i reaguje na brzinu i pauzu", () => {
    const machine = createElectionDayMachine({ startTime: "06:00" });
    const actor = createActor(machine);
    actor.start();

    const initialMs = actor.getSnapshot().context.simulationTimeMs;

    // TICK od 1000ms realnog vremena pri 1x brzini (6 sim sekundi = 6000ms)
    actor.send({ type: "TICK", deltaRealMs: 1000 });
    expect(actor.getSnapshot().context.simulationTimeMs).toBe(initialMs + 6000);

    // Promena brzine na 2x
    actor.send({ type: "SET_SPEED", speed: 2 });
    actor.send({ type: "TICK", deltaRealMs: 1000 });
    expect(actor.getSnapshot().context.simulationTimeMs).toBe(initialMs + 6000 + 12000);

    // Pauziranje
    actor.send({ type: "TOGGLE_PAUSE" });
    expect(actor.getSnapshot().context.paused).toBe(true);
    const pausedMs = actor.getSnapshot().context.simulationTimeMs;

    actor.send({ type: "TICK", deltaRealMs: 2000 });
    expect(actor.getSnapshot().context.simulationTimeMs).toBe(pausedMs);

    actor.stop();
  });

  it("TRIGGER_WORLD_ACTION ažurira domainState preko resolveChoice i upisuje u actionLog", () => {
    const machine = createElectionDayMachine({ role: "clan_odbora" });
    const actor = createActor(machine);
    actor.start();

    // Reagovanje na plakat u hodniku (E01-a)
    actor.send({
      type: "TRIGGER_WORLD_ACTION",
      eventId: "E01",
      choiceId: "E01-a",
      worldActionId: "remove_poster_now",
    });

    const ctx = actor.getSnapshot().context;
    expect(ctx.domainState.scores.procedure).toBe(3);
    expect(ctx.domainState.scores.documentation).toBe(2);
    expect(ctx.domainState.flags).toContain("propaganda-uklonjena");
    expect(ctx.actionLog).toHaveLength(1);
    expect(ctx.actionLog[0].type).toBe("world_action");
    expect(ctx.actionLog[0].eventId).toBe("E01");

    actor.stop();
  });

  it("ADD_EVIDENCE dodaje strukturirani dokaz i beleži unos u actionLog", () => {
    const machine = createElectionDayMachine({ role: "posmatrac" });
    const actor = createActor(machine);
    actor.start();

    actor.send({
      type: "ADD_EVIDENCE",
      record: {
        id: "ev-test-1",
        simulationTimeMs: 21600000,
        timestamp: "06:00",
        locationId: "entrance",
        observedFacts: ["Plakat u hodniku"],
        assumptions: [],
        witnesses: ["Posmatrač #1"],
        relatedRuleIds: ["P12"],
        createdByRole: "posmatrac",
        source: "manual",
        completeness: { time: true, location: true, facts: true, witnesses: true },
      },
    });

    const ctx = actor.getSnapshot().context;
    expect(ctx.evidenceNotebook).toHaveLength(1);
    expect(ctx.evidenceNotebook[0].id).toBe("ev-test-1");
    expect(ctx.actionLog).toHaveLength(1);
    expect(ctx.actionLog[0].type).toBe("evidence_recorded");

    actor.stop();
  });

  it("CHANGE_ROLE menja ulogu i evidentira promenu u actionLog", () => {
    const machine = createElectionDayMachine({ role: "clan_odbora" });
    const actor = createActor(machine);
    actor.start();

    expect(actor.getSnapshot().context.domainState.role).toBe("clan_odbora");

    actor.send({ type: "CHANGE_ROLE", role: "posmatrac" });
    expect(actor.getSnapshot().context.domainState.role).toBe("posmatrac");
    expect(actor.getSnapshot().context.actionLog.some((a) => a.type === "role_change")).toBe(true);

    actor.send({ type: "CHANGE_ROLE", role: "birac" });
    expect(actor.getSnapshot().context.domainState.role).toBe("birac");

    actor.stop();
  });

  it("TRIGGER_WORLD_ACTION odbija radnju ako je rezervisana za drugu ulogu", () => {
    const machine = createElectionDayMachine({ role: "posmatrac" });
    const actor = createActor(machine);
    actor.start();

    // Posmatrač pokušava akciju rezervisana samo za člana odbora (remove_poster_board)
    actor.send({
      type: "TRIGGER_WORLD_ACTION",
      eventId: "E01",
      choiceId: "E01-a",
      worldActionId: "remove_poster_board",
    });

    const ctx = actor.getSnapshot().context;
    // Nije trebalo da se promeni skor niti primeni akcija
    expect(ctx.actionLog.filter((a) => a.type === "world_action")).toHaveLength(0);

    // Ali posmatračka akcija alert_board_poster_observer prolazi
    actor.send({
      type: "TRIGGER_WORLD_ACTION",
      eventId: "E01",
      choiceId: "E01-a",
      worldActionId: "alert_board_poster_observer",
    });

    const ctxAfter = actor.getSnapshot().context;
    expect(ctxAfter.actionLog.filter((a) => a.type === "world_action")).toHaveLength(1);

    actor.stop();
  });

  it("START_COUNTING i SIGN_PROTOCOL orkestriraju prelazak na 20:00 i overu Zapisnika", () => {
    const machine = createElectionDayMachine({ role: "clan_odbora", startTime: "06:00" });
    const actor = createActor(machine);
    actor.start();

    expect(actor.getSnapshot().context.currentPhase).toBe("pre_opening");
    expect(actor.getSnapshot().context.countingSession).toBeUndefined();

    // Pokrećemo brojanje (zatvaranje u 20:00)
    actor.send({ type: "START_COUNTING" });

    const countingSnapshot = actor.getSnapshot();
    expect(countingSnapshot.context.currentPhase).toBe("counting");
    expect(countingSnapshot.context.simulationTimeMs).toBeGreaterThanOrEqual(72000000); // 20:00
    expect(countingSnapshot.context.countingSession).toBeDefined();
    expect(countingSnapshot.context.countingSession?.receivedBallots).toBe(500);
    expect(countingSnapshot.context.actionLog.some((a) => a.type === "phase_change")).toBe(true);

    // Overa zapisnika
    actor.send({ type: "SIGN_PROTOCOL" });

    const signedSnapshot = actor.getSnapshot();
    expect(signedSnapshot.context.countingSession?.isProtocolSigned).toBe(true);
    expect(signedSnapshot.context.countingSession?.signedByAtLeastThree).toBe(true);
    expect(signedSnapshot.context.actionLog.some((a) => a.type === "protocol_signed")).toBe(true);

    actor.stop();
  });
});

