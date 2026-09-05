export interface CountingInput {
  R: number | null;
  U: number | null;
  G: number | null;
  B: number | null;
  V: number | null;
  N: number | null;
  listVotes: Array<number | null>;
}

export interface CountingCheck {
  status: "unchecked" | "pass" | "warning" | "annulment";
  ok: boolean | null;
  actual: number | null;
  expected: number | null;
  difference: number | null;
}

export interface CountingResult {
  ruleA: CountingCheck;
  ruleB: CountingCheck;
  ruleC: CountingCheck;
  ruleD: CountingCheck;
  hasAnyInput: boolean;
  isAnnulmentFail: boolean;
  isCalculationFail: boolean;
  allEvaluated: boolean;
  isEverythingValid: boolean;
}

function check(ok: boolean | null, actual: number | null, expected: number | null, difference: number | null, warning = false): CountingCheck {
  return {
    status: ok === null ? "unchecked" : ok ? "pass" : warning ? "warning" : "annulment",
    ok,
    actual,
    expected,
    difference,
  };
}

export function validateCounting(input: CountingInput): CountingResult {
  const hasAnyInput = Object.values(input).some((value) =>
    Array.isArray(value) ? value.some((item) => item !== null) : value !== null,
  );

  const ruleAReady = input.B !== null && input.G !== null;
  const ruleA = check(ruleAReady ? input.B! <= input.G! : null, input.B, input.G, ruleAReady ? input.B! - input.G! : null);

  const ruleBReady = input.U !== null && input.B !== null && input.R !== null;
  const sumUB = ruleBReady ? input.U! + input.B! : null;
  const ruleBExact = ruleBReady ? sumUB === input.R : null;
  const ruleB = check(
    ruleBReady ? sumUB! <= input.R! : null,
    sumUB,
    input.R,
    ruleBReady ? sumUB! - input.R! : null,
    ruleBReady ? sumUB! < input.R! : false,
  );

  const ruleCReady = input.N !== null && input.V !== null && input.B !== null;
  const sumNV = ruleCReady ? input.N! + input.V! : null;
  const ruleC = check(ruleCReady ? sumNV === input.B : null, sumNV, input.B, ruleCReady ? sumNV! - input.B! : null, true);

  const listReady = input.listVotes.length > 0 && input.listVotes.every((value) => value !== null);
  const sumLists = listReady
    ? input.listVotes.filter((value): value is number => value !== null).reduce((sum, value) => sum + value, 0)
    : null;
  const ruleDReady = sumLists !== null && input.V !== null;
  const ruleD = check(ruleDReady ? sumLists === input.V : null, sumLists, input.V, ruleDReady ? sumLists! - input.V! : null, true);

  const isAnnulmentFail = ruleA.ok === false || ruleB.ok === false;
  const isCalculationFail = ruleBExact === false || ruleC.ok === false || ruleD.ok === false;
  const allEvaluated = ruleA.ok !== null && ruleBExact !== null && ruleC.ok !== null && ruleD.ok !== null;

  return {
    ruleA,
    ruleB,
    ruleC,
    ruleD,
    hasAnyInput,
    isAnnulmentFail,
    isCalculationFail,
    allEvaluated,
    isEverythingValid: allEvaluated && ruleA.ok === true && ruleBExact === true && ruleC.ok === true && ruleD.ok === true,
  };
}
