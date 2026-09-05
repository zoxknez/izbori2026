export interface SourceEntry {
  id: string;
  tier: 1 | 2 | 3;
  label: string;
  url: string;
  description?: string;
}

export const sources: SourceEntry[] = [
  {
    id: "rik-zakoni",
    tier: 1,
    label: "RIK: važeći izborni zakoni",
    url: "https://www.rik.parlament.gov.rs/",
    description:
      "Republička izborna komisija. Zakon o izboru narodnih poslanika, Zakon o lokalnim izborima, Zakon o Jedinstvenom biračkom spisku i njihove izmene.",
  },
  {
    id: "rik-podzakonska",
    tier: 1,
    label: "RIK: podzakonska akta i obrasci",
    url: "https://www.rik.parlament.gov.rs/",
    description: "Uputstva, odluke i obrasci koje RIK objavljuje za sprovođenje izbora, uključujući obrazac ZP-4.",
  },
  {
    id: "rik-registar-prigovora",
    tier: 1,
    label: "RIK: registar prigovora i rezultati",
    url: "https://www.rik.parlament.gov.rs/",
    description: "Zvanični rezultati, zapisnici sa biračkih mesta i registar podnetih prigovora.",
  },
  {
    id: "odihr-2023",
    tier: 2,
    label: "ODIHR/OSCE: izveštaj o parlamentarnim izborima 2023",
    url: "https://www.osce.org/odihr/elections/serbia",
    description:
      "Posmatračka misija OSCE/ODIHR beležila je proceduralne probleme uključujući grupno glasanje, fotografisanje listića i pokušaje uticaja na birače.",
  },
  {
    id: "odihr-2024",
    tier: 2,
    label: "ODIHR/OSCE: izveštaj o lokalnim izborima 2024",
    url: "https://www.osce.org/odihr/elections/serbia",
    description: "Nastavak praćenja proceduralnih problema na lokalnim izborima.",
  },
  {
    id: "krivicni-zakonik",
    tier: 1,
    label: "Krivični zakonik Republike Srbije",
    url: "https://www.pravno-informacioni-sistem.rs/",
    description: "Glava XV: Krivična dela protiv izbornih prava (čl. 154–161).",
  },
  {
    id: "crta",
    tier: 3,
    label: "CRTA: građanske posmatračke misije",
    url: "https://crta.rs/",
    description: "Akreditovana posmatračka organizacija koja prati i prijavljuje izborne nepravilnosti, uključujući slučajeve tipa „bugarski voz“.",
  },
];
