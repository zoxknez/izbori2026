import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLog, decisionTrees } from "@/lib/db/schema";
import { assertPermission } from "@/lib/domain/admin/rbac";
import { getCurrentAdmin } from "@/lib/domain/admin/server-auth";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().trim().min(1).max(10000).optional(),
  publicationStatus: z.enum(["draft", "published", "archived"]).optional(),
  reviewStatus: z.enum(["unreviewed", "content_review", "legal_review", "verified", "stale"]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Nema izmena.");

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Prijava je obavezna." }, { status: 401 });
  const { id } = await context.params;
  let patch: z.infer<typeof patchSchema>;
  try { patch = patchSchema.parse(await request.json()); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Neispravan zahtev." }, { status: 400 }); }
  try {
    if (patch.title || patch.description) assertPermission(admin.role, "rules:write");
    if (patch.publicationStatus || patch.reviewStatus) assertPermission(admin.role, "review:write");
  } catch { return NextResponse.json({ error: "Uloga nema dozvolu za traženu izmenu." }, { status: 403 }); }
  const [before] = await db.select().from(decisionTrees).where(eq(decisionTrees.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Stablo nije pronađeno." }, { status: 404 });
  const next = { ...(patch.title === undefined ? {} : { title: patch.title }), ...(patch.description === undefined ? {} : { description: patch.description }), ...(patch.publicationStatus === undefined ? {} : { publicationStatus: patch.publicationStatus }), ...(patch.reviewStatus === undefined ? {} : { reviewStatus: patch.reviewStatus }), updatedAt: new Date() };
  const [after] = await db.update(decisionTrees).set(next).where(eq(decisionTrees.id, id)).returning();
  await db.insert(auditLog).values({ id: crypto.randomUUID(), actorUserId: admin.id, action: "decision_tree.update", entityType: "decision_tree", entityId: id, before: { title: before.title, description: before.description, publicationStatus: before.publicationStatus, reviewStatus: before.reviewStatus }, after: { title: after.title, description: after.description, publicationStatus: after.publicationStatus, reviewStatus: after.reviewStatus } });
  return NextResponse.json({ ok: true, tree: { id: after.id, updatedAt: after.updatedAt } });
}
