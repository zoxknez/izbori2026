import { z } from "zod";

export const decisionNodeType = z.enum(["question", "result"]);
export const decisionOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  nextNodeId: z.string().optional(),
  ruleIds: z.array(z.string()).default([]),
});

export const decisionNodeSchema = z.object({
  id: z.string().min(1),
  type: decisionNodeType,
  prompt: z.string().min(1),
  options: z.array(decisionOptionSchema).default([]),
  ruleIds: z.array(z.string()).default([]),
  order: z.number().int().nonnegative(),
});

export const decisionTreeSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  startNodeId: z.string().min(1),
  nodes: z.array(decisionNodeSchema).min(1),
  publicationStatus: z.enum(["draft", "published", "archived"]),
  reviewStatus: z.enum(["unreviewed", "content_review", "legal_review", "verified", "stale"]),
  order: z.number().int().nonnegative(),
});

export type DecisionNode = z.infer<typeof decisionNodeSchema>;
export type DecisionTree = z.infer<typeof decisionTreeSchema>;

export interface DecisionEvaluation {
  treeSlug: string;
  visitedNodeIds: string[];
  ruleIds: string[];
  terminal: boolean;
}
