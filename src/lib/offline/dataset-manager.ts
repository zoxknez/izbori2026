import { activateDataset, readDatasetMeta } from "./indexed-db";
import { validateDatasetFile, type DatasetFile, type DatasetSnapshot } from "./dataset-validator";

export type DatasetUpdatePriority = "normal" | "important" | "critical";

export interface DatasetUpdateInfo {
  hasUpdate: boolean;
  version: string;
  activeVersion?: string;
  updatePriority: DatasetUpdatePriority;
  legalReviewDate?: string;
}

/**
 * Poredi lokalno aktivnu verziju sa serverskom „current“ verzijom.
 * Namerno ne preuzima ništa: samo javlja da li i koliko hitno postoji nova verzija pravila.
 */
export async function checkForDatasetUpdate(): Promise<DatasetUpdateInfo | null> {
  try {
    const response = await fetch("/api/offline-dataset/current", { cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      version?: unknown;
      updatePriority?: unknown;
      legalReviewDate?: unknown;
    };
    if (typeof body.version !== "string") return null;

    const activeVersion = await readDatasetMeta("activeDatasetVersion");
    const priority: DatasetUpdatePriority =
      body.updatePriority === "critical" || body.updatePriority === "important" ? body.updatePriority : "normal";

    return {
      // Prvi put korisnik nema lokalni dataset: tada nema šta da se „ažurira“.
      hasUpdate: Boolean(activeVersion) && activeVersion !== body.version,
      version: body.version,
      activeVersion,
      updatePriority: priority,
      legalReviewDate: typeof body.legalReviewDate === "string" ? body.legalReviewDate : undefined,
    };
  } catch {
    // Bez mreže se tiho nastavlja sa lokalnim datasetom.
    return null;
  }
}

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
