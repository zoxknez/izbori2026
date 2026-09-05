import { redirect } from "next/navigation";
import { getAllRules, getDecisionTrees, getSources } from "@/lib/data";
import { AdminSourceEditor } from "@/components/admin-source-editor";
import { buildTrainingQuestions } from "@/lib/domain/training/generate-questions";
import { simulationEvents } from "@/lib/domain/simulator/seed-events";
import { buildDependencyGraph, sourceIdsForRule } from "@/lib/domain/legal/dependency-graph";
import { getCurrentAdmin } from "@/lib/domain/admin/server-auth";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const [rules, sources, decisionTrees] = await Promise.all([getAllRules(), getSources(), getDecisionTrees()]);
  const training = buildTrainingQuestions(rules).map((question) => ({ ruleIds: [question.ruleId], sourceIds: question.sourceIds }));
  const sourceByRuleId = new Map(rules.map((rule) => [rule.id, rule]));
  const simulation = simulationEvents.flatMap((event) => event.choices.map((choice) => ({
    ruleIds: choice.ruleIds,
    sourceIds: [...new Set(choice.ruleIds.flatMap((ruleId) => {
      const rule = sourceByRuleId.get(ruleId);
      return rule ? sourceIdsForRule(rule, sources) : [];
    }))],
  })));
  const graph = buildDependencyGraph({ rules, sources, decisionTrees, training, simulation });
  const impactBySource = Object.fromEntries(sources.map((source) => [source.id, {
    rules: graph.sourceToRules[source.id]?.length ?? 0,
    training: graph.sourceToTraining[source.id]?.length ?? 0,
    simulation: graph.sourceToSimulation[source.id]?.length ?? 0,
    decisionBranches: graph.sourceToDecisionBranches[source.id]?.length ?? 0,
  }]));

  return <main className="mx-auto max-w-6xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-wider text-brand">Admin / legal sources</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Editor pravnih izvora</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">Jedini source model aplikacije je tabela <code>sources</code>. Status izvora, verzija i period važenja ulaze u audit, a supersession propagira stale status do svih zavisnih modula.</p><div className="mt-8"><AdminSourceEditor sources={sources} role={admin.role} impactBySource={impactBySource} /></div></main>;
}
