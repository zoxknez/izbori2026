import { describe, expect, it } from "vitest";
import { EMPTY_INCIDENT, generateChronology } from "./incident";

describe("generateChronology", () => {
  it("includes the core location and incident facts", () => {
    const result = generateChronology({
      ...EMPTY_INCIDENT,
      opstina: "Novi Sad",
      brojMesta: "42",
      datum: "2026-09-05",
      vreme: "14:20",
      staSamVideo: "Lice je ušlo iza paravana sa dva listića.",
      propis: "ZINP čl. 93",
    });

    expect(result).toMatch(/Novi Sad/);
    expect(result).toMatch(/biračkom mestu br\. 42/);
    expect(result).toMatch(/14:20/);
    expect(result).toMatch(/Lice je ušlo iza paravana/);
    expect(result).toMatch(/ZINP čl\. 93/);
  });

  it("remains usable when optional details are empty", () => {
    const result = generateChronology(EMPTY_INCIDENT);

    expect(result).toMatch(/datum\/vreme nije uneto/);
    expect(result).toMatch(/biračko mesto nije uneto/);
    expect(result).toMatch(/Birački odbor je o događaju upozoren/);
    expect(result).not.toMatch(/Relevantan propis:/);
  });
});
