"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, Trophy, XCircle } from "lucide-react";
import type { KnowledgeState, TrainingQuestion } from "@/lib/domain/training/types";
import { selectNextQuestion, scoreExam } from "@/lib/domain/training/selection-engine";
import { updateKnowledgeState } from "@/lib/domain/training/mastery";
import { readOfflineValue, setDraftInProgress, writeOfflineValue } from "@/lib/offline/indexed-db";
import { cn } from "@/lib/utils";

export function TrainingQuiz({ questions }: { questions: TrainingQuestion[] }) {
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [states, setStates] = useState<Record<string, KnowledgeState>>({});
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Array<{ question: TrainingQuestion; choiceId: string }>>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0.6);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const sessionLength = Math.min(mode === "exam" ? 20 : 12, questions.length);
  const stateMap = useMemo(() => new Map(Object.entries(states)), [states]);
  const current = askedIds.length < sessionLength ? selectNextQuestion(questions, stateMap, new Set(askedIds)) : undefined;
  const currentAnswer = selectedChoice && current?.choices.find((choice) => choice.id === selectedChoice);
  const finished = !current && askedIds.length >= sessionLength;
  const score = scoreExam(answers);
  const masteryEntries = Object.values(states);
  const averageMastery = masteryEntries.length ? Math.round(masteryEntries.reduce((sum, state) => sum + state.mastery, 0) / masteryEntries.length * 100) : 0;
  const dueCount = now === null ? 0 : masteryEntries.filter((state) => Date.parse(state.nextReviewAt) <= now).length;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  useEffect(() => {
    let mounted = true;
    readOfflineValue<Record<string, KnowledgeState>>("trainingProgress", "knowledge").then((stored) => {
      if (mounted && stored) setStates(stored);
      if (mounted) setHydrated(true);
    }).catch(() => { if (mounted) setHydrated(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    void setDraftInProgress("training", askedIds.length > 0);
    return () => { void setDraftInProgress("training", false); };
  }, [askedIds.length]);

  async function choose(choiceId: string) {
    if (!current || selectedChoice) return;
    const choice = current.choices.find((item) => item.id === choiceId);
    if (!choice) return;
    setSelectedChoice(choiceId);
    setAnswers((previous) => [...previous, { question: current, choiceId }]);
  }

  async function advance() {
    if (!current || !selectedChoice) return;
    const choice = current.choices.find((item) => item.id === selectedChoice);
    if (!choice) return;
    const answeredAt = new Date().toISOString();
    const nextState = updateKnowledgeState(states[current.ruleId], { questionId: current.id, ruleId: current.ruleId, correct: choice.isCorrect, confidence, answeredAt });
    const nextStates = { ...states, [current.ruleId]: nextState };
    setStates(nextStates);
    await writeOfflineValue("trainingProgress", "knowledge", nextStates);
    setAskedIds((previous) => [...previous, current.id]);
    setSelectedChoice(null);
  }

  function restart() {
    setAskedIds([]);
    setAnswers([]);
    setSelectedChoice(null);
  }

  function changeMode(nextMode: "practice" | "exam") {
    setMode(nextMode);
    setAskedIds([]);
    setAnswers([]);
    setSelectedChoice(null);
  }

  if (!hydrated) return <div className="rounded-3xl border border-border bg-surface p-8 text-sm text-ink-dim">Učitavam tvoj napredak…</div>;
  if (finished) return (
    <div className="rounded-3xl border border-border bg-surface p-8 text-center shadow-card sm:p-12">
      <Trophy className="mx-auto h-10 w-10 text-brand" />
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brand">{mode === "exam" ? "Ispit završen" : "Sesija završena"}</p>
      <h2 className="mt-2 text-3xl font-extrabold text-ink">{score.correct} / {score.total} tačnih</h2>
      <p className="mt-2 text-sm text-ink-dim">Uspešnost: <strong>{score.percentage}%</strong>. Napredak je sačuvan na uređaju.</p>
      <div className="mx-auto mt-6 grid max-w-lg gap-2 text-left sm:grid-cols-2">{Object.entries(score.bySeverity).map(([difficulty, result]) => <div key={difficulty} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-ink-dim"><span className="font-semibold text-ink">{difficulty}</span><span className="float-right">{result.correct}/{result.total}</span></div>)}</div>
      <button type="button" onClick={restart} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-ink"><RotateCcw className="h-4 w-4" /> Nova sesija</button>
    </div>
  );
  if (!current) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-bold uppercase tracking-wider text-brand">Tvoj napredak</p><p className="mt-1 text-sm text-ink-dim">Prosečan mastery: <strong className="text-ink">{averageMastery}%</strong> · due za ponavljanje: <strong className="text-ink">{dueCount}</strong> · obrađeno pravila: <strong className="text-ink">{masteryEntries.length}/{new Set(questions.map((question) => question.ruleId)).size}</strong></p></div><div className="flex rounded-xl border border-border bg-surface-2 p-1"><button type="button" onClick={() => changeMode("practice")} className={cn("rounded-lg px-3 py-2 text-xs font-bold", mode === "practice" ? "bg-brand text-brand-ink" : "text-ink-dim")}>Vežba · 12</button><button type="button" onClick={() => changeMode("exam")} className={cn("rounded-lg px-3 py-2 text-xs font-bold", mode === "exam" ? "bg-brand text-brand-ink" : "text-ink-dim")}>Ispit · 20</button></div></div>
      <div className="flex items-center justify-between text-xs text-ink-faint"><span>Pitanje <strong>{askedIds.length + 1}</strong> od <strong>{sessionLength}</strong></span><span>Mastery zapis se čuva offline</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${askedIds.length / sessionLength * 100}%` }} /></div>
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-9">
        <p className="text-xs font-bold uppercase tracking-wider text-brand">{current.type === "classification" ? "Klasifikacija" : "Situaciono pitanje"} · {current.difficulty}</p>
        <h2 className="mt-4 text-xl font-extrabold leading-relaxed text-ink sm:text-2xl">{current.prompt}</h2>
        <div className="mt-7 grid gap-3">{current.choices.map((choice) => {
          const picked = selectedChoice === choice.id;
          return <button key={choice.id} type="button" disabled={Boolean(selectedChoice)} onClick={() => choose(choice.id)} className={cn("flex items-start gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-colors", !selectedChoice && "border-border bg-surface-2 hover:border-brand", picked && choice.isCorrect && "border-emerald-500 bg-emerald-500/10", picked && !choice.isCorrect && "border-red-500 bg-red-500/10", selectedChoice && !picked && "opacity-50")}>{selectedChoice && picked ? (choice.isCorrect ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <XCircle className="h-5 w-5 shrink-0 text-red-500" />) : <span className="h-5 w-5 shrink-0 rounded-full border border-border" />}{choice.label}</button>;
        })}</div>
        {currentAnswer && <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-4 text-sm leading-relaxed text-ink-dim"><strong className="text-ink">{currentAnswer.isCorrect ? "Tačno." : "Netačno."}</strong> {currentAnswer.explanation}<div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="font-semibold text-ink">Koliko si siguran?</span>{[0.3, 0.6, 0.9].map((value) => <button key={value} type="button" onClick={() => setConfidence(value)} className={cn("rounded-lg border px-2.5 py-1", confidence === value ? "border-brand bg-brand/10 text-brand" : "border-border")}>{value === 0.3 ? "Nisko" : value === 0.6 ? "Srednje" : "Visoko"}</button>)}<button type="button" onClick={advance} className="ml-auto rounded-xl bg-brand px-4 py-2 font-bold text-brand-ink">{askedIds.length + 1 === sessionLength ? "Završi" : "Sledeće pitanje"}</button></div></div>}
      </div>
    </div>
  );
}
