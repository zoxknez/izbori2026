import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import {
  rules as rulesTable,
  criminalArticles as criminalArticlesTable,
  sources as sourcesTable,
  decisionTrees as decisionTreesTable,
  decisionNodes as decisionNodesTable,
} from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import type { Rule } from "@/lib/types";
import type { RuleRow } from "@/lib/db/schema";

const VALID_SEVERITIES = new Set<Rule["severity"]>([
  "ponistavanje",
  "teska_nepravilnost",
  "krivicno_delo",
  "nepravilnost",
  "proveri",
  "info",
  "dozvoljeno",
]);

function toRule(row: RuleRow): Rule {
  return {
    id: row.id,
    slug: row.slug,
    naziv: row.naziv,
    kategorija: row.kategorija,
    severity: VALID_SEVERITIES.has(row.severity as Rule["severity"])
      ? (row.severity as Rule["severity"])
      : (() => {
          throw new Error(`Nepoznata težina pravila: ${row.id}`);
        })(),
    electionTypes: row.electionTypes ?? [],
    phase: row.phase,
    phases: (row.phases?.length ? row.phases : [row.phase]) as Rule["phases"],
    summary: row.summary,
    legalRule: row.legalRule,
    pravniOsnov: row.lawReferences?.[0]?.law,
    legalEffect: row.legalEffect ?? undefined,
    whatToCheck: row.whatToCheck ?? [],
    controllerActions: row.controllerActions ?? [],
    voterActions: row.voterActions ?? [],
    observerActions: row.observerActions ?? [],
    evidenceChecklist: row.evidenceChecklist ?? [],
    doNotDo: row.doNotDo ?? [],
    lawReferences: row.lawReferences ?? [],
    sourceUrls: row.sourceUrls ?? [],
    relatedSlugs: row.relatedSlugs ?? [],
    mythCheck: row.mythCheck ?? null,
    isAutomaticAnnulment: row.isAutomaticAnnulment ?? false,
    order: row.order ?? 0,
    publicationStatus: (row.publicationStatus as Rule["publicationStatus"]) ?? "published",
    reviewStatus: (row.reviewStatus as Rule["reviewStatus"]) ?? "REVIEW_REQUIRED",
    lastLegalReview: row.lastLegalReview ?? undefined,
  };
}

export const getAllRules = cache(async (): Promise<Rule[]> => {
  const rows = await db.select().from(rulesTable).orderBy(asc(rulesTable.order));
  return rows.map(toRule);
});

export const getRuleBySlug = cache(async (slug: string): Promise<Rule | undefined> => {
  const all = await getAllRules();
  return all.find((r) => r.slug === slug);
});

export const getRulesByIds = cache(async (ids: string[]): Promise<Rule[]> => {
  const all = await getAllRules();
  const map = new Map(all.map((r) => [r.id, r]));
  return ids.map((id) => map.get(id)).filter((r): r is Rule => Boolean(r));
});

export async function getCriminalArticles() {
  const rows = await db.select().from(criminalArticlesTable).orderBy(asc(criminalArticlesTable.order));
  return rows.map((row) => ({ ...row, nijeDokaz: row.nijeDokaz ?? undefined, order: row.order ?? 0 }));
}

export async function getSources() {
  const rows = await db.select().from(sourcesTable).orderBy(asc(sourcesTable.tier));
  return rows.map((row) => ({
    ...row,
    tier: row.tier as 1 | 2 | 3,
    description: row.description ?? undefined,
    order: row.order ?? 0,
    publisher: row.publisher ?? undefined,
    version: row.version ?? undefined,
    validFromDate: row.validFromDate ?? undefined,
    validUntilDate: row.validUntilDate ?? undefined,
    status: (row.status as "active" | "superseded" | "archived") ?? "active",
    supersedesId: row.supersedesId ?? undefined,
  }));
}

export const getDecisionTrees = cache(async () => {
  const [trees, nodes] = await Promise.all([
    db.select().from(decisionTreesTable).orderBy(asc(decisionTreesTable.order)),
    db.select().from(decisionNodesTable).orderBy(asc(decisionNodesTable.order)),
  ]);
  return trees.map((tree) => ({
    id: tree.id,
    slug: tree.slug,
    title: tree.title,
    description: tree.description,
    startNodeId: tree.startNodeId,
    publicationStatus: (tree.publicationStatus as "draft" | "published" | "archived") ?? "published",
    reviewStatus: (tree.reviewStatus as "UNREVIEWED" | "REVIEW_REQUIRED" | "REVIEWED") ?? "REVIEW_REQUIRED",
    order: tree.order ?? 0,
    nodes: nodes
      .filter((node) => node.treeId === tree.id)
      .map((node) => ({
        id: node.id,
        type: node.type as "question" | "result",
        prompt: node.prompt,
        options: node.options ?? [],
        ruleIds: node.ruleIds ?? [],
        order: node.order ?? 0,
      })),
  }));
});
