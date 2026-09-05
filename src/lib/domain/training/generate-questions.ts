import type { Rule } from "@/lib/types";
import { sources } from "@/content/sources";
import { minimumQuestionsForSeverity } from "./coverage";
import type { TrainingQuestion } from "./types";

export function buildTrainingQuestions(rules: Rule[]): TrainingQuestion[] {
  return rules.flatMap((rule) => {
    const count = minimumQuestionsForSeverity(rule.severity);
    const difficulty = rule.severity === "ponistavanje" ? "annulment" : rule.severity === "krivicno_delo" ? "criminal" : rule.severity === "teska_nepravilnost" ? "heavy" : "normal";
    const sourceIds = [...new Set([
      ...(rule.lawReferences ?? []).map((reference) => sources.find((source) => source.url === reference.url)?.id),
      ...(rule.sourceUrls ?? []).map((sourceLink) => sources.find((source) => source.url === sourceLink.url)?.id),
    ].filter((sourceId): sourceId is string => Boolean(sourceId)))];
    return Array.from({ length: count }, (_, index) => {
      const classification = index === 0 && rule.mythCheck;
      const correctLabel = classification ? ({ mit: "Mit", cinjenica: "Činjenica", zavisi: "Zavisi" }[rule.mythCheck!.verdict]) : "Da, primeni navedenu proceduru";
      const wrongLabel = classification ? ({ mit: "Činjenica", cinjenica: "Mit", zavisi: "Uvek dozvoljeno" }[rule.mythCheck!.verdict]) : "Ne, može se ignorisati";
      const scenarioTemplates = [
        { prompt: `Situacija: ${rule.summary} Koji je prvi dokumentovani korak?`, correct: rule.controllerActions[0] ?? rule.legalRule, wrong: "Nastaviti bez provere i bez obaveštavanja odbora." },
        { prompt: `Situacija: ${rule.summary} Koju činjenicu treba posebno zabeležiti?`, correct: rule.evidenceChecklist[0] ?? rule.whatToCheck[0] ?? rule.legalRule, wrong: "Ne unositi vreme, učesnike ni okolnosti događaja." },
        { prompt: `Situacija: ${rule.summary} Koju radnju treba izbeći?`, correct: rule.doNotDo[0] ?? "Ne preskakati propisanu proveru i unos u zapisnik.", wrong: rule.controllerActions[0] ?? "Ignorisati događaj." },
        { prompt: `Situacija: ${rule.summary} Koji je relevantan pravni efekat?`, correct: rule.legalEffect ?? rule.legalRule, wrong: "Događaj nema nikakav proceduralni ili pravni značaj." },
      ][(index - (classification ? 1 : 0)) % 4];
      return {
        id: `${rule.id}-Q${index + 1}`,
        ruleId: rule.id,
        type: classification ? "classification" : "scenario",
        prompt: classification ? `Kako klasifikuješ tvrdnju: „${rule.mythCheck!.claim}“?` : scenarioTemplates.prompt,
        choices: [
          { id: "correct", label: classification ? correctLabel : scenarioTemplates.correct, isCorrect: true, explanation: classification ? rule.mythCheck!.explanation : rule.legalRule },
          { id: "wrong", label: classification ? wrongLabel : scenarioTemplates.wrong, isCorrect: false, explanation: "Ovaj odgovor nije u skladu sa opisanim pravilom i pravnim osnovom." },
        ],
        difficulty,
        publicationStatus: rule.publicationStatus ?? "published",
        reviewStatus: rule.reviewStatus ?? "legal_review",
        sourceIds,
      };
    });
  });
}
