import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { DatasetFile } from "./dataset-validator";

interface OfflineDB extends DBSchema {
  datasetMeta: { key: string; value: string };
  datasetFiles: { key: string; value: DatasetFile & { id: string; version: string } };
  incidentNotes: { key: string; value: unknown };
  trainingProgress: { key: string; value: unknown };
  knowledgeState: { key: string; value: unknown };
  simulationHistory: { key: string; value: unknown };
  userPreferences: { key: string; value: unknown };
}

export type OfflineDraftKind = "incident" | "training" | "simulation";

let connection: Promise<IDBPDatabase<OfflineDB>> | undefined;

function getConnection() {
  if (typeof window === "undefined") throw new Error("IndexedDB je dostupan samo u browseru.");
  connection ??= openDB<OfflineDB>("izbori-offline", 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("datasetMeta")) database.createObjectStore("datasetMeta");
      if (!database.objectStoreNames.contains("datasetFiles")) database.createObjectStore("datasetFiles", { keyPath: "id" });
      for (const store of ["incidentNotes", "trainingProgress", "knowledgeState", "simulationHistory", "userPreferences"] as const) {
        if (!database.objectStoreNames.contains(store)) database.createObjectStore(store);
      }
    },
  });
  return connection;
}

export async function readDatasetMeta(key: string): Promise<string | undefined> {
  return (await getConnection()).get("datasetMeta", key);
}

export async function writeDatasetMeta(key: string, value: string): Promise<void> {
  await (await getConnection()).put("datasetMeta", value, key);
}

export async function activateDataset(version: string, files: DatasetFile[]): Promise<void> {
  const database = await getConnection();
  const transaction = database.transaction(["datasetFiles", "datasetMeta"], "readwrite");
  for (const file of files) await transaction.objectStore("datasetFiles").put({ ...file, version, id: `${version}:${file.filename}` });
  await transaction.objectStore("datasetMeta").put(version, "activeDatasetVersion");
  await transaction.done;
}

export async function readActiveDatasetFile(filename: string): Promise<DatasetFile | undefined> {
  const version = await readDatasetMeta("activeDatasetVersion");
  if (!version) return undefined;
  const file = await (await getConnection()).get("datasetFiles", `${version}:${filename}`);
  return file ? { filename: file.filename, payload: file.payload, sha256: file.sha256, size: file.size } : undefined;
}

export async function readOfflineValue<T>(store: "incidentNotes" | "trainingProgress" | "knowledgeState" | "simulationHistory" | "userPreferences", key: string): Promise<T | undefined> {
  return (await getConnection()).get(store, key) as Promise<T | undefined>;
}

export async function writeOfflineValue(store: "incidentNotes" | "trainingProgress" | "knowledgeState" | "simulationHistory" | "userPreferences", key: string, value: unknown): Promise<void> {
  await (await getConnection()).put(store, value, key);
}

export async function setDraftInProgress(kind: OfflineDraftKind, inProgress: boolean): Promise<void> {
  await writeOfflineValue("userPreferences", `draft:${kind}`, inProgress);
}

export async function hasOpenDraft(): Promise<boolean> {
  const values = await Promise.all([
    readOfflineValue<boolean>("userPreferences", "draft:incident"),
    readOfflineValue<boolean>("userPreferences", "draft:training"),
    readOfflineValue<boolean>("userPreferences", "draft:simulation"),
  ]);
  return values.some(Boolean);
}

export async function getOfflineStorageSummary() {
  const database = await getConnection();
  const [activeDatasetVersion, incidentCount, knowledgeCount, simulationCount] = await Promise.all([
    readDatasetMeta("activeDatasetVersion"),
    database.count("incidentNotes"),
    database.count("knowledgeState"),
    database.count("simulationHistory"),
  ]);
  const estimate = await navigator.storage?.estimate();
  return { activeDatasetVersion, incidentCount, knowledgeCount, simulationCount, usage: estimate?.usage ?? 0, quota: estimate?.quota ?? 0 };
}

export async function clearOfflineUserData(): Promise<void> {
  const database = await getConnection();
  const transaction = database.transaction(["incidentNotes", "trainingProgress", "knowledgeState", "simulationHistory", "userPreferences"], "readwrite");
  await Promise.all([
    transaction.objectStore("incidentNotes").clear(),
    transaction.objectStore("trainingProgress").clear(),
    transaction.objectStore("knowledgeState").clear(),
    transaction.objectStore("simulationHistory").clear(),
    transaction.objectStore("userPreferences").clear(),
  ]);
  await transaction.done;
}
