import type { DecisionTree } from "@/lib/domain/decision-trees/types";

export const decisionTrees: DecisionTree[] = [
  {
    id: "DT01",
    slug: "kontrolni-list-i-kutija",
    title: "Kontrolni list i glasačka kutija",
    description: "Brza provera problema sa kutijom, kontrolnim listom i pečaćenjem pre glasanja.",
    startNodeId: "DT01-N1",
    publicationStatus: "published",
    reviewStatus: "legal_review",
    order: 1,
    nodes: [
      { id: "DT01-N1", type: "question", prompt: "Da li je kontrolni list pravilno popunjen i potpisan?", options: [{ id: "yes", label: "Da", nextNodeId: "DT01-N2", ruleIds: [] }, { id: "no", label: "Ne", nextNodeId: "DT01-R1", ruleIds: ["P06", "P07", "P08"] }], ruleIds: [], order: 1 },
      { id: "DT01-N2", type: "question", prompt: "Da li je glasačka kutija pokazana prazna pre prvog glasa?", options: [{ id: "yes", label: "Da", nextNodeId: "DT01-R2", ruleIds: [] }, { id: "no", label: "Ne", nextNodeId: "DT01-R3", ruleIds: ["P05"] }], ruleIds: [], order: 2 },
      { id: "DT01-R1", type: "result", prompt: "Mogući zakonski osnov za poništavanje - otvorite relevantno pravilo.", options: [], ruleIds: ["P06", "P07", "P08"], order: 3 },
      { id: "DT01-R2", type: "result", prompt: "Osnovna procedura je ispunjena.", options: [], ruleIds: ["P06", "P07", "P08"], order: 4 },
      { id: "DT01-R3", type: "result", prompt: "Zabeležite proceduralnu nepravilnost i zahtevajte ponavljanje kontrole.", options: [], ruleIds: ["P05"], order: 5 },
    ],
  },
  {
    id: "DT02",
    slug: "tajnost-glasanja",
    title: "Tajnost i sloboda glasanja",
    description: "Razlikujte pomoć biraču, pritisak i fotografisanje glasačkog listića.",
    startNodeId: "DT02-N1",
    publicationStatus: "published",
    reviewStatus: "legal_review",
    order: 2,
    nodes: [
      { id: "DT02-N1", type: "question", prompt: "Da li je birač fotografisao svoj listić ili pokazao kako je glasao?", options: [{ id: "yes", label: "Da", nextNodeId: "DT02-R1", ruleIds: ["T09"] }, { id: "no", label: "Ne", nextNodeId: "DT02-N2", ruleIds: [] }], ruleIds: [], order: 1 },
      { id: "DT02-N2", type: "question", prompt: "Da li je drugo lice usmeravalo birača ili glasalo umesto njega?", options: [{ id: "yes", label: "Da", nextNodeId: "DT02-R2", ruleIds: ["T02", "T03"] }, { id: "no", label: "Ne", nextNodeId: "DT02-R3", ruleIds: [] }], ruleIds: [], order: 2 },
      { id: "DT02-R1", type: "result", prompt: "Zaštitite tajnost i unesite događaj u zapisnik.", options: [], ruleIds: ["T09"], order: 3 },
      { id: "DT02-R2", type: "result", prompt: "Zaustavite radnju, proverite identitet pomagača i zabeležite činjenice.", options: [], ruleIds: ["T02", "T03"], order: 4 },
      { id: "DT02-R3", type: "result", prompt: "Nije identifikovan ovaj tip problema.", options: [], ruleIds: [], order: 5 },
    ],
  },
  {
    id: "DT03",
    slug: "neslaganje-u-zapisniku",
    title: "Neslaganje brojeva u zapisniku",
    description: "Odredite da li neslaganje zahteva ponovno brojanje ili predstavlja zakonski osnov za poništavanje po službenoj dužnosti.",
    startNodeId: "DT03-N1",
    publicationStatus: "published",
    reviewStatus: "legal_review",
    order: 3,
    nodes: [
      { id: "DT03-N1", type: "question", prompt: "Da li je broj listića u kutiji veći od broja birača koji su glasali?", options: [{ id: "yes", label: "Da", nextNodeId: "DT03-R1", ruleIds: ["Z01"] }, { id: "no", label: "Ne", nextNodeId: "DT03-N2", ruleIds: [] }], ruleIds: [], order: 1 },
      { id: "DT03-N2", type: "question", prompt: "Da li zbir neupotrebljenih listića i listića u kutiji premašuje primljene listiće?", options: [{ id: "yes", label: "Da", nextNodeId: "DT03-R1", ruleIds: ["Z01"] }, { id: "no", label: "Ne", nextNodeId: "DT03-R2", ruleIds: [] }], ruleIds: [], order: 2 },
      { id: "DT03-R1", type: "result", prompt: "Mogući osnov za poništavanje po članu 116 - odmah zabeležite tačne brojeve.", options: [], ruleIds: ["Z01"], order: 3 },
      { id: "DT03-R2", type: "result", prompt: "Ponovo prebrojte i razjasnite računsku razliku pre potpisivanja.", options: [], ruleIds: ["Z01"], order: 4 },
    ],
  },
];
