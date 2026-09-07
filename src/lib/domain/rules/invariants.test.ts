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

  it("garantuje zakonitu formulaciju identifikacije birača (čl. 93 ZINP) i zabranjuje kolokvijalno 'LK ili pasoš'", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    const simulatorFiles = [
      path.join(process.cwd(), "src", "lib", "domain", "simulator", "role-permissions.ts"),
      path.join(process.cwd(), "src", "lib", "domain", "simulator", "incident-binding.ts"),
    ];

    for (const filePath of simulatorFiles) {
      const content = await fs.readFile(filePath, "utf8");
      expect(content).not.toMatch(/LK ili pasoš/i);
      expect(content).not.toMatch(/lična karta ili pasoš/i);
    }

    // Provera da role-permissions.ts sadrži eksplicitnu referencu na član 93 ZINP
    const rolePermissionsContent = await fs.readFile(
      path.join(process.cwd(), "src", "lib", "domain", "simulator", "role-permissions.ts"),
      "utf8",
    );
    expect(rolePermissionsContent).toContain("član 93 ZINP");
  });
});

