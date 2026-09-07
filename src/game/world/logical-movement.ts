import type { Point2D } from "./routes";

export interface LogicalMovement {
  from: Point2D;
  to: Point2D;
  startedAtSimulationMs: number;
  durationSimulationMs: number;
}

export function getLogicalMovementPosition(movement: LogicalMovement, simulationTimeMs: number): Point2D {
  const progress = Math.max(
    0,
    Math.min(1, (simulationTimeMs - movement.startedAtSimulationMs) / Math.max(1, movement.durationSimulationMs)),
  );
  return {
    x: movement.from.x + (movement.to.x - movement.from.x) * progress,
    y: movement.from.y + (movement.to.y - movement.from.y) * progress,
  };
}

export function isLogicalMovementComplete(movement: LogicalMovement, simulationTimeMs: number): boolean {
  return simulationTimeMs >= movement.startedAtSimulationMs + movement.durationSimulationMs;
}
