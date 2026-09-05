import { describe, expect, it } from "vitest";
import { validateCounting, type CountingInput } from "./results-validator";

const base: CountingInput = { R: 1000, U: 350, G: 650, B: 650, V: 635, N: 15, listVotes: [385, 250] };

describe("validateCounting", () => {
  it.each([
    ["validan zapisnik", base, false, false, true],
    ["višak u kutiji", { ...base, G: 649 }, true, false, false],
    ["U+B premašuje R", { ...base, R: 999 }, true, true, false],
    ["U+B je manji od R", { ...base, R: 1001 }, false, true, false],
    ["važeći plus nevažeći nije B", { ...base, N: 14 }, false, true, false],
    ["zbir lista nije V", { ...base, listVotes: [384, 250] }, false, true, false],
    ["nepotpun unos", { ...base, R: null, listVotes: [null, 250] }, false, false, false],
    ["prazan unos", { R: null, U: null, G: null, B: null, V: null, N: null, listVotes: [null] }, false, false, false],
  ] satisfies Array<[string, CountingInput, boolean, boolean, boolean]>)
  ("%s", (_label, input, annulment, calculation, valid) => {
    const result = validateCounting(input);
    expect(result.isAnnulmentFail).toBe(annulment);
    expect(result.isCalculationFail).toBe(calculation);
    expect(result.isEverythingValid).toBe(valid);
  });
});
