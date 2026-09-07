import type { ActiveIncident, EvidenceRecord, GameActionLogEntry } from "./live-types";

export interface DebriefTimelineEntry {
  id: string;
  simulationTimeMs: number;
  timestamp: string;
  kind: "action" | "evidence" | "timeout";
  label: string;
  detail?: string;
}

export function buildDebriefTimeline(
  actionLog: readonly GameActionLogEntry[],
  evidence: readonly EvidenceRecord[],
  missedIncidents: readonly ActiveIncident[],
): DebriefTimelineEntry[] {
  const entries: DebriefTimelineEntry[] = actionLog.map((entry) => ({
    id: entry.id,
    simulationTimeMs: entry.simulationTimeMs,
    timestamp: entry.timestamp,
    kind: entry.type === "timeout" ? "timeout" : entry.type === "evidence_recorded" ? "evidence" : "action",
    label: entry.type === "timeout" ? `Istekao incident ${entry.eventId ?? ""}` : entry.type === "evidence_recorded" ? "Dokaz zabeležen" : entry.type === "world_action" ? `Reakcija na ${entry.eventId ?? "incident"}` : entry.type === "phase_change" ? "Promena faze dana" : entry.type === "role_change" ? "Promena uloge" : entry.type === "protocol_signed" ? "Zapisnik potpisan" : entry.type,
    detail: entry.details,
  }));

  for (const record of evidence) {
    if (entries.some((entry) => entry.kind === "evidence" && entry.detail?.includes(record.id))) continue;
    entries.push({
      id: `evidence-${record.id}`,
      simulationTimeMs: record.simulationTimeMs,
      timestamp: record.timestamp,
      kind: "evidence",
      label: "Dokaz zabeležen",
      detail: `${record.locationId}: ${record.observedFacts.join("; ") || "bez opisa činjenica"}`,
    });
  }

  for (const incident of missedIncidents) {
    entries.push({
      id: `missed-${incident.instanceId}`,
      simulationTimeMs: incident.expiresAtSimulationTimeMs ?? incident.spawnedAtSimulationTimeMs,
      timestamp: "",
      kind: "timeout",
      label: `Propušten incident ${incident.eventId}`,
      detail: incident.binding.timeout?.label,
    });
  }

  return entries.sort((a, b) => a.simulationTimeMs - b.simulationTimeMs || a.id.localeCompare(b.id));
}
