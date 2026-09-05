"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, GitBranch, ChevronRight } from "lucide-react";
import type { DecisionTree } from "@/lib/domain/decision-trees/types";
import { evaluateDecisionTree } from "@/lib/domain/decision-trees/evaluator";
import type { Rule } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function DecisionTreeNavigator({ trees, rules }: { trees: DecisionTree[]; rules: Rule[] }) {
  const [treeSlug, setTreeSlug] = useState(trees[0]?.slug ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const tree = trees.find((item) => item.slug === treeSlug) ?? trees[0];
  const nodes = useMemo(() => new Map(tree?.nodes.map((node) => [node.id, node]) ?? []), [tree]);

  const currentNode = useMemo(() => {
    if (!tree) return undefined;
    let node = nodes.get(tree.startNodeId);
    for (let i = 0; i < tree.nodes.length && node?.type === "question"; i += 1) {
      const answer = answers[node.id];
      if (!answer) break;
      const option = node.options.find((candidate) => candidate.id === answer);
      if (!option?.nextNodeId) break;
      node = nodes.get(option.nextNodeId);
    }
    return node;
  }, [answers, nodes, tree]);

  if (!tree || !currentNode) return null;
  const evaluation = evaluateDecisionTree(tree, answers);
  const ruleMap = new Map(rules.map((rule) => [rule.id, rule]));
  const recommendedRules = evaluation.ruleIds.map((id) => ruleMap.get(id)).filter((rule): rule is Rule => Boolean(rule));

  function reset(nextSlug = tree.slug) {
    setTreeSlug(nextSlug);
    setAnswers({});
  }

  return (
    <section className="rounded-3xl border border-brand/20 bg-brand/[0.035] p-5 shadow-sm sm:p-7" aria-labelledby="decision-tree-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand"><GitBranch className="h-4 w-4" /> Formalni vodič kroz odluku</div>
          <h2 id="decision-tree-title" className="mt-2 text-xl font-extrabold text-ink">Kreni od onoga što si upravo video</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-dim">Odgovori na kratka pitanja. Svaki korak vodi ka relevantnom pravilu iz baze, sa jasnim sledećim postupkom.</p>
        </div>
        <select aria-label="Izaberi vodič" value={tree.slug} onChange={(event) => reset(event.target.value)} className="h-10 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-ink">
          {trees.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
        </select>
      </div>
      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        {currentNode.type === "result" ? (
          <div>
            <p className="text-base font-bold text-ink">{currentNode.prompt}</p>
            {recommendedRules.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2">{recommendedRules.map((rule) => <Link key={rule.id} href={`/pravila/${rule.slug}`} className="group rounded-xl border border-border bg-surface-2 p-3 transition-colors hover:border-brand"><span className="text-sm font-bold text-ink group-hover:text-brand">{rule.naziv}</span><span className="mt-1 flex items-center gap-1 text-xs text-ink-dim">Otvori protokol <ChevronRight className="h-3 w-3" /></span></Link>)}</div>}
            <Button variant="secondary" size="sm" className="mt-5" onClick={() => reset()}><RotateCcw className="h-3.5 w-3.5" /> Ponovi vodič</Button>
          </div>
        ) : (
          <div>
            <p className="text-base font-bold text-ink">{currentNode.prompt}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">{currentNode.options.map((option) => <button key={option.id} type="button" onClick={() => setAnswers((previous) => ({ ...previous, [currentNode.id]: option.id }))} className="group flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3 text-left text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand">{option.label}<ChevronRight className="h-4 w-4 text-ink-faint group-hover:text-brand" /></button>)}</div>
            {Object.keys(answers).length > 0 && <button type="button" onClick={() => setAnswers({})} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Vrati se na početak</button>}
          </div>
        )}
      </div>
    </section>
  );
}
