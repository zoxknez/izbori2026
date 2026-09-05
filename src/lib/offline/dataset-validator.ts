import { datasetSnapshotSchema, type DatasetSnapshot } from "@/schemas/dataset";
import type { SourceEntry } from "@/content/sources";
export { datasetSnapshotSchema } from "@/schemas/dataset";
export type { DatasetSnapshot } from "@/schemas/dataset";

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
