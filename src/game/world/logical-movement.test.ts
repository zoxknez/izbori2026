import { describe, expect, it } from "vitest";
import { getLogicalMovementPosition, isLogicalMovementComplete, type LogicalMovement } from "./logical-movement";

describe("logical movement", () => {
  const movement: LogicalMovement = {
    from: { x: 0, y: 10 },
    to: { x: 100, y: 50 },
    startedAtSimulationMs: 1_000,
    durationSimulationMs: 2_000,
  };

  it("derives the same position from the same simulation instant", () => {
    expect(getLogicalMovementPosition(movement, 2_000)).toEqual({ x: 50, y: 30 });
    expect(getLogicalMovementPosition(movement, 2_000)).toEqual(getLogicalMovementPosition(movement, 2_000));
    expect(isLogicalMovementComplete(movement, 2_999)).toBe(false);
    expect(isLogicalMovementComplete(movement, 3_000)).toBe(true);
  });

  it("does not advance before its logical start, which preserves pause/restore parity", () => {
    expect(getLogicalMovementPosition(movement, 900)).toEqual(movement.from);
  });
});
