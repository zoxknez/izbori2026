import type { SimulationRole } from "./types";

/**
 * Uslov i trenutak kada se incident aktivira u živom svetu biračkog mesta.
 */
export interface IncidentTrigger {
  type: "time" | "voter_arrival" | "flag" | "manual";
  /** Format HH:MM ako se okida u određeno vreme */
  simulationTime?: string;
  requiredFlags?: string[];
  forbidsFlags?: string[];
  roleFilter?: SimulationRole[];
}

/**
 * Kontekstualna radnja u svetu vezana za konkretan SimulationChoice.
 */
export interface WorldActionBinding {
  worldActionId: string;
  label: string;
  choiceId: string;
  requiredRole?: SimulationRole;
  icon?: string;
}

/**
 * Vremensko ograničenje u simulacionim sekundama.
 * Ako igrač ne reaguje pre isteka, incident se automatski razrešava
 * isključivo kroz autorski definisan choiceId (nema sintetičkih kazni!).
 */
export interface IncidentTimeout {
  simulationSeconds: number;
  choiceId: string;
  label?: string;
}

/**
 * Povezivanje SimulationEvent entiteta sa 2D svetom i tačkama interakcije.
 */
export interface WorldIncidentBinding {
  eventId: string;
  trigger: IncidentTrigger;
  locationId: string;
  hotspotTarget: string;
  actions: WorldActionBinding[];
  roleFilter?: SimulationRole[];
  timeout?: IncidentTimeout;
}

export type WorldAction = WorldActionBinding;

/**
 * Instanca incidenta koji je trenutno aktivan u prostoru.
 */
export interface ActiveIncident {
  instanceId: string;
  eventId: string;
  binding: WorldIncidentBinding;
  spawnedAtSimulationTimeMs: number;
  expiresAtSimulationTimeMs?: number;
  locationId: string;
  isInspected: boolean;
}

/**
 * Strukturirana zabeleška u beležnici dokaza (Evidence Tray).
 */
export interface EvidenceRecord {
  id: string;
  eventId?: string;
  incidentInstanceId?: string;
  simulationTimeMs: number;
  timestamp: string; // "HH:MM"
  locationId: string; // npr. "voter-roll-desk", "booth-2", "entrance"
  observedFacts: string[];
  assumptions: string[];
  witnesses: string[];
  relatedRuleIds: string[];
  createdByRole: SimulationRole;
  source: "manual" | "world_interaction" | "system_generated";
  completeness: {
    time: boolean;
    location: boolean;
    facts: boolean;
    witnesses: boolean;
  };
}

/**
 * Zapis u determinističkom akcionom dnevniku za potrebe Replay-a i reprodukcije.
 */
export interface GameActionLogEntry {
  id: string;
  simulationTimeMs: number;
  timestamp: string;
  type:
    | "world_action"
    | "timeout"
    | "evidence_recorded"
    | "pause"
    | "speed_change"
    | "role_change"
    | "phase_change"
    | "protocol_signed";
  eventId?: string;
  choiceId?: string;
  locationId?: string;
  actorId?: string;
  details?: string;
}
