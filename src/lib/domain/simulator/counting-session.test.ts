import { describe, it, expect } from "vitest";
import {
  initializeCountingSession,
  evaluateCountingSession,
} from "./counting-session";
import { createSimulationState } from "./engine";
import { simulationEvents } from "./seed-events";

describe("Milestone 6: Counting Session & Protocol Forensics (validateCounting Parity)", () => {
  it("pravilno sproveden izborni dan rezultira 100% ispravnim Zapisnikom", () => {
    const state = createSimulationState(simulationEvents, {
      role: "clan_odbora",
      mode: "guided",
      randomSeed: 42,
    });

    const session = initializeCountingSession(state, 500);
    expect(session.receivedBallots).toBe(500);
    expect(session.unusedBallots).toBe(180);
    expect(session.votersTurnout).toBe(320);
    expect(session.ballotsInBox).toBe(320);
    expect(session.validBallots! + session.invalidBallots!).toBe(320);
    expect(session.controlListSignedByFirstVoter).toBe(true);

    const evaluation = evaluateCountingSession(session);
    const { countingResult, forensicsResult } = evaluation;

    // Sva 4 pravila prolaze
    expect(countingResult.ruleA.ok).toBe(true);
    expect(countingResult.ruleB.ok).toBe(true);
    expect(countingResult.ruleC.ok).toBe(true);
    expect(countingResult.ruleD.ok).toBe(true);
    expect(countingResult.isEverythingValid).toBe(true);
    expect(countingResult.isAnnulmentFail).toBe(false);
    expect(countingResult.isCalculationFail).toBe(false);

    // Forenzika konstatuje ispravnost
    expect(forensicsResult.status).toBe("correct");
    expect(forensicsResult.title).toContain("Nema utvrđene greške");
  });

  it("odložena posledica: nepravilnost sa kontrolnim listom (E05) dovodi do poništavanja po čl. 116", () => {
    const state = createSimulationState(simulationEvents, {
      role: "clan_odbora",
      mode: "guided",
      randomSeed: 42,
    });
    // Simuliramo flag nastao iz E05-b (kontrolni list ubačen bez potpisa prvog birača)
    state.flags.push("kontrolni-bez-potpisa");

    const session = initializeCountingSession(state, 500);
    expect(session.controlListSignedByFirstVoter).toBe(false);

    const evaluation = evaluateCountingSession(session);
    const { forensicsResult } = evaluation;

    expect(forensicsResult.status).toBe("annulment");
    expect(forensicsResult.article).toBe("Čl. 116. ZINP");
    expect(forensicsResult.findings).toContain("Kontrolni list nije potpisao prvi birač.");
  });

  it("odložena posledica: birač van spiska (E10) stvara višak listića u kutiji (B > G, čl. 116)", () => {
    const state = createSimulationState(simulationEvents, {
      role: "clan_odbora",
      mode: "guided",
      randomSeed: 42,
    });
    // Simuliramo flag iz E10-b (izdat listić mimo biračkog spiska)
    state.flags.push("birac-van-spiska-gladao");

    const session = initializeCountingSession(state, 500);
    expect(session.ballotsInBox).toBeGreaterThan(session.votersTurnout!);

    const evaluation = evaluateCountingSession(session);
    const { countingResult, forensicsResult } = evaluation;

    // Pravilo A pada (B <= G)
    expect(countingResult.ruleA.ok).toBe(false);
    expect(countingResult.isAnnulmentFail).toBe(true);

    expect(forensicsResult.status).toBe("annulment");
    expect(forensicsResult.findings).toContain("Brojevi ukazuju na zakonski osnov iz člana 116.");
  });

  it("računska neusaglašenost zbirnih lista aktivira status teške greške (čl. 110)", () => {
    const state = createSimulationState(simulationEvents, {
      role: "clan_odbora",
      mode: "guided",
      randomSeed: 42,
    });

    const session = initializeCountingSession(state, 500);
    // Veštački unosimo pogrešan zbir glasova lista (manje od važećih)
    session.listVotes = [100, 100, 50]; // 250 umesto 312

    const evaluation = evaluateCountingSession(session);
    const { countingResult, forensicsResult } = evaluation;

    expect(countingResult.ruleD.ok).toBe(false);
    expect(countingResult.isCalculationFail).toBe(true);
    expect(forensicsResult.status).toBe("heavy_error");
    expect(forensicsResult.article).toBe("Čl. 110. ZINP");
  });

  it("zapisnik bez potpisa tri člana BO aktivira status da se rezultat ne može utvrditi (čl. 115)", () => {
    const state = createSimulationState(simulationEvents, {
      role: "posmatrac",
      mode: "guided",
      randomSeed: 42,
    });

    const session = initializeCountingSession(state, 500);
    session.signedByAtLeastThree = false;

    const evaluation = evaluateCountingSession(session);
    const { forensicsResult } = evaluation;

    expect(forensicsResult.status).toBe("result_undetermined");
    expect(forensicsResult.article).toBe("Čl. 115. ZINP");
    expect(forensicsResult.findings).toContain("Zapisnik nisu potpisala najmanje tri člana biračkog odbora.");
  });
});
