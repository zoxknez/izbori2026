import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, datasetFiles, datasetVersions } from "@/lib/db/schema";
import { AdminAccessError, requireAdminPermission } from "@/lib/domain/admin/server-auth";
import { datasetSnapshotSchema, sha256Hex, stableStringify, validateDatasetFile } from "@/lib/offline/dataset-validator";
import { createCurrentDatasetSnapshot } from "@/lib/offline/create-dataset-snapshot";

export async function POST(request: Request) {
  let admin;
  try { admin = await requireAdminPermission("publish"); }
  catch (error) { if (error instanceof AdminAccessError) return NextResponse.json({ error: error.message }, { status: error.status }); throw error; }

  try {
    const body = await request.json().catch(() => ({})) as { snapshot?: unknown; version?: string };
    const requestedVersion = body.version?.trim();
    const snapshot = datasetSnapshotSchema.parse(body.snapshot ?? await createCurrentDatasetSnapshot(requestedVersion));
    const version = requestedVersion || snapshot.version;
    if (snapshot.version !== version) throw new Error("Version dataseta i manifest payload-a moraju biti identični.");
    const serialized = stableStringify(snapshot);
    const sha256 = await sha256Hex(serialized);
    const size = new TextEncoder().encode(serialized).byteLength;
    await validateDatasetFile({ filename: "snapshot.json", payload: snapshot, sha256, size });
    const datasetId = `ADM-${crypto.randomUUID()}`;
    await db.batch([
      db.update(datasetVersions).set({ status: "archived" }).where(eq(datasetVersions.status, "active")),
      db.insert(datasetVersions).values({ id: datasetId, version, status: "active", updatePriority: "normal", manifestHash: sha256, publishedAt: new Date(), publishedBy: admin.id }),
      db.insert(datasetFiles).values({ id: `${datasetId}:snapshot.json`, datasetVersionId: datasetId, filename: "snapshot.json", payload: snapshot, sha256, size }),
      db.insert(auditLog).values({ id: crypto.randomUUID(), actorUserId: admin.id, action: "publish", entityType: "dataset_version", entityId: datasetId, after: { version, sha256 } }),
    ]);
    return NextResponse.json({ ok: true, version, sha256 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Publish nije uspeo." }, { status: 400 });
  }
}
