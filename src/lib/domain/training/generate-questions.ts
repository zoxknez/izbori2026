import type { Rule } from "@/lib/types";
import { sources } from "@/content/sources";
import { authoredTrainingQuestions } from "@/content/training-questions";
import { minimumQuestionsForSeverity } from "./coverage";
import type { TrainingQuestion } from "./types";

function difficultyFor(rule: Rule): TrainingQuestion["difficulty"] {
  if (rule.severity === "ponistavanje") return "annulment";
  if (rule.severity === "krivicno_delo") return "criminal";
  if (rule.severity === "teska_nepravilnost") return "heavy";
  return "normal";
}

function sourceIdsFor(rule: Rule): string[] {
  return [
    ...new Set(
      [
        ...(rule.lawReferences ?? []).map((reference) => sources.find((source) => source.url === reference.url)?.id),
        ...(rule.sourceUrls ?? []).map((sourceLink) => sources.find((source) => source.url === sourceLink.url)?.id),
      ].filter((sourceId): sourceId is string => Boolean(sourceId)),
    ),
  ];
}

/**
 * Popunjava coverage tamo gde nema autorskih pitanja.
 * Generisana pitanja su namerno konzervativna: ne izmišljaju pravni zaključak,
 * već proveravaju radnje i efekte koji već stoje u samom pravilu.
 */
function generateFallbackQuestions(rule: Rule, count: number, startIndex: number): TrainingQuestion[] {
  const difficulty = difficultyFor(rule);
  const sourceIds = sourceIdsFor(rule);

  const templates = [
    {
      prompt: `Situacija: ${rule.summary} Koji je prvi dokumentovani korak?`,
      correct: rule.controllerActions[0] ?? rule.legalRule,
      wrong: "Nastaviti bez provere i bez obaveštavanja ostalih članova odbora.",
    },
    {
      prompt: `Situacija: ${rule.summary} Koju činjenicu treba posebno zabeležiti?`,
      correct: rule.evidenceChecklist[0] ?? rule.whatToCheck[0] ?? rule.legalRule,
      wrong: "Nije potrebno beležiti vreme, učesnike ni okolnosti događaja.",
    },
    {
      prompt: `Situacija: ${rule.summary} Šta je pravni efekat ovakvog postupanja?`,
      correct: rule.legalEffect ?? rule.legalRule,
      wrong: "Događaj nema nikakav proceduralni ni pravni značaj.",
    },
    {
      prompt: `Situacija: ${rule.summary} Koju radnju treba izbeći?`,
      correct: rule.doNotDo[0] ?? "Preskakanje propisane provere i izostanak unosa u zapisnik.",
      wrong: rule.controllerActions[0] ?? "Postupanje po propisanoj proceduri.",
    },
  ];

  return Array.from({ length: count }, (_, index) => {
    const isMythCheck = index === 0 && Boolean(rule.mythCheck);
    const template = templates[(index + startIndex) % templates.length];
    const verdictLabels = { mit: "Mit", cinjenica: "Činjenica", zavisi: "Zavisi od okolnosti" } as const;
    const oppositeLabels = { mit: "Činjenica", cinjenica: "Mit", zavisi: "Uvek dozvoljeno" } as const;

    return {
      id: `${rule.id}-G${startIndex + index + 1}`,
      ruleId: rule.id,
      type: isMythCheck ? "classification" : "scenario",
      prompt: isMythCheck ? `Kako klasifikuješ tvrdnju: „${rule.mythCheck!.claim}“?` : template.prompt,
      choices: [
        {
          id: "correct",
          label: isMythCheck ? verdictLabels[rule.mythCheck!.verdict] : template.correct,
          isCorrect: true,
          explanation: isMythCheck ? rule.mythCheck!.explanation : rule.legalRule,
        },
        {
          id: "wrong",
          label: isMythCheck ? oppositeLabels[rule.mythCheck!.verdict] : template.wrong,
          isCorrect: false,
          explanation: "Ovaj odgovor nije u skladu sa opisanim pravilom i njegovim pravnim osnovom.",
        },
      ],
      difficulty,
      publicationStatus: rule.publicationStatus ?? "published",
      reviewStatus: rule.reviewStatus ?? "legal_review",
      sourceIds,
    } satisfies TrainingQuestion;
  });
}

/**
 * Banka pitanja = autorska pitanja + generisana dopuna do coverage praga.
 * Autorska uvek imaju prednost i nikada se ne prepisuju.
 */
export function buildTrainingQuestions(rules: Rule[]): TrainingQuestion[] {
  const ruleIds = new Set(rules.map((rule) => rule.id));
  const authored = authoredTrainingQuestions.filter((question) => ruleIds.has(question.ruleId));
  const authoredByRule = new Map<string, TrainingQuestion[]>();
  for (const question of authored) {
    authoredByRule.set(question.ruleId, [...(authoredByRule.get(question.ruleId) ?? []), question]);
  }

  const questions: TrainingQuestion[] = [...authored];
  for (const rule of rules) {
    const existing = authoredByRule.get(rule.id)?.length ?? 0;
    const missing = minimumQuestionsForSeverity(rule.severity) - existing;
    if (missing > 0) questions.push(...generateFallbackQuestions(rule, missing, existing));
  }
  return questions;
}

export const AUTHORED_QUESTION_COUNT = authoredTrainingQuestions.length;
