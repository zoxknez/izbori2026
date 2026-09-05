import Link from "next/link";
import { AlertTriangle, Gavel, Scale, ListChecks, Ban, BookOpen, Link2 } from "lucide-react";
import type { Rule } from "@/lib/types";
import { CATEGORY_META, ELECTION_TYPE_META } from "@/lib/types";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { RoleActions } from "@/components/role-actions";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border-soft pt-6 first:border-t-0 first:pt-0">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-faint">
        <Icon className="h-4 w-4" />
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

const MYTH_META = {
  mit: { label: "MIT", className: "bg-sev-teska/15 text-sev-teska border-sev-teska/30" },
  cinjenica: { label: "ČINJENICA", className: "bg-sev-dozvoljeno/15 text-sev-dozvoljeno border-sev-dozvoljeno/30" },
  zavisi: { label: "ZAVISI OD OKOLNOSTI", className: "bg-sev-proveri/15 text-sev-proveri border-sev-proveri/30" },
};

export function RuleDetail({ rule, related }: { rule: Rule; related: Rule[] }) {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={rule.severity} />
          <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-ink-dim">
            {CATEGORY_META[rule.kategorija]?.label ?? rule.kategorija}
          </span>
          {rule.isAutomaticAnnulment && (
            <span className="rounded-full border border-sev-ponistavanje/30 bg-sev-ponistavanje/10 px-2.5 py-1 text-xs font-semibold text-sev-ponistavanje">
              🚨 Automatsko poništavanje
            </span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">{rule.naziv}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-dim">{rule.summary}</p>
        <p className="mt-3 text-xs text-ink-faint">
          Odnosi se na: {rule.electionTypes.map((t) => ELECTION_TYPE_META[t] ?? t).join(", ")}
        </p>
      </div>

      {rule.mythCheck && (
        <Card className="border-dashed">
          <CardBody className="pt-5">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${MYTH_META[rule.mythCheck.verdict].className}`}
            >
              {MYTH_META[rule.mythCheck.verdict].label}
            </span>
            <p className="mt-3 text-sm font-medium italic text-ink">„{rule.mythCheck.claim}“</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">{rule.mythCheck.explanation}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-8">
          <Section icon={Scale} title="Šta pravilo kaže">
            <p className="text-[15px] leading-relaxed text-ink">{rule.legalRule}</p>
          </Section>

          {rule.legalEffect && (
            <Section icon={AlertTriangle} title="Pravna posledica">
              <p className="text-[15px] leading-relaxed text-ink">{rule.legalEffect}</p>
            </Section>
          )}

          {rule.whatToCheck.length > 0 && (
            <Section icon={ListChecks} title="Odmah proveri">
              <ul className="space-y-2">
                {rule.whatToCheck.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-dim">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sev-proveri/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section icon={Gavel} title="Šta uraditi">
            <RoleActions
              controllerActions={rule.controllerActions}
              voterActions={rule.voterActions}
              observerActions={rule.observerActions}
            />
          </Section>

          {rule.evidenceChecklist.length > 0 && (
            <Section icon={ListChecks} title="Šta zabeležiti kao dokaz">
              <ul className="space-y-2">
                {rule.evidenceChecklist.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-dim">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {rule.doNotDo.length > 0 && (
            <Section icon={Ban} title="Nemoj">
              <ul className="space-y-2">
                {rule.doNotDo.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 rounded-lg border border-sev-teska/25 bg-sev-teska/5 p-3 text-sm leading-relaxed text-ink"
                  >
                    <Ban className="mt-0.5 h-4 w-4 shrink-0 text-sev-teska" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section icon={BookOpen} title="Pravni osnov">
            <ul className="space-y-1.5">
              {rule.lawReferences.map((ref, i) => (
                <li key={i} className="text-sm text-ink-dim">
                  <span className="font-medium text-ink">{ref.law}</span>, {ref.article}
                </li>
              ))}
            </ul>
          </Section>
        </CardHeader>
      </Card>

      {related.length > 0 && (
        <Section icon={Link2} title="Povezane nepravilnosti">
          <div className="grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/pravila/${r.slug}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink-dim hover:border-ink-faint hover:text-ink"
              >
                <SeverityBadge severity={r.severity} size="sm" />
                <span className="truncate">{r.naziv}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
