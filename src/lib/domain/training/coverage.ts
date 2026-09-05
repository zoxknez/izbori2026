import type { Rule, Severity } from "@/lib/types";
import type { TrainingQuestion } from "./types";

export function minimumQuestionsForSeverity(severity: Severity): number {
  if (severity === "ponistavanje") return 4;
  if (severity === "krivicno_delo") return 4;
  if (severity === "teska_nepravilnost") return 3;
  return 2;
}

export interface CoverageGap {
  ruleId: string;
  required: number;
  actual: number;
}

export function checkTrainingCoverage(rules: Rule[], questions: TrainingQuestion[]): CoverageGap[] {
  const counts = new Map<string, number>();
  questions.forEach((question) => counts.set(question.ruleId, (counts.get(question.ruleId) ?? 0) + 1));
  return rules.flatMap((rule) => {
    const required = minimumQuestionsForSeverity(rule.severity);
    const actual = counts.get(rule.id) ?? 0;
    return actual >= required ? [] : [{ ruleId: rule.id, required, actual }];
  });
}

export function assertTrainingCoverage(rules: Rule[], questions: TrainingQuestion[]): void {
  const gaps = checkTrainingCoverage(rules, questions);
  if (gaps.length > 0) throw new Error(`Training coverage nije zadovoljen: ${gaps.map((gap) => `${gap.ruleId} ${gap.actual}/${gap.required}`).join(", ")}`);
}
