import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAllRules, getDecisionTrees, getSources } from "@/lib/data";
import { buildDependencyGraph } from "@/lib/domain/legal/dependency-graph";
import { hasPermission } from "@/lib/domain/admin/rbac";
import { AdminPublishButton } from "@/components/admin-publish-button";
import type { AdminRole } from "@/lib/domain/admin/rbac";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const [rules, sources, decisionTrees] = await Promise.all([getAllRules(), getSources(), getDecisionTrees()]);
  const graph = buildDependencyGraph({ rules, sources, decisionTrees, training: [], simulation: [] });
  const sourceRows = sources.map((source) => ({ source, ruleCount: graph.sourceToRules[source.id]?.length ?? 0, branchCount: graph.sourceToDecisionBranches[source.id]?.length ?? 0 }));

  return <main className="mx-auto max-w-5xl px-5 py-12">
    <p className="text-xs font-bold uppercase tracking-wider text-brand">Admin / dependency-aware content</p>
    <h1 className="mt-2 text-3xl font-extrabold text-ink">Kontrolna tabla</h1>
    <p className="mt-3 text-sm text-ink-dim">Prijavljen: <strong>{session.user.email}</strong> · uloga: <strong>{session.user.role}</strong></p>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs text-ink-faint">Objava</p><p className="mt-2 text-lg font-bold text-ink">Publish gate aktivan</p></div>
      <div className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs text-ink-faint">Dataset</p><p className="mt-2 text-lg font-bold text-ink">Hash + cross-reference</p></div>
      <div className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs text-ink-faint">Audit</p><p className="mt-2 text-lg font-bold text-ink">Append-only log</p></div>
    </div>
    <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
      <div className="flex flex-wrap gap-3"><Link href="/admin/rules" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-brand-ink">Otvori editor pravila</Link><Link href="/admin/sources" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-ink">Otvori editor izvora</Link><span className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-ink-dim">{rules.length} pravila · {sources.length} izvora · {decisionTrees.length} stabla</span></div>
      {hasPermission(session.user.role as AdminRole, "publish") && <AdminPublishButton />}
    </div>
    <section className="mt-8 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-end justify-between gap-4"><div><h2 className="text-lg font-bold text-ink">Dependency graph izvora</h2><p className="mt-1 text-sm text-ink-dim">Formalna decision-tree grananja i pravila koja zavise od svakog izvora.</p></div><span className="text-xs text-ink-faint">{sourceRows.filter((row) => row.ruleCount > 0).length} povezano</span></div>
      <div className="mt-5 divide-y divide-border/60">{sourceRows.map(({ source, ruleCount, branchCount }) => <div key={source.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span className="font-semibold text-ink">{source.label}</span><span className="text-xs text-ink-dim">{ruleCount} pravila · {branchCount} decision-tree grana · <span className={source.status === "superseded" ? "text-rose-500" : "text-emerald-500"}>{source.status ?? "active"}</span></span></div>)}</div>
    </section>
  </main>;
}
