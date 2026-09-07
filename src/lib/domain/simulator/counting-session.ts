import type { SimulationState, SimulationRole } from "./types";
import {
  validateCounting,
  validateRecordForensics,
  type CountingInput,
  type CountingResult,
  type RecordForensicsInput,
  type RecordForensicsResult,
} from "@/lib/domain/results-validator";

export interface ProtocolObjection {
  id: string;
  role: SimulationRole;
  authorLabel: string;
  text: string;
  timestamp: string;
}

export interface CountingSession {
  // Primljeni listići (R)
  receivedBallots: number;
  // Neupotrebljeni listići (U)
  unusedBallots: number | null;
  // Broj birača koji su glasali prema spisku (G)
  votersTurnout: number | null;
  // Listići nađeni u kutiji (B)
  ballotsInBox: number | null;
  // Važeći listići (V)
  validBallots: number | null;
  // Nevažeći listići (N)
  invalidBallots: number | null;
  // Glasovi po izbornim listama
  listVotes: Array<number | null>;

  // Forenzičke provere za Zapisnik
  controlListPresent: boolean | null;
  controlListCompleted: boolean | null;
  controlListSignedByFirstVoter: boolean | null;
  controlListSignedByBoardMember: boolean | null;
  recordPresent: boolean | null;
  signedByAtLeastThree: boolean | null;
  interruptedAndNotResumed: boolean | null;

  // Status overe i primedbe
  isProtocolSigned: boolean;
  signedByMembers: string[];
  objections: ProtocolObjection[];
}

/**
 * Inicijalizuje podatke za prebrojavanje na osnovu istorije i zastavica izbornog dana.
 * Sve prethodne odluke (npr. nepravilnost sa kontrolnim listom E04/E05)
 * direktno se prelivaju u stanje kutije i kontrolnog lista bez sintetičkih pravila.
 */
export function initializeCountingSession(
  domainState: SimulationState,
  baseBallots = 500,
): CountingSession {
  const flags = domainState.flags;

  // Da li je kontrolni list uredno potpisan od strane prvog birača?
  // Zastavice iz E04 i E05 (npr. kutija zatvorena bez birača ili list bez potpisa)
  const hasFirstVoterSignError =
    flags.includes("kontrolni-bez-potpisa") ||
    flags.includes("kutija-bez-biraca") ||
    flags.includes("kutija-neuredna");

  // Da li je bilo glasanja mimo biračkog spiska? (E10-b)
  const hasIllegalVoter = flags.includes("birac-van-spiska-gladao");

  const turnout = 320;
  const unused = baseBallots - turnout; // 180
  // Ako je neko glasao van spiska a listić ubačen u kutiju, u kutiji ima više listića nego potpisanih birača!
  const inBox = hasIllegalVoter ? turnout + 2 : turnout;

  const invalid = 8;
  const valid = inBox - invalid; // 312 ili 314

  return {
    receivedBallots: baseBallots,
    unusedBallots: unused,
    votersTurnout: turnout,
    ballotsInBox: inBox,
    validBallots: valid,
    invalidBallots: invalid,
    listVotes: [Math.floor(valid * 0.48), Math.floor(valid * 0.35), valid - Math.floor(valid * 0.48) - Math.floor(valid * 0.35)],

    controlListPresent: true,
    controlListCompleted: true,
    controlListSignedByFirstVoter: !hasFirstVoterSignError,
    controlListSignedByBoardMember: true,
    recordPresent: true,
    signedByAtLeastThree: null, // Čeka overu na kraju (null = neprovereno/čeka se potpis)
    interruptedAndNotResumed: false,

    isProtocolSigned: false,
    signedByMembers: [],
    objections: [],
  };
}

/**
 * Poziva isključivo domenske validatore za utvrđivanje rezultata:
 * `validateCounting()` i `validateRecordForensics()`.
 */
export function evaluateCountingSession(session: CountingSession): {
  countingInput: CountingInput;
  countingResult: CountingResult;
  forensicsInput: RecordForensicsInput;
  forensicsResult: RecordForensicsResult;
} {
  const countingInput: CountingInput = {
    R: session.receivedBallots,
    U: session.unusedBallots,
    G: session.votersTurnout,
    B: session.ballotsInBox,
    V: session.validBallots,
    N: session.invalidBallots,
    listVotes: session.listVotes,
  };

  const countingResult = validateCounting(countingInput);

  const forensicsInput: RecordForensicsInput = {
    recordPresent: session.recordPresent,
    signedByAtLeastThree: session.signedByAtLeastThree,
    controlListPresent: session.controlListPresent,
    controlListCompleted: session.controlListCompleted,
    controlListSignedByFirstVoter: session.controlListSignedByFirstVoter,
    controlListSignedByBoardMember: session.controlListSignedByBoardMember,
    interruptedAndNotResumed: session.interruptedAndNotResumed,
  };

  const forensicsResult = validateRecordForensics(forensicsInput, countingResult);

  return {
    countingInput,
    countingResult,
    forensicsInput,
    forensicsResult,
  };
}
