"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Gavel,
  NotebookPen,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Users,
  Vote,
  XCircle,
} from "lucide-react";
import { simulationEvents } from "@/lib/domain/simulator/seed-events";
import {
  applyChoice,
  availableChoices,
  computeDebrief,
  createSimulationState,
  eventsForRole,
  runCountingMode,
} from "@/lib/domain/simulator/engine";
import {
  CLASSIFICATION_LABELS,
  SCORE_CATEGORIES,
  SCORE_CATEGORY_LABELS,
  SIMULATION_ELECTION_LABELS,
  SIMULATION_ROLE_LABELS,
  type ChoiceClassification,
  type SimulationChoice,
  type SimulationElectionType,
  type SimulationEvent,
  type SimulationMode,
  type SimulationRole,
  type SimulationState,
} from "@/lib/domain/simulator/types";
import { PHASE_META } from "@/lib/phases";
import { readOfflineValue, setDraftInProgress, writeOfflineValue } from "@/lib/offline/indexed-db";
import { cn } from "@/lib/utils";

const CLASSIFICATION_STYLE: Record<ChoiceClassification, { chip: string; ring: string; icon: typeof CheckCircle2 }> = {
  correct: { chip: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", ring: "border-emerald-500/40", icon: CheckCircle2 },
  acceptable: { chip: "bg-sky-500/15 text-sky-400 border-sky-500/30", ring: "border-sky-500/40", icon: CheckCircle2 },
  suboptimal: { chip: "bg-amber-500/15 text-amber-400 border-amber-500/30", ring: "border-amber-500/40", icon: TriangleAlert },
  wrong: { chip: "bg-orange-500/15 text-orange-400 border-orange-500/30", ring: "border-orange-500/40", icon: XCircle },
  critical_error: { chip: "bg-rose-500/15 text-rose-400 border-rose-500/30", ring: "border-rose-500/50", icon: ShieldAlert },
};

const ROLE_ICON: Record<SimulationRole, typeof Users> = { clan_odbora: Gavel, posmatrac: Eye, birac: Vote };

const ROLE_DESCRIPTION: Record<SimulationRole, string> = {
  clan_odbora: "Vodiš proceduru: otvaranje, identifikacija, brojanje i zapisnik. Najduži i najzahtevniji tok.",
  posmatrac: "Ne vodiš proceduru, ali beležiš, tražiš postupanje po propisu i unosiš primedbe.",
  birac: "Kratak tok: doživljavaš dan kroz svoje pravo glasa i odluke koje čuvaju tvoj glas.",
};

const MODE_LABEL: Record<SimulationMode, { title: string; hint: string }> = {
  guided: { title: "Vođeni dan", hint: "Hronološki tok, puna povratna informacija" },
  randomized: { title: "Nasumični dan", hint: "Isti događaji, nepredvidiv redosled" },
  hard: { title: "Teški režim", hint: "Duple kazne za pogrešne odluke" },
};

const SAVE_KEY = "latest-run";

interface SavedRun {
  state: SimulationState;
  savedAt: string;
}

function scorePercentage(state: SimulationState, category: (typeof SCORE_CATEGORIES)[number]) {
  const max = state.maxScores[category];
  if (max <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((Math.max(0, state.scores[category]) / max) * 100)));
}

/** Traka napretka po fazama dana. */
function DayTimeline({ state, total }: { state: SimulationState; total: number }) {
  const progress = Math.min(100, Math.round((state.history.length / Math.max(1, total)) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-medium text-ink-faint">
        <span>
          Događaj <strong className="text-ink">{Math.min(state.history.length + 1, total)}</strong> od {total}
        </span>
        <span>{progress}% dana</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

function ScoreMeters({ state }: { state: SimulationState }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {SCORE_CATEGORIES.map((category) => {
        const percentage = scorePercentage(state, category);
        return (
          <div key={category} className="rounded-xl border border-border/70 bg-surface-2/60 px-3 py-2">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
              {SCORE_CATEGORY_LABELS[category]}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border/60">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  percentage === null ? "bg-border" : percentage >= 80 ? "bg-emerald-400" : percentage >= 50 ? "bg-amber-400" : "bg-rose-400",
                )}
                initial={{ width: 0 }}
                animate={{ width: `${percentage ?? 0}%` }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
              />
            </div>
            <p className="mt-1 text-[11px] font-bold text-ink">{percentage === null ? "—" : `${percentage}%`}</p>
          </div>
        );
      })}
    </div>
  );
}

/** Counting Mode: isti validator koji koristi i javni /validator. */
function CountingPanel({ event }: { event: SimulationEvent }) {
  const result = useMemo(() => (event.counting ? runCountingMode(event.counting) : null), [event.counting]);
  if (!event.counting || !result) return null;

  const rows: Array<[string, number | null]> = [
    ["Primljeno listića (R)", event.counting.R],
    ["Neupotrebljeno (U)", event.counting.U],
    ["Birača glasalo (G)", event.counting.G],
    ["Listića u kutiji (B)", event.counting.B],
    ["Važećih (V)", event.counting.V],
    ["Nevažećih (N)", event.counting.N],
  ];

  const checks: Array<[string, boolean | null, string]> = [
    ["Pravilo A · B ≤ G", result.ruleA.ok, `${event.counting.B} naspram ${event.counting.G}`],
    ["Pravilo B · U + B ≤ R", result.ruleB.ok, `${(event.counting.U ?? 0) + (event.counting.B ?? 0)} naspram ${event.counting.R}`],
    ["Pravilo C · N + V = B", result.ruleC.ok, `${(event.counting.N ?? 0) + (event.counting.V ?? 0)} naspram ${event.counting.B}`],
    ["Pravilo D · Σ lista = V", result.ruleD.ok, `${event.counting.listVotes.reduce<number>((sum, value) => sum + (value ?? 0), 0)} naspram ${event.counting.V}`],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 rounded-2xl border border-brand/25 bg-brand/[0.04] p-4 sm:p-5"
    >
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
        <Calculator className="h-4 w-4" /> Counting Mode · isti engine kao validator zapisnika
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border/70 bg-surface px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</p>
            <p className="font-mono text-lg font-bold text-ink">{value ?? "—"}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {checks.map(([label, ok, detail]) => (
          <div
            key={label}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs",
              ok === false ? "border-rose-500/40 bg-rose-500/10 text-rose-300" : "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-300",
            )}
          >
            <span className="font-semibold">{label}</span>
            <span className="font-mono text-[11px] opacity-80">{detail}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function SimulationGame() {
  const [role, setRole] = useState<SimulationRole>("clan_odbora");
  const [electionType, setElectionType] = useState<SimulationElectionType>("narodni_poslanici");
  const [mode, setMode] = useState<SimulationMode>("guided");
  const [state, setState] = useState<SimulationState | null>(null);
  const [feedback, setFeedback] = useState<SimulationChoice | null>(null);
  const [resumable, setResumable] = useState<SavedRun | null>(null);

  const eventMap = useMemo(() => new Map(simulationEvents.map((event) => [event.id, event])), []);
  const event = state ? eventMap.get(state.currentEventId) : undefined;
  const choices = state && event ? availableChoices(event, state) : [];
  const totalEvents = state
    ? state.allowedEventIds?.length ?? eventsForRole(simulationEvents, state.role).length
    : eventsForRole(simulationEvents, role).length;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const saved = await readOfflineValue<SavedRun>("simulationHistory", SAVE_KEY);
        if (!cancelled && saved?.state && !saved.state.finished) setResumable(saved);
      } catch {
        /* IndexedDB nedostupan — simulacija i dalje radi, samo bez nastavka */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: SimulationState) => {
    try {
      await writeOfflineValue("simulationHistory", SAVE_KEY, { state: next, savedAt: new Date().toISOString() });
      await setDraftInProgress("simulation", !next.finished);
    } catch {
      /* bez lokalnog skladišta simulacija ostaje samo u memoriji */
    }
  }, []);

  function start(setup: { role?: SimulationRole; mode?: SimulationMode; onlyEventIds?: string[] } = {}) {
    const next = createSimulationState(simulationEvents, {
      role: setup.role ?? role,
      electionType,
      mode: setup.mode ?? mode,
      randomSeed: Math.floor(Math.random() * 1_000_000),
      onlyEventIds: setup.onlyEventIds,
    });
    setFeedback(null);
    setResumable(null);
    setState(next);
    void persist(next);
  }

  /** Prvo se prikazuje ocena odluke; tok se pomera tek kada korisnik potvrdi. */
  function choose(choice: SimulationChoice) {
    if (!state || !event || feedback) return;
    setFeedback(choice);
  }

  function continueDay() {
    if (!state || !event || !feedback) return;
    const next = applyChoice(state, event, feedback, simulationEvents);
    setFeedback(null);
    setState(next);
    void persist(next);
  }

  // ------------------------------------------------------------------ SETUP
  if (!state) {
    return (
      <div className="space-y-6">
        {resumable && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/[0.06] p-4"
          >
            <div>
              <p className="text-sm font-bold text-ink">Imaš nezavršenu simulaciju</p>
              <p className="text-xs text-ink-dim">
                {SIMULATION_ROLE_LABELS[resumable.state.role]} · sat {resumable.state.clock} · {resumable.state.history.length} odluka
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setState(resumable.state);
                setResumable(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink"
            >
              Nastavi dan <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Korak 1 · Uloga</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(Object.keys(SIMULATION_ROLE_LABELS) as SimulationRole[]).map((candidate) => {
              const Icon = ROLE_ICON[candidate];
              const active = role === candidate;
              const count = eventsForRole(simulationEvents, candidate).length;
              return (
                <motion.button
                  key={candidate}
                  type="button"
                  onClick={() => setRole(candidate)}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    active ? "border-brand bg-brand/10" : "border-border bg-surface hover:border-brand/40",
                  )}
                >
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", active ? "bg-brand text-brand-ink" : "bg-surface-2 text-brand")}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-ink">{SIMULATION_ROLE_LABELS[candidate]}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-faint">{ROLE_DESCRIPTION[candidate]}</p>
                  <p className="mt-2 text-[11px] font-semibold text-brand">{count} događaja</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Korak 2 · Vrsta izbora</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(SIMULATION_ELECTION_LABELS) as SimulationElectionType[]).map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setElectionType(candidate)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                    electionType === candidate ? "border-brand bg-brand/10 text-brand" : "border-border bg-surface text-ink-dim hover:text-ink",
                  )}
                >
                  {SIMULATION_ELECTION_LABELS[candidate]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Korak 3 · Režim</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(MODE_LABEL) as SimulationMode[]).map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setMode(candidate)}
                  title={MODE_LABEL[candidate].hint}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                    mode === candidate ? "border-brand bg-brand/10 text-brand" : "border-border bg-surface text-ink-dim hover:text-ink",
                  )}
                >
                  {MODE_LABEL[candidate].title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={() => start()}
          whileTap={{ scale: 0.99 }}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-8 text-base font-bold text-brand-ink shadow-card sm:w-auto"
        >
          <Sparkles className="h-5 w-5" />
          Započni birački dan
        </motion.button>
      </div>
    );
  }

  // ------------------------------------------------------------------ DEBRIEF
  if (state.finished || !event) {
    const debrief = computeDebrief(state);
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="rounded-3xl border border-border bg-surface p-6 text-center shadow-card sm:p-10">
          <Award className="mx-auto h-10 w-10 text-brand" />
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-brand">Birački dan završen</p>
          <motion.p
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 18 }}
            className="mt-2 text-5xl font-extrabold text-ink"
          >
            {debrief.totalPercentage}%
          </motion.p>
          <p className="mt-2 text-sm text-ink-dim">
            {SIMULATION_ROLE_LABELS[state.role]} · {state.history.length} odluka · {debrief.evidence} sačuvanih beleški
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {debrief.categories.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink">{SCORE_CATEGORY_LABELS[category.category]}</span>
                <span className="font-mono font-bold text-ink">{category.max > 0 ? `${category.percentage}%` : "—"}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className={cn("h-full rounded-full", category.percentage >= 80 ? "bg-emerald-400" : category.percentage >= 50 ? "bg-amber-400" : "bg-rose-400")}
                  initial={{ width: 0 }}
                  animate={{ width: `${category.percentage}%` }}
                  transition={{ delay: 0.15 + index * 0.05, type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {debrief.narrative.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface-2/60 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">Rezime dana</p>
            <ul className="mt-3 space-y-2">
              {debrief.narrative.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-ink-dim">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        {debrief.criticalErrors.length > 0 && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-rose-400">
              <ShieldAlert className="h-4 w-4" /> Kritične greške ({debrief.criticalErrors.length})
            </p>
            <ul className="mt-3 space-y-2.5">
              {debrief.criticalErrors.map((decision) => (
                <li key={decision.eventId} className="rounded-xl border border-rose-500/20 bg-surface p-3">
                  <p className="text-xs font-mono text-rose-300">{decision.time}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{decision.eventTitle}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-dim">{decision.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {debrief.rulesToReview.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <BookOpen className="h-4 w-4 text-brand" /> Pravila za ponavljanje
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {debrief.rulesToReview.map((ruleId) => (
                <Link
                  key={ruleId}
                  href={`/pravila?q=${encodeURIComponent(ruleId)}`}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-dim hover:border-brand/40 hover:text-brand"
                >
                  {ruleId}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {debrief.mistakes.length > 0 && (
            <button
              type="button"
              onClick={() => start({ onlyEventIds: debrief.mistakes.map((decision) => decision.eventId) })}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-ink"
            >
              <RotateCcw className="h-4 w-4" /> Ponovi samo moje greške ({debrief.mistakes.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => start()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-5 py-3 text-sm font-bold text-ink hover:border-brand/40"
          >
            Nova simulacija
          </button>
          <button
            type="button"
            onClick={() => setState(null)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-ink-dim hover:text-ink"
          >
            Promeni ulogu ili režim
          </button>
        </div>
      </motion.div>
    );
  }

  // ------------------------------------------------------------------ IGRA
  const feedbackStyle = feedback ? CLASSIFICATION_STYLE[feedback.classification] : null;
  const FeedbackIcon = feedbackStyle?.icon ?? CheckCircle2;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-20 items-center justify-center rounded-xl border border-brand/25 bg-brand/10">
              <Clock className="mr-1.5 h-3.5 w-3.5 text-brand" />
              <motion.span
                key={state.clock}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="font-mono text-base font-extrabold text-brand"
              >
                {state.clock}
              </motion.span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                {PHASE_META[event.phase]?.label ?? event.phase}
              </p>
              <p className="text-xs text-ink-dim">
                {SIMULATION_ROLE_LABELS[state.role]} · {MODE_LABEL[state.mode].title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 font-semibold text-ink">
              <NotebookPen className="h-3.5 w-3.5 text-brand" /> {state.evidence} beleški
            </span>
          </div>
        </div>
        <div className="mt-4">
          <DayTimeline state={state} total={totalEvents} />
        </div>
        <div className="mt-4">
          <ScoreMeters state={state} />
        </div>
      </div>

      <div>
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className={cn(
            "rounded-3xl border bg-surface p-5 shadow-card sm:p-8",
            event.riskBand === "annulment" || event.riskBand === "criminal" ? "border-rose-500/30" : "border-border",
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                event.riskBand === "routine"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : event.riskBand === "irregularity"
                    ? "bg-amber-500/10 text-amber-400"
                    : event.riskBand === "serious"
                      ? "bg-orange-500/10 text-orange-400"
                      : "bg-rose-500/15 text-rose-400",
              )}
            >
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">{event.title}</p>
              <h2 className="mt-2 text-lg font-semibold leading-relaxed text-ink sm:text-xl">{event.description}</h2>
            </div>
          </div>

          {event.counting && <CountingPanel event={event} />}

          <div className="mt-6 grid gap-2.5">
            {choices.map((choice, index) => (
              <motion.button
                key={choice.id}
                type="button"
                disabled={Boolean(feedback)}
                onClick={() => choose(choice)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                whileTap={feedback ? undefined : { scale: 0.99 }}
                className={cn(
                  "group flex items-start gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-colors",
                  feedback?.id === choice.id
                    ? cn("bg-surface-2 text-ink", feedbackStyle?.ring)
                    : feedback
                      ? "border-border/50 bg-surface-2/40 text-ink-faint"
                      : "border-border bg-surface-2 text-ink hover:border-brand",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold",
                    feedback?.id === choice.id ? "border-brand bg-brand text-brand-ink" : "border-border text-ink-faint",
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                {choice.label}
              </motion.button>
            ))}
          </div>

        </motion.div>

        {feedback && (
          <motion.div
            key={`feedback-${event.id}-${feedback.id}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
              <div className={cn("mt-3 rounded-2xl border p-4 sm:p-5", feedbackStyle?.ring, "bg-surface-2/60")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold", feedbackStyle?.chip)}>
                      <FeedbackIcon className="h-3.5 w-3.5" />
                      {CLASSIFICATION_LABELS[feedback.classification]}
                    </span>
                    {feedback.ruleIds.map((ruleId) => (
                      <Link
                        key={ruleId}
                        href={`/pravila?q=${encodeURIComponent(ruleId)}`}
                        className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink-dim hover:text-brand"
                      >
                        {ruleId}
                      </Link>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-dim">{feedback.explanation}</p>
                  <button
                    type="button"
                    onClick={continueDay}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink"
                  >
                    Nastavi dan <ArrowRight className="h-4 w-4" />
                  </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
