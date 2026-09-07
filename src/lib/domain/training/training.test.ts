import { describe, expect, it } from "vitest";
import { rules } from "@/content/rules";
import { authoredTrainingQuestions } from "@/content/training-questions";
import { AUTHORED_QUESTION_COUNT, buildTrainingQuestions } from "./generate-questions";
import { assertTrainingCoverage, minimumQuestionsForSeverity } from "./coverage";
import { createKnowledgeState, updateKnowledgeState } from "./mastery";
import { isAnswerCorrect, scoreExam, selectNextQuestion } from "./selection-engine";
import { activeMisconceptions, targetsActiveMisconception, updateMisconceptions } from "./misconceptions";
import { MISCONCEPTION_TAGS, type MisconceptionState } from "./types";

const questions = buildTrainingQuestions(rules);

describe("banka pitanja", () => {
  it("pokriva svako pravilo prema severity pragu", () => {
    assertTrainingCoverage(rules, questions);
    for (const rule of rules) {
      expect(questions.filter((question) => question.ruleId === rule.id).length).toBeGreaterThanOrEqual(
        minimumQuestionsForSeverity(rule.severity),
      );
    }
  });

  it("sadrži autorska pitanja koja imaju prednost nad generisanima", () => {
    expect(AUTHORED_QUESTION_COUNT).toBeGreaterThanOrEqual(25);
    expect(questions.filter((question) => question.authored).length).toBe(AUTHORED_QUESTION_COUNT);
  });

  it("koristi više tipova pitanja, ne samo jedan", () => {
    const types = new Set(questions.map((question) => question.type));
    expect(types.size).toBeGreaterThanOrEqual(5);
    for (const expected of ["multi_choice", "true_false", "sequence", "numeric"]) {
      expect(types.has(expected as never)).toBe(true);
    }
  });

  it("autorska pitanja imaju validnu strukturu po tipu", () => {
    for (const question of authoredTrainingQuestions) {
      if (question.type === "numeric") {
        expect(question.numeric?.answer).toBeTypeOf("number");
      } else if (question.type === "sequence") {
        expect(question.correctOrder?.length).toBe(question.choices.length);
      } else {
        expect(question.choices.filter((choice) => choice.isCorrect).length).toBeGreaterThanOrEqual(1);
        expect(question.choices.length).toBeGreaterThanOrEqual(2);
      }
      for (const choice of question.choices) expect(choice.explanation.length).toBeGreaterThan(20);
      for (const tag of question.misconceptionTags ?? []) expect(MISCONCEPTION_TAGS).toContain(tag);
    }
  });
});

describe("mastery i izbor pitanja", () => {
  it("povećava mastery nakon tačnog odgovora i zakazuje ponavljanje", () => {
    const previous = createKnowledgeState("P01");
    const next = updateKnowledgeState(previous, {
      questionId: "P01-Q1",
      ruleId: "P01",
      correct: true,
      confidence: 0.9,
      answeredAt: new Date().toISOString(),
    });
    expect(next.mastery).toBeGreaterThan(previous.mastery);
    expect(Date.parse(next.nextReviewAt)).toBeGreaterThan(Date.now());
  });

  it("prioritizuje pravilo na kojem je korisnik pogrešio", () => {
    const target = questions[0];
    const weak = updateKnowledgeState(undefined, {
      questionId: target.id,
      ruleId: target.ruleId,
      correct: false,
      confidence: 0.2,
      answeredAt: new Date().toISOString(),
    });
    const next = selectNextQuestion([target, questions[1]], new Map([[target.ruleId, weak]]));
    expect(next?.id).toBe(target.id);
  });

  it("ocenjuje sve tipove odgovora", () => {
    const trueFalse = questions.find((question) => question.type === "true_false")!;
    const correctId = trueFalse.choices.find((choice) => choice.isCorrect)!.id;
    expect(isAnswerCorrect(trueFalse, { choiceIds: [correctId] })).toBe(true);

    const multi = questions.find((question) => question.type === "multi_choice")!;
    const allCorrect = multi.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id);
    expect(isAnswerCorrect(multi, { choiceIds: allCorrect })).toBe(true);
    expect(isAnswerCorrect(multi, { choiceIds: allCorrect.slice(0, 1) })).toBe(false);

    const sequence = questions.find((question) => question.type === "sequence")!;
    expect(isAnswerCorrect(sequence, { order: sequence.correctOrder })).toBe(true);
    expect(isAnswerCorrect(sequence, { order: [...sequence.correctOrder!].reverse() })).toBe(false);

    const numeric = questions.find((question) => question.type === "numeric")!;
    expect(isAnswerCorrect(numeric, { value: numeric.numeric!.answer })).toBe(true);
    expect(isAnswerCorrect(numeric, { value: numeric.numeric!.answer + 1 })).toBe(false);
  });

  it("računa breakdown ispita po težini", () => {
    const first = questions.find((question) => question.type !== "numeric" && question.type !== "sequence")!;
    const second = questions.find(
      (question) => question.id !== first.id && question.type !== "numeric" && question.type !== "sequence",
    )!;
    const result = scoreExam([
      { question: first, choiceIds: first.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id) },
      { question: second, choiceIds: [] },
    ]);
    expect(result.correct).toBe(1);
    expect(result.total).toBe(2);
    expect(result.bySeverity[first.difficulty]?.total).toBeGreaterThan(0);
  });
});

describe("misconception engine", () => {
  const answeredAt = new Date().toISOString();

  it("beleži zabludu iz pogrešnog odgovora i drži je aktivnom", () => {
    const states = updateMisconceptions({}, {
      questionId: "A-T02-helper",
      ruleId: "T02",
      correct: false,
      confidence: 0.8,
      answeredAt,
      misconception: "HELPER_ALWAYS_ILLEGAL",
      testedMisconceptions: ["HELPER_ALWAYS_ILLEGAL"],
    });
    expect(states.HELPER_ALWAYS_ILLEGAL.hits).toBe(1);
    expect(activeMisconceptions(states)).toContain("HELPER_ALWAYS_ILLEGAL");
  });

  it("cilja drugo pitanje koje testira istu zabludu", () => {
    const states = updateMisconceptions({}, {
      questionId: "A-T02-helper",
      ruleId: "T02",
      correct: false,
      confidence: 0.8,
      answeredAt,
      misconception: "HELPER_ALWAYS_ILLEGAL",
    });
    const followUp = questions.find(
      (question) => question.id === "A-T02-helper-scenario" && question.misconceptionTags?.includes("HELPER_ALWAYS_ILLEGAL"),
    );
    expect(followUp).toBeDefined();
    expect(targetsActiveMisconception(followUp!, states)).toBe(true);

    const picked = selectNextQuestion(questions, new Map(), new Set(["A-T02-helper"]), states);
    expect(picked?.misconceptionTags).toContain("HELPER_ALWAYS_ILLEGAL");
  });

  it("smatra zabludu ispravljenom tek posle dva uzastopna tačna odgovora", () => {
    let states: Record<string, MisconceptionState> = updateMisconceptions({}, {
      questionId: "q1",
      ruleId: "T02",
      correct: false,
      confidence: 0.5,
      answeredAt,
      misconception: "HELPER_ALWAYS_ILLEGAL",
    });
    states = updateMisconceptions(states, {
      questionId: "q2",
      ruleId: "T01",
      correct: true,
      confidence: 0.7,
      answeredAt,
      testedMisconceptions: ["HELPER_ALWAYS_ILLEGAL"],
    });
    expect(states.HELPER_ALWAYS_ILLEGAL.resolved).toBe(false);

    states = updateMisconceptions(states, {
      questionId: "q3",
      ruleId: "T01",
      correct: true,
      confidence: 0.9,
      answeredAt,
      testedMisconceptions: ["HELPER_ALWAYS_ILLEGAL"],
    });
    expect(states.HELPER_ALWAYS_ILLEGAL.resolved).toBe(true);
    expect(activeMisconceptions(states)).not.toContain("HELPER_ALWAYS_ILLEGAL");
  });
});
