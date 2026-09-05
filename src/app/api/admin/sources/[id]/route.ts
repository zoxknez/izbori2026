import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { z } from "zod";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import { auditLog, decisionTrees, rules, sources } from "@/lib/db/schema";
import { assertPermission } from "@/lib/domain/admin/rbac";
import { buildTrainingQuestions } from "@/lib/domain/training/generate-questions";
import { simulationEvents } from "@/lib/domain/simulator/seed-events";
import { calculateStalePropagation, sourceIdsForRule } from "@/lib/domain/legal/dependency-graph";
import { getAllRules, getDecisionTrees, getSources } from "@/lib/data";

const patchSchema = z.object({
  label: z.string().trim().min(1).max(500).optional(),
  description: z.string().trim().max(10000).optional(),
  publisher: z.string().trim().max(500).optional(),
  version: z.string().trim().max(100).optional(),
  validFromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional(),
  validUntilDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional(),
  status: z.enum(["active", "superseded", "archived"]).optional(),
  supersedesId: z.string().min(1).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Nema izmena.");

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Prijava je obavezna." }, { status: 401 });
  try { assertPermission(session.user.role, "sources:write"); } catch { return NextResponse.json({ error: "Uloga nema dozvolu za izmene izvora." }, { status: 403 }); }
  const { id } = await context.params;
  let patch: z.infer<typeof patchSchema>;
  try { patch = patchSchema.parse(await request.json()); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Neispravan zahtev." }, { status: 400 }); }
  if (patch.supersedesId === id) return NextResponse.json({ error: "Izvor ne može da zamenjuje samog sebe." }, { status: 400 });

  try {
    const [before] = await db.select().from(sources).where(eq(sources.id, id)).limit(1);
    if (!before) return NextResponse.json({ error: "Izvor nije pronađen." }, { status: 404 });
    if (patch.supersedesId) {
      const [replacement] = await db.select({ id: sources.id }).from(sources).where(eq(sources.id, patch.supersedesId)).limit(1);
      if (!replacement) return NextResponse.json({ error: "Navedeni izvor koji se zamenjuje ne postoji." }, { status: 400 });
    }
    const nextStatus = patch.status ?? (before.status as "active" | "superseded" | "archived" | null) ?? "active";
    const [currentRules, currentSources, currentTrees] = await Promise.all([getAllRules(), getSources(), getDecisionTrees()]);
    const training = buildTrainingQuestions(currentRules).map((question) => ({ ruleIds: [question.ruleId], sourceIds: question.sourceIds }));
    const sourceByRuleId = new Map(currentRules.map((rule) => [rule.id, rule]));
    const simulation = simulationEvents.flatMap((event) => event.choices.map((choice) => ({ ruleIds: choice.ruleIds, sourceIds: [...new Set(choice.ruleIds.flatMap((ruleId) => { const rule = sourceByRuleId.get(ruleId); return rule ? sourceIdsForRule(rule, currentSources) : []; }))] })));
    const nextSources = currentSources.map((source) => source.id === id ? { ...source, status: nextStatus } : source);
    const propagation = calculateStalePropagation({ rules: currentRules, sources: nextSources, decisionTrees: currentTrees, training, simulation });
    const staleRuleIds = nextStatus === "superseded" ? propagation.ruleIds : [];
    const staleTreeIds = nextStatus === "superseded" ? propagation.decisionTreeIds : [];
    const sourceUpdate = db.update(sources).set({
      ...(patch.label === undefined ? {} : { label: patch.label }),
      ...(patch.description === undefined ? {} : { description: patch.description || null }),
      ...(patch.publisher === undefined ? {} : { publisher: patch.publisher || null }),
      ...(patch.version === undefined ? {} : { version: patch.version || null }),
      ...(patch.validFromDate === undefined ? {} : { validFromDate: patch.validFromDate || null }),
      ...(patch.validUntilDate === undefined ? {} : { validUntilDate: patch.validUntilDate || null }),
      ...(patch.status === undefined ? {} : { status: patch.status }),
      ...(patch.supersedesId === undefined ? {} : { supersedesId: patch.supersedesId }),
      lastCheckedAt: new Date(),
    }).where(eq(sources.id, id));
    const operations: BatchItem<"pg">[] = [sourceUpdate];
    staleRuleIds.forEach((ruleId) => operations.push(db.update(rules).set({ reviewStatus: "stale", updatedAt: new Date() }).where(eq(rules.id, ruleId))));
    staleTreeIds.forEach((treeId) => operations.push(db.update(decisionTrees).set({ reviewStatus: "stale", updatedAt: new Date() }).where(eq(decisionTrees.id, treeId))));
    operations.push(db.insert(auditLog).values({ id: crypto.randomUUID(), actorUserId: session.user.id, action: "source.update", entityType: "source", entityId: id, before: { label: before.label, status: before.status, version: before.version, supersedesId: before.supersedesId }, after: { label: patch.label ?? before.label, status: nextStatus, version: patch.version ?? before.version, supersedesId: patch.supersedesId === undefined ? before.supersedesId : patch.supersedesId, staleRuleIds, staleTreeIds } }));
    await db.batch(operations as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
    return NextResponse.json({ ok: true, stale: { rules: staleRuleIds.length, decisionTrees: staleTreeIds.length } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Izmena izvora nije uspela." }, { status: 400 });
  }
}
