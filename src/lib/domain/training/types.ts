import type { PublicationStatus, ReviewStatus } from "@/lib/types";

export type TrainingQuestionType =
  | "classification"
  | "single_choice"
  | "multi_choice"
  | "true_false"
  | "scenario"
  | "sequence"
  | "numeric";

/**
 * Pogrešna mentalna pravila koja se najčešće sreću na biračkom mestu.
 * Kada korisnik odgovori pogrešno, tag se pamti i kasnije se cilja drugim pitanjem.
 */
export const MISCONCEPTION_TAGS = [
  "HELPER_ALWAYS_ILLEGAL",
  "TALLY_MARKS_ALWAYS_ILLEGAL",
  "DECEASED_IN_REGISTER_EQUALS_FRAUD",
  "OBSERVER_NOT_ALLOWED_AT_COUNT",
  "EVERY_PHOTO_EQUALS_VOTE_BUYING",
  "PARTY_TRANSPORT_EQUALS_VOTE_BUYING",
  "BOARD_CAN_ADD_VOTER",
  "KNOWN_VOTER_NEEDS_NO_ID",
  "FEWER_BALLOTS_BLOCKS_OPENING",
  "QUEUE_CLOSES_AT_20",
  "BOARD_ANNULS_BY_ITSELF",
  "RECORD_OBJECTION_IS_OPTIONAL",
] as const;

export type MisconceptionTag = (typeof MISCONCEPTION_TAGS)[number];

export const MISCONCEPTION_LABELS: Record<MisconceptionTag, string> = {
  HELPER_ALWAYS_ILLEGAL: "Svaka pomoć biraču iza paravana je zabranjena",
  TALLY_MARKS_ALWAYS_ILLEGAL: "Svaka evidencija izlaznosti je nezakonita",
  DECEASED_IN_REGISTER_EQUALS_FRAUD: "Preminula osoba u spisku znači da je neko glasao umesto nje",
  OBSERVER_NOT_ALLOWED_AT_COUNT: "Posmatrač ne sme da prisustvuje brojanju",
  EVERY_PHOTO_EQUALS_VOTE_BUYING: "Svaka fotografija listića dokazuje kupovinu glasa",
  PARTY_TRANSPORT_EQUALS_VOTE_BUYING: "Organizovan prevoz birača je sam po sebi kupovina glasova",
  BOARD_CAN_ADD_VOTER: "Odbor sme da dopiše birača ako je očigledna greška",
  KNOWN_VOTER_NEEDS_NO_ID: "Poznatom biraču ne treba provera isprave",
  FEWER_BALLOTS_BLOCKS_OPENING: "Manjak listića sprečava otvaranje biračkog mesta",
  QUEUE_CLOSES_AT_20: "U 20:00 se vrata zaključavaju i red se raspušta",
  BOARD_ANNULS_BY_ITSELF: "Birački odbor sam poništava glasanje",
  RECORD_OBJECTION_IS_OPTIONAL: "Primedba u zapisnik je formalnost bez značaja",
};

export interface TrainingChoice {
  id: string;
  label: string;
  isCorrect: boolean;
  explanation: string;
  /** Zabluda koju baš ovaj pogrešan odgovor otkriva. */
  misconception?: MisconceptionTag;
}

export interface TrainingQuestion {
  id: string;
  ruleId: string;
  type: TrainingQuestionType;
  prompt: string;
  choices: TrainingChoice[];
  /** Za `sequence`: tačan redosled ID-jeva iz `choices`. */
  correctOrder?: string[];
  /** Za `numeric`: očekivani broj i kratko objašnjenje računa. */
  numeric?: { answer: number; unit?: string; hint?: string };
  difficulty: "normal" | "heavy" | "criminal" | "annulment";
  publicationStatus: PublicationStatus;
  reviewStatus: ReviewStatus;
  sourceIds: string[];
  /** Zablude koje ovo pitanje proverava (i kada se odgovori tačno). */
  misconceptionTags?: MisconceptionTag[];
  /** Autorska pitanja imaju prednost nad generisanim pri izboru. */
  authored?: boolean;
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

export interface MisconceptionState {
  tag: MisconceptionTag;
  /** Koliko puta je zabluda potvrđena pogrešnim odgovorom. */
  hits: number;
  /** Uzastopni tačni odgovori na pitanja koja je testiraju. */
  clearedStreak: number;
  resolved: boolean;
  lastSeenAt: string;
}

export interface TrainingAnswer {
  questionId: string;
  ruleId: string;
  correct: boolean;
  confidence: number;
  answeredAt: string;
  misconception?: MisconceptionTag;
  /** Zablude koje je pitanje testiralo, bez obzira na ishod. */
  testedMisconceptions?: MisconceptionTag[];
}
