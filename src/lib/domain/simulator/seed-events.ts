import type { SimulationChoice, SimulationEvent, SimulationRiskBand } from "./types";

const phases = ["pre_otvaranja", "identifikacija", "glasanje", "van_birackog_mesta", "zatvaranje", "brojanje", "zapisnik", "svaka"] as const;
const titles = [
  "Materijal pre otvaranja", "Kontrolni list", "Prazna kutija", "Prvi birač", "Identitet birača", "UV lampa", "Birački spisak", "Pomoć iza paravana", "Slikanje listića", "Pritisak na birača", "Neovlašćeno lice", "Red u 20 časova", "Glasanje van biračkog mesta", "Evidencija van BM", "Paralelni spisak", "Kupovina glasova", "Bugarski voz", "Zatvaranje vrata", "Pečaćenje materijala", "Prebrojavanje", "Listići u kutiji", "Nevažeći listići", "Glasovi lista", "Višak listića", "Kontrolni list pri otvaranju", "Popunjavanje zapisnika", "Primedba člana", "Potpisi odbora", "Predaja materijala", "Objava zapisnika",
] as const;

const severities = ["proveri", "info", "teska_nepravilnost", "nepravilnost", "proveri", "teska_nepravilnost", "nepravilnost", "teska_nepravilnost", "nepravilnost", "krivicno_delo", "teska_nepravilnost", "info", "nepravilnost", "proveri", "krivicno_delo", "krivicno_delo", "krivicno_delo", "info", "teska_nepravilnost", "proveri", "ponistavanje", "proveri", "proveri", "ponistavanje", "ponistavanje", "nepravilnost", "proveri", "teska_nepravilnost", "teska_nepravilnost", "info"] as const;

const outcomes = ["routine", "routine", "prevented", "routine", "prevented", "serious", "prevented", "serious", "prevented", "criminal", "serious", "routine", "prevented", "serious", "criminal", "criminal", "criminal", "routine", "serious", "prevented", "annulment", "serious", "prevented", "annulment", "annulment", "prevented", "serious", "serious", "serious", "routine"] as const;
const riskBands: SimulationRiskBand[] = [
  ...Array<SimulationRiskBand>(15).fill("routine"),
  ...Array<SimulationRiskBand>(8).fill("irregularity"),
  ...Array<SimulationRiskBand>(4).fill("serious"),
  ...Array<SimulationRiskBand>(2).fill("criminal"),
  "annulment",
];
const eventRuleIds = ["P01", "P03", "P02", "P05", "I03", "I01", "I05", "T01", "T09", "T10", "N01", "Z01", "V01", "V04", "E02", "KG01", "BV01", "Z02", "Z03", "AN01", "AN01", "ZP01", "ZP02", "AN02", "P06", "ZP01", "ZP02", "ZP03", "ZP04", "FR01"] as const;

export const simulationEvents: SimulationEvent[] = titles.map((title, index) => {
  const id = `E${String(index + 1).padStart(2, "0")}`;
  const nextEventId = index < titles.length - 1 ? `E${String(index + 2).padStart(2, "0")}` : undefined;
  const phase = phases[index % phases.length];
  const ruleIds = [eventRuleIds[index]];
  const correct: SimulationChoice = { id: `${id}-C`, label: "Zaustavi radnju, proveri činjenice i zahtevaj unos u zapisnik", outcome: index % 5 === 0 ? "prevented" : "routine", ruleIds, effects: { scoreDelta: 3, evidenceDelta: 1, addFlags: [`checked-${index}`], phase }, nextEventId };
  const report = { id: `${id}-R`, label: "Obezbedi svedoke i odmah sačuvaj preciznu primedbu", outcome: "prevented" as const, ruleIds, effects: { scoreDelta: 2, evidenceDelta: 2, addFlags: [`reported-${index}`], phase }, nextEventId };
  const ignore = { id: `${id}-I`, label: "Ignoriši događaj i nastavi bez beleženja", outcome: outcomes[index], ruleIds, effects: { scoreDelta: -3, evidenceDelta: -1, addFlags: [`ignored-${index}`], phase }, nextEventId };
  const choices = index < 20 ? [correct, report, ignore] : [correct, ignore];
  return { id, phase, title, description: `Događaj ${index + 1}: ${title}. Proceni situaciju i izaberi sledeću radnju kao kontrolor.`, severity: severities[index], riskBand: riskBands[index], choices };
});

export const SIMULATOR_EVENT_COUNT = simulationEvents.length;
export const SIMULATOR_CHOICE_COUNT = simulationEvents.reduce((sum, event) => sum + event.choices.length, 0);
export const SIMULATOR_RISK_DISTRIBUTION = { routine: 15, irregularity: 8, serious: 4, criminal: 2, annulment: 1 } as const;
