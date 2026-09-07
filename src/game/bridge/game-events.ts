import type { SimulationState } from "@/lib/domain/simulator/types";
import type {
  ActiveIncident,
  EvidenceRecord,
  GameActionLogEntry,
} from "@/lib/domain/simulator/live-types";
import type { WorldIncidentPresentation } from "@/game/world/world-incident-presentation";
import type { ProceduralAudioCue } from "@/game/audio/procedural-audio";
import type { SimulationRole } from "@/lib/domain/simulator/types";

/**
 * Tipizirani događaji koje GameBridge razmenjuje između
 * Phaser scene, XState orkestratora i React korisničkog interfejsa.
 */
export interface GameBridgeEventMap {
  // Iz Phasera ka Bridge-u / XState-u:
  WORLD_READY: { width: number; height: number };
  HOTSPOT_CLICKED: { hotspotId: string; locationId: string; title: string };
  HOTSPOT_HOVERED: { hotspotId: string | null };
  FOCUS_LOCATION: { locationId: string; x?: number; y?: number };
  WORLD_ACTION_REQUESTED: { worldActionId: string; choiceId: string; eventId?: string };
  NPC_METRICS_UPDATED: { activeVoterCount: number; queueLength: number };
  WORLD_STATE_SNAPSHOT: {
    rngState: number;
    deterministicCounter?: number;
    activeVoters: unknown[];
    queueOrder: string[];
    nextSpawnAtMs: number;
    nextEntityId: number;
    voterPool?: unknown[];
    completedVoterIds?: string[];
  };

  // Iz XState / Domain layer-a ka Phaseru i Reactu:
  CLOCK_TICK: {
    simulationTimeMs: number;
    timeString?: string;
    deltaMs?: number;
    deltaSimMs?: number;
    paused?: boolean;
    speed?: 1 | 2 | 4;
  };
  SPEED_CHANGED: { speed: 1 | 2 | 4; paused: boolean };
  DOMAIN_STATE_CHANGED: { domainState: SimulationState };
  ACTIVE_INCIDENTS_CHANGED: { incidents: ActiveIncident[] };
  WORLD_INCIDENT_PRESENTATIONS_CHANGED: { incidents: Array<ActiveIncident & { presentation: WorldIncidentPresentation }> };
  INCIDENT_EXPIRED: { incident: ActiveIncident };
  EVIDENCE_ADDED: { record: EvidenceRecord };
  EVIDENCE_MARKERS_CHANGED: { records: EvidenceRecord[] };
  AUDIO_SETTINGS_CHANGED: { muted: boolean; volume: number };
  AUDIO_CUE_REQUESTED: { cue: ProceduralAudioCue };
  ROLE_CHANGED: { role: SimulationRole };
  ACTION_LOGGED: { entry: GameActionLogEntry };

  // Komande interfejsa i scene:
  PAUSE_TOGGLED: { paused: boolean };
  SPEED_SET: { speed: 1 | 2 | 4 };
  RESET_REQUESTED: { seed?: number };
  SWITCH_SCENE: { sceneKey: "PollingStationScene" | "CountingScene" };
  PHASE_CHANGED: {
    phase: "pre_opening" | "voting" | "closing" | "counting" | "protocol" | "handover" | "debrief" | "closed";
    acceptingNewVoters: boolean;
  };
  REQUEST_WORLD_SNAPSHOT: Record<string, never>;
  RESTORE_WORLD_STATE: {
    rngState: number;
    activeVoters?: unknown[];
    queueOrder?: string[];
    nextSpawnAtMs?: number;
    nextEntityId?: number;
    voterPool?: unknown[];
    completedVoterIds?: string[];
  };
}

export type GameBridgeEventName = keyof GameBridgeEventMap;
