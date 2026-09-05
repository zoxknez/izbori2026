import type { Rule } from "@/lib/types";
import { minimumQuestionsForSeverity } from "./coverage";
import type { TrainingQuestion } from "./types";

export function buildTrainingQuestions(rules: Rule[]): TrainingQuestion[] {
  return rules.flatMap((rule) => {
    const count = minimumQuestionsForSeverity(rule.severity);
    const difficulty = rule.severity === "ponistavanje" ? "annulment" : rule.severity === "krivicno_delo" ? "criminal" : rule.severity === "teska_nepravilnost" ? "heavy" : "normal";
    return Array.from({ length: count }, (_, index) => {
      const classification = index === 0 && rule.mythCheck;
      const correctLabel = classification ? ({ mit: "Mit", cinjenica: "Činjenica", zavisi: "Zavisi" }[rule.mythCheck!.verdict]) : "Da, primeni navedenu proceduru";
      const wrongLabel = classification ? ({ mit: "Činjenica", cinjenica: "Mit", zavisi: "Uvek dozvoljeno" }[rule.mythCheck!.verdict]) : "Ne, može se ignorisati";
      return {
        id: `${rule.id}-Q${index + 1}`,
        ruleId: rule.id,
        type: classification ? "classification" : "scenario",
        prompt: classification ? `Kako klasifikuješ tvrdnju: „${rule.mythCheck!.claim}“?` : `Situacija: ${rule.summary} Šta je ispravan prvi korak?`,
        choices: [
          { id: "correct", label: correctLabel, isCorrect: true, explanation: classification ? rule.mythCheck!.explanation : rule.controllerActions[0] ?? rule.legalRule },
          { id: "wrong", label: wrongLabel, isCorrect: false, explanation: "Ovaj odgovor nije u skladu sa opisanim pravilom i pravnim osnovom." },
        ],
        difficulty,
        publicationStatus: rule.publicationStatus ?? "published",
        reviewStatus: rule.reviewStatus ?? "legal_review",
        sourceIds: [],
      };
    });
  });
}
