import { describe, expect, it } from "vitest";
import { rules } from "@/content/rules";
import { buildTrainingQuestions } from "./generate-questions";
import { assertTrainingCoverage, minimumQuestionsForSeverity } from "./coverage";
import { createKnowledgeState, updateKnowledgeState } from "./mastery";
import { selectNextQuestion, scoreExam } from "./selection-engine";

describe("training engine", () => {
  const questions = buildTrainingQuestions(rules);

  it("pokriva svih 66 pravila prema severity pragu", () => {
    assertTrainingCoverage(rules, questions);
    expect(questions.length).toBeGreaterThan(160);
    for (const rule of rules) expect(questions.filter((question) => question.ruleId === rule.id).length).toBeGreaterThanOrEqual(minimumQuestionsForSeverity(rule.severity));
  });

  it("povećava mastery nakon tačnog odgovora i zakazuje ponavljanje", () => {
    const previous = createKnowledgeState("P01");
    const next = updateKnowledgeState(previous, { questionId: "P01-Q1", ruleId: "P01", correct: true, confidence: 0.9, answeredAt: new Date().toISOString() });
    expect(next.mastery).toBeGreaterThan(previous.mastery);
    expect(Date.parse(next.nextReviewAt)).toBeGreaterThan(Date.now());
  });

  it("prioritizuje pitanje sa greškom i računa breakdown ispita", () => {
    const target = questions[0];
    const weak = updateKnowledgeState(undefined, { questionId: target.id, ruleId: target.ruleId, correct: false, confidence: 0.2, answeredAt: new Date().toISOString() });
    const next = selectNextQuestion([target, questions[1]], new Map([[target.ruleId, weak]]));
    expect(next?.id).toBe(target.id);
    const result = scoreExam([{ question: target, choiceId: "correct" }, { question: questions[1], choiceId: "wrong" }]);
    expect(result.correct).toBe(1);
    expect(result.total).toBe(2);
    expect(result.bySeverity[target.difficulty]?.total).toBeGreaterThan(0);
  });
});
