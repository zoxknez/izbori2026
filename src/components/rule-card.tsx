import Link from "next/link";
import { ArrowRight, ChevronRight, ShieldAlert, Scale } from "lucide-react";
import type { Rule, Severity } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { cn } from "@/lib/utils";

const SEVERITY_BORDER: Record<Severity, string> = {
  ponistavanje: "border-l-rose-500 hover:border-rose-400/60",
  teska_nepravilnost: "border-l-red-500 hover:border-red-400/60",
  krivicno_delo: "border-l-slate-400 hover:border-slate-300",
  nepravilnost: "border-l-orange-500 hover:border-orange-400/60",
  proveri: "border-l-amber-500 hover:border-amber-400/60",
  info: "border-l-sky-500 hover:border-sky-400/60",
  dozvoljeno: "border-l-emerald-500 hover:border-emerald-400/60",
};

export function RuleCard({
  rule,
  layout = "grid",
}: {
  rule: Rule;
  layout?: "grid" | "list";
}) {
  const borderAccent = SEVERITY_BORDER[rule.severity] ?? "border-l-border";

  if (layout === "list") {
    return (
      <Link href={`/pravila/${rule.slug}`} className="group block">
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border border-border/80 border-l-[3.5px] bg-surface/80 px-4 py-3 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:bg-surface-2 hover:border-brand/40",
            borderAccent
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SeverityBadge severity={rule.severity} size="sm" className="shrink-0" />
            <span className="truncate text-sm font-semibold text-ink group-hover:text-brand transition-colors">
              {rule.naziv}
            </span>
            {rule.isAutomaticAnnulment && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-sev-ponistavanje/15 px-2 py-0.5 text-[11px] font-semibold text-sev-ponistavanje shrink-0">
                <ShieldAlert className="h-3 w-3" /> Poništavanje
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs text-ink-faint">
            {rule.pravniOsnov && (
              <span className="hidden md:inline font-mono text-[11px] text-ink-dim max-w-[140px] truncate">
                {rule.pravniOsnov}
              </span>
            )}
            <span className="hidden sm:inline rounded-md bg-surface-2 px-2 py-0.5 text-[11px] text-ink-dim border border-border/60">
              {CATEGORY_META[rule.kategorija]?.label ?? rule.kategorija}
            </span>
            <ChevronRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/pravila/${rule.slug}`} className="group block h-full">
      <div
        className={cn(
          "flex h-full flex-col justify-between rounded-2xl border border-border/80 border-l-[4px] bg-surface/80 p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:bg-surface-2 hover:border-brand/40 hover:shadow-lg",
          borderAccent
        )}
      >
        <div>
          {/* Header badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <SeverityBadge severity={rule.severity} size="sm" />
              <span className="rounded-md bg-surface-2/90 border border-border/60 px-2 py-0.5 text-[11px] font-medium text-ink-dim">
                {CATEGORY_META[rule.kategorija]?.label ?? rule.kategorija}
              </span>
            </div>

            {rule.isAutomaticAnnulment && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sev-ponistavanje/15 border border-sev-ponistavanje/30 px-2 py-0.5 text-[10px] font-bold text-sev-ponistavanje">
                <ShieldAlert className="h-3 w-3" /> PONIŠTAVA SE
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mt-3 text-base font-bold leading-snug text-ink group-hover:text-brand transition-colors">
            {rule.naziv}
          </h3>

          {/* Summary */}
          <p className="mt-2 text-xs leading-relaxed text-ink-dim line-clamp-2">
            {rule.summary}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3.5 border-t border-border-soft flex items-center justify-between text-xs">
          {rule.pravniOsnov ? (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-brand/90 truncate max-w-[200px]">
              <Scale className="h-3 w-3 shrink-0" />
              <span className="truncate">{rule.pravniOsnov}</span>
            </span>
          ) : (
            <span className="text-[11px] text-ink-faint">Procedura BM</span>
          )}

          <span className="inline-flex items-center gap-1 font-medium text-[11px] text-ink-faint group-hover:text-brand transition-colors">
            Pogledaj proceduru
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
