import type { SeededRNG } from "@/game/random/seeded-rng";
import type { VoterProfile } from "@/game/machines/voter.machine";
import { createVoterMachine } from "@/game/machines/voter.machine";
import { createActor, type ActorRefFrom } from "xstate";

const FIRST_NAMES_M = [
  "Marko", "Nikola", "Jovan", "Stefan", "Petar", "Milan", "Miloš", "Dragan",
  "Aleksandar", "Dušan", "Vuk", "Luka", "Filip", "Nemanja", "Đorđe"
];

const FIRST_NAMES_Z = [
  "Milica", "Jelena", "Ana", "Dunja", "Teodora", "Snežana", "Gordana", "Zorica",
  "Marija", "Katarina", "Sara", "Sofija", "Nevena", "Tamara", "Bojana"
];

/**
 * Generiše deterministički skup birača za smenu biračkog mesta.
 */
export function generateVoterPopulation(rng: SeededRNG, count: number = 20): VoterProfile[] {
  const population: VoterProfile[] = [];

  for (let i = 1; i <= count; i++) {
    const isMale = rng.chance(0.5);
    const name = isMale ? rng.pick(FIRST_NAMES_M) : rng.pick(FIRST_NAMES_Z);

    const ageRoll = rng.next();
    const ageCategory = ageRoll < 0.3 ? "young" : ageRoll < 0.7 ? "middle" : "senior";

    // Brzina hoda zavisno od starosti
    const walkSpeed =
      ageCategory === "young"
        ? rng.integer(85, 100)
        : ageCategory === "middle"
          ? rng.integer(70, 85)
          : rng.integer(55, 70);

    population.push({
      id: `voter-${i}`,
      name: `${name} #${i}`,
      gender: isMale ? "m" : "z",
      ageCategory,
      walkSpeed,
      hasValidDocument: true,
      needsAssistance: false,
      isRegistered: true,
      hasAlreadyVoted: false,
      stationWaitTimes: {
        uvCheckMs: rng.integer(1500, 2500),
        idCheckMs: rng.integer(2000, 3000),
        voterRollMs: rng.integer(2000, 3200),
        sprayMs: rng.integer(1400, 2000),
        receiveBallotMs: rng.integer(1400, 2200),
        boothMs: ageCategory === "senior" ? rng.integer(5000, 8000) : rng.integer(3500, 5500),
        ballotBoxMs: rng.integer(1400, 2200),
      },
    });
  }

  return population;
}

export type VoterActor = ActorRefFrom<ReturnType<typeof createVoterMachine>>;

export interface ActiveVoterEntity {
  profile: VoterProfile;
  actor: VoterActor;
  currentStation:
    | "queue"
    | "uv"
    | "identification"
    | "voter_roll"
    | "spray"
    | "receive_ballot"
    | "booth"
    | "ballot_box"
    | "exiting";
  assignedBoothIndex?: number;
  timeAtStationMs: number;
}

/**
 * Upravlja redom, zauzetošću stanica i koordinacijom NPC birača.
 */
export class NPCStationManager {
  private queue: string[] = []; // ID-evi birača koji čekaju u redu
  private stationOccupancy: {
    uv: string | null;
    identification: string | null;
    voter_roll: string | null;
    spray: string | null;
    receive_ballot: string | null;
    booths: [string | null, string | null, string | null];
    ballot_box: string | null;
  } = {
    uv: null,
    identification: null,
    voter_roll: null,
    spray: null,
    receive_ballot: null,
    booths: [null, null, null],
    ballot_box: null,
  };

  private activeVoters = new Map<string, ActiveVoterEntity>();
  private completedVoters = new Set<string>();

  spawnVoter(profile: VoterProfile): ActiveVoterEntity {
    const machine = createVoterMachine(profile);
    const actor = createActor(machine);
    actor.start();

    actor.send({ type: "ENTER_STATION" });

    const entity: ActiveVoterEntity = {
      profile,
      actor,
      currentStation: "queue",
      timeAtStationMs: 0,
    };

    this.activeVoters.set(profile.id, entity);
    this.queue.push(profile.id);
    actor.send({ type: "JOIN_QUEUE", queueIndex: this.queue.length - 1 });

    return entity;
  }

  getActiveVoter(id: string): ActiveVoterEntity | undefined {
    return this.activeVoters.get(id);
  }

  getAllActiveVoters(): ActiveVoterEntity[] {
    return Array.from(this.activeVoters.values());
  }

  getQueuePosition(voterId: string): number {
    return this.queue.indexOf(voterId);
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueueOrder(): string[] {
    return [...this.queue];
  }

  /**
   * Proverava da li ima slobodnog paravana (0, 1, 2).
   */
  getFreeBoothIndex(): number | -1 {
    return this.stationOccupancy.booths.findIndex((b) => b === null);
  }

  /**
   * Logika toka i oslobađanja/zauzeća stanica:
   * Vraća listu preporučenih kretanja birača u ovom koraku.
   */
  updateStationProgress(deltaMs: number): {
    moves: Array<{
      voterId: string;
      from: string;
      to: string;
      boothIndex?: number;
    }>;
    completed: string[];
  } {
    const moves: Array<{ voterId: string; from: string; to: string; boothIndex?: number }> = [];
    const completed: string[] = [];

    // 1. Proveri UV stanicu ako je prazna a red nije prazan
    if (!this.stationOccupancy.uv && this.queue.length > 0) {
      const nextVoterId = this.queue.shift()!;
      const entity = this.activeVoters.get(nextVoterId);
      if (entity) {
        this.stationOccupancy.uv = nextVoterId;
        entity.currentStation = "uv";
        entity.timeAtStationMs = 0;
        entity.actor.send({ type: "START_UV_CHECK" });
        moves.push({ voterId: nextVoterId, from: "queue", to: "uv" });

        // Obavesti preostale u redu da se pomere napred
        this.queue.forEach((qId, idx) => {
          this.activeVoters.get(qId)?.actor.send({ type: "ADVANCE_QUEUE", newQueueIndex: idx });
        });
      }
    }

    // 2. Prolazak kroz aktivne birače po stanicama
    for (const [id, entity] of this.activeVoters.entries()) {
      entity.timeAtStationMs += deltaMs;
      const waitTimes = entity.profile.stationWaitTimes;

      switch (entity.currentStation) {
        case "uv":
          if (entity.timeAtStationMs >= waitTimes.uvCheckMs && !this.stationOccupancy.identification) {
            this.stationOccupancy.uv = null;
            this.stationOccupancy.identification = id;
            entity.currentStation = "identification";
            entity.timeAtStationMs = 0;
            entity.actor.send({ type: "FINISH_UV_CHECK" });
            moves.push({ voterId: id, from: "uv", to: "identification" });
          }
          break;

        case "identification":
          if (entity.timeAtStationMs >= waitTimes.idCheckMs && !this.stationOccupancy.voter_roll) {
            this.stationOccupancy.identification = null;
            this.stationOccupancy.voter_roll = id;
            entity.currentStation = "voter_roll";
            entity.timeAtStationMs = 0;
            entity.actor.send({ type: "FINISH_IDENTIFICATION" });
            moves.push({ voterId: id, from: "identification", to: "voter_roll" });
          }
          break;

        case "voter_roll":
          if (entity.timeAtStationMs >= waitTimes.voterRollMs && !this.stationOccupancy.spray) {
            this.stationOccupancy.voter_roll = null;
            this.stationOccupancy.spray = id;
            entity.currentStation = "spray";
            entity.timeAtStationMs = 0;
            entity.actor.send({ type: "FINISH_VOTER_ROLL" });
            moves.push({ voterId: id, from: "voter_roll", to: "spray" });
          }
          break;

        case "spray":
          if (entity.timeAtStationMs >= waitTimes.sprayMs && !this.stationOccupancy.receive_ballot) {
            this.stationOccupancy.spray = null;
            this.stationOccupancy.receive_ballot = id;
            entity.currentStation = "receive_ballot";
            entity.timeAtStationMs = 0;
            entity.actor.send({ type: "FINISH_SPRAY" });
            moves.push({ voterId: id, from: "spray", to: "receive_ballot" });
          }
          break;

        case "receive_ballot":
          if (entity.timeAtStationMs >= waitTimes.receiveBallotMs) {
            const freeBoothIndex = this.getFreeBoothIndex();
            if (freeBoothIndex !== -1) {
              this.stationOccupancy.receive_ballot = null;
              this.stationOccupancy.booths[freeBoothIndex] = id;
              entity.currentStation = "booth";
              entity.assignedBoothIndex = freeBoothIndex;
              entity.timeAtStationMs = 0;
              entity.actor.send({ type: "RECEIVE_BALLOT" });
              entity.actor.send({ type: "GO_TO_BOOTH", boothIndex: freeBoothIndex });
              moves.push({ voterId: id, from: "receive_ballot", to: "booth", boothIndex: freeBoothIndex });
            }
          }
          break;

        case "booth":
          if (entity.timeAtStationMs >= waitTimes.boothMs && !this.stationOccupancy.ballot_box) {
            const boothIdx = entity.assignedBoothIndex ?? 0;
            this.stationOccupancy.booths[boothIdx] = null;
            this.stationOccupancy.ballot_box = id;
            entity.currentStation = "ballot_box";
            entity.timeAtStationMs = 0;
            entity.actor.send({ type: "FINISH_VOTING" });
            moves.push({ voterId: id, from: "booth", to: "ballot_box" });
          }
          break;

        case "ballot_box":
          if (entity.timeAtStationMs >= waitTimes.ballotBoxMs) {
            this.stationOccupancy.ballot_box = null;
            entity.currentStation = "exiting";
            entity.timeAtStationMs = 0;
            entity.actor.send({ type: "INSERT_BALLOT" });
            moves.push({ voterId: id, from: "ballot_box", to: "exiting" });
          }
          break;

        case "exiting":
          if (entity.timeAtStationMs >= 2000) {
            entity.actor.send({ type: "EXIT" });
            entity.actor.stop();
            this.activeVoters.delete(id);
            this.completedVoters.add(id);
            completed.push(id);
          }
          break;
      }
    }

    return { moves, completed };
  }

  getCompletedCount(): number {
    return this.completedVoters.size;
  }
}
