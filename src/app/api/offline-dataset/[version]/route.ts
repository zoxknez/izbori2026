import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { datasetFiles, datasetVersions } from "@/lib/db/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ version: string }> }) {
  const { version } = await params;
  // CI and a fresh public deployment intentionally work from the checked-in,
  // checksum-verified offline snapshot until an administrative database exists.
  if (!process.env.DATABASE_URL) {
    const raw = await readFile(join(process.cwd(), "public", "offline-data", "bootstrap", "snapshot.json"), "utf8");
    const snapshot = JSON.parse(raw) as { filename: string; payload: unknown; sha256: string; size?: number };
    return NextResponse.json({
      version: version === "current" ? "bootstrap" : version,
      manifestHash: snapshot.sha256,
      updatePriority: "bootstrap",
      legalReviewDate: null,
      files: [{ filename: snapshot.filename, payload: snapshot.payload, sha256: snapshot.sha256, size: snapshot.size ?? raw.length }],
    }, { headers: { "Cache-Control": version === "current" ? "no-store" : "public, max-age=31536000, immutable" } });
  }
  const versionRow = version === "current"
    ? (await db.select().from(datasetVersions).where(eq(datasetVersions.status, "active")).limit(1))[0]
    : (await db.select().from(datasetVersions).where(and(eq(datasetVersions.version, version), eq(datasetVersions.status, "active"))).limit(1))[0];
  if (!versionRow) return NextResponse.json({ error: "Dataset nije pronađen." }, { status: 404 });
  const files = await db.select({ filename: datasetFiles.filename, payload: datasetFiles.payload, sha256: datasetFiles.sha256, size: datasetFiles.size }).from(datasetFiles).where(eq(datasetFiles.datasetVersionId, versionRow.id));
  return NextResponse.json({ version: versionRow.version, manifestHash: versionRow.manifestHash, updatePriority: versionRow.updatePriority, legalReviewDate: versionRow.legalReviewDate, files }, {
    headers: { "Cache-Control": version === "current" ? "no-store" : "public, max-age=31536000, immutable" },
  });
}
