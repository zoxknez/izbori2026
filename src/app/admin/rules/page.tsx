import { redirect } from "next/navigation";
import { getAllRules, getDecisionTrees } from "@/lib/data";
import { AdminRuleEditor } from "@/components/admin-rule-editor";
import { buildTrainingQuestions } from "@/lib/domain/training/generate-questions";
import { simulationEvents } from "@/lib/domain/simulator/seed-events";
import { buildDependencyGraph } from "@/lib/domain/legal/dependency-graph";
import { getCurrentAdmin } from "@/lib/domain/admin/server-auth";

export const dynamic = "force-dynamic";

export default async function AdminRulesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const [rules, decisionTrees] = await Promise.all([getAllRules(), getDecisionTrees()]);
  const graph = buildDependencyGraph({ rules, sources: [], decisionTrees, training: [], simulation: [] });
  const trainingQuestions = buildTrainingQuestions(rules);
  const impactByRule = Object.fromEntries(rules.map((rule) => [rule.id, {
    decisionBranches: graph.ruleToDecisionBranches[rule.id]?.length ?? 0,
    trainingQuestions: trainingQuestions.filter((question) => question.ruleId === rule.id).length,
    simulationChoices: simulationEvents.reduce((count, event) => count + event.choices.filter((choice) => choice.ruleIds.includes(rule.id)).length, 0),
  }]));
  return <main className="mx-auto max-w-6xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-wider text-brand">Admin / content editor</p><h1 className="mt-2 text-3xl font-extrabold text-ink">Editor pravila</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-dim">Izmene se čuvaju server-side uz RBAC i audit zapis. Za javnu/offline verziju i dalje je potreban validiran publish dataset-a.</p><div className="mt-8"><AdminRuleEditor rules={rules} role={admin.role} impactByRule={impactByRule} /></div></main>;
}
