import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadAndActivateDataset } from "./dataset-manager";
import { readDatasetMeta } from "./indexed-db";
import { sha256Hex, stableStringify, validateDatasetFile, type DatasetFile } from "./dataset-validator";

function snapshot(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1 as const,
    version: "test-1",
    generatedAt: new Date().toISOString(),
    rules: [],
    sources: [],
    decisionTrees: [],
    training: [],
    simulation: [],
    ...overrides,
  };
}

async function file(payload: unknown, hash = true): Promise<DatasetFile> {
  const serialized = stableStringify(payload);
  return {
    filename: "snapshot.json",
    payload,
    sha256: hash ? await sha256Hex(serialized) : "0".repeat(64),
    size: new TextEncoder().encode(serialized).byteLength,
  };
}

describe("offline dataset validation", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
  });

  it("odbija hash mismatch", async () => {
    await expect(validateDatasetFile(await file(snapshot(), false))).rejects.toThrow("hash mismatch");
  });

  it("odbija decision tree koji referencira nepostojeće pravilo", async () => {
    const tree = { id: "T", slug: "t", title: "T", description: "T", startNodeId: "R", publicationStatus: "published" as const, reviewStatus: "REVIEW_REQUIRED" as const, order: 0, nodes: [{ id: "R", type: "result" as const, prompt: "R", options: [], ruleIds: ["UNKNOWN"], order: 0 }] };
    await expect(validateDatasetFile(await file(snapshot({ decisionTrees: [tree] })))).rejects.toThrow("nepoznata pravila");
  });

  it("odbija neispravan schema payload", async () => {
    await expect(validateDatasetFile(await file({ nope: true }))).rejects.toThrow();
  });

  it("validira, preuzima i tek onda aktivira snapshot", async () => {
    const validFile = await file(snapshot());
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ files: [validFile] }), { status: 200 })));
    const active = await downloadAndActivateDataset();
    expect(active.version).toBe("test-1");
    expect(await readDatasetMeta("activeDatasetVersion")).toBe("test-1");
  });
});
