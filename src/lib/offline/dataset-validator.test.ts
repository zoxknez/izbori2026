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

function responseFor(files: DatasetFile[], version = (files[0].payload as { version: string }).version) {
  return new Response(JSON.stringify({ version, manifestHash: files[0].sha256, files }), { status: 200 });
}

describe("offline dataset validation", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
  });

  it("odbija hash mismatch", async () => {
    await expect(validateDatasetFile(await file(snapshot(), false))).rejects.toThrow("hash mismatch");
  });

  it("odbija decision tree koji referencira nepostojeće pravilo", async () => {
    const tree = { id: "T", slug: "t", title: "T", description: "T", startNodeId: "R", publicationStatus: "published" as const, reviewStatus: "legal_review" as const, order: 0, nodes: [{ id: "R", type: "result" as const, prompt: "R", options: [], ruleIds: ["UNKNOWN"], order: 0 }] };
    await expect(validateDatasetFile(await file(snapshot({ decisionTrees: [tree] })))).rejects.toThrow("nepoznata pravila");
  });

  it("odbija neispravan schema payload", async () => {
    await expect(validateDatasetFile(await file({ nope: true }))).rejects.toThrow();
  });

  it("validira, preuzima i tek onda aktivira snapshot", async () => {
    const validFile = await file(snapshot());
    vi.stubGlobal("fetch", vi.fn(async () => responseFor([validFile])));
    const active = await downloadAndActivateDataset();
    expect(active.version).toBe("test-1");
    expect(await readDatasetMeta("activeDatasetVersion")).toBe("test-1");
  });

  it("zadržava prethodni pointer ako preuzimanje zakaže posle prvog fajla", async () => {
    const oldFile = await file(snapshot());
    vi.stubGlobal("fetch", vi.fn(async () => responseFor([oldFile])));
    await downloadAndActivateDataset();

    const nextFile = await file(snapshot({ version: "test-2" }));
    const brokenFile = await file(snapshot({ version: "test-2", rules: [{ invalid: true }] }), false);
    vi.stubGlobal("fetch", vi.fn(async () => responseFor([nextFile, brokenFile])));
    await expect(downloadAndActivateDataset()).rejects.toThrow();
    expect(await readDatasetMeta("activeDatasetVersion")).toBe("test-1");
  });

  it("odbija manifest koji meša verzije ili ne odgovara payload-u", async () => {
    const first = await file(snapshot());
    const second = await file(snapshot({ version: "test-2" }));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      version: "test-1",
      manifestHash: first.sha256,
      files: [first, second],
    }), { status: 200 })));
    await expect(downloadAndActivateDataset()).rejects.toThrow("nisu usklađeni");
    expect(await readDatasetMeta("activeDatasetVersion")).toBe("test-1");
  });
});
