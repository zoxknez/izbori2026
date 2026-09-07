import { describe, expect, it } from "vitest";
import { COUNTING_WORKFLOW_STEPS, nextCountingWorkflowStep } from "@/game/world/counting-workflow";

describe("counting presentation workflow", () => {
  it("advances only in the authored visual order", () => {
    expect(COUNTING_WORKFLOW_STEPS).toHaveLength(6);
    expect(nextCountingWorkflowStep(0, "counting-box-ballots")).toBe(0);
    expect(nextCountingWorkflowStep(0, "counting-unused")).toBe(1);
    expect(nextCountingWorkflowStep(5, "counting-protocol")).toBe(6);
  });
});
