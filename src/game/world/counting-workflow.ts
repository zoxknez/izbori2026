export const COUNTING_WORKFLOW_STEPS = [
  { hotspotId: "counting-unused", label: "Neupotrebljeni listići" },
  { hotspotId: "counting-voter-roll", label: "Birački spisak" },
  { hotspotId: "counting-control-sheet", label: "Kontrolni list" },
  { hotspotId: "counting-box-ballots", label: "Listići iz kutije" },
  { hotspotId: "counting-sorting", label: "Razvrstavanje" },
  { hotspotId: "counting-protocol", label: "Zapisnik" },
] as const;

/** Presentation-only workflow helper; the domain validator remains authoritative. */
export function nextCountingWorkflowStep(currentStep: number, hotspotId: string): number {
  const expected = COUNTING_WORKFLOW_STEPS[currentStep]?.hotspotId;
  return expected === hotspotId ? currentStep + 1 : currentStep;
}
