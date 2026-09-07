import type { MisconceptionState, MisconceptionTag, TrainingAnswer, TrainingQuestion } from "./types";

/** Broj uzastopnih tačnih odgovora posle kojih se zabluda smatra ispravljenom. */
export const MISCONCEPTION_CLEAR_STREAK = 2;

export function createMisconceptionState(tag: MisconceptionTag, at: string): MisconceptionState {
  return { tag, hits: 0, clearedStreak: 0, resolved: false, lastSeenAt: at };
}

/**
 * Ažurira evidenciju zabluda posle jednog odgovora.
 * Pogrešan odgovor koji nosi tag potvrđuje zabludu; tačan odgovor na pitanje koje je
 * testira približava je statusu „ispravljena“.
 */
export function updateMisconceptions(
  previous: Record<string, MisconceptionState>,
  answer: TrainingAnswer,
): Record<string, MisconceptionState> {
  const next = { ...previous };
  const tested = new Set<MisconceptionTag>(answer.testedMisconceptions ?? []);
  if (answer.misconception) tested.add(answer.misconception);

  for (const tag of tested) {
    const current = next[tag] ?? createMisconceptionState(tag, answer.answeredAt);
    const confirmed = answer.misconception === tag && !answer.correct;
    next[tag] = confirmed
      ? { ...current, hits: current.hits + 1, clearedStreak: 0, resolved: false, lastSeenAt: answer.answeredAt }
      : answer.correct
        ? {
            ...current,
            clearedStreak: current.clearedStreak + 1,
            resolved: current.hits === 0 ? current.resolved : current.clearedStreak + 1 >= MISCONCEPTION_CLEAR_STREAK,
            lastSeenAt: answer.answeredAt,
          }
        : { ...current, lastSeenAt: answer.answeredAt };
  }
  return next;
}

/** Zablude koje su potvrđene i još nisu ispravljene. */
export function activeMisconceptions(states: Record<string, MisconceptionState>): MisconceptionTag[] {
  return Object.values(states)
    .filter((state) => state.hits > 0 && !state.resolved)
    .sort((a, b) => b.hits - a.hits || a.lastSeenAt.localeCompare(b.lastSeenAt))
    .map((state) => state.tag);
}

/**
 * Da li pitanje cilja neku od nerešenih zabluda.
 * Namerno ne vraća isto pitanje na kojem je korisnik pogrešio, nego bilo koje
 * pitanje koje testira istu zabludu drugom formulacijom.
 */
export function targetsActiveMisconception(
  question: TrainingQuestion,
  states: Record<string, MisconceptionState>,
): boolean {
  const active = new Set(activeMisconceptions(states));
  if (active.size === 0) return false;
  const tags = new Set<MisconceptionTag>(question.misconceptionTags ?? []);
  question.choices.forEach((choice) => {
    if (choice.misconception) tags.add(choice.misconception);
  });
  return [...tags].some((tag) => active.has(tag));
}
