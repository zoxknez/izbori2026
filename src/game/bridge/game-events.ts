import type { SimulationState } from "@/lib/domain/simulator/types";
import type {
  ActiveIncident,
  EvidenceRecord,
  GameActionLogEntry,
} from "@/lib/domain/simulator/live-types";

/**
 * Tipizirani događaji koje GameBridge razmenjuje između
 * Phaser scene, XState orkestratora i React korisničkog interfejsa.
 */
export interface GameBridgeEventMap {
  // Iz Phasera ka Bridge-u / XState-u:
  WORLD_READY: { width: number; height: number };
  HOTSPOT_CLICKED: { hotspotId: string; locationId: string; title: string };
  HOTSPOT_HOVERED: { hotspotId: string | null };
  WORLD_ACTION_REQUESTED: { worldActionId: string; choiceId: string; eventId?: string };

  // Iz XState / Domain layer-a ka Phaseru i Reactu:
  CLOCK_TICK: {
    simulationTimeMs: number;
    timeString: string;
    deltaMs: number;
    deltaSimMs?: number;
    paused?: boolean;
    speed?: 1 | 2 | 4;
  };
  SPEED_CHANGED: { speed: 1 | 2 | 4; paused: boolean };
  DOMAIN_STATE_CHANGED: { domainState: SimulationState };
  ACTIVE_INCIDENTS_CHANGED: { incidents: ActiveIncident[] };
  INCIDENT_EXPIRED: { incident: ActiveIncident };
  EVIDENCE_ADDED: { record: EvidenceRecord };
  ACTION_LOGGED: { entry: GameActionLogEntry };

  // Komande interfejsa i scene:
  PAUSE_TOGGLED: { paused: boolean };
  SPEED_SET: { speed: 1 | 2 | 4 };
  RESET_REQUESTED: { seed?: number };
  SWITCH_SCENE: { sceneKey: "PollingStationScene" | "CountingScene" };
  PHASE_CHANGED: { phase: "voting" | "counting" };
}

export type GameBridgeEventName = keyof GameBridgeEventMap;
