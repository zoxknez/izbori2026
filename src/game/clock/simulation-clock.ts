import type { ActiveIncident } from "@/lib/domain/simulator/live-types";

/**
 * Pomoćne funkcije za upravljanje vremenom u simulaciji biračkog dana.
 * Vreme ne koristi real-time setTimeout, već simulacione milisekunde
 * koje napreduju kroz diskretne TICK poruke u zavisnosti od brzine (1x, 2x, 4x) i pauze.
 */

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

/**
 * Pretvara vreme formata "HH:MM" u simulacione milisekunde od početka dana (00:00).
 */
export function timeStringToMs(timeString: string): number {
  const parts = timeString.split(":");
  const hours = parseInt(parts[0] ?? "0", 10);
  const minutes = parseInt(parts[1] ?? "0", 10);
  return hours * MS_PER_HOUR + minutes * MS_PER_MINUTE;
}

/**
 * Pretvara simulacione milisekunde u format "HH:MM".
 */
export function msToTimeString(ms: number): string {
  const totalMinutes = Math.floor(ms / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const hh = hours.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export type SimulationSpeed = 1 | 2 | 4;

export interface ClockTickOptions {
  currentMs: number;
  deltaRealMs: number;
  /**
   * Koliko simulacionih sekundi prođe za jednu realnu sekundu pri 1x brzini.
   * Podrazumevano: 6 simulacionih sekundi za 1 realnu sekundu (1 minut smene = 10 realnih sekundi).
   */
  simulationRatio?: number;
  speed: SimulationSpeed;
  paused: boolean;
}

/**
 * Izračunava novo simulaciono vreme nakon realnog vremenskog koraka.
 */
export function tickClock(options: ClockTickOptions): number {
  if (options.paused) {
    return options.currentMs;
  }
  const ratio = options.simulationRatio ?? 6;
  const deltaSimulationMs = options.deltaRealMs * ratio * options.speed;
  return options.currentMs + Math.round(deltaSimulationMs);
}

/**
 * Pronalazi sve aktivne incidente kojima je isteklo vreme za reakciju.
 */
export function findExpiredIncidents(
  activeIncidents: readonly ActiveIncident[],
  currentSimulationMs: number,
): ActiveIncident[] {
  return activeIncidents.filter(
    (incident) =>
      incident.expiresAtSimulationTimeMs !== undefined &&
      incident.expiresAtSimulationTimeMs <= currentSimulationMs,
  );
}
