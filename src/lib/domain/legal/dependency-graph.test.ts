import { describe, expect, it } from "vitest";
import { buildDependencyGraph, calculateStalePropagation } from "./dependency-graph";

describe("legal dependency graph", () => {
  const snapshot = {
    sources: [
      { id: "S1", url: "https://example.test/law", status: "superseded" as const },
      { id: "S2", url: "https://example.test/rik", status: "active" as const },
    ],
    rules: [
      { id: "R1", lawReferences: [{ url: "https://example.test/law" }], sourceUrls: [] },
      { id: "R2", lawReferences: [{ url: "https://example.test/rik" }], sourceUrls: [] },
    ],
    training: [{ ruleIds: ["R1"], sourceIds: ["S1"] }, { ruleIds: ["R2"], sourceIds: ["S2"] }],
    simulation: [{ ruleIds: ["R1"], sourceIds: ["S1"] }],
    decisionTrees: [{ id: "T1", nodes: [{ id: "N1", ruleIds: [], options: [{ ruleIds: ["R1"] }, { ruleIds: ["R1"] }] }] }],
  };

  it("counts rules and distinct decision-tree branches per source", () => {
    const graph = buildDependencyGraph(snapshot);
    expect(graph.sourceToRules.S1).toEqual(["R1"]);
    expect(graph.ruleToDecisionBranches.R1).toHaveLength(2);
    expect(graph.sourceToDecisionBranches.S1).toHaveLength(2);
  });

  it("propagates superseded source state to all dependent modules", () => {
    expect(calculateStalePropagation(snapshot)).toEqual({ sourceIds: ["S1"], ruleIds: ["R1"], trainingIndexes: [0], simulationIndexes: [0], decisionTreeIds: ["T1"] });
  });
});
