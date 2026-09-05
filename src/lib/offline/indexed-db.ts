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
