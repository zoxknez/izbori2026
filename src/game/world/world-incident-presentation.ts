import type { ActiveIncident } from "@/lib/domain/simulator/live-types";

export type WorldIncidentVisualKind = "prop" | "npc_state" | "queue_state" | "station_state" | "overlay_marker";
export type IncidentAwareness = "low" | "medium" | "high";

export interface WorldIncidentPresentation {
  eventId: string;
  locationId: string;
  visual: { kind: WorldIncidentVisualKind; assetKey?: string; anchor: { x: number; y: number } };
  attention: { awareness: IncidentAwareness; pulse: boolean; label: string };
  resolvedVisual: { remove: boolean; state: "resolved" | "unresolved" };
}

/** Presentation-only map. Legal meaning remains exclusively in the authored binding/domain. */
export const WORLD_INCIDENT_PRESENTATIONS: Record<string, Omit<WorldIncidentPresentation, "eventId" | "locationId">> = {
  E01: { visual: { kind: "prop", assetKey: "poster", anchor: { x: 50, y: 95 } }, attention: { awareness: "medium", pulse: true, label: "Ulaz" }, resolvedVisual: { remove: true, state: "resolved" } },
  E04: { visual: { kind: "station_state", assetKey: "ballot-box", anchor: { x: 760, y: 340 } }, attention: { awareness: "high", pulse: true, label: "Glasačka kutija" }, resolvedVisual: { remove: false, state: "unresolved" } },
  E07: { visual: { kind: "station_state", assetKey: "uv-lamp", anchor: { x: 150, y: 160 } }, attention: { awareness: "medium", pulse: true, label: "UV stanica" }, resolvedVisual: { remove: true, state: "resolved" } },
  E12: { visual: { kind: "npc_state", assetKey: "booth", anchor: { x: 680, y: 150 } }, attention: { awareness: "high", pulse: true, label: "Paravan" }, resolvedVisual: { remove: true, state: "resolved" } },
  E18: { visual: { kind: "overlay_marker", anchor: { x: 500, y: 480 } }, attention: { awareness: "low", pulse: true, label: "Prostor posmatrača" }, resolvedVisual: { remove: true, state: "resolved" } },
};

export function getWorldIncidentPresentation(incident: ActiveIncident): WorldIncidentPresentation {
  const base = WORLD_INCIDENT_PRESENTATIONS[incident.eventId] ?? {
    visual: { kind: "overlay_marker" as const, anchor: { x: 500, y: 300 } },
    attention: { awareness: "low" as const, pulse: false, label: incident.locationId },
    resolvedVisual: { remove: true, state: "resolved" as const },
  };
  return { eventId: incident.eventId, locationId: incident.locationId, ...base };
}
