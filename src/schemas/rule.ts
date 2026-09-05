import { z } from "zod";
import { ELECTION_PHASES, PUBLICATION_STATUSES, REVIEW_STATUSES, SEVERITY_ORDER } from "@/lib/types";

export const ruleSchema = z.object({
  id: z.string().min(1), slug: z.string().min(1), naziv: z.string().min(1), kategorija: z.string().min(1),
  severity: z.enum(SEVERITY_ORDER), electionTypes: z.array(z.string()), phases: z.array(z.enum(ELECTION_PHASES)).min(1),
  summary: z.string().min(1), legalRule: z.string().min(1), legalEffect: z.string().optional(),
  whatToCheck: z.array(z.string()), controllerActions: z.array(z.string()), voterActions: z.array(z.string()),
  observerActions: z.array(z.string()), evidenceChecklist: z.array(z.string()), doNotDo: z.array(z.string()),
  lawReferences: z.array(z.object({ law: z.string(), article: z.string(), url: z.string().url().optional() })),
  sourceUrls: z.array(z.object({ label: z.string(), url: z.string().url() })), relatedSlugs: z.array(z.string()),
  aliases: z.array(z.string()).default([]), informalQueries: z.array(z.string()).default([]),
  mythCheck: z.object({ claim: z.string(), verdict: z.enum(["mit", "cinjenica", "zavisi"]), explanation: z.string() }).nullable().optional(),
  isAutomaticAnnulment: z.boolean(), order: z.number().int().nonnegative(),
  publicationStatus: z.enum(PUBLICATION_STATUSES), reviewStatus: z.enum(REVIEW_STATUSES), lastLegalReview: z.string().optional(),
});

export type CanonicalRule = z.infer<typeof ruleSchema>;
