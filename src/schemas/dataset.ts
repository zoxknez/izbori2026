import { z } from "zod";
import { ruleSchema } from "./rule";
import { sourceSchema } from "./source";
import { decisionTreeSchema } from "./decision-tree";

const referenceSetSchema = z.object({ ruleIds: z.array(z.string()).default([]), sourceIds: z.array(z.string()).default([]) });

export const datasetSnapshotSchema = z.object({
  schemaVersion: z.literal(1), version: z.string().min(1), generatedAt: z.string().datetime(),
  rules: z.array(ruleSchema), sources: z.array(sourceSchema), decisionTrees: z.array(decisionTreeSchema),
  training: z.array(referenceSetSchema).default([]), simulation: z.array(referenceSetSchema).default([]),
});

export type DatasetSnapshot = z.infer<typeof datasetSnapshotSchema>;
