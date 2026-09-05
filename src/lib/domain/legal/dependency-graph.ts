import type { ReviewStatus } from "@/lib/types";

export interface DependencySource {
  id: string;
  url: string;
  status?: "active" | "superseded" | "archived";
}

export interface DependencyRule {
  id: string;
  reviewStatus?: ReviewStatus;
  lawReferences?: Array<{ url?: string }>;
  sourceUrls?: Array<{ url: string }>;
}

export interface DependencyReference {
  ruleIds: string[];
  sourceIds: string[];
}

export interface DependencyTreeNode {
  id: string;
  ruleIds: string[];
  options: Array<{ ruleIds: string[] }>;
}

export interface DependencyTree {
  id: string;
  nodes: DependencyTreeNode[];
}

export interface DependencySnapshot {
  sources: DependencySource[];
  rules: DependencyRule[];
  training: DependencyReference[];
  simulation: DependencyReference[];
  decisionTrees: DependencyTree[];
}

export interface DependencyGraph {
  sourceToRules: Record<string, string[]>;
  sourceToTraining: Record<string, number[]>;
  sourceToSimulation: Record<string, number[]>;
  sourceToDecisionBranches: Record<string, string[]>;
  ruleToDecisionBranches: Record<string, string[]>;
}

function add<T>(record: Record<string, T[]>, key: string, value: T): void {
  record[key] ??= [];
  if (!record[key].includes(value)) record[key].push(value);
}

function sourceIdsForRule(rule: DependencyRule, sourceByUrl: Map<string, string>): string[] {
  const urls = [
    ...(rule.lawReferences ?? []).map((reference) => reference.url).filter((url): url is string => Boolean(url)),
    ...(rule.sourceUrls ?? []).map((source) => source.url),
  ];
  return [...new Set(urls.map((url) => sourceByUrl.get(url)).filter((id): id is string => Boolean(id)))];
}

export function buildDependencyGraph(snapshot: DependencySnapshot): DependencyGraph {
  const sourceToRules: Record<string, string[]> = {};
  const sourceToTraining: Record<string, number[]> = {};
  const sourceToSimulation: Record<string, number[]> = {};
  const sourceToDecisionBranches: Record<string, string[]> = {};
  const ruleToDecisionBranches: Record<string, string[]> = {};
  const sourceByUrl = new Map(snapshot.sources.map((source) => [source.url, source.id]));

  snapshot.rules.forEach((rule) => {
    sourceIdsForRule(rule, sourceByUrl).forEach((sourceId) => add(sourceToRules, sourceId, rule.id));
  });
  snapshot.training.forEach((item, index) => item.sourceIds.forEach((sourceId) => add(sourceToTraining, sourceId, index)));
  snapshot.simulation.forEach((item, index) => item.sourceIds.forEach((sourceId) => add(sourceToSimulation, sourceId, index)));
  snapshot.decisionTrees.forEach((tree) => {
    tree.nodes.forEach((node) => {
      const nodeBranchId = `${tree.id}:${node.id}`;
      node.ruleIds.forEach((ruleId) => add(ruleToDecisionBranches, ruleId, nodeBranchId));
      node.options.forEach((option, optionIndex) => {
        const branchId = `${nodeBranchId}:option-${optionIndex + 1}`;
        option.ruleIds.forEach((ruleId) => add(ruleToDecisionBranches, ruleId, branchId));
      });
    });
  });

  const sourceRulesById = new Map(snapshot.sources.map((source) => [source.id, source]));
  snapshot.rules.forEach((rule) => {
    sourceIdsForRule(rule, sourceByUrl).forEach((sourceId) => {
      const source = sourceRulesById.get(sourceId);
      if (source?.status === "superseded") {
        // The key is retained in the graph even when its only current consumers are stale.
        sourceToRules[sourceId] ??= [];
      }
    });
  });

  Object.entries(ruleToDecisionBranches).forEach(([ruleId, branches]) => {
    const rule = snapshot.rules.find((candidate) => candidate.id === ruleId);
    const sourceIds = rule ? sourceIdsForRule(rule, sourceByUrl) : [];
    sourceIds.forEach((sourceId) => branches.forEach((branch) => add(sourceToDecisionBranches, sourceId, branch)));
  });

  return { sourceToRules, sourceToTraining, sourceToSimulation, sourceToDecisionBranches, ruleToDecisionBranches };
}

export interface StalePropagation {
  sourceIds: string[];
  ruleIds: string[];
  trainingIndexes: number[];
  simulationIndexes: number[];
  decisionTreeIds: string[];
}

export function calculateStalePropagation(snapshot: DependencySnapshot): StalePropagation {
  const graph = buildDependencyGraph(snapshot);
  const sourceIds = snapshot.sources.filter((source) => source.status === "superseded").map((source) => source.id);
  const staleSources = new Set(sourceIds);
  const ruleIds = new Set(sourceIds.flatMap((sourceId) => graph.sourceToRules[sourceId] ?? []));
  const trainingIndexes = new Set(sourceIds.flatMap((sourceId) => graph.sourceToTraining[sourceId] ?? []));
  const simulationIndexes = new Set(sourceIds.flatMap((sourceId) => graph.sourceToSimulation[sourceId] ?? []));
  const decisionTreeIds = new Set<string>();

  sourceIds.forEach((sourceId) => {
    (graph.sourceToDecisionBranches[sourceId] ?? []).forEach((branch) => decisionTreeIds.add(branch.split(":", 1)[0]));
  });

  // Keep the source set explicit in the result so an Admin publish workflow can audit every propagation.
  return { sourceIds: [...staleSources], ruleIds: [...ruleIds], trainingIndexes: [...trainingIndexes], simulationIndexes: [...simulationIndexes], decisionTreeIds: [...decisionTreeIds] };
}
