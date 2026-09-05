export { decisionNodeType, decisionOptionSchema, decisionNodeSchema, decisionTreeSchema } from "@/schemas/decision-tree";
export type { DecisionNode, DecisionTree } from "@/schemas/decision-tree";

export interface DecisionEvaluation {
  treeSlug: string;
  visitedNodeIds: string[];
  ruleIds: string[];
  terminal: boolean;
}
