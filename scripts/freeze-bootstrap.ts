import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/lib/db");
  const { datasetVersions, datasetFiles } = await import("../src/lib/db/schema");
  const { eq, and } = await import("drizzle-orm");
  const [version] = await db.select().from(datasetVersions).where(eq(datasetVersions.status, "active")).limit(1);
  if (!version) throw new Error("Nema aktivnog dataseta za bootstrap.");
  const [file] = await db.select().from(datasetFiles).where(and(eq(datasetFiles.datasetVersionId, version.id), eq(datasetFiles.filename, "snapshot.json"))).limit(1);
  if (!file) throw new Error(`Nedostaje snapshot.json za dataset ${version.version}.`);
  const outputDir = join(process.cwd(), "public", "offline-data", "bootstrap");
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "snapshot.json"), JSON.stringify({ filename: file.filename, payload: file.payload, sha256: file.sha256, size: file.size }, null, 2), "utf8");
  console.log(`Bootstrap snapshot zamrznut za ${version.version}.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
