import { z } from "zod";
import { ruleSchema } from "@/lib/domain/rules/invariants";
import { decisionTreeSchema } from "@/lib/domain/decision-trees/types";
import type { SourceEntry } from "@/content/sources";

const sourceSchema = z.object({
  id: z.string().min(1),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  type: z.enum(["law", "bylaw", "rik", "court", "odihr", "observer_report", "other"]).optional(),
  label: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
  publisher: z.string().optional(),
  version: z.string().optional(),
  validFromDate: z.string().optional(),
  validUntilDate: z.string().optional(),
  status: z.enum(["active", "superseded", "archived"]).optional(),
  supersedesId: z.string().optional(),
});

const referenceSetSchema = z.object({
  ruleIds: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
});

export const datasetSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  version: z.string().min(1),
  generatedAt: z.string().datetime(),
  rules: z.array(ruleSchema),
  sources: z.array(sourceSchema),
  decisionTrees: z.array(decisionTreeSchema),
  training: z.array(referenceSetSchema).default([]),
  simulation: z.array(referenceSetSchema).default([]),
});

export type DatasetSnapshot = z.infer<typeof datasetSnapshotSchema>;

export interface DatasetFile {
  filename: string;
  payload: unknown;
  sha256: string;
  size: number;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    return Object.keys(item as Record<string, unknown>).sort().reduce<Record<string, unknown>>((result, key) => {
      result[key] = (item as Record<string, unknown>)[key];
      return result;
    }, {});
  });
}

export async function sha256Hex(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto nije dostupan za proveru dataseta.");
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function validateDatasetFile(file: DatasetFile): Promise<DatasetSnapshot> {
  const snapshot = datasetSnapshotSchema.parse(file.payload);
  const serialized = stableStringify(snapshot);
  const actualHash = await sha256Hex(serialized);
  const actualSize = new TextEncoder().encode(serialized).byteLength;
  if (actualHash !== file.sha256) throw new Error(`Dataset hash mismatch za ${file.filename}.`);
  if (actualSize !== file.size) throw new Error(`Dataset size mismatch za ${file.filename}.`);

  const ruleIds = new Set(snapshot.rules.map((rule) => rule.id));
  const sourceIds = new Set(snapshot.sources.map((source) => source.id));
  const referencedRuleIds = new Set<string>();
  const referencedSourceIds = new Set<string>();
  for (const tree of snapshot.decisionTrees) {
    tree.nodes.forEach((node) => {
      node.ruleIds.forEach((id) => referencedRuleIds.add(id));
      node.options.forEach((option) => option.ruleIds.forEach((id) => referencedRuleIds.add(id)));
    });
  }
  [...snapshot.training, ...snapshot.simulation].forEach((item) => {
    item.ruleIds.forEach((id) => referencedRuleIds.add(id));
    item.sourceIds.forEach((id) => referencedSourceIds.add(id));
  });
  const missingRules = [...referencedRuleIds].filter((id) => !ruleIds.has(id));
  const missingSources = [...referencedSourceIds].filter((id) => !sourceIds.has(id));
  if (missingRules.length > 0) throw new Error(`Dataset sadrži nepoznata pravila: ${missingRules.join(", ")}`);
  if (missingSources.length > 0) throw new Error(`Dataset sadrži nepoznate izvore: ${missingSources.join(", ")}`);
  return snapshot;
}

export function sourceEntryFromSnapshot(source: DatasetSnapshot["sources"][number]): SourceEntry {
  return source;
}
