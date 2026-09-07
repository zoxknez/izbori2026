import { isDue } from "./mastery";
import { targetsActiveMisconception } from "./misconceptions";
import type { KnowledgeState, MisconceptionState, TrainingQuestion } from "./types";

export interface SelectionContext {
  knowledge: Map<string, KnowledgeState>;
  misconceptions?: Record<string, MisconceptionState>;
  now?: number;
}

/**
 * Težina pitanja pri izboru sledećeg. Namerno deterministički, bez nasumičnog mešanja:
 * slabe oblasti, nerešene zablude i pitanja koja su „dospela“ za ponavljanje idu prva.
 */
export function questionWeight(question: TrainingQuestion, context: SelectionContext): number {
  const state = context.knowledge.get(question.ruleId);
  const now = context.now ?? Date.now();

  const dueBoost = isDue(state, now) ? 3 : 0;
  const weaknessBoost = 1 + (1 - (state?.mastery ?? 0));
  const retryBoost = state && state.attempts > 0 && state.correct < state.attempts ? 2 : 0;
  const misconceptionBoost = context.misconceptions && targetsActiveMisconception(question, context.misconceptions) ? 4 : 0;
  const authoredBoost = question.authored ? 1.5 : 0;

  return dueBoost + weaknessBoost + retryBoost + misconceptionBoost + authoredBoost;
}

export function selectNextQuestion(
  questions: TrainingQuestion[],
  knowledge: Map<string, KnowledgeState>,
  excludedIds = new Set<string>(),
  misconceptions?: Record<string, MisconceptionState>,
): TrainingQuestion | undefined {
  const context: SelectionContext = { knowledge, misconceptions };
  return questions
    .filter((question) => !excludedIds.has(question.id))
    .sort((a, b) => questionWeight(b, context) - questionWeight(a, context) || a.id.localeCompare(b.id))[0];
}

/** Da li je odgovor tačan, za sve tipove pitanja. */
export function isAnswerCorrect(
  question: TrainingQuestion,
  answer: { choiceIds?: string[]; order?: string[]; value?: number | null },
): boolean {
  if (question.type === "numeric") {
    return typeof answer.value === "number" && question.numeric?.answer === answer.value;
  }
  if (question.type === "sequence") {
    const expected = question.correctOrder ?? [];
    return Boolean(answer.order && answer.order.length === expected.length && answer.order.every((id, index) => id === expected[index]));
  }
  const selected = new Set(answer.choiceIds ?? []);
  const correct = new Set(question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id));
  if (question.type === "multi_choice") {
    return selected.size === correct.size && [...correct].every((id) => selected.has(id));
  }
  return selected.size === 1 && correct.has([...selected][0]);
}

export function scoreExam(
  answers: Array<{ question: TrainingQuestion; choiceIds?: string[]; order?: string[]; value?: number | null }>,
) {
  const evaluated = answers.map((answer) => ({ ...answer, correct: isAnswerCorrect(answer.question, answer) }));
  const correct = evaluated.filter((answer) => answer.correct).length;
  const total = evaluated.length;
  const bySeverity = evaluated.reduce<Record<string, { correct: number; total: number }>>((result, answer) => {
    const bucket = result[answer.question.difficulty] ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (answer.correct) bucket.correct += 1;
    result[answer.question.difficulty] = bucket;
    return result;
  }, {});
  return { correct, total, percentage: total ? Math.round((correct / total) * 100) : 0, bySeverity };
}
