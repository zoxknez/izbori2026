import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { datasetFiles, datasetVersions } from "@/lib/db/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ version: string }> }) {
  const { version } = await params;
  const versionRow = version === "current"
    ? (await db.select().from(datasetVersions).where(eq(datasetVersions.status, "active")).limit(1))[0]
    : (await db.select().from(datasetVersions).where(and(eq(datasetVersions.version, version), eq(datasetVersions.status, "active"))).limit(1))[0];
  if (!versionRow) return NextResponse.json({ error: "Dataset nije pronađen." }, { status: 404 });
  const files = await db.select({ filename: datasetFiles.filename, payload: datasetFiles.payload, sha256: datasetFiles.sha256, size: datasetFiles.size }).from(datasetFiles).where(eq(datasetFiles.datasetVersionId, versionRow.id));
  return NextResponse.json({ version: versionRow.version, manifestHash: versionRow.manifestHash, files }, {
    headers: { "Cache-Control": version === "current" ? "no-store" : "public, max-age=31536000, immutable" },
  });
}
