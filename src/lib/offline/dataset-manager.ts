import { activateDataset } from "./indexed-db";
import { validateDatasetFile, type DatasetFile, type DatasetSnapshot } from "./dataset-validator";

export async function downloadAndActivateDataset(version = "current"): Promise<DatasetSnapshot> {
  const response = await fetch(`/api/offline-dataset/${encodeURIComponent(version)}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Dataset nije dostupan (${response.status}).`);
  const body = await response.json() as { version?: unknown; manifestHash?: unknown; files?: unknown };
  if (typeof body.version !== "string" || typeof body.manifestHash !== "string" || !Array.isArray(body.files) || body.files.length === 0) {
    throw new Error("Odgovor dataseta nema validan manifest.");
  }
  const files = body.files as DatasetFile[];
  const snapshots: DatasetSnapshot[] = [];
  for (const file of files) snapshots.push(await validateDatasetFile(file));
  const snapshotVersions = new Set(snapshots.map((snapshot) => snapshot.version));
  if (snapshotVersions.size !== 1 || snapshots[0].version !== body.version || files[0].sha256 !== body.manifestHash) {
    throw new Error("Manifest dataseta i payload fajl nisu usklađeni.");
  }
  if (version !== "current" && body.version !== version) throw new Error("Vraćena verzija dataseta nije tražena verzija.");
  await activateDataset(snapshots[0].version, files);
  return snapshots[0];
}
