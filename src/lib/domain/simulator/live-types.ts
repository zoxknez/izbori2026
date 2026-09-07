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

/**
 * Raspored rada biračkog mesta prema čl. 91 i 99 ZINP.
 */
export interface PollSchedule {
  scheduledOpenTimeMs: number;              // 07:00 (25_200_000 ms)
  actualOpenTimeMs: number;                 // zabeleženo vreme otvaranja
  scheduledCloseTimeMs: number;             // 20:00 (72_000_000 ms)
  openingDelayMs: number;                   // svako kašnjenje otvaranja produžava glasanje (čl. 91)
  qualifyingInterruptionMs: number;         // samo prekidi > 1h produžavaju glasanje (čl. 91)
  legalExtensionMs: number;                 // openingDelayMs + qualifyingInterruptionMs
  effectiveCloseTimeMs: number;             // scheduledCloseTimeMs + legalExtensionMs
  earlyCloseAtMs?: number;                  // čl. 91: ako su glasali svi upisani birači
  actualClosingStartedAtMs?: number;        // trenutak stupanja u 'closing' fazu (čl. 99)
  resultsPublicationEmbargoUntilMs: number; // uvek fiksno 20:00 (72_000_000 ms)
}

/**
 * Pravni prekid glasanja (npr. prekid reda na biračkom mestu po čl. 98 ZINP).
 * Razlikuje se od virtuelne simulacione pauze (simulationPaused).
 */
export interface LegalVotingInterruption {
  id: string;
  startedAtMs: number;
  endedAtMs?: number;
  durationMs: number;
  reasonId: string;
  resumedByRole?: SimulationRole;
}

/**
 * Službeni Zapisnik o radu biračkog odbora (član 105 ZINP).
 * Sadrži rubrike 1-7, verifikaciju kontrolnog lista i primedbe članova BO.
 */
export interface BoardProtocol {
  isSigned: boolean;
  signedAtMs?: number;
  signedByMembers: string[];
  boardMemberRemarks: Array<{
    member: string;
    role: string;
    text: string;
    timestampMs: number;
  }>;
  controlSheetStatus: "valid" | "invalid_missing_signature" | "missing";
  rubrics: Record<string, number>;
}

/**
 * Poseban zapisnik o prisustvu posmatrača (član 168 ZINP).
 * Nezavisan od službenog Zapisnika BO.
 */
export interface ObserverPresenceRecord {
  observers: Array<{
    id: string;
    organization: string;
    accreditationNumber: string;
    arrivedAtMs: number;
    departedAtMs?: number;
  }>;
  remarks: Array<{
    observerId: string;
    organization: string;
    text: string;
    timestampMs: number;
  }>;
}

