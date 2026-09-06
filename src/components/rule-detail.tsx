"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Gavel,
  Scale,
  ListChecks,
  Ban,
  BookOpen,
  Link2,
  Copy,
  Check,
  TriangleAlert,
  ShieldAlert,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import type { Rule } from "@/lib/types";
import { CATEGORY_META, ELECTION_TYPE_META } from "@/lib/types";
import { PHASE_META } from "@/lib/phases";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { RoleActions } from "@/components/role-actions";
import { cn } from "@/lib/utils";

const MYTH_CONFIG = {
  mit: {
    label: "MIT (NETAČNO)",
    icon: XCircle,
    className: "border-sev-teska/40 bg-sev-teska/10 text-sev-teska",
    badgeClass: "bg-sev-teska text-canvas",
  },
  cinjenica: {
    label: "ČINJENICA (TAČNO)",
    icon: CheckCircle2,
    className: "border-sev-dozvoljeno/40 bg-sev-dozvoljeno/10 text-sev-dozvoljeno",
    badgeClass: "bg-sev-dozvoljeno text-canvas",
  },
  zavisi: {
    label: "ZAVISI OD OKOLNOSTI",
    icon: HelpCircle,
    className: "border-sev-proveri/40 bg-sev-proveri/10 text-sev-proveri",
    badgeClass: "bg-sev-proveri text-canvas",
  },
};

export function RuleDetail({ rule, related }: { rule: Rule; related: Rule[] }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = `${rule.naziv}\n\n${rule.summary}\n\nPravni osnov: ${rule.pravniOsnov ?? ""}\n${rule.legalRule}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const isCriminal = rule.severity === "krivicno_delo";

  return (
    <div className="space-y-8">
      {rule.publicationStatus === "published" && rule.reviewStatus === "stale" && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <p><strong>Potrebna je pravna provera.</strong> Ovo pravilo je i dalje dostupno, ali je izvor izmenjen ili zamenjen. Pre postupanja proverite najnovije uputstvo i pravni osnov.</p>
        </div>
      )}
      {/* Dossier Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-surface/90 to-surface/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Glow accent */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />

        {/* Badges bar */}
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={rule.severity} size="md" />

          <span className="rounded-full border border-border/80 bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-dim">
            {CATEGORY_META[rule.kategorija]?.label ?? rule.kategorija}
          </span>

          {rule.phases.length > 0 && (
            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
              {rule.phases.map((phase) => PHASE_META[phase]?.label ?? phase).join(" · ")}
            </span>
          )}

          {rule.isAutomaticAnnulment && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sev-ponistavanje/40 bg-sev-ponistavanje/15 px-3 py-1 text-xs font-bold text-sev-ponistavanje shadow-xs">
              <ShieldAlert className="h-3.5 w-3.5" />
              Zakonski osnov za poništavanje BM
            </span>
          )}

          {isCriminal && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/40 bg-slate-500/15 px-3 py-1 text-xs font-bold text-slate-300 shadow-xs">
              <Gavel className="h-3.5 w-3.5" />
              Krivično delo (KZ RS)
            </span>
          )}
        </div>

        {/* Title & Summary */}
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-4xl leading-tight">
          {rule.naziv}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-dim sm:text-lg">
          {rule.summary}
        </p>

        {/* Scope info */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-faint">
          <span>
            Primenjuje se na: <strong className="text-ink-dim">{rule.electionTypes.map((t) => ELECTION_TYPE_META[t] ?? t).join(", ")}</strong>
          </span>
          {rule.pravniOsnov && (
            <span className="font-mono text-brand/90 font-medium">
              § {rule.pravniOsnov}
            </span>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border-soft pt-5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/80 bg-surface-2 px-4 text-xs font-semibold text-ink hover:border-brand/40 hover:bg-surface hover:text-brand transition-all active:scale-95"
          >
            {copied ? <Check className="h-4 w-4 text-sev-dozvoljeno" /> : <Copy className="h-4 w-4" />}
            {copied ? "Pravilo kopirano u clipboard!" : "Kopiraj pravilo i član zakona"}
          </button>

          <Link
            href={`/prijavi?rule=${rule.slug}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-sev-teska/15 border border-sev-teska/30 px-4 text-xs font-semibold text-sev-teska hover:bg-sev-teska hover:text-canvas transition-colors"
          >
            <TriangleAlert className="h-4 w-4" />
            Prijavi incident na osnovu ovog pravila
          </Link>
        </div>
      </div>

      {/* Myth or Fact Callout */}
      {rule.mythCheck && (() => {
        const conf = MYTH_CONFIG[rule.mythCheck.verdict] ?? MYTH_CONFIG.zavisi;
        const Icon = conf.icon;
        return (
          <div className={cn("rounded-2xl border p-5 sm:p-6 shadow-sm", conf.className)}>
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider", conf.badgeClass)}>
                {conf.label}
              </span>
              <Icon className="h-4 w-4 shrink-0" />
            </div>
            <p className="mt-3 text-base font-semibold italic text-ink">
              „{rule.mythCheck.claim}“
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              {rule.mythCheck.explanation}
            </p>
          </div>
        );
      })()}

      {/* Main Content Modules Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Core Legal Rules & Actions */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card: Legal Rule & Effect */}
          <div className="rounded-2xl border border-border/80 bg-surface/80 p-6 shadow-card">
            <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-brand">
              <Scale className="h-4 w-4" />
              Šta propisi nalažu
            </div>

            <div className="mt-4 rounded-xl border-l-4 border-l-brand/70 bg-surface-2/60 p-4">
              <p className="text-sm sm:text-[15px] leading-relaxed text-ink font-medium">
                {rule.legalRule}
              </p>
            </div>

            {rule.legalEffect && (
              <div className="mt-5 rounded-xl border border-sev-ponistavanje/25 bg-sev-ponistavanje/[0.05] p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sev-ponistavanje">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Pravna posledica kršenja
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink font-medium">
                  {rule.legalEffect}
                </p>
              </div>
            )}
          </div>

          {/* Card: Immediate Checks */}
          {rule.whatToCheck.length > 0 && (
            <div className="rounded-2xl border border-border/80 bg-surface/80 p-6 shadow-card">
              <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-sev-proveri">
                <ListChecks className="h-4 w-4" />
                Odmah proveri na licu mesta
              </div>
              <p className="mt-1.5 text-xs text-ink-faint">
                Brza provera činjenica pre preduzimanja bilo kakvih radnji:
              </p>

              <div className="mt-4 space-y-2.5">
                {rule.whatToCheck.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface-2/40 p-3 text-sm text-ink-dim"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sev-proveri shadow-xs" />
                    <span className="leading-relaxed text-ink">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card: What to do (RoleActions) */}
          <div className="rounded-2xl border border-border/80 bg-surface/80 p-6 shadow-card">
            <div className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-ink">
              <Gavel className="h-4 w-4 text-brand" />
              Šta konkretno da uradiš
            </div>
            <p className="mt-1.5 text-xs text-ink-faint">
              Izaberi svoju ulogu na biračkom mestu za korak-po-korak uputstvo:
            </p>

            <div className="mt-4">
              <RoleActions
                controllerActions={rule.controllerActions}
                voterActions={rule.voterActions}
                observerActions={rule.observerActions}
              />
            </div>
          </div>

          {/* Card: Prohibitions (Do Not Do) */}
          {rule.doNotDo.length > 0 && (
            <div className="rounded-2xl border border-sev-teska/30 bg-sev-teska/[0.04] p-6 shadow-card">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-sev-teska">
                <Ban className="h-4.5 w-4.5" />
                Šta nikako ne smeš da radiš
              </div>
              <p className="mt-1 text-xs text-ink-dim">
                Postupci koji mogu ugroziti tvoj položaj ili zakonitost procesa:
              </p>

              <div className="mt-4 space-y-2.5">
                {rule.doNotDo.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-sev-teska/20 bg-surface/80 p-3.5 text-sm leading-relaxed text-ink"
                  >
                    <Ban className="mt-0.5 h-4 w-4 shrink-0 text-sev-teska" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Evidence, Law references & Related */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card: Evidence Checklist */}
          {rule.evidenceChecklist.length > 0 && (
            <div className="rounded-2xl border border-border/80 bg-surface/80 p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
                <FileSpreadsheet className="h-4 w-4" />
                Šta zabeležiti kao dokaz
              </div>

              <div className="mt-3.5 space-y-2">
                {rule.evidenceChecklist.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-surface-2/50 p-2.5 text-xs leading-relaxed text-ink-dim"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card: Law References */}
          <div className="rounded-2xl border border-border/80 bg-surface/80 p-5 shadow-card">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
              <BookOpen className="h-4 w-4 text-brand" />
              Zvanični pravni izvori
            </div>

            <div className="mt-3.5 space-y-2">
              {rule.lawReferences.map((ref, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/60 bg-surface-2/60 p-3 text-xs"
                >
                  {ref.url ? (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand hover:underline"
                    >
                      {ref.law}
                    </a>
                  ) : (
                    <p className="font-semibold text-ink">{ref.law}</p>
                  )}
                  <p className="mt-0.5 text-ink-dim font-mono text-[11px]">{ref.article}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border-soft">
              <Link
                href="/izvori"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
              >
                Pregledaj sve zakone i pravilnike
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Card: Related Rules */}
          {related.length > 0 && (
            <div className="rounded-2xl border border-border/80 bg-surface/80 p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
                <Link2 className="h-4 w-4 text-brand" />
                Povezane nepravilnosti
              </div>

              <div className="mt-3.5 space-y-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/pravila/${r.slug}`}
                    className="group block rounded-xl border border-border/60 bg-surface-2/50 p-3 transition-all hover:border-brand/40 hover:bg-surface-2 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <SeverityBadge severity={r.severity} size="sm" />
                      {r.isAutomaticAnnulment && (
                        <span className="text-[10px] font-bold text-sev-ponistavanje">Poništava se</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-ink group-hover:text-brand transition-colors line-clamp-2">
                      {r.naziv}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
