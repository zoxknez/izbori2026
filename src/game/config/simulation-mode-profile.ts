export type LiveSimulationMode = "guided" | "realistic" | "stress";

export interface SimulationModeProfile {
  maxConcurrentIncidents: number;
  incidentTimeoutMultiplier: number;
  showWorldHints: boolean;
  showDirectFocusCue: boolean;
}

/**
 * Mode changes pressure and presentation only. It must never alter authored
 * choices, legal rules, or the result returned by the domain engine.
 */
export const SIMULATION_MODE_PROFILES: Record<LiveSimulationMode, SimulationModeProfile> = {
  guided: {
    maxConcurrentIncidents: 1,
    incidentTimeoutMultiplier: 1.35,
    showWorldHints: true,
    showDirectFocusCue: true,
  },
  realistic: {
    maxConcurrentIncidents: 2,
    incidentTimeoutMultiplier: 1,
    showWorldHints: false,
    showDirectFocusCue: false,
  },
  stress: {
    maxConcurrentIncidents: 3,
    incidentTimeoutMultiplier: 0.6,
    showWorldHints: false,
    showDirectFocusCue: false,
  },
};
