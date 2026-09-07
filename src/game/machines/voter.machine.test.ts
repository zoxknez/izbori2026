import { describe, expect, it } from "vitest";
import { createActor } from "xstate";
import { createVoterMachine, type VoterProfile } from "./voter.machine";

const testProfile: VoterProfile = {
  id: "voter-test-1",
  name: "Petar Petrović",
  gender: "m",
  ageCategory: "middle",
  walkSpeed: 75,
  hasValidDocument: true,
  needsAssistance: false,
  isRegistered: true,
  hasAlreadyVoted: false,
  stationWaitTimes: {
    uvCheckMs: 2000,
    idCheckMs: 2500,
    voterRollMs: 2500,
    sprayMs: 1500,
    receiveBallotMs: 1500,
    boothMs: 4000,
    ballotBoxMs: 2000,
  },
};

describe("Milestone 2: VoterMachine XState 5 Actor", () => {
  it("prolazi kroz regularan tok svih 7 stanica biračkog mesta", () => {
    const machine = createVoterMachine(testProfile);
    const actor = createActor(machine);
    actor.start();

    expect(actor.getSnapshot().value).toBe("outside");

    actor.send({ type: "ENTER_STATION" });
    expect(actor.getSnapshot().value).toBe("entering");

    actor.send({ type: "JOIN_QUEUE", queueIndex: 0 });
    expect(actor.getSnapshot().value).toBe("waiting_in_queue");

    actor.send({ type: "START_UV_CHECK" });
    expect(actor.getSnapshot().value).toBe("at_uv_check");

    actor.send({ type: "FINISH_UV_CHECK" });
    expect(actor.getSnapshot().value).toBe("at_identification");

    actor.send({ type: "FINISH_IDENTIFICATION" });
    expect(actor.getSnapshot().value).toBe("at_voter_roll");

    actor.send({ type: "FINISH_VOTER_ROLL" });
    expect(actor.getSnapshot().value).toBe("at_spray");

    actor.send({ type: "FINISH_SPRAY" });
    expect(actor.getSnapshot().value).toBe("at_receive_ballot");

    actor.send({ type: "RECEIVE_BALLOT" });
    expect(actor.getSnapshot().context.ballotReceived).toBe(true);

    actor.send({ type: "GO_TO_BOOTH", boothIndex: 1 });
    expect(actor.getSnapshot().value).toBe("at_booth");
    expect(actor.getSnapshot().context.assignedBoothIndex).toBe(1);

    actor.send({ type: "FINISH_VOTING" });
    expect(actor.getSnapshot().value).toBe("at_ballot_box");
    expect(actor.getSnapshot().context.voted).toBe(true);

    actor.send({ type: "INSERT_BALLOT" });
    expect(actor.getSnapshot().value).toBe("exiting");

    actor.send({ type: "EXIT" });
    expect(actor.getSnapshot().value).toBe("left_station");

    actor.stop();
  });

  it("omogućava prekid toka scenarijem (npr. neispravna isprava) i razrešenje", () => {
    const machine = createVoterMachine(testProfile);
    const actor = createActor(machine);
    actor.start();

    actor.send({ type: "ENTER_STATION" });
    actor.send({ type: "START_UV_CHECK" });
    actor.send({ type: "FINISH_UV_CHECK" });
    expect(actor.getSnapshot().value).toBe("at_identification");

    // Prekid: problem sa ispravom
    actor.send({ type: "TRIGGER_INCIDENT", incidentId: "invalid_document" });
    expect(actor.getSnapshot().value).toBe("waiting_resolution");
    expect(actor.getSnapshot().context.incidentEncountered).toBe("invalid_document");

    // Razrešenje
    actor.send({ type: "RESOLVE_INCIDENT" });
    expect(actor.getSnapshot().value).toBe("exiting");

    actor.stop();
  });
});
