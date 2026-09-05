import type { PublicationStatus, ReviewStatus } from "@/lib/types";

export type TrainingQuestionType = "classification" | "single_choice" | "scenario";

export interface TrainingChoice {
  id: string;
  label: string;
  isCorrect: boolean;
  explanation: string;
}

export interface TrainingQuestion {
  id: string;
  ruleId: string;
  type: TrainingQuestionType;
  prompt: string;
  choices: TrainingChoice[];
  difficulty: "normal" | "heavy" | "criminal" | "annulment";
  publicationStatus: PublicationStatus;
  reviewStatus: ReviewStatus;
  sourceIds: string[];
}

export interface KnowledgeState {
  ruleId: string;
  attempts: number;
  correct: number;
  mastery: number;
  streak: number;
  confidence: number;
  nextReviewAt: string;
  lastAnsweredAt?: string;
}

export interface TrainingAnswer {
  questionId: string;
  ruleId: string;
  correct: boolean;
  confidence: number;
  answeredAt: string;
}
