import "server-only";
import type { DatasetSnapshot } from "./dataset-validator";
import { getAllRules, getDecisionTrees, getSources } from "@/lib/data";
import { buildTrainingQuestions } from "@/lib/domain/training/generate-questions";
import { simulationEvents } from "@/lib/domain/simulator/seed-events";
import { canonicalizeRule } from "@/lib/domain/rules/invariants";
import { sourceIdsForRule } from "@/lib/domain/legal/dependency-graph";

export async function createCurrentDatasetSnapshot(version = `admin-${Date.now()}`): Promise<DatasetSnapshot> {
  const [rules, sources, decisionTrees] = await Promise.all([getAllRules(), getSources(), getDecisionTrees()]);
  const canonicalRules = rules.map(canonicalizeRule);
  const questions = buildTrainingQuestions(canonicalRules);
  const ruleById = new Map(canonicalRules.map((rule) => [rule.id, rule]));
  return {
    schemaVersion: 1,
    version,
    generatedAt: new Date().toISOString(),
    rules: canonicalRules,
    sources,
    decisionTrees,
    training: questions.map((question) => ({ ruleIds: [question.ruleId], sourceIds: question.sourceIds })),
    simulation: simulationEvents.flatMap((event) => event.choices.map((choice) => ({
      ruleIds: choice.ruleIds,
      sourceIds: [...new Set(choice.ruleIds.flatMap((ruleId) => {
        const rule = ruleById.get(ruleId);
        return rule ? sourceIdsForRule(rule, sources) : [];
      }))],
    }))),
  };
}
