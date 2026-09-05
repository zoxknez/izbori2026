import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Rule } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { Card } from "@/components/ui/card";

export function RuleCard({ rule }: { rule: Rule }) {
  return (
    <Link href={`/pravila/${rule.slug}`} className="group block">
      <Card className="flex items-start gap-4 p-4 transition-colors hover:border-ink-faint sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={rule.severity} size="sm" />
            <span className="text-xs text-ink-faint">{CATEGORY_META[rule.kategorija]?.label ?? rule.kategorija}</span>
          </div>
          <h3 className="mt-2 text-base font-semibold leading-snug text-ink group-hover:text-brand">
            {rule.naziv}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-dim">{rule.summary}</p>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
      </Card>
    </Link>
  );
}
