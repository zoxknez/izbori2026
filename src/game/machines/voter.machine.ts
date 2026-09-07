import { setup, assign } from "xstate";

export type VoterStateValue =
  | "outside"
  | "entering"
  | "waiting_in_queue"
  | "at_uv_check"
  | "at_identification"
  | "at_voter_roll"
  | "at_spray"
  | "at_receive_ballot"
  | "at_booth"
  | "at_ballot_box"
  | "exiting"
  | "left_station"
  // Grane scenarija
  | "waiting_resolution";

export interface VoterProfile {
  id: string;
  name: string;
  gender: "m" | "z";
  ageCategory: "young" | "middle" | "senior";
  walkSpeed: number; // pikseli po sekundi
  hasValidDocument: boolean;
  needsAssistance: boolean;
  isRegistered: boolean;
  hasAlreadyVoted: boolean;
  stationWaitTimes: {
    uvCheckMs: number;
    idCheckMs: number;
    voterRollMs: number;
    sprayMs: number;
    receiveBallotMs: number;
    boothMs: number;
    ballotBoxMs: number;
  };
}

export interface VoterMachineContext {
  profile: VoterProfile;
  assignedBoothIndex?: number;
  queueIndex: number;
  ballotReceived: boolean;
  voted: boolean;
  incidentEncountered?: string;
}

export type VoterMachineEvent =
  | { type: "ENTER_STATION" }
  | { type: "JOIN_QUEUE"; queueIndex: number }
  | { type: "ADVANCE_QUEUE"; newQueueIndex: number }
  | { type: "START_UV_CHECK" }
  | { type: "FINISH_UV_CHECK" }
  | { type: "START_IDENTIFICATION" }
  | { type: "FINISH_IDENTIFICATION" }
  | { type: "START_VOTER_ROLL" }
  | { type: "FINISH_VOTER_ROLL" }
  | { type: "START_SPRAY" }
  | { type: "FINISH_SPRAY" }
  | { type: "RECEIVE_BALLOT" }
  | { type: "GO_TO_BOOTH"; boothIndex: number }
  | { type: "FINISH_VOTING" }
  | { type: "GO_TO_BALLOT_BOX" }
  | { type: "INSERT_BALLOT" }
  | { type: "EXIT" }
  | { type: "TRIGGER_INCIDENT"; incidentId: string }
  | { type: "RESOLVE_INCIDENT" };

export function createVoterMachine(profile: VoterProfile) {
  return setup({
    types: {
      context: {} as VoterMachineContext,
      events: {} as VoterMachineEvent,
    },
    actions: {
      setQueueIndex: assign({
        queueIndex: (_, params: { queueIndex: number }) => params.queueIndex,
      }),
      assignBooth: assign({
        assignedBoothIndex: (_, params: { boothIndex: number }) => params.boothIndex,
      }),
      setBallotReceived: assign({
        ballotReceived: true,
      }),
      setVoted: assign({
        voted: true,
      }),
      recordIncident: assign({
        incidentEncountered: (_, params: { incidentId: string }) => params.incidentId,
      }),
    },
  }).createMachine({
    id: `voter-${profile.id}`,
    initial: "outside",
    context: {
      profile,
      queueIndex: -1,
      ballotReceived: false,
      voted: false,
      incidentEncountered: undefined,
    },
    states: {
      outside: {
        on: {
          ENTER_STATION: "entering",
        },
      },
      entering: {
        on: {
          JOIN_QUEUE: {
            target: "waiting_in_queue",
            actions: { type: "setQueueIndex", params: ({ event }) => ({ queueIndex: event.queueIndex }) },
          },
          START_UV_CHECK: "at_uv_check",
        },
      },
      waiting_in_queue: {
        on: {
          ADVANCE_QUEUE: {
            actions: { type: "setQueueIndex", params: ({ event }) => ({ queueIndex: event.newQueueIndex }) },
          },
          START_UV_CHECK: "at_uv_check",
        },
      },
      at_uv_check: {
        on: {
          FINISH_UV_CHECK: "at_identification",
          TRIGGER_INCIDENT: {
            target: "waiting_resolution",
            actions: { type: "recordIncident", params: ({ event }) => ({ incidentId: event.incidentId }) },
          },
        },
      },
      at_identification: {
        on: {
          FINISH_IDENTIFICATION: "at_voter_roll",
          TRIGGER_INCIDENT: {
            target: "waiting_resolution",
            actions: { type: "recordIncident", params: ({ event }) => ({ incidentId: event.incidentId }) },
          },
        },
      },
      at_voter_roll: {
        on: {
          FINISH_VOTER_ROLL: "at_spray",
          TRIGGER_INCIDENT: {
            target: "waiting_resolution",
            actions: { type: "recordIncident", params: ({ event }) => ({ incidentId: event.incidentId }) },
          },
        },
      },
      at_spray: {
        on: {
          FINISH_SPRAY: "at_receive_ballot",
        },
      },
      at_receive_ballot: {
        on: {
          RECEIVE_BALLOT: {
            actions: "setBallotReceived",
          },
          GO_TO_BOOTH: {
            target: "at_booth",
            actions: { type: "assignBooth", params: ({ event }) => ({ boothIndex: event.boothIndex }) },
          },
        },
      },
      at_booth: {
        on: {
          FINISH_VOTING: {
            target: "at_ballot_box",
            actions: "setVoted",
          },
          TRIGGER_INCIDENT: {
            target: "waiting_resolution",
            actions: { type: "recordIncident", params: ({ event }) => ({ incidentId: event.incidentId }) },
          },
        },
      },
      at_ballot_box: {
        on: {
          INSERT_BALLOT: "exiting",
        },
      },
      exiting: {
        on: {
          EXIT: "left_station",
        },
      },
      waiting_resolution: {
        on: {
          RESOLVE_INCIDENT: "exiting",
        },
      },
      left_station: {
        type: "final",
      },
    },
  });
}
