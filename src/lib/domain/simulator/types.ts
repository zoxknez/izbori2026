import type { ElectionPhase, Severity } from "@/lib/types";
import type { CountingInput, CountingResult } from "@/lib/domain/results-validator";

/** Uloga u kojoj korisnik prolazi kroz birački dan. Menja koje odluke su mu uopšte dostupne. */
export type SimulationRole = "clan_odbora" | "posmatrac" | "birac";

/** Vrsta izbora: menja pravni okvir na koji se događaj poziva. */
export type SimulationElectionType = "narodni_poslanici" | "predsednik" | "lokalni" | "istovremeni";

export type SimulationMode = "guided" | "randomized" | "hard";

export type SimulationOutcome = "routine" | "prevented" | "serious" | "criminal" | "annulment";
export type SimulationRiskBand = "routine" | "irregularity" | "serious" | "criminal" | "annulment";

/** Ocena kvaliteta odluke; direktno određuje ton povratne informacije. */
export type ChoiceClassification = "correct" | "acceptable" | "suboptimal" | "wrong" | "critical_error";

/** Šest osa po kojima se meri rad tokom dana. */
export type ScoreCategory =
  | "procedure"
  | "secrecy"
  | "voterRights"
  | "documentation"
  | "counting"
  | "legalResponse";

export const SCORE_CATEGORIES: ScoreCategory[] = [
  "procedure",
  "secrecy",
  "voterRights",
  "documentation",
  "counting",
  "legalResponse",
];

export const SCORE_CATEGORY_LABELS: Record<ScoreCategory, string> = {
  procedure: "Procedura",
  secrecy: "Tajnost glasanja",
  voterRights: "Prava birača",
  documentation: "Dokumentovanje",
  counting: "Brojanje",
  legalResponse: "Pravna reakcija",
};

export const SIMULATION_ROLE_LABELS: Record<SimulationRole, string> = {
  clan_odbora: "Član biračkog odbora",
  posmatrac: "Akreditovani posmatrač",
  birac: "Birač",
};

export const SIMULATION_ELECTION_LABELS: Record<SimulationElectionType, string> = {
  narodni_poslanici: "Narodni poslanici",
  predsednik: "Predsednik Republike",
  lokalni: "Lokalni izbori",
  istovremeni: "Istovremeni izbori",
};

export const CLASSIFICATION_LABELS: Record<ChoiceClassification, string> = {
  correct: "Tačno postupanje",
  acceptable: "Prihvatljivo",
  suboptimal: "Može bolje",
  wrong: "Pogrešno",
  critical_error: "Kritična greška",
};

export interface SimulationCondition {
  requiresFlags?: string[];
  forbidsFlags?: string[];
  requiresPhase?: ElectionPhase;
  roles?: SimulationRole[];
}

export interface SimulationEffect {
  addFlags?: string[];
  removeFlags?: string[];
  /** Poeni po kategoriji; izostavljena kategorija se ne menja. */
  scores?: Partial<Record<ScoreCategory, number>>;
  evidenceDelta?: number;
  phase?: ElectionPhase;
}

export interface SimulationChoice {
  id: string;
  label: string;
  /** Kratko obrazloženje koje se prikazuje tek nakon izbora. */
  explanation: string;
  classification: ChoiceClassification;
  outcome: SimulationOutcome;
  ruleIds: string[];
  /** Uloge kojima je ova odluka uopšte na raspolaganju. */
  roles?: SimulationRole[];
  conditions?: SimulationCondition;
  effects: SimulationEffect;
  nextEventId?: string;
}

export interface SimulationEvent {
  id: string;
  /** Sat na biračkom mestu, format HH:MM. Nosi dramaturgiju dana. */
  time: string;
  phase: ElectionPhase;
  title: string;
  /** Situacija onako kako je vidi izabrana uloga. */
  description: string;
  severity: Severity;
  riskBand: SimulationRiskBand;
  roles?: SimulationRole[];
  choices: SimulationChoice[];
  conditions?: SimulationCondition;
  /** Kada je postavljeno, događaj otvara Counting Mode sa ovim brojevima. */
  counting?: CountingInput;
  /** Tačan zaključak koji korisnik mora da izabere u Counting Mode-u. */
  countingConclusionId?: string;
}

export interface SimulationDecision {
  eventId: string;
  eventTitle: string;
  time: string;
  choiceId: string;
  choiceLabel: string;
  classification: ChoiceClassification;
  outcome: SimulationOutcome;
  ruleIds: string[];
  explanation: string;
}

export type ScoreBoard = Record<ScoreCategory, number>;

export interface SimulationState {
  role: SimulationRole;
  electionType: SimulationElectionType;
  mode: SimulationMode;
  randomSeed: number;
  currentEventId: string;
  phase: ElectionPhase;
  clock: string;
  /** Kada je postavljeno, tok prolazi samo kroz ove događaje (režim „ponovi moje greške“). */
  allowedEventIds?: string[];
  /** Osvojeni poeni po kategoriji. */
  scores: ScoreBoard;
  /** Maksimum koji je bio dostupan po kategoriji do sada. */
  maxScores: ScoreBoard;
  evidence: number;
  flags: string[];
  history: SimulationDecision[];
  startedAt: string;
  finished: boolean;
}

export interface CategoryResult {
  category: ScoreCategory;
  earned: number;
  max: number;
  percentage: number;
}

export interface SimulationDebrief {
  totalPercentage: number;
  categories: CategoryResult[];
  strongest?: CategoryResult;
  weakest?: CategoryResult;
  criticalErrors: SimulationDecision[];
  mistakes: SimulationDecision[];
  handledWell: SimulationDecision[];
  rulesToReview: string[];
  evidence: number;
  narrative: string[];
}

export interface CountingModeState {
  input: CountingInput;
  result: CountingResult;
}
