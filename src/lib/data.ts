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
  }));
}
