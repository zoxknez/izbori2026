export interface Point2D {
  x: number;
  y: number;
}

/**
 * 2D koordinate stanica i putanja na biračkom mestu.
 * Sve pozicije su usklađene sa vizuelnim elementima PollingStationScene.
 */
export const STATION_WAYPOINTS = {
  entrance: { x: 50, y: 160 },
  hallway_check: { x: 75, y: 160 },

  // Pozicije u redu pre UV stanice
  queue_slots: [
    { x: 110, y: 220 }, // Najbliži UV stanici
    { x: 85, y: 220 },
    { x: 60, y: 220 },
    { x: 35, y: 220 },
  ],

  // Radne stanice
  uv_station: { x: 150, y: 225 },
  identification: { x: 280, y: 225 },
  voter_roll: { x: 360, y: 225 },
  spray: { x: 450, y: 225 },
  receive_ballot: { x: 520, y: 225 },

  // Paravani za glasanje (3 paravana)
  booths: [
    { x: 680, y: 195 },
    { x: 760, y: 195 },
    { x: 840, y: 195 },
  ],

  // Glasačka kutija
  ballot_box: { x: 760, y: 290 },

  // Izlazna vrata
  exit_door: { x: 940, y: 140 },
  outside_left: { x: 1060, y: 140 },
} as const;

/**
 * Pomoćna funkcija za izračunavanje trajanja kretanja (u milisekundama)
 * između dve tačke na osnovu brzine birača (pikseli u sekundi).
 */
export function calculateMoveDurationMs(from: Point2D, to: Point2D, speedPxPerSec: number): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const effectiveSpeed = Math.max(speedPxPerSec, 40); // Minimalna brzina radi glatkoće
  return Math.round((distance / effectiveSpeed) * 1000);
}
