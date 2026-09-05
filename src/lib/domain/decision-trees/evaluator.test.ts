import { describe, expect, it } from "vitest";
import { decisionTrees } from "@/content/decision-trees";
import { evaluateDecisionTree } from "./evaluator";

describe("decision tree evaluator", () => {
  it("evaluira sva tri seedovana stabla do terminalnog rezultata", () => {
    const cases = [
      [decisionTrees[0], { "DT01-N1": "no" }, "P06"],
      [decisionTrees[1], { "DT02-N1": "yes" }, "T09"],
      [decisionTrees[2], { "DT03-N1": "yes" }, "Z01"],
    ] as const;

    for (const [tree, answers, expectedRuleId] of cases) {
      const result = evaluateDecisionTree(tree, answers);
      expect(result.terminal).toBe(true);
      expect(result.ruleIds).toContain(expectedRuleId);
    }
  });

  it("ne završava bez odgovora na pitanje", () => {
    const result = evaluateDecisionTree(decisionTrees[0], {});
    expect(result.terminal).toBe(false);
  });
});
