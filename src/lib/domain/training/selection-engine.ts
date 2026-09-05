import { isDue } from "./mastery";
import type { KnowledgeState, TrainingQuestion } from "./types";

export function questionWeight(question: TrainingQuestion, states: Map<string, KnowledgeState>, now = Date.now()): number {
  const state = states.get(question.ruleId);
  const dueBoost = isDue(state, now) ? 3 : 0;
  const weaknessBoost = 1 + (1 - (state?.mastery ?? 0));
  const retryBoost = state && state.attempts > 0 && state.correct < state.attempts ? 2 : 0;
  return dueBoost + weaknessBoost + retryBoost;
}

export function selectNextQuestion(questions: TrainingQuestion[], states: Map<string, KnowledgeState>, excludedIds = new Set<string>()): TrainingQuestion | undefined {
  return questions
    .filter((question) => !excludedIds.has(question.id))
    .sort((a, b) => questionWeight(b, states) - questionWeight(a, states) || a.id.localeCompare(b.id))[0];
}

export function scoreExam(answers: Array<{ question: TrainingQuestion; choiceId: string }>) {
  const correct = answers.filter(({ question, choiceId }) => question.choices.some((choice) => choice.id === choiceId && choice.isCorrect)).length;
  const total = answers.length;
  const bySeverity = answers.reduce<Record<string, { correct: number; total: number }>>((result, { question, choiceId }) => {
    const bucket = result[question.difficulty] ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (question.choices.some((choice) => choice.id === choiceId && choice.isCorrect)) bucket.correct += 1;
    result[question.difficulty] = bucket;
    return result;
  }, {});
  return { correct, total, percentage: total ? Math.round(correct / total * 100) : 0, bySeverity };
}
