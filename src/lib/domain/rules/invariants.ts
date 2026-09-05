import { z } from "zod";
import {
  ELECTION_PHASES,
  PUBLICATION_STATUSES,
  REVIEW_STATUSES,
  SEVERITY_ORDER,
  SEVERITY_META,
  type Rule,
} from "@/lib/types";

export const ruleSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  naziv: z.string().min(1),
  kategorija: z.string().min(1),
  severity: z.enum(SEVERITY_ORDER),
  electionTypes: z.array(z.string()),
  phase: z.string().min(1),
  phases: z.array(z.enum(ELECTION_PHASES)).min(1),
  summary: z.string().min(1),
  legalRule: z.string().min(1),
  legalEffect: z.string().optional(),
  whatToCheck: z.array(z.string()),
  controllerActions: z.array(z.string()),
  voterActions: z.array(z.string()),
  observerActions: z.array(z.string()),
  evidenceChecklist: z.array(z.string()),
  doNotDo: z.array(z.string()),
  lawReferences: z.array(z.object({ law: z.string(), article: z.string(), url: z.string().url().optional() })),
  sourceUrls: z.array(z.object({ label: z.string(), url: z.string().url() })),
  relatedSlugs: z.array(z.string()),
  mythCheck: z.object({
    claim: z.string(),
    verdict: z.enum(["mit", "cinjenica", "zavisi"]),
    explanation: z.string(),
  }).nullable().optional(),
  isAutomaticAnnulment: z.boolean(),
  order: z.number().int().nonnegative(),
  publicationStatus: z.enum(PUBLICATION_STATUSES),
  reviewStatus: z.enum(REVIEW_STATUSES),
  lastLegalReview: z.string().optional(),
});

export type CanonicalRule = z.infer<typeof ruleSchema>;

export function canonicalizeRule(rule: Rule): CanonicalRule {
  const phases = rule.phases?.length ? rule.phases : [rule.phase as CanonicalRule["phases"][number]];
  const isAutomaticAnnulment = rule.severity === "ponistavanje";
  const canonical = ruleSchema.parse({
    ...rule,
    phases,
    isAutomaticAnnulment,
    order: rule.order ?? 0,
    publicationStatus: rule.publicationStatus ?? "published",
    reviewStatus: rule.reviewStatus ?? "legal_review",
    mythCheck: rule.mythCheck ?? null,
  });

  if (rule.isAutomaticAnnulment !== undefined && rule.isAutomaticAnnulment !== isAutomaticAnnulment) {
    throw new Error(`Invarijanta ${rule.id}: automatsko poništavanje mora biti izvedeno iz severity.`);
  }

  return canonical;
}

export function assertRulesInvariants(rules: Rule[]): CanonicalRule[] {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const canonical = rules.map((rule) => {
    const value = canonicalizeRule(rule);
    if (seenIds.has(value.id) || seenSlugs.has(value.slug)) {
      throw new Error(`Duplikat pravila: ${value.id}/${value.slug}`);
    }
    seenIds.add(value.id);
    seenSlugs.add(value.slug);
    if (SEVERITY_META[value.severity].label.length === 0) {
      throw new Error(`Nedostaje labela za severity ${value.severity}`);
    }
    return value;
  });
  return canonical;
}
