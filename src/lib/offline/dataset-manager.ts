import { activateDataset } from "./indexed-db";
import { validateDatasetFile, type DatasetFile, type DatasetSnapshot } from "./dataset-validator";

export async function downloadAndActivateDataset(version = "current"): Promise<DatasetSnapshot> {
  const response = await fetch(`/api/offline-dataset/${encodeURIComponent(version)}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Dataset nije dostupan (${response.status}).`);
  const body = await response.json() as { files: DatasetFile[] };
  if (!Array.isArray(body.files) || body.files.length === 0) throw new Error("Dataset nema fajlova.");
  const snapshots: DatasetSnapshot[] = [];
  for (const file of body.files) snapshots.push(await validateDatasetFile(file));
  await activateDataset(snapshots[0].version, body.files);
  return snapshots[0];
}
