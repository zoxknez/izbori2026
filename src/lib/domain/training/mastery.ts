import type { KnowledgeState, TrainingAnswer } from "./types";

const INTERVALS_DAYS = [0, 1, 3, 7, 14, 30];

export function createKnowledgeState(ruleId: string): KnowledgeState {
  return { ruleId, attempts: 0, correct: 0, mastery: 0, streak: 0, confidence: 0, nextReviewAt: new Date(0).toISOString() };
}

export function updateKnowledgeState(previous: KnowledgeState | undefined, answer: TrainingAnswer): KnowledgeState {
  const state = previous ?? createKnowledgeState(answer.ruleId);
  const attempts = state.attempts + 1;
  const correct = state.correct + (answer.correct ? 1 : 0);
  const streak = answer.correct ? state.streak + 1 : 0;
  const confidence = Math.max(0, Math.min(1, answer.confidence));
  const intervalIndex = answer.correct ? Math.min(streak, INTERVALS_DAYS.length - 1) : 0;
  const days = INTERVALS_DAYS[intervalIndex] * (0.75 + confidence * 0.5);
  const nextReviewAt = new Date(Date.now() + days * 86_400_000).toISOString();
  return { ...state, attempts, correct, streak, confidence, mastery: Math.max(0, Math.min(1, correct / attempts * 0.7 + confidence * 0.3)), nextReviewAt, lastAnsweredAt: answer.answeredAt };
}

export function isDue(state: KnowledgeState | undefined, now = Date.now()): boolean {
  return !state || Date.parse(state.nextReviewAt) <= now;
}
