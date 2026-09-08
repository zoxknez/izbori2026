import { describe, expect, it } from "vitest";
import { SIMULATION_MODE_PROFILES } from "./simulation-mode-profile";

describe("simulation mode profiles", () => {
  it("changes pressure without changing the legal engine surface", () => {
    expect(SIMULATION_MODE_PROFILES.guided.maxConcurrentIncidents).toBe(2);
    expect(SIMULATION_MODE_PROFILES.realistic.maxConcurrentIncidents).toBe(2);
    expect(SIMULATION_MODE_PROFILES.stress.maxConcurrentIncidents).toBe(3);
    expect(SIMULATION_MODE_PROFILES.guided.incidentTimeoutMultiplier).toBeGreaterThan(1);
    expect(SIMULATION_MODE_PROFILES.stress.incidentTimeoutMultiplier).toBeLessThan(1);
  });
});
