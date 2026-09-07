import type { LawReference } from "@/lib/types";

/**
 * Single source of truth for the public legal citations used by educational
 * content. The link leads to the current law index maintained by RIK; every
 * article number remains visible in the UI and in the offline dataset.
 */
export const ZINP_LAW = "Zakon o izboru narodnih poslanika";
export const ZINP_URL = "https://www.rik.parlament.gov.rs/tekst/sr/61/zakoni.php";

function zinp(article: string): LawReference {
  return { law: ZINP_LAW, article, url: ZINP_URL };
}

export const LEGAL_REFS = {
  voting: zinp("čl. 87–99 · tok glasanja"),
  attendance: zinp("čl. 87 i 91 · prisustvo odbora i trajanje glasanja"),
  identity: zinp("čl. 93 · utvrđivanje identiteta birača"),
  homeVoting: zinp("čl. 96 · glasanje van biračkog mesta"),
  oppositionBoard: zinp("čl. 107 · jemstva za predstavnike opozicione liste"),
  lightErrors: zinp("čl. 109 · lake greške u zapisniku"),
  heavyErrors: zinp("čl. 110 · teške greške i uvid u materijal"),
  sampleCheck: zinp("čl. 111–114 · kontrola zapisnika i uzorak"),
  resultUndetermined: zinp("čl. 115 · rezultat se ne može utvrditi"),
  annulment: zinp("čl. 116 · poništavanje po službenoj dužnosti"),
  voterRecord: zinp("čl. 55 · informacija da li je birač evidentiran da je glasao"),
  requestContents: zinp("čl. 148–149 · zahtev za poništavanje glasanja"),
  courtAppeal: zinp("čl. 156 · žalba Upravnom sudu"),
  observer: zinp("čl. 166 i 168 · položaj i praćenje rada biračkog odbora"),
} as const;
