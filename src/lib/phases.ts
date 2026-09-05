export const PHASE_META: Record<string, { label: string; hint: string; icon: string }> = {
  pre_otvaranja: {
    label: "Pre otvaranja biračkog mesta",
    hint: "Materijal, kutija, kontrolni list, paravani",
    icon: "door-open",
  },
  identifikacija: {
    label: "Prilikom identifikacije birača",
    hint: "UV lampa, lična karta, birački spisak, potpis",
    icon: "id-card",
  },
  glasanje: {
    label: "Iza paravana / tokom glasanja",
    hint: "Tajnost, pomoć biraču, pritisak, fotografisanje",
    icon: "eye-off",
  },
  van_birackog_mesta: {
    label: "Glasanje van biračkog mesta",
    hint: "Glasanje kod kuće zbog bolesti, starosti ili invaliditeta",
    icon: "home",
  },
  zatvaranje: {
    label: "Prilikom zatvaranja biračkog mesta",
    hint: "Red u 20:00, kašnjenje, rano zatvaranje",
    icon: "door-closed",
  },
  brojanje: {
    label: "Tokom brojanja glasova",
    hint: "Kutija, listići, računica, poništavanje",
    icon: "calculator",
  },
  zapisnik: {
    label: "Popunjavanje i isticanje zapisnika",
    hint: "Potpisi, primedbe, javni uvid, neslaganje brojeva",
    icon: "file-text",
  },
  svaka: {
    label: "Van biračkog mesta / bilo kada tog dana",
    hint: "Kupovina glasova, pretnje, organizovana manipulacija",
    icon: "triangle-alert",
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
