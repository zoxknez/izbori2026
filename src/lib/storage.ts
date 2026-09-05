import { z } from "zod";
import type { IncidentData } from "@/lib/incident";
import { readOfflineValue, writeOfflineValue } from "@/lib/offline/indexed-db";

const incidentDataSchema = z.object({
  vrstaIzbora: z.string().max(64),
  opstina: z.string().max(200),
  brojMesta: z.string().max(32),
  datum: z.string().max(32),
  vreme: z.string().max(32),
  uloga: z.string().max(100),
  faza: z.string().max(64),
  staSamVideo: z.string().max(10000),
  spornaRadnja: z.string().max(5000),
  koJeVideo: z.string().max(5000),
  odborUpozoren: z.enum(["da", "ne", "nije primenljivo"]),
  nepravilnostPrestala: z.enum(["da", "ne", "nije primenljivo"]),
  primedbaTrazena: z.enum(["da", "ne", "nije primenljivo"]),
  propis: z.string().max(2000),
  napomena: z.string().max(5000),
}) satisfies z.ZodType<IncidentData>;

const savedIncidentSchema = z.object({
  id: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  data: incidentDataSchema,
});

const savedIncidentsSchema = z.array(savedIncidentSchema).max(30);
const checklistSchema = z.record(z.string().min(1).max(100), z.boolean());

export type SavedIncident = z.infer<typeof savedIncidentSchema>;

function readJson<T>(key: string, schema: z.ZodType<T>): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T, schema: z.ZodType<T>): boolean {
  if (typeof window === "undefined") return false;
  try {
    const parsed = schema.safeParse(value);
    if (!parsed.success) return false;
    window.localStorage.setItem(key, JSON.stringify(parsed.data));
    return true;
  } catch {
    return false;
  }
}

export function readSavedIncidents(key: string): SavedIncident[] {
  return readJson(key, savedIncidentsSchema) ?? [];
}

export function writeSavedIncidents(key: string, value: SavedIncident[]): boolean {
  return writeJson(key, value, savedIncidentsSchema);
}

/** IndexedDB is the canonical store for incident records; localStorage is read only for legacy migration. */
export async function readSavedIncidentsOffline(key: string): Promise<SavedIncident[]> {
  try {
    const stored = await readOfflineValue<unknown>("incidentNotes", key);
    const parsed = savedIncidentsSchema.safeParse(stored);
    if (parsed.success) return parsed.data;

    const legacy = readSavedIncidents(key);
    if (legacy.length > 0) await writeOfflineValue("incidentNotes", key, legacy);
    return legacy;
  } catch {
    return readSavedIncidents(key);
  }
}

export async function writeSavedIncidentsOffline(key: string, value: SavedIncident[]): Promise<boolean> {
  const parsed = savedIncidentsSchema.safeParse(value);
  if (!parsed.success) return false;
  try {
    await writeOfflineValue("incidentNotes", key, parsed.data);
    return true;
  } catch {
    return writeSavedIncidents(key, parsed.data);
  }
}

export async function removeSavedIncidentsOffline(key: string): Promise<boolean> {
  try {
    await writeOfflineValue("incidentNotes", key, []);
    return true;
  } catch {
    return removeStoredValue(key);
  }
}

export function readChecklist(key: string): Record<string, boolean> {
  return readJson(key, checklistSchema) ?? {};
}

export function writeChecklist(key: string, value: Record<string, boolean>): boolean {
  return writeJson(key, value, checklistSchema);
}

export function removeStoredValue(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
