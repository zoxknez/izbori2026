"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowDown, ArrowUp, Brain, CheckCircle2, Lightbulb, RotateCcw, Trophy, XCircle } from "lucide-react";
import type { KnowledgeState, MisconceptionState, TrainingQuestion } from "@/lib/domain/training/types";
import { MISCONCEPTION_LABELS } from "@/lib/domain/training/types";
import { isAnswerCorrect, scoreExam, selectNextQuestion } from "@/lib/domain/training/selection-engine";
import { updateKnowledgeState } from "@/lib/domain/training/mastery";
import { activeMisconceptions, updateMisconceptions } from "@/lib/domain/training/misconceptions";
import { readOfflineValue, setDraftInProgress, writeOfflineValue } from "@/lib/offline/indexed-db";
import { cn } from "@/lib/utils";

type Mode = "practice" | "exam";

interface AnswerDraft {
  choiceIds: string[];
  order: string[];
  value: number | null;
}

const EMPTY_DRAFT: AnswerDraft = { choiceIds: [], order: [], value: null };

const TYPE_LABEL: Record<TrainingQuestion["type"], string> = {
  classification: "Klasifikacija",
  single_choice: "Jedan tačan odgovor",
  multi_choice: "Više tačnih odgovora",
  true_false: "Tačno ili netačno",
  scenario: "Situaciono pitanje",
  sequence: "Poređaj po redosledu",
  numeric: "Brojčani odgovor",
};

export function TrainingQuiz({ questions }: { questions: TrainingQuestion[] }) {
  const [mode, setMode] = useState<Mode>("practice");
  const [knowledge, setKnowledge] = useState<Record<string, KnowledgeState>>({});
  const [misconceptions, setMisconceptions] = useState<Record<string, MisconceptionState>>({});
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Array<{ question: TrainingQuestion } & AnswerDraft>>([]);
  const [draft, setDraft] = useState<AnswerDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);
  const [confidence, setConfidence] = useState(0.6);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  const sessionLength = Math.min(mode === "exam" ? 20 : 12, questions.length);
  const knowledgeMap = useMemo(() => new Map(Object.entries(knowledge)), [knowledge]);
  const current =
    askedIds.length < sessionLength
      ? selectNextQuestion(questions, knowledgeMap, new Set(askedIds), misconceptions)
      : undefined;
  const finished = !current && askedIds.length >= sessionLength;
  const score = scoreExam(answers);
  const knowledgeEntries = Object.values(knowledge);
  const averageMastery = knowledgeEntries.length
    ? Math.round((knowledgeEntries.reduce((sum, state) => sum + state.mastery, 0) / knowledgeEntries.length) * 100)
    : 0;
  const dueCount = now === null ? 0 : knowledgeEntries.filter((state) => Date.parse(state.nextReviewAt) <= now).length;
  const openMisconceptions = activeMisconceptions(misconceptions);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [storedKnowledge, storedMisconceptions] = await Promise.all([
          readOfflineValue<Record<string, KnowledgeState>>("trainingProgress", "knowledge"),
          readOfflineValue<Record<string, MisconceptionState>>("trainingProgress", "misconceptions"),
        ]);
        if (!mounted) return;
        if (storedKnowledge) setKnowledge(storedKnowledge);
        if (storedMisconceptions) setMisconceptions(storedMisconceptions);
      } catch {
        /* bez lokalnog skladišta trening i dalje radi, samo bez pamćenja napretka */
      } finally {
        if (mounted) {
          setNow(Date.now());
          setHydrated(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    void setDraftInProgress("training", askedIds.length > 0 && !finished);
    return () => {
      void setDraftInProgress("training", false);
    };
  }, [askedIds.length, finished]);

  // Sekvencijalna pitanja startuju u fiksnom, ali ne tačnom redosledu - izvedeno, bez efekta.
  const sequenceOrder = useMemo(() => {
    if (current?.type !== "sequence") return [];
    return draft.order.length > 0 ? draft.order : [...current.choices.map((choice) => choice.id)].reverse();
  }, [current, draft.order]);

  const effectiveDraft: AnswerDraft = current?.type === "sequence" ? { ...draft, order: sequenceOrder } : draft;
  const correct = current ? isAnswerCorrect(current, effectiveDraft) : false;
  const canSubmit = current
    ? current.type === "numeric"
      ? draft.value !== null
      : current.type === "sequence"
        ? sequenceOrder.length === current.choices.length
        : draft.choiceIds.length > 0
    : false;

  function toggleChoice(choiceId: string) {
    if (!current || submitted) return;
    setDraft((previous) => {
      if (current.type === "multi_choice") {
        const has = previous.choiceIds.includes(choiceId);
        return { ...previous, choiceIds: has ? previous.choiceIds.filter((id) => id !== choiceId) : [...previous.choiceIds, choiceId] };
      }
      return { ...previous, choiceIds: [choiceId] };
    });
  }

  function moveItem(choiceId: string, direction: -1 | 1) {
    if (submitted) return;
    setDraft((previous) => {
      const order = previous.order.length > 0 ? [...previous.order] : sequenceOrder;
      const index = order.indexOf(choiceId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= order.length) return previous;
      [order[index], order[target]] = [order[target], order[index]];
      return { ...previous, order };
    });
  }

  function submit() {
    if (!current || submitted || !canSubmit) return;
    setSubmitted(true);
    setAnswers((previous) => [...previous, { question: current, ...effectiveDraft }]);
  }

  async function advance() {
    if (!current || !submitted) return;
    const answeredAt = new Date().toISOString();
    const pickedMisconception = current.choices.find(
      (choice) => draft.choiceIds.includes(choice.id) && !choice.isCorrect && choice.misconception,
    )?.misconception;

    const nextKnowledge = {
      ...knowledge,
      [current.ruleId]: updateKnowledgeState(knowledge[current.ruleId], {
        questionId: current.id,
        ruleId: current.ruleId,
        correct,
        confidence,
        answeredAt,
      }),
    };
    const nextMisconceptions = updateMisconceptions(misconceptions, {
      questionId: current.id,
      ruleId: current.ruleId,
      correct,
      confidence,
      answeredAt,
      misconception: pickedMisconception,
      testedMisconceptions: current.misconceptionTags,
    });

    setKnowledge(nextKnowledge);
    setMisconceptions(nextMisconceptions);
    setAskedIds((previous) => [...previous, current.id]);
    setDraft(EMPTY_DRAFT);
    setSubmitted(false);

    try {
      await writeOfflineValue("trainingProgress", "knowledge", nextKnowledge);
      await writeOfflineValue("trainingProgress", "misconceptions", nextMisconceptions);
    } catch {
      /* skladište nedostupno */
    }
  }

  function reset(nextMode: Mode = mode) {
    setMode(nextMode);
    setAskedIds([]);
    setAnswers([]);
    setDraft(EMPTY_DRAFT);
    setSubmitted(false);
  }

  if (!hydrated) {
    return <div className="rounded-3xl border border-border bg-surface p-8 text-sm text-ink-dim">Učitavam tvoj napredak…</div>;
  }

  if (finished) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-card sm:p-12">
          <Trophy className="mx-auto h-10 w-10 text-brand" />
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brand">
            {mode === "exam" ? "Ispit završen" : "Sesija završena"}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink">
            {score.correct} / {score.total} tačnih
          </h2>
          <p className="mt-2 text-sm text-ink-dim">
            Uspešnost: <strong>{score.percentage}%</strong>. Napredak i zablude su sačuvani na uređaju.
          </p>
          <div className="mx-auto mt-6 grid max-w-lg gap-2 text-left sm:grid-cols-2">
            {Object.entries(score.bySeverity).map(([difficulty, result]) => (
              <div key={difficulty} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-ink-dim">
                <span className="font-semibold text-ink">{difficulty}</span>
                <span className="float-right">
                  {result.correct}/{result.total}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-ink"
          >
            <RotateCcw className="h-4 w-4" /> Nova sesija
          </button>
        </div>

        {openMisconceptions.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-400">
              <Lightbulb className="h-4 w-4" /> Zablude koje još nisu ispravljene
            </p>
            <ul className="mt-3 space-y-2">
              {openMisconceptions.map((tag) => (
                <li key={tag} className="text-sm text-ink-dim">
                  „{MISCONCEPTION_LABELS[tag]}“
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-faint">
              Sledeća sesija će ih ciljano proveriti drugačije formulisanim pitanjima.
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  if (!current) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Tvoj napredak</p>
          <p className="mt-1 text-sm text-ink-dim">
            Prosečan mastery: <strong className="text-ink">{averageMastery}%</strong> · za ponavljanje:{" "}
            <strong className="text-ink">{dueCount}</strong> · otvorenih zabluda:{" "}
            <strong className="text-ink">{openMisconceptions.length}</strong>
          </p>
        </div>
        <div className="flex rounded-xl border border-border bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => reset("practice")}
            className={cn("rounded-lg px-3 py-2 text-xs font-bold", mode === "practice" ? "bg-brand text-brand-ink" : "text-ink-dim")}
          >
            Vežba · 12
          </button>
          <button
            type="button"
            onClick={() => reset("exam")}
            className={cn("rounded-lg px-3 py-2 text-xs font-bold", mode === "exam" ? "bg-brand text-brand-ink" : "text-ink-dim")}
          >
            Ispit · 20
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-faint">
        <span>
          Pitanje <strong>{askedIds.length + 1}</strong> od <strong>{sessionLength}</strong>
        </span>
        <span>{current.authored ? "Autorsko pitanje" : "Generisano iz pravila"}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={{ width: 0 }}
          animate={{ width: `${(askedIds.length / sessionLength) * 100}%` }}
        />
      </div>

      <motion.div
        key={current.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-9"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-brand">
          {TYPE_LABEL[current.type]} · {current.difficulty}
        </p>
        <h2 className="mt-4 text-lg font-extrabold leading-relaxed text-ink sm:text-2xl">{current.prompt}</h2>

        {current.type === "numeric" ? (
          <div className="mt-7">
            <input
              inputMode="numeric"
              value={draft.value ?? ""}
              disabled={submitted}
              onChange={(event) => {
                const raw = event.target.value.trim();
                setDraft((previous) => ({ ...previous, value: /^\d+$/.test(raw) ? Number(raw) : null }));
              }}
              placeholder="Unesi broj"
              className="h-14 w-full rounded-2xl border border-border bg-surface-2 px-4 font-mono text-2xl font-bold text-ink focus:border-brand focus:outline-none"
            />
            {current.numeric?.unit && <p className="mt-2 text-xs text-ink-faint">Jedinica: {current.numeric.unit}</p>}
          </div>
        ) : current.type === "sequence" ? (
          <ol className="mt-7 space-y-2">
            {sequenceOrder.map((choiceId, index) => {
              const choice = current.choices.find((item) => item.id === choiceId)!;
              const isRight = submitted && current.correctOrder?.[index] === choiceId;
              return (
                <li
                  key={choiceId}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 text-sm font-semibold",
                    submitted ? (isRight ? "border-emerald-500/50 bg-emerald-500/10" : "border-rose-500/50 bg-rose-500/10") : "border-border bg-surface-2",
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-bold text-brand">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-ink">{choice.label}</span>
                  <span className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(choiceId, -1)}
                      disabled={submitted || index === 0}
                      aria-label={`Pomeri gore: ${choice.label}`}
                      className="rounded-lg border border-border p-1.5 text-ink-dim hover:text-ink disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(choiceId, 1)}
                      disabled={submitted || index === sequenceOrder.length - 1}
                      aria-label={`Pomeri dole: ${choice.label}`}
                      className="rounded-lg border border-border p-1.5 text-ink-dim hover:text-ink disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="mt-7 grid gap-3">
            {current.choices.map((choice) => {
              const picked = draft.choiceIds.includes(choice.id);
              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={submitted}
                  onClick={() => toggleChoice(choice.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-colors",
                    !submitted && (picked ? "border-brand bg-brand/10 text-ink" : "border-border bg-surface-2 text-ink hover:border-brand"),
                    submitted && choice.isCorrect && "border-emerald-500 bg-emerald-500/10 text-ink",
                    submitted && picked && !choice.isCorrect && "border-rose-500 bg-rose-500/10 text-ink",
                    submitted && !picked && !choice.isCorrect && "border-border/50 text-ink-faint",
                  )}
                >
                  {submitted ? (
                    choice.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    ) : picked ? (
                      <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                    ) : (
                      <span className="h-5 w-5 shrink-0 rounded-full border border-border" />
                    )
                  ) : (
                    <span
                      className={cn(
                        "h-5 w-5 shrink-0 border",
                        current.type === "multi_choice" ? "rounded-md" : "rounded-full",
                        picked ? "border-brand bg-brand" : "border-border",
                      )}
                    />
                  )}
                  {choice.label}
                </button>
              );
            })}
            {current.type === "multi_choice" && !submitted && (
              <p className="text-xs text-ink-faint">Označi sve tačne odgovore, pa potvrdi.</p>
            )}
          </div>
        )}

        {!submitted && (
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-ink disabled:opacity-40"
          >
            Potvrdi odgovor
          </button>
        )}

        {submitted && (
          <motion.div
            key={`feedback-${current.id}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-2xl border border-border bg-surface-2 p-4 text-sm leading-relaxed text-ink-dim"
            >
              <p className="flex items-center gap-2 font-bold text-ink">
                {correct ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                {correct ? "Tačno." : "Nije tačno."}
              </p>

              {current.type === "numeric" ? (
                <p className="mt-2">
                  Tačan odgovor: <strong className="text-ink">{current.numeric?.answer}</strong>
                  {current.numeric?.hint ? ` - ${current.numeric.hint}` : ""}
                </p>
              ) : current.type === "sequence" ? (
                <p className="mt-2">
                  Tačan redosled:{" "}
                  <strong className="text-ink">
                    {(current.correctOrder ?? [])
                      .map((id) => current.choices.find((choice) => choice.id === id)?.label)
                      .join(" → ")}
                  </strong>
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {current.choices
                    .filter((choice) => choice.isCorrect || draft.choiceIds.includes(choice.id))
                    .map((choice) => (
                      <li key={choice.id}>
                        <strong className={cn(choice.isCorrect ? "text-emerald-400" : "text-rose-400")}>
                          {choice.isCorrect ? "Tačno" : "Netačno"}:
                        </strong>{" "}
                        {choice.explanation}
                      </li>
                    ))}
                </ul>
              )}

              {!correct &&
                current.choices.some((choice) => draft.choiceIds.includes(choice.id) && choice.misconception) && (
                  <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <Brain className="mt-0.5 h-4 w-4 shrink-0" />
                    Ovo je česta zabluda:{" "}
                    {
                      MISCONCEPTION_LABELS[
                        current.choices.find((choice) => draft.choiceIds.includes(choice.id) && choice.misconception)!
                          .misconception!
                      ]
                    }
                    . Vratićemo ti je kasnije, drugačije formulisanu.
                  </p>
                )}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-ink">Koliko si bio siguran?</span>
                {[0.3, 0.6, 0.9].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setConfidence(value)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1",
                      confidence === value ? "border-brand bg-brand/10 text-brand" : "border-border",
                    )}
                  >
                    {value === 0.3 ? "Pogađao sam" : value === 0.6 ? "Nisam siguran" : "Bio sam siguran"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={advance}
                  className="ml-auto rounded-xl bg-brand px-4 py-2 font-bold text-brand-ink"
                >
                  {askedIds.length + 1 === sessionLength ? "Završi" : "Sledeće pitanje"}
                </button>
              </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
