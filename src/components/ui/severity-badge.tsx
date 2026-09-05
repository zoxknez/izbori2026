import { SEVERITY_META, type Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOT: Record<Severity, string> = {
  dozvoljeno: "bg-sev-dozvoljeno",
  info: "bg-sev-info",
  proveri: "bg-sev-proveri",
  nepravilnost: "bg-sev-nepravilnost",
  teska_nepravilnost: "bg-sev-teska",
  krivicno_delo: "bg-sev-krivicno",
  ponistavanje: "bg-sev-ponistavanje",
};

export function SeverityBadge({
  severity,
  size = "md",
  className,
}: {
  severity: Severity;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = SEVERITY_META[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        meta.className,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[severity])} />
      {meta.label}
    </span>
  );
}
