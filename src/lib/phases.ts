export const PHASE_META: Record<string, { label: string; hint: string }> = {
  pre_otvaranja: {
    label: "Pre otvaranja biračkog mesta",
    hint: "Materijal, kutija, kontrolni list, paravani",
  },
  identifikacija: {
    label: "Prilikom identifikacije birača",
    hint: "UV lampa, lična karta, birački spisak, potpis",
  },
  glasanje: {
    label: "Iza paravana / tokom glasanja",
    hint: "Tajnost, pomoć biraču, pritisak, fotografisanje",
  },
  van_birackog_mesta: {
    label: "Glasanje van biračkog mesta",
    hint: "Glasanje kod kuće zbog bolesti, starosti ili invaliditeta",
  },
  zatvaranje: {
    label: "Prilikom zatvaranja biračkog mesta",
    hint: "Red u 20:00, kašnjenje, rano zatvaranje",
  },
  brojanje: {
    label: "Tokom brojanja glasova",
    hint: "Kutija, listići, računica, poništavanje",
  },
  zapisnik: {
    label: "Popunjavanje i isticanje zapisnika",
    hint: "Potpisi, primedbe, javni uvid, neslaganje brojeva",
  },
  svaka: {
    label: "Van biračkog mesta / bilo kada tog dana",
    hint: "Kupovina glasova, pretnje, organizovana manipulacija",
  },
};

export const PHASE_ORDER = [
  "pre_otvaranja",
  "identifikacija",
  "glasanje",
  "van_birackog_mesta",
  "zatvaranje",
  "brojanje",
  "zapisnik",
  "svaka",
];
