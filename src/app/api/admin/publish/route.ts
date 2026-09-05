import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import { auditLog, datasetFiles, datasetVersions } from "@/lib/db/schema";
import { assertPermission } from "@/lib/domain/admin/rbac";
import { datasetSnapshotSchema, sha256Hex, stableStringify, validateDatasetFile } from "@/lib/offline/dataset-validator";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Prijava je obavezna." }, { status: 401 });
  try { assertPermission(session.user.role, "publish"); } catch { return NextResponse.json({ error: "Uloga nema publish dozvolu." }, { status: 403 }); }

  try {
    const body = await request.json() as { snapshot?: unknown; version?: string };
    const snapshot = datasetSnapshotSchema.parse(body.snapshot);
    const serialized = stableStringify(snapshot);
    const sha256 = await sha256Hex(serialized);
    const size = new TextEncoder().encode(serialized).byteLength;
    await validateDatasetFile({ filename: "snapshot.json", payload: snapshot, sha256, size });
    const version = body.version?.trim() || `admin-${Date.now()}`;
    const datasetId = `ADM-${Date.now()}`;
    await db.update(datasetVersions).set({ status: "archived" }).where(eq(datasetVersions.status, "active"));
    await db.insert(datasetVersions).values({ id: datasetId, version, status: "active", updatePriority: "normal", manifestHash: sha256, publishedAt: new Date(), publishedBy: session.user.id });
    await db.insert(datasetFiles).values({ id: `${datasetId}:snapshot.json`, datasetVersionId: datasetId, filename: "snapshot.json", payload: snapshot, sha256, size });
    await db.insert(auditLog).values({ id: crypto.randomUUID(), actorUserId: session.user.id, action: "publish", entityType: "dataset_version", entityId: datasetId, after: { version, sha256 } });
    return NextResponse.json({ ok: true, version, sha256 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Publish nije uspeo." }, { status: 400 });
  }
}
