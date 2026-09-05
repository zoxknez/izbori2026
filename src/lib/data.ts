import "server-only";
import { db } from "@/lib/db";
import { rules as rulesTable, criminalArticles as criminalArticlesTable, sources as sourcesTable } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import type { Rule } from "@/lib/types";
import type { RuleRow } from "@/lib/db/schema";

function toRule(row: RuleRow): Rule {
  return {
    id: row.id,
    slug: row.slug,
    naziv: row.naziv,
    kategorija: row.kategorija,
    severity: row.severity as Rule["severity"],
    electionTypes: row.electionTypes ?? [],
    phase: row.phase,
    summary: row.summary,
    legalRule: row.legalRule,
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
    reviewStatus: row.reviewStatus ?? undefined,
    lastLegalReview: row.lastLegalReview ?? undefined,
  };
}

export async function getAllRules(): Promise<Rule[]> {
  const rows = await db.select().from(rulesTable).orderBy(asc(rulesTable.order));
  return rows.map(toRule);
}

export async function getRuleBySlug(slug: string): Promise<Rule | undefined> {
  const all = await getAllRules();
  return all.find((r) => r.slug === slug);
}

export async function getRulesByIds(ids: string[]): Promise<Rule[]> {
  const all = await getAllRules();
  const map = new Map(all.map((r) => [r.id, r]));
  return ids.map((id) => map.get(id)).filter((r): r is Rule => Boolean(r));
}

export async function getCriminalArticles() {
  return db.select().from(criminalArticlesTable).orderBy(asc(criminalArticlesTable.order));
}

export async function getSources() {
  return db.select().from(sourcesTable).orderBy(asc(sourcesTable.tier));
}
