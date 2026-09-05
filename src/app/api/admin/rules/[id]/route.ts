import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditLog, rules } from "@/lib/db/schema";
import { getCurrentAdmin } from "@/lib/domain/admin/server-auth";
import { assertPermission } from "@/lib/domain/admin/rbac";

const patchSchema = z.object({
  summary: z.string().trim().min(1).max(10000).optional(),
  legalRule: z.string().trim().min(1).max(20000).optional(),
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
    if (patch.summary || patch.legalRule) assertPermission(admin.role, "rules:write");
    if (patch.publicationStatus || patch.reviewStatus) assertPermission(admin.role, "review:write");
  } catch { return NextResponse.json({ error: "Uloga nema dozvolu za traženu izmenu." }, { status: 403 }); }

  const [before] = await db.select().from(rules).where(eq(rules.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Pravilo nije pronađeno." }, { status: 404 });
  const next = {
    ...(patch.summary === undefined ? {} : { summary: patch.summary }),
    ...(patch.legalRule === undefined ? {} : { legalRule: patch.legalRule }),
    ...(patch.publicationStatus === undefined ? {} : { publicationStatus: patch.publicationStatus }),
    ...(patch.reviewStatus === undefined ? {} : { reviewStatus: patch.reviewStatus }),
    updatedAt: new Date(),
  };
  const [after] = await db.update(rules).set(next).where(eq(rules.id, id)).returning();
  await db.insert(auditLog).values({ id: crypto.randomUUID(), actorUserId: admin.id, action: "rule.update", entityType: "rule", entityId: id, before: { summary: before.summary, legalRule: before.legalRule, publicationStatus: before.publicationStatus, reviewStatus: before.reviewStatus }, after: { summary: after.summary, legalRule: after.legalRule, publicationStatus: after.publicationStatus, reviewStatus: after.reviewStatus } });
  return NextResponse.json({ ok: true, rule: { id: after.id, updatedAt: after.updatedAt } });
}
