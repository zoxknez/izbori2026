import type { DecisionEvaluation, DecisionTree } from "./types";

export function evaluateDecisionTree(tree: DecisionTree, answers: Record<string, string>): DecisionEvaluation {
  const nodes = new Map(tree.nodes.map((node) => [node.id, node]));
  const visitedNodeIds: string[] = [];
  const ruleIds = new Set<string>();
  let nodeId: string | undefined = tree.startNodeId;

  for (let step = 0; step < tree.nodes.length + 1 && nodeId; step += 1) {
    const node = nodes.get(nodeId);
    if (!node) throw new Error(`Nepostojeći čvor ${nodeId} u stablu ${tree.slug}`);
    if (visitedNodeIds.includes(node.id)) throw new Error(`Ciklus u stablu ${tree.slug} kod čvora ${node.id}`);
    visitedNodeIds.push(node.id);
    node.ruleIds.forEach((id) => ruleIds.add(id));
    if (node.type === "result") {
      return { treeSlug: tree.slug, visitedNodeIds, ruleIds: [...ruleIds], terminal: true };
    }
    const answer = answers[node.id];
    const option = node.options.find((candidate) => candidate.id === answer);
    if (!option) return { treeSlug: tree.slug, visitedNodeIds, ruleIds: [...ruleIds, ...node.options.flatMap((item) => item.ruleIds)], terminal: false };
    option.ruleIds.forEach((id) => ruleIds.add(id));
    nodeId = option.nextNodeId;
  }
  throw new Error(`Stablo ${tree.slug} nije završilo u rezultatu.`);
}
