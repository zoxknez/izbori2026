import { config } from "dotenv";
config({ path: ".env.local" });
import type { DatasetSnapshot } from "../src/lib/offline/dataset-validator";
import { simulationEvents } from "../src/lib/domain/simulator/seed-events";

async function main() {
  const [{ db }, schema, validator] = await Promise.all([
    import("../src/lib/db"),
    import("../src/lib/db/schema"),
    import("../src/lib/offline/dataset-validator"),
  ]);
  const { asc, eq } = await import("drizzle-orm");
  const { buildTrainingQuestions } = await import("../src/lib/domain/training/generate-questions");
  const version = process.env.DATASET_VERSION ?? `2026.09.05-${Date.now()}`;
  const snapshot: DatasetSnapshot = {
    schemaVersion: 1 as const,
    version,
    generatedAt: new Date().toISOString(),
    rules: (await db.select().from(schema.rules).orderBy(asc(schema.rules.order))).map((row) => ({
      id: row.id, slug: row.slug, naziv: row.naziv, kategorija: row.kategorija,
      severity: row.severity as DatasetSnapshot["rules"][number]["severity"],
      electionTypes: row.electionTypes ?? [], phase: row.phase, phases: (row.phases?.length ? row.phases : [row.phase]) as DatasetSnapshot["rules"][number]["phases"],
      summary: row.summary, legalRule: row.legalRule, legalEffect: row.legalEffect ?? undefined,
      whatToCheck: row.whatToCheck ?? [], controllerActions: row.controllerActions ?? [], voterActions: row.voterActions ?? [], observerActions: row.observerActions ?? [], evidenceChecklist: row.evidenceChecklist ?? [], doNotDo: row.doNotDo ?? [], lawReferences: row.lawReferences ?? [], sourceUrls: row.sourceUrls ?? [], relatedSlugs: row.relatedSlugs ?? [], aliases: row.aliases ?? [], informalQueries: row.informalQueries ?? [], mythCheck: row.mythCheck ?? null,
      isAutomaticAnnulment: row.severity === "ponistavanje", order: row.order ?? 0,
      publicationStatus: (row.publicationStatus as "draft" | "published" | "archived") ?? "published",
      reviewStatus: (row.reviewStatus as "unreviewed" | "content_review" | "legal_review" | "verified" | "stale") ?? "legal_review",
      lastLegalReview: row.lastLegalReview ?? undefined,
    })),
    sources: (await db.select().from(schema.sources).orderBy(asc(schema.sources.tier))).map((row) => ({
      id: row.id, tier: row.tier as 1 | 2 | 3, type: (row.type as "law" | "bylaw" | "rik" | "court" | "odihr" | "observer_report" | "other") ?? "other", label: row.label, url: row.url, description: row.description ?? undefined,
      publisher: row.publisher ?? undefined, version: row.version ?? undefined, validFromDate: row.validFromDate ?? undefined,
      validUntilDate: row.validUntilDate ?? undefined, status: (row.status as "active" | "superseded" | "archived") ?? "active", supersedesId: row.supersedesId ?? undefined,
    })),
    decisionTrees: (await db.select().from(schema.decisionTrees).orderBy(asc(schema.decisionTrees.order))).map((tree) => ({
      id: tree.id, slug: tree.slug, title: tree.title, description: tree.description, startNodeId: tree.startNodeId,
      publicationStatus: (tree.publicationStatus as "draft" | "published" | "archived") ?? "published",
      reviewStatus: (tree.reviewStatus as "unreviewed" | "content_review" | "legal_review" | "verified" | "stale") ?? "legal_review", order: tree.order ?? 0,
      nodes: [],
    })),
    training: [],
    simulation: [],
  };
  const treeNodes = await db.select().from(schema.decisionNodes).orderBy(asc(schema.decisionNodes.order));
  snapshot.decisionTrees.forEach((tree) => {
    tree.nodes = treeNodes.filter((node) => node.treeId === tree.id).map((node) => ({ id: node.id, type: node.type as "question" | "result", prompt: node.prompt, options: node.options ?? [], ruleIds: node.ruleIds ?? [], order: node.order ?? 0 }));
  });
  snapshot.training = buildTrainingQuestions(snapshot.rules).map((question) => ({ ruleIds: [question.ruleId], sourceIds: question.sourceIds }));
  snapshot.simulation = simulationEvents.flatMap((event) => event.choices.map((choice) => ({ ruleIds: choice.ruleIds, sourceIds: [] })));
  const parsed = validator.datasetSnapshotSchema.parse(snapshot);
  const serialized = validator.stableStringify(parsed);
  const sha256 = await validator.sha256Hex(serialized);
  const size = new TextEncoder().encode(serialized).byteLength;
  const datasetFile = { filename: "snapshot.json", payload: parsed, sha256, size };
  const datasetId = `DS-${version.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 24)}`;

  await db.update(schema.datasetVersions).set({ status: "archived" }).where(eq(schema.datasetVersions.status, "active"));
  await db.insert(schema.datasetVersions).values({
    id: datasetId,
    version,
    status: "active",
    updatePriority: "normal",
    legalReviewDate: process.env.LEGAL_REVIEW_DATE,
    manifestHash: sha256,
    publishedAt: new Date(),
    publishedBy: "bootstrap-script",
  }).onConflictDoUpdate({
    target: schema.datasetVersions.version,
    set: { status: "active", manifestHash: sha256, publishedAt: new Date() },
  });
  await db.insert(schema.datasetFiles).values({
    id: `${datasetId}:snapshot.json`,
    datasetVersionId: datasetId,
    filename: datasetFile.filename,
    payload: datasetFile.payload,
    sha256: datasetFile.sha256,
    size: datasetFile.size,
  }).onConflictDoUpdate({
    target: schema.datasetFiles.id,
    set: { datasetVersionId: datasetId, payload: datasetFile.payload, sha256, size },
  });
  console.log(`Dataset ${version} je aktivan (${size} B, ${parsed.rules.length} pravila).`);
}

main().catch((error) => { console.error(error); process.exit(1); });
