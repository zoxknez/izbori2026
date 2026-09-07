import { describe, expect, it } from "vitest";
import { buildDebriefTimeline } from "./debrief-timeline";

describe("debrief timeline", () => {
  it("combines actions, evidence and missed incidents in simulation order", () => {
    const timeline = buildDebriefTimeline(
      [{ id: "a", simulationTimeMs: 200, timestamp: "07:00", type: "world_action", eventId: "E01", details: "Uklonjeno" }],
      [{ id: "e1", simulationTimeMs: 300, timestamp: "07:01", locationId: "entrance", observedFacts: ["plakat"], assumptions: [], witnesses: [], relatedRuleIds: [], createdByRole: "posmatrac", source: "manual", completeness: { time: true, location: true, facts: true, witnesses: false } }],
      [{ instanceId: "E02-1", eventId: "E02", locationId: "board-table", binding: { timeout: { label: "isteklo" } } as never, spawnedAtSimulationTimeMs: 100, expiresAtSimulationTimeMs: 400, isInspected: false }],
    );
    expect(timeline.map((entry) => entry.kind)).toEqual(["action", "evidence", "timeout"]);
    expect(timeline[2].label).toContain("E02");
  });
});
