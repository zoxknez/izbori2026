import { describe, expect, it } from "vitest";
import { calculateMoveDurationMs, STATION_WAYPOINTS } from "./routes";

describe("Milestone 2: Spatial Routes & Waypoints", () => {
  it("STATION_WAYPOINTS sadrži sve definisane stanice", () => {
    expect(STATION_WAYPOINTS.entrance).toBeDefined();
    expect(STATION_WAYPOINTS.uv_station).toBeDefined();
    expect(STATION_WAYPOINTS.identification).toBeDefined();
    expect(STATION_WAYPOINTS.voter_roll).toBeDefined();
    expect(STATION_WAYPOINTS.spray).toBeDefined();
    expect(STATION_WAYPOINTS.receive_ballot).toBeDefined();
    expect(STATION_WAYPOINTS.booths).toHaveLength(3);
    expect(STATION_WAYPOINTS.ballot_box).toBeDefined();
    expect(STATION_WAYPOINTS.exit_door).toBeDefined();
  });

  it("calculateMoveDurationMs tačno računa trajanje na osnovu Euklidske razdaljine", () => {
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 0 };
    const speed = 100; // 100 px/sec

    // Razdaljina 100px / 100px/s = 1s = 1000ms
    const duration = calculateMoveDurationMs(from, to, speed);
    expect(duration).toBe(1000);
  });
});
