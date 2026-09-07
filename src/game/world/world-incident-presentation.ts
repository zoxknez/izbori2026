import type { ActiveIncident } from "@/lib/domain/simulator/live-types";

export type WorldIncidentVisualKind = "prop" | "npc_state" | "queue_state" | "station_state" | "overlay_marker";
export type IncidentAwareness = "low" | "medium" | "high";

export interface WorldIncidentPresentation {
  eventId: string;
  locationId: string;
  /** Presentation target only; the domain still owns the legal action binding. */
  hotspotTarget: string;
  visual: { kind: WorldIncidentVisualKind; assetKey?: string; anchor: { x: number; y: number } };
  attention: { awareness: IncidentAwareness; pulse: boolean; label: string };
  resolvedVisual: { remove: boolean; state: "resolved" | "unresolved" };
}

/** Presentation-only map. Legal meaning remains exclusively in the authored binding/domain. */
export const WORLD_INCIDENT_PRESENTATIONS: Record<string, Omit<WorldIncidentPresentation, "eventId" | "locationId">> = {
  E01: { hotspotTarget: "hallway-poster", visual: { kind: "prop", assetKey: "poster", anchor: { x: 50, y: 95 } }, attention: { awareness: "medium", pulse: true, label: "Propaganda na ulazu" }, resolvedVisual: { remove: true, state: "resolved" } },
  E02: { hotspotTarget: "material-ballot-stack", visual: { kind: "station_state", assetKey: "ballot-stack", anchor: { x: 410, y: 160 } }, attention: { awareness: "medium", pulse: true, label: "Manjak materijala" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E03: { hotspotTarget: "booth-angle", visual: { kind: "station_state", assetKey: "booth", anchor: { x: 760, y: 150 } }, attention: { awareness: "high", pulse: true, label: "Tajnost paravana" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E04: { hotspotTarget: "empty-box", visual: { kind: "station_state", assetKey: "ballot-box", anchor: { x: 760, y: 340 } }, attention: { awareness: "high", pulse: true, label: "Provera kutije" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E05: { hotspotTarget: "control-sheet", visual: { kind: "prop", assetKey: "control-sheet", anchor: { x: 700, y: 340 } }, attention: { awareness: "medium", pulse: true, label: "Kontrolni list" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E06: { hotspotTarget: "box-seal", visual: { kind: "station_state", assetKey: "ballot-box", anchor: { x: 760, y: 340 } }, attention: { awareness: "high", pulse: true, label: "Pečaćenje kutije" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E07: { hotspotTarget: "uv-lamp-check", visual: { kind: "station_state", assetKey: "uv-lamp", anchor: { x: 150, y: 160 } }, attention: { awareness: "medium", pulse: true, label: "UV provera" }, resolvedVisual: { remove: true, state: "resolved" } },
  E08: { hotspotTarget: "voter-roll-table", visual: { kind: "npc_state", assetKey: "voter", anchor: { x: 320, y: 225 } }, attention: { awareness: "high", pulse: true, label: "Identifikacija birača" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E09: { hotspotTarget: "uv-lamp-check", visual: { kind: "npc_state", assetKey: "voter", anchor: { x: 150, y: 225 } }, attention: { awareness: "high", pulse: true, label: "Sporni UV trag" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E10: { hotspotTarget: "voter-roll-table", visual: { kind: "queue_state", assetKey: "voter", anchor: { x: 320, y: 225 } }, attention: { awareness: "medium", pulse: true, label: "Birač nije u spisku" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E12: { hotspotTarget: "booth-angle", visual: { kind: "npc_state", assetKey: "voter", anchor: { x: 680, y: 150 } }, attention: { awareness: "high", pulse: true, label: "Paravan" }, resolvedVisual: { remove: true, state: "resolved" } },
  E18: { hotspotTarget: "observer-desk", visual: { kind: "overlay_marker", anchor: { x: 500, y: 480 } }, attention: { awareness: "low", pulse: true, label: "Prostor posmatrača" }, resolvedVisual: { remove: true, state: "resolved" } },
  E23: { hotspotTarget: "voter-roll-table", visual: { kind: "npc_state", assetKey: "phone", anchor: { x: 320, y: 225 } }, attention: { awareness: "high", pulse: true, label: "Telefon i podaci" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E24: { hotspotTarget: "booth-middle", visual: { kind: "npc_state", assetKey: "voter", anchor: { x: 760, y: 150 } }, attention: { awareness: "high", pulse: true, label: "Uticaj na birača" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E26: { hotspotTarget: "ballot-box", visual: { kind: "npc_state", assetKey: "voter", anchor: { x: 760, y: 290 } }, attention: { awareness: "high", pulse: true, label: "Listić kod kutije" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E27: { hotspotTarget: "entrance-door", visual: { kind: "queue_state", assetKey: "voter", anchor: { x: 75, y: 160 } }, attention: { awareness: "high", pulse: true, label: "Red u 20:00" }, resolvedVisual: { remove: false, state: "unresolved" } },
};

export function getWorldIncidentPresentation(incident: ActiveIncident): WorldIncidentPresentation {
  const base = WORLD_INCIDENT_PRESENTATIONS[incident.eventId] ?? {
    hotspotTarget: incident.binding.hotspotTarget,
    visual: { kind: "overlay_marker" as const, anchor: { x: 500, y: 300 } },
    attention: { awareness: "low" as const, pulse: false, label: incident.locationId },
    resolvedVisual: { remove: true, state: "resolved" as const },
  };
  return { eventId: incident.eventId, locationId: incident.locationId, ...base };
}
