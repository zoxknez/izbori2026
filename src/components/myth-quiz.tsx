"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  Sparkles,
  BookOpen,
  HelpCircle as QuestionMark,
  Award,
  ChevronRight,
} from "lucide-react";
import type { Rule, MythCheck } from "@/lib/types";
import { cn } from "@/lib/utils";

const VERDICT_CONFIG: Record<
  MythCheck["verdict"],
  {
    label: string;
    subLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    cardStyle: string;
    badgeStyle: string;
  }
> = {
  cinjenica: {
    label: "ČINJENICA",
    subLabel: "Zakon to dozvoljava / tačno je",
    icon: CheckCircle2,
    cardStyle: "border-sev-dozvoljeno/40 bg-sev-dozvoljeno/10 text-sev-dozvoljeno",
    badgeStyle: "bg-sev-dozvoljeno text-canvas",
  },
  mit: {
    label: "MIT",
    subLabel: "To je zabluda / nepravilnost",
    icon: XCircle,
    cardStyle: "border-sev-teska/40 bg-sev-teska/10 text-sev-teska",
    badgeStyle: "bg-sev-teska text-canvas",
  },
  zavisi: {
    label: "ZAVISI",
    subLabel: "Zavisi od tačnih okolnosti",
    icon: HelpCircle,
    cardStyle: "border-sev-proveri/40 bg-sev-proveri/10 text-sev-proveri",
    badgeStyle: "bg-sev-proveri text-canvas",
  },
};

const OPTIONS: { key: MythCheck["verdict"]; label: string; desc: string }[] = [
  { key: "cinjenica", label: "Činjenica", desc: "Zakon to dozvoljava" },
  { key: "mit", label: "Mit", desc: "Netačno / zabluda" },
  { key: "zavisi", label: "Zavisi", desc: "Od tačnih okolnosti" },
];

export function MythQuiz({ rules }: { rules: (Rule & { mythCheck: MythCheck })[] }) {
  const [activeTab, setActiveTab] = useState<"quiz" | "browse">("quiz");

  // Quiz state
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<MythCheck["verdict"] | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Browse state
  const [browseFilter, setBrowseFilter] = useState<"all" | MythCheck["verdict"]>("all");

  const current = rules[index % rules.length];
  const finished = index >= rules.length;

  function pick(v: MythCheck["verdict"]) {
    if (answer) return;
    setAnswer(v);
    const isCorrect = v === current.mythCheck.verdict;
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function next() {
    setAnswer(null);
    setIndex((i) => i + 1);
  }

  function restart() {
    setAnswer(null);
    setIndex(0);
    setScore({ correct: 0, total: 0 });
  }

  const filteredBrowse = useMemo(() => {
    if (browseFilter === "all") return rules;
    return rules.filter((r) => r.mythCheck.verdict === browseFilter);
  }, [rules, browseFilter]);

  const percent = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center">
        <div className="flex rounded-2xl border border-border/80 bg-surface/90 p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-150",
              activeTab === "quiz"
                ? "bg-brand text-brand-ink font-bold shadow-xs"
                : "text-ink-dim hover:text-ink"
            )}
          >
            <Trophy className="h-4 w-4" />
            Interaktivni kviz znanja
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("browse")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-150",
              activeTab === "browse"
                ? "bg-brand text-brand-ink font-bold shadow-xs"
                : "text-ink-dim hover:text-ink"
            )}
          >
            <BookOpen className="h-4 w-4" />
            Katalog svih mitova ({rules.length})
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE QUIZ */}
      {activeTab === "quiz" && (
        <div className="mx-auto max-w-2xl">
          {finished ? (
            /* Results Screen */
            <div className="rounded-3xl border border-border/80 bg-surface/85 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                <Award className="h-8 w-8" />
              </div>

              <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-brand">
                Kviz je završen!
              </span>

              <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">
                {score.correct} / {score.total} tačnih odgovora
              </h2>

              <p className="mt-1 text-base font-bold text-brand">{percent}% uspešnosti</p>

              {/* Evaluation Message */}
              <div className="mt-6 rounded-2xl border border-border/80 bg-surface-2/60 p-4 text-sm text-ink-dim leading-relaxed">
                {percent === 100 ? (
                  <p>
                    🏆 <strong>Savršeno!</strong> Izborni propisi su ti potpuno jasni. Spreman si za ulogu kontrolora ili informisanog birača.
                  </p>
                ) : percent >= 70 ? (
                  <p>
                    🎖️ <strong>Vrlo dobro!</strong> Razumeš većinu ključnih situacija na biračkom mestu, uz par detalja koje vredi obnoviti.
                  </p>
                ) : (
                  <p>
                    📖 <strong>Vredi ponoviti!</strong> Neke situacije koje deluju bezazleno su zapravo nepravilnosti. Prelistaj katalog mitova pre izbornog dana.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={restart}
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-brand-ink shadow-sm hover:bg-brand-strong transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                  Igraj ponovo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("browse")}
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border/80 bg-surface-2 px-6 text-sm font-semibold text-ink hover:border-brand/40 hover:text-brand transition-colors"
                >
                  Prelistaj sve mitove
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Active Question Card */
            <div className="space-y-4">
              {/* Question Progress Meta */}
              <div className="flex items-center justify-between text-xs text-ink-faint px-1">
                <span className="font-semibold">
                  Pitanje <strong>{index + 1}</strong> od <strong>{rules.length}</strong>
                </span>
                <span className="font-mono">
                  Tačno: {score.correct} / {score.total}
                </span>
              </div>

              {/* Main Question Card */}
              <div className="rounded-3xl border border-border/80 bg-surface/85 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                  <Sparkles className="h-3.5 w-3.5" />
                  Da li je ovo mit ili činjenica?
                </div>

                <blockquote className="mt-5 text-lg sm:text-xl font-bold leading-relaxed text-ink">
                  „{current.mythCheck.claim}“
                </blockquote>

                {/* 3 Interactive Choice Buttons */}
                <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {OPTIONS.map((opt) => {
                    const isPicked = answer === opt.key;
                    const isCorrectOpt = answer && opt.key === current.mythCheck.verdict;
                    const isWrongPicked = isPicked && opt.key !== current.mythCheck.verdict;

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => pick(opt.key)}
                        disabled={Boolean(answer)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-150 select-none",
                          !answer && "border-border/80 bg-surface-2/60 hover:border-brand/50 hover:bg-surface-2 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer",
                          isCorrectOpt && "border-sev-dozvoljeno bg-sev-dozvoljeno/15 text-sev-dozvoljeno ring-2 ring-sev-dozvoljeno/30 shadow-md",
                          isWrongPicked && "border-sev-teska bg-sev-teska/15 text-sev-teska ring-2 ring-sev-teska/30",
                          answer && !isPicked && !isCorrectOpt && "border-border/40 bg-surface-2/30 opacity-40 cursor-default"
                        )}
                      >
                        <span className="text-sm font-bold text-ink">{opt.label}</span>
                        <span className="mt-1 text-[11px] text-ink-faint leading-tight">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Box (Revealed upon answering) */}
                {answer && (() => {
                  const isCorrect = answer === current.mythCheck.verdict;
                  const config = VERDICT_CONFIG[current.mythCheck.verdict];
                  const Icon = config.icon;

                  return (
                    <div className="mt-6 animate-fade-up rounded-2xl border border-border-soft bg-surface-2/70 p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider",
                              config.badgeStyle
                            )}
                          >
                            {config.label}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-bold",
                              isCorrect ? "text-sev-dozvoljeno" : "text-sev-teska"
                            )}
                          >
                            {isCorrect ? "Tačan odgovor! Bravo." : "Netačno."}
                          </span>
                        </div>
                        <Icon className="h-4.5 w-4.5 text-ink-faint" />
                      </div>

                      <p className="text-sm leading-relaxed text-ink-dim">
                        {current.mythCheck.explanation}
                      </p>

                      <div className="pt-3 border-t border-border-soft flex items-center justify-between">
                        <Link
                          href={`/pravila/${current.slug}`}
                          className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
                        >
                          Pročitaj celo pravilo i zakonski osnov
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={next}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-ink hover:bg-brand-strong transition-colors"
                        >
                          {index + 1 === rules.length ? "Završi kviz" : "Sledeće pitanje"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BROWSE ALL MYTHS CATALOG */}
      {activeTab === "browse" && (
        <div className="space-y-6">
          {/* Filter Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setBrowseFilter("all")}
              className={cn(
                "rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors shrink-0",
                browseFilter === "all"
                  ? "border-brand/60 bg-brand/15 text-brand"
                  : "border-border/80 bg-surface-2/60 text-ink-dim hover:text-ink"
              )}
            >
              Sve tvrdnje ({rules.length})
            </button>
            <button
              type="button"
              onClick={() => setBrowseFilter("mit")}
              className={cn(
                "rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors shrink-0",
                browseFilter === "mit"
                  ? "border-sev-teska/50 bg-sev-teska/15 text-sev-teska"
                  : "border-border/80 bg-surface-2/60 text-ink-dim hover:text-ink"
              )}
            >
              ❌ Samo mitovi ({rules.filter((r) => r.mythCheck.verdict === "mit").length})
            </button>
            <button
              type="button"
              onClick={() => setBrowseFilter("cinjenica")}
              className={cn(
                "rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors shrink-0",
                browseFilter === "cinjenica"
                  ? "border-sev-dozvoljeno/50 bg-sev-dozvoljeno/15 text-sev-dozvoljeno"
                  : "border-border/80 bg-surface-2/60 text-ink-dim hover:text-ink"
              )}
            >
              ✅ Samo činjenice ({rules.filter((r) => r.mythCheck.verdict === "cinjenica").length})
            </button>
            <button
              type="button"
              onClick={() => setBrowseFilter("zavisi")}
              className={cn(
                "rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors shrink-0",
                browseFilter === "zavisi"
                  ? "border-sev-proveri/50 bg-sev-proveri/15 text-sev-proveri"
                  : "border-border/80 bg-surface-2/60 text-ink-dim hover:text-ink"
              )}
            >
              ⚠️ Zavisi od okolnosti ({rules.filter((r) => r.mythCheck.verdict === "zavisi").length})
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBrowse.map((r) => {
              const config = VERDICT_CONFIG[r.mythCheck.verdict];
              const Icon = config.icon;

              return (
                <div
                  key={r.id}
                  className="rounded-3xl border border-border/80 bg-surface/85 p-6 shadow-card transition-all hover:border-brand/40 hover:bg-surface-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider",
                          config.badgeStyle
                        )}
                      >
                        {config.label}
                      </span>
                      <Icon className="h-4.5 w-4.5 text-ink-faint" />
                    </div>

                    <h3 className="mt-3.5 text-base font-bold text-ink leading-snug">
                      „{r.mythCheck.claim}“
                    </h3>

                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-ink-dim">
                      {r.mythCheck.explanation}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-border-soft flex items-center justify-between text-xs">
                    <span className="text-ink-faint font-medium truncate max-w-[200px]">
                      {r.naziv}
                    </span>
                    <Link
                      href={`/pravila/${r.slug}`}
                      className="font-semibold text-brand hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      Detaljno pravilo →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
