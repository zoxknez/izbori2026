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

export type RecordForensicsStatus = "unchecked" | "correct" | "light_error" | "heavy_error" | "result_undetermined" | "annulment";

export interface RecordForensicsInput {
  recordPresent: boolean | null;
  signedByAtLeastThree: boolean | null;
  controlListPresent: boolean | null;
  controlListCompleted: boolean | null;
  controlListSignedByFirstVoter: boolean | null;
  controlListSignedByBoardMember: boolean | null;
  interruptedAndNotResumed: boolean | null;
}

export interface RecordForensicsResult {
  status: RecordForensicsStatus;
  title: string;
  article: string;
  findings: string[];
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

/** Classifies only facts the form can establish; it never replaces a commission's decision. */
export function validateRecordForensics(input: RecordForensicsInput, counting: CountingResult): RecordForensicsResult {
  const noData = Object.values(input).every((value) => value === null) && !counting.hasAnyInput;
  if (noData) return { status: "unchecked", title: "Čeka se potpuna kontrola", article: "", findings: [] };

  const annulmentFindings = [
    input.controlListPresent === false ? "Kontrolni list nije pronađen u glasačkoj kutiji." : null,
    input.controlListCompleted === false ? "Kontrolni list nije popunjen." : null,
    input.controlListSignedByFirstVoter === false ? "Kontrolni list nije potpisao prvi birač." : null,
    input.controlListSignedByBoardMember === false ? "Kontrolni list nije potpisao najmanje jedan član biračkog odbora." : null,
    counting.isAnnulmentFail ? "Brojevi ukazuju na zakonski osnov iz člana 116." : null,
  ].filter((item): item is string => Boolean(item));
  if (annulmentFindings.length) return { status: "annulment", title: "Poništavanje po službenoj dužnosti", article: "Čl. 116. ZINP", findings: annulmentFindings };

  const indeterminateFindings = [
    input.recordPresent === false ? "Zapisnik o radu biračkog odbora nije dostavljen." : null,
    input.signedByAtLeastThree === false ? "Zapisnik nisu potpisala najmanje tri člana biračkog odbora." : null,
    input.interruptedAndNotResumed === true ? "Glasanje je prekinuto i nije nastavljeno." : null,
  ].filter((item): item is string => Boolean(item));
  if (indeterminateFindings.length) return { status: "result_undetermined", title: "Rezultat se ne može utvrditi", article: "Čl. 115. ZINP", findings: indeterminateFindings };

  if (counting.isCalculationFail) return { status: "heavy_error", title: "Teška greška — potreban je uvid u materijal", article: "Čl. 110. ZINP", findings: ["Postoji gruba logičko-računska greška koju treba proveriti uvidom u izborni materijal."] };

  return { status: "correct", title: "Nema utvrđene greške u unetim proverama", article: "Edukativna kontrola", findings: ["Za konačnu ocenu i dalje su potrebni stvarni zapisnik, materijal i nadležna komisija."] };
}
