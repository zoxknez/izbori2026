import { SEVERITY_META, type Rule } from "@/lib/types";
import { ruleSchema, type CanonicalRule } from "@/schemas/rule";

export { ruleSchema } from "@/schemas/rule";
export type { CanonicalRule } from "@/schemas/rule";

export function canonicalizeRule(rule: Rule): CanonicalRule {
  const phases = rule.phases;
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
