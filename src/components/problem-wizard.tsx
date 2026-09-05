"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCcw,
  ChevronRight,
  Search,
  X,
  Zap,
  Copy,
  Check,
  FileText,
} from "lucide-react";
import { ruleHasPhase, type Rule, type Severity } from "@/lib/types";
import { PHASE_META, PHASE_ORDER } from "@/lib/phases";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { Card } from "@/components/ui/card";
import { RuleDetail } from "@/components/rule-detail";
import { PhaseIcon } from "@/components/phase-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step = "phase" | "scenario" | "result";

const QUICK_TAGS = [
  { label: "Bugarski voz", query: "bugarski voz" },
  { label: "Slikanje telefonom", query: "slikanje" },
  { label: "UV lampa i sprej", query: "sprej" },
  { label: "Paralelni spisak", query: "paraleln" },
  { label: "Glasanje van BM", query: "van biračkog" },
  { label: "Brojanje glasova", query: "brojanje" },
  { label: "Kontrolni list", query: "kontrolni list" },
  { label: "Neovlašćeno lice", query: "neovlašć" },
];

export function ProblemWizard({ rules }: { rules: Rule[] }) {
  const [step, setStep] = useState<Step>("phase");
  const [phase, setPhase] = useState<string | null>(null);
  const [selected, setSelected] = useState<Rule | null>(null);

  // Search state
  const [globalSearch, setGlobalSearch] = useState("");
  const [phaseFilterSeverity, setPhaseFilterSeverity] = useState<Severity | "sve">("sve");
  const [copiedAction, setCopiedAction] = useState(false);

  const phasesPresent = useMemo(
    () => PHASE_ORDER.filter((p) => rules.some((r) => ruleHasPhase(r, p))),
    [rules]
  );

  // Phase counts
  const phaseCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of PHASE_ORDER) {
      map[p] = rules.filter((r) => ruleHasPhase(r, p)).length;
    }
    return map;
  }, [rules]);

  // Instant global search results (Emergency mode)
  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    return rules.filter(
      (r) =>
        r.naziv.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.legalRule.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        r.aliases?.some((alias) => alias.toLowerCase().includes(q)) ||
        r.informalQueries?.some((query) => query.toLowerCase().includes(q))
    );
  }, [rules, globalSearch]);

  // Scenarios inside selected phase
  const scenarios = useMemo(() => {
    if (!phase) return [];
    let list = rules.filter((r) => ruleHasPhase(r, phase));
    if (phaseFilterSeverity !== "sve") {
      list = list.filter((r) => r.severity === phaseFilterSeverity);
    }
    return list.sort((a, b) => {
      // Prioritize automatic annulment and higher severity
      if (a.isAutomaticAnnulment && !b.isAutomaticAnnulment) return -1;
      if (!a.isAutomaticAnnulment && b.isAutomaticAnnulment) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [rules, phase, phaseFilterSeverity]);

  const related = useMemo(() => {
    if (!selected) return [];
    return rules.filter((r) => selected.relatedSlugs?.includes(r.slug));
  }, [rules, selected]);

  function reset() {
    setStep("phase");
    setPhase(null);
    setSelected(null);
    setGlobalSearch("");
    setPhaseFilterSeverity("sve");
  }

  function pickRule(rule: Rule) {
    setSelected(rule);
    setStep("result");
    setGlobalSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyControllerSteps() {
    if (!selected) return;
    const actions = selected.controllerActions?.length
      ? selected.controllerActions.map((a, i) => `${i + 1}. ${a}`).join("\n")
      : "Nema unetih koraka";
    const text = `HITAN PROTOKOL ZA KONTROLORA: ${selected.naziv}\n\n${actions}\n\nPravni osnov: ${
      selected.lawReferences?.map((l) => `${l.law} ${l.article}`).join("; ") || "ZINP"
    }`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedAction(true);
      setTimeout(() => setCopiedAction(false), 2000);
    } catch {
      /* fallback */
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. HITNA EKSPRESNA PRETRAGA (Emergency bar) */}
      <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink">
                Hitna pomoć na biračkom mestu
              </h2>
              <p className="text-xs text-ink-dim">
                Znaš šta vidiš? Ukucaj pojam i odmah otvori proceduru i primedbu.
              </p>
            </div>
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Pretraži: sprej, slikanje, paravan..."
              className="h-10 w-full rounded-xl border border-border bg-surface-2 pl-10 pr-9 text-xs text-ink placeholder:text-ink-faint focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                aria-label="Obriši pretragu"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Tag Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mr-1">
            Brzi filteri:
          </span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag.label}
              onClick={() => setGlobalSearch(tag.query)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                globalSearch.toLowerCase() === tag.query.toLowerCase()
                  ? "border-brand bg-brand text-white font-semibold"
                  : "border-border bg-surface text-ink-dim hover:border-brand/40 hover:text-ink"
              )}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Global Search Results Dropdown/Box if user is typing */}
        {globalSearch.trim().length > 0 && (
          <div className="mt-4 rounded-xl border border-brand/30 bg-surface p-3 shadow-md">
            <div className="mb-2 flex items-center justify-between border-b border-border/60 pb-2 text-xs font-semibold text-ink-dim">
              <span>Pronađeno u bazi ({searchResults.length})</span>
              <button
                onClick={() => setGlobalSearch("")}
                className="text-[11px] text-brand hover:underline"
              >
                Zatvori pretragu
              </button>
            </div>

            {searchResults.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-faint">
                Nema pronađenih nepravilnosti za pojam &quot;{globalSearch}&quot;. Probajte opštiji termin ili upotrebite čarobnjak ispod.
              </p>
            ) : (
              <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => pickRule(r)}
                    className="flex flex-col items-start gap-1 rounded-xl border border-border bg-surface-2 p-3 text-left transition-all hover:border-brand hover:bg-brand/5"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <SeverityBadge severity={r.severity} size="sm" />
                      {r.isAutomaticAnnulment && (
                        <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          🚨 Poništavanje
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-ink">{r.naziv}</span>
                    <span className="line-clamp-1 text-[11px] text-ink-dim">
                      {r.summary}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. INTERAKTIVNI 3-STEP STEPPER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Step 1 */}
          <button
            onClick={() => {
              setStep("phase");
              setSelected(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
              step === "phase"
                ? "bg-brand text-white shadow-sm"
                : "bg-surface-2 text-ink-dim hover:text-ink"
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/15 text-[11px]">
              1
            </span>
            <span>Gde (Faza)</span>
          </button>

          <ChevronRight className="h-4 w-4 text-ink-faint" />

          {/* Step 2 */}
          <button
            onClick={() => {
              if (phase) {
                setStep("scenario");
                setSelected(null);
              }
            }}
            disabled={!phase}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
              step === "scenario"
                ? "bg-brand text-white shadow-sm"
                : phase
                ? "bg-surface-2 text-ink-dim hover:text-ink cursor-pointer"
                : "bg-surface-2/40 text-ink-faint cursor-not-allowed"
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/15 text-[11px]">
              2
            </span>
            <span>Šta vidiš (Scenario)</span>
          </button>

          <ChevronRight className="h-4 w-4 text-ink-faint" />

          {/* Step 3 */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
              step === "result"
                ? "bg-brand text-white shadow-sm"
                : "bg-surface-2/40 text-ink-faint"
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/15 text-[11px]">
              3
            </span>
            <span>Protokol & Primedba</span>
          </div>
        </div>

        {step !== "phase" && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold text-ink-dim hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Počni ispočetka
          </button>
        )}
      </div>

      {/* 3. STEP CONTENT */}

      {/* STEP 1: FAZA DANA */}
      {step === "phase" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-ink">
              1. U kojoj fazi izbornog dana se problem dešava?
            </h2>
            <p className="mt-1 text-sm text-ink-dim">
              Izaberite fazu kako biste suzili izbor na tačne situacije i zakonska pravila.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {phasesPresent.map((p) => {
              const count = phaseCounts[p] ?? 0;
              return (
                <button
                  key={p}
                  onClick={() => {
                    setPhase(p);
                    setStep("scenario");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group text-left"
                >
                  <Card className="flex h-full items-start gap-4 p-5 transition-all hover:border-brand/60 hover:shadow-md">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                      <PhaseIcon
                        icon={PHASE_META[p]?.icon ?? "triangle-alert"}
                        className="h-5 w-5"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-ink group-hover:text-brand transition-colors">
                          {PHASE_META[p]?.label ?? p}
                        </p>
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-ink-dim">
                          {count} situacija
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">
                        {PHASE_META[p]?.hint}
                      </p>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: SCENARIO UNUTAR FAZE */}
      {step === "scenario" && phase && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                onClick={() => setStep("phase")}
                className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Vrati se na izbor faze
              </button>
              <h2 className="text-xl font-extrabold text-ink">
                2. Izaberite situaciju: {PHASE_META[phase]?.label}
              </h2>
              <p className="mt-1 text-xs text-ink-dim">
                Pronađite šta najtačnije opisuje događaj na biračkom mestu.
              </p>
            </div>

            {/* Severity filter inside phase */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              <button
                onClick={() => setPhaseFilterSeverity("sve")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  phaseFilterSeverity === "sve"
                    ? "bg-ink text-surface font-bold"
                    : "bg-surface-2 text-ink-dim hover:text-ink"
                )}
              >
                Sve ({rules.filter((r) => ruleHasPhase(r, phase)).length})
              </button>
              <button
                onClick={() => setPhaseFilterSeverity("ponistavanje")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  phaseFilterSeverity === "ponistavanje"
                    ? "bg-rose-600 text-white font-bold"
                    : "bg-surface-2 text-ink-dim hover:text-ink"
                )}
              >
                🚨 Poništavanje
              </button>
              <button
                onClick={() => setPhaseFilterSeverity("teska_nepravilnost")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  phaseFilterSeverity === "teska_nepravilnost"
                    ? "bg-red-600 text-white font-bold"
                    : "bg-surface-2 text-ink-dim hover:text-ink"
                )}
              >
                🔴 Teške
              </button>
            </div>
          </div>

          {/* Grid of scenarios */}
          <div className="grid gap-3.5 sm:grid-cols-2">
            {scenarios.map((rule) => (
              <button
                key={rule.id}
                onClick={() => pickRule(rule)}
                className="group text-left"
              >
                <Card
                  className={cn(
                    "flex h-full flex-col justify-between p-4 transition-all hover:border-brand hover:shadow-md",
                    rule.isAutomaticAnnulment && "border-rose-500/40 bg-rose-500/[0.02]"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <SeverityBadge severity={rule.severity} size="sm" />
                      {rule.isAutomaticAnnulment && (
                        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                          🚨 Poništava se po čl. 116
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-ink group-hover:text-brand transition-colors">
                      {rule.naziv}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-ink-dim">
                      {rule.summary}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] font-medium text-ink-faint">
                    <span>
                      {rule.lawReferences?.[0]
                        ? `${rule.lawReferences[0].law}, ${rule.lawReferences[0].article}`
                        : "Propis ZINP"}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-brand group-hover:underline">
                      Otvori protokol <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: REZULTAT I PROTOKOL */}
      {step === "result" && selected && (
        <div className="space-y-6">
          {/* Executive Action Header */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => setStep("scenario")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-dim hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Nazad na listu situacija
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={copyControllerSteps}
                className="text-xs font-semibold"
              >
                {copiedAction ? (
                  <Check className="h-3.5 w-3.5 text-sev-dozvoljeno" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copiedAction ? "Kopirano!" : "Kopiraj korake za kontrolora"}
              </Button>

              <Link href={`/prijavi?rule=${selected.slug}`}>
                <Button variant="primary" size="sm" className="text-xs font-semibold">
                  <FileText className="h-3.5 w-3.5" />
                  Prijavi u generator primedbe
                </Button>
              </Link>
            </div>
          </div>

          {/* Full Rule Detail view */}
          <RuleDetail rule={selected} related={related} />
        </div>
      )}
    </div>
  );
}
