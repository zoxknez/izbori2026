export interface IncidentData {
  vrstaIzbora: string;
  opstina: string;
  brojMesta: string;
  datum: string;
  vreme: string;
  uloga: string;
  faza: string;
  staSamVideo: string;
  spornaRadnja: string;
  koJeVideo: string;
  odborUpozoren: "da" | "ne" | "nije primenljivo";
  nepravilnostPrestala: "da" | "ne" | "nije primenljivo";
  primedbaTrazena: "da" | "ne" | "nije primenljivo";
  propis: string;
  napomena: string;
}

export const EMPTY_INCIDENT: IncidentData = {
  vrstaIzbora: "narodni_poslanici",
  opstina: "",
  brojMesta: "",
  datum: "",
  vreme: "",
  uloga: "birač",
  faza: "pre_otvaranja",
  staSamVideo: "",
  spornaRadnja: "",
  koJeVideo: "",
  odborUpozoren: "nije primenljivo",
  nepravilnostPrestala: "nije primenljivo",
  primedbaTrazena: "nije primenljivo",
  propis: "",
  napomena: "",
};

const VRSTA_LABEL: Record<string, string> = {
  narodni_poslanici: "izbore za narodne poslanike",
  predsednik: "izbore za predsednika Republike",
  lokalni: "lokalne izbore",
};

export function generateChronology(d: IncidentData): string {
  const lines: string[] = [];

  const datumVreme = [d.datum, d.vreme].filter(Boolean).join(" u ");
  const mesto = [d.brojMesta && `biračkom mestu br. ${d.brojMesta}`, d.opstina && `u ${d.opstina}`]
    .filter(Boolean)
    .join(" ");

  lines.push(
    `Dana ${datumVreme || "[datum/vreme nije uneto]"}, na ${mesto || "[biračko mesto nije uneto]"}, ` +
      `povodom ${VRSTA_LABEL[d.vrstaIzbora] ?? "izbora"}, u svojstvu: ${d.uloga}.`
  );

  if (d.staSamVideo) lines.push(`Neposredno uočeno: ${d.staSamVideo}`);
  if (d.spornaRadnja) lines.push(`Sporna radnja: ${d.spornaRadnja}`);
  if (d.koJeVideo) lines.push(`Događaj je mogao videti/potvrditi: ${d.koJeVideo}`);

  lines.push(`Birački odbor je o događaju upozoren: ${d.odborUpozoren}.`);
  lines.push(`Nepravilnost je u međuvremenu prestala: ${d.nepravilnostPrestala}.`);
  lines.push(`Zahtevano je unošenje primedbe u zapisnik: ${d.primedbaTrazena}.`);

  if (d.propis) lines.push(`Relevantan propis: ${d.propis}.`);
  if (d.napomena) lines.push(`Dodatna napomena: ${d.napomena}`);

  return lines.join("\n\n");
}
