import { describe, expect, it } from "vitest";
import { getWorldIncidentPresentation } from "./world-incident-presentation";

describe("world incident presentation", () => {
  it("maps authored incidents to spatial presentation without legal logic", () => {
    const presentation = getWorldIncidentPresentation({
      instanceId: "E01-1", eventId: "E01", locationId: "entrance",
      binding: {} as never, spawnedAtSimulationTimeMs: 25200000, isInspected: false,
    });
    expect(presentation.visual.kind).toBe("prop");
    expect(presentation.visual.anchor).toEqual({ x: 50, y: 95 });
    expect(presentation.attention.awareness).toBe("medium");
  });

  it("provides a neutral fallback for a new authored event", () => {
    const presentation = getWorldIncidentPresentation({
      instanceId: "new-1", eventId: "NEW", locationId: "unknown",
      binding: {} as never, spawnedAtSimulationTimeMs: 0, isInspected: false,
    });
    expect(presentation.visual.kind).toBe("overlay_marker");
    expect(presentation.attention.awareness).toBe("low");
  });
});
