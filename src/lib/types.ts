export const SEVERITY_ORDER = [
  "dozvoljeno",
  "info",
  "proveri",
  "nepravilnost",
  "teska_nepravilnost",
  "krivicno_delo",
  "ponistavanje",
] as const;

export type Severity = (typeof SEVERITY_ORDER)[number];

export const ELECTION_PHASES = [
  "pre_otvaranja",
  "identifikacija",
  "glasanje",
  "van_birackog_mesta",
  "zatvaranje",
  "brojanje",
  "zapisnik",
  "svaka",
] as const;

export type ElectionPhase = (typeof ELECTION_PHASES)[number];

export const PUBLICATION_STATUSES = ["draft", "published", "archived"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const REVIEW_STATUSES = ["UNREVIEWED", "REVIEW_REQUIRED", "REVIEWED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const SEVERITY_META: Record<
  Severity,
  { label: string; emoji: string; className: string }
> = {
  dozvoljeno: {
    label: "Dozvoljeno",
    emoji: "🟢",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  info: {
    label: "Informacija",
    emoji: "🔵",
    className: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  proveri: {
    label: "Proveri",
    emoji: "🟡",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  nepravilnost: {
    label: "Nepravilnost",
    emoji: "🟠",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  },
  teska_nepravilnost: {
    label: "Teška nepravilnost",
    emoji: "🔴",
    className: "bg-red-500/10 text-red-400 border-red-500/30",
  },
  krivicno_delo: {
    label: "Moguće krivično delo",
    emoji: "⚫",
    className: "bg-zinc-500/10 text-zinc-300 border-zinc-400/30",
  },
  ponistavanje: {
    label: "Poništavanje po službenoj dužnosti",
    emoji: "🚨",
    className: "bg-rose-600/15 text-rose-400 border-rose-600/40",
  },
};

export const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  pre_otvaranja: { label: "Pre otvaranja biračkog mesta", icon: "door-open" },
  identitet_spisak: { label: "Identitet i birački spisak", icon: "id-card" },
  tajnost_sloboda: { label: "Tajnost i sloboda glasanja", icon: "eye-off" },
  kupovina_glasova: { label: "Kupovina glasova", icon: "banknote" },
  paralelna_evidencija: { label: "Paralelna evidencija", icon: "list-checks" },
  neovlascena_lica: { label: "Neovlašćena lica", icon: "user-x" },
  bugarski_voz: { label: "„Bugarski voz“", icon: "train-front" },
  van_birackog_mesta: { label: "Glasanje van biračkog mesta", icon: "home" },
  zatvaranje: { label: "Zatvaranje biračkog mesta", icon: "door-closed" },
  brojanje: { label: "Brojanje glasova", icon: "calculator" },
  zapisnik: { label: "Zapisnik", icon: "file-text" },
  falsifikovanje: { label: "Falsifikovanje rezultata", icon: "shield-alert" },
};

export const ELECTION_TYPE_META: Record<string, string> = {
  narodni_poslanici: "Narodni poslanici",
  predsednik: "Predsednik Republike",
  lokalni: "Lokalni izbori",
  sve: "Svi tipovi izbora",
};

export interface LawReference {
  law: string;
  article: string;
  url?: string;
}

export interface SourceLink {
  label: string;
  url: string;
}

export interface MythCheck {
  claim: string;
  verdict: "mit" | "cinjenica" | "zavisi";
  explanation: string;
}

export interface Rule {
  id: string;
  slug: string;
  naziv: string;
  kategorija: string;
  severity: Severity;
  electionTypes: string[];
  /** @deprecated Use phases. Kept until all consumers are migrated. */
  phase: string;
  phases?: ElectionPhase[];
  summary: string;
  legalRule: string;
  pravniOsnov?: string;
  legalEffect?: string;
  whatToCheck: string[];
  controllerActions: string[];
  voterActions: string[];
  observerActions: string[];
  evidenceChecklist: string[];
  doNotDo: string[];
  lawReferences: LawReference[];
  sourceUrls: SourceLink[];
  relatedSlugs: string[];
  mythCheck?: MythCheck | null;
  isAutomaticAnnulment?: boolean;
  order?: number;
  publicationStatus?: PublicationStatus;
  reviewStatus?: ReviewStatus;
  lastLegalReview?: string;
}

export function ruleHasPhase(rule: Rule, phase: string): boolean {
  return (rule.phases?.length ? rule.phases : [rule.phase]).includes(phase as ElectionPhase);
}
