import { describe, expect, it } from "vitest";
import { rules } from "@/content/rules";
import { SEVERITY_META } from "@/lib/types";
import { assertRulesInvariants } from "./invariants";

describe("kanonska pravila", () => {
  it("validira sva pravila bez duplikata i izvodi poništavanje iz severity", () => {
    const canonical = assertRulesInvariants(rules);
    expect(canonical).toHaveLength(66);
    expect(canonical.filter((rule) => rule.isAutomaticAnnulment)).toHaveLength(7);
    expect(canonical.every((rule) => rule.phases.length > 0)).toBe(true);
  });

  it("koristi preciznu javnu labelu za krivično delo", () => {
    expect(SEVERITY_META.krivicno_delo.label).toBe("Moguće krivično delo");
  });
});
