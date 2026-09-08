import { describe, expect, it } from "vitest";
import { SeededRNG } from "@/game/random/seeded-rng";
import {
  generateVoterPopulation,
  NPCStationManager,
} from "./npc-system";

describe("Milestone 2: NPC Station Manager & Population Generator", () => {
  it("generateVoterPopulation deterministički generiše profile na osnovu seed-a", () => {
    const seed = 98765432;
    const pop1 = generateVoterPopulation(new SeededRNG(seed), 10);
    const pop2 = generateVoterPopulation(new SeededRNG(seed), 10);

    expect(pop1).toHaveLength(10);
    expect(pop2).toHaveLength(10);
    expect(pop1.map((p) => p.name)).toEqual(pop2.map((p) => p.name));
    expect(pop1.map((p) => p.walkSpeed)).toEqual(pop2.map((p) => p.walkSpeed));
    expect(pop1.map((p) => p.gender)).toEqual(pop2.map((p) => p.gender));
    expect(pop1.map((p) => p.behaviorProfile)).toEqual(pop2.map((p) => p.behaviorProfile));
    expect(pop1.every((p) => {
      const behavior = p.behaviorProfile;
      return Boolean(
        behavior &&
          behavior.patience >= 35 &&
          behavior.patience <= 95 &&
          behavior.awareness >= 40 &&
          behavior.awareness <= 95 &&
          ["normal", "slow", "hurried"].includes(behavior.walkingStyle) &&
          ["routine", "confused", "impatient", "needs_assistance"].includes(behavior.behavior),
      );
    })).toBe(true);
  });

  it("NPCStationManager raspoređuje birače u red i sukcesivno ih vodi kroz stanice", () => {
    const rng = new SeededRNG(42);
    const population = generateVoterPopulation(rng, 3);
    const manager = new NPCStationManager();

    // Spawnovanje 2 birača
    const voter1 = manager.spawnVoter(population[0]);
    const voter2 = manager.spawnVoter(population[1]);

    expect(manager.getAllActiveVoters()).toHaveLength(2);
    expect(manager.getQueuePosition(voter1.profile.id)).toBe(0);
    expect(manager.getQueuePosition(voter2.profile.id)).toBe(1);

    // Prvi korak: UV stanica je slobodna, voter1 ulazi na UV
    const step1 = manager.updateStationProgress(100);
    expect(step1.moves).toContainEqual(
      expect.objectContaining({ voterId: voter1.profile.id, from: "queue", to: "uv" }),
    );
    expect(manager.getQueuePosition(voter2.profile.id)).toBe(0);

    // Simulacija prolaska vremena (npr. 30 sekundi simuliranog rada)
    // Svi koraci treba da napreduju
    let completedCount = 0;
    for (let t = 0; t < 300; t++) {
      const step = manager.updateStationProgress(100);
      completedCount += step.completed.length;
    }

    expect(completedCount).toBeGreaterThanOrEqual(1);
    expect(manager.getCompletedCount()).toBeGreaterThanOrEqual(1);
  });
});
