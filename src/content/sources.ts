export interface SourceEntry {
  id: string;
  tier: 1 | 2 | 3;
  label: string;
  url: string;
  description?: string;
  publisher?: string;
  version?: string;
  validFromDate?: string;
  validUntilDate?: string;
  status?: "active" | "superseded" | "archived";
  supersedesId?: string;
}

export const sources: SourceEntry[] = [
  {
    id: "rik-zakoni",
    tier: 1,
    label: "RIK: važeći izborni zakoni",
    url: "https://www.rik.parlament.gov.rs/tekst/sr/61/zakoni.php",
    description:
      "Republička izborna komisija. Zakon o izboru narodnih poslanika, Zakon o lokalnim izborima, Zakon o Jedinstvenom biračkom spisku i njihove izmene.",
  },
  {
    id: "rik-podzakonska",
    tier: 1,
    label: "RIK: podzakonska akta i obrasci",
    url: "https://www.rik.parlament.gov.rs/tekst/70/podzakonska-akta.php",
    description: "Uputstva, odluke i obrasci koje RIK objavljuje za sprovođenje izbora, uključujući obrazac ZP-4.",
  },
  {
    id: "rik-zp4",
    tier: 1,
    label: "RIK: obrazac ZP-4 i uputstvo za pravna sredstva",
    url: "https://www.rik.parlament.gov.rs/extfile/sr/files/additionalDocuments/996/48/Uputstvo%20-%20prigovori.pdf",
    description: "Zvanično uputstvo i obrasci za podnošenje zahteva birača za poništavanje glasanja.",
  },
  {
    id: "rik-registar-prigovora",
    tier: 1,
    label: "RIK: registar prigovora i rezultati",
    url: "https://www.rik.parlament.gov.rs/tekst/1553/izborna-dokumenta.php",
    description: "Zvanični rezultati, zapisnici sa biračkih mesta i registar podnetih prigovora.",
  },
  {
    id: "odihr-2023",
    tier: 2,
    label: "ODIHR/OSCE: izveštaj o parlamentarnim izborima 2023",
    url: "https://odihr.osce.org/odihr/elections/serbia/563502",
    description:
      "Posmatračka misija OSCE/ODIHR beležila je proceduralne probleme uključujući grupno glasanje, fotografisanje listića i pokušaje uticaja na birače.",
  },
  {
    id: "odihr-2024",
    tier: 2,
    label: "ODIHR/OSCE: izveštaj o lokalnim izborima 2024",
    url: "https://odihr.osce.org/odihr/elections/serbia/575488",
    description: "Nastavak praćenja proceduralnih problema na lokalnim izborima.",
  },
  {
    id: "krivicni-zakonik",
    tier: 1,
    label: "Krivični zakonik Republike Srbije",
    url: "https://reg.pravno-informacioni-sistem.rs/api/viewdoc?doctype=reg&regactid=437844&uuid=f9f75050-d16f-484a-acad-4be0f1a5bcf5",
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
