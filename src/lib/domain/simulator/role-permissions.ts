import type { SimulationRole } from "./types";
import type { WorldAction, WorldIncidentBinding } from "./live-types";

export type RolePermission =
  | "manipulate_materials"       // Rukovanje glasačkim listićima, kutijom, vrećom
  | "sign_protocol"              // Potpisivanje zapisnika o radu biračkog odbora
  | "submit_formal_objection"    // Podnošenje formalnog prigovora / primedbe
  | "record_evidence"            // Unošenje zabeleški u beležnicu dokaza
  | "inspect_voter_id"           // Provera ličnih isprava birača
  | "apply_spray_and_uv"         // Rukovanje UV lampom i nevidljivim sprejom
  | "vote_in_booth"              // Samostalno glasanje iza paravana
  | "relocate_booths"            // Premeštanje paravana radi zaštite tajnosti
  | "demand_procedural_pause";   // Zahtevanje kratke pauze za otklanjanje nepravilnosti

export interface RoleInfo {
  role: SimulationRole;
  label: string;
  shortLabel: string;
  badgeColor: string;
  summary: string;
  coreResponsibilities: string[];
  strictProhibitions: string[];
  permissions: RolePermission[];
}

export const ROLE_CONFIGS: Record<SimulationRole, RoleInfo> = {
  clan_odbora: {
    role: "clan_odbora",
    label: "Član biračkog odbora",
    shortLabel: "Član BO",
    badgeColor: "brand",
    summary:
      "Ovlašćeno službeno lice zaduženo za neposredno sprovođenje glasanja, obezbeđivanje zakonitosti, rukovanje materijalom i utvrđivanje rezultata.",
    coreResponsibilities: [
      "Priprema i provera biračkog mesta pre otvaranja (06:00-07:00)",
      "Provera prazne glasačke kutije i popunjavanje kontrolnog lista sa prvim biračem",
      "Kontrola ličnih isprava birača i identifikacija u biračkom spisku",
      "Pravilna primena UV lampe (pre) i spreja (posle glasanja)",
      "Uručenje glasačkih listića i obezbeđivanje potpune tajnosti iza paravana",
      "Održavanje reda u prostoriji i zabrana propagande u krugu od 50 metara",
      "Prebrojavanje glasova i potpisivanje Zapisnika o radu biračkog odbora",
    ],
    strictProhibitions: [
      "Zabranjeno glasanje bez važeće lične isprave (LK ili pasoš)",
      "Zabranjeno narušavanje tajnosti glasanja ili posmatranje birača iza paravana",
      "Zabranjeno izdavanje listića licu sa već prisutnim tragom spreja",
      "Zabranjeno zadržavanje nezapečaćene glasačke kutije tokom glasanja",
    ],
    permissions: [
      "manipulate_materials",
      "sign_protocol",
      "record_evidence",
      "inspect_voter_id",
      "apply_spray_and_uv",
      "relocate_booths",
      "demand_procedural_pause",
    ],
  },
  posmatrac: {
    role: "posmatrac",
    label: "Ovlašćeni posmatrač",
    shortLabel: "Posmatrač",
    badgeColor: "sky",
    summary:
      "Nezavisni akreditovani posmatrač izborne misije. Prati zakonitost rada biračkog odbora, evidentira činjenice u beležnicu i zahteva unošenje primedbi u zapisnik.",
    coreResponsibilities: [
      "Prati pripremu prostorije, proveru kutije i kontrolnog lista",
      "Beleži tok glasanja sa tačnim vremenom, akterima i lokacijom",
      "Razdvaja neposredno uočene činjenice od pretpostavki ili glasina",
      "Skreće pažnju predsedniku biračkog odbora na uočene nepravilnosti",
      "Zahteva unošenje primedbi u Zapisnik o radu biračkog odbora",
      "Obaveštava koordinacioni centar posmatračke misije",
    ],
    strictProhibitions: [
      "STROGO ZABRANJENO fizičko rukovanje izbornim materijalom (listići, kutija, spisak)",
      "Zabranjeno ometanje rada biračkog odbora ili samostalno premeštanje inventara",
      "Zabranjeno sugerisanje biračima kako da glasaju",
      "Zabranjeno narušavanje neutralnosti posmatračke uloge",
    ],
    permissions: [
      "submit_formal_objection",
      "record_evidence",
    ],
  },
  birac: {
    role: "birac",
    label: "Građanin birač",
    shortLabel: "Birač",
    badgeColor: "emerald",
    summary:
      "Građanin koji ostvaruje Ustavom zajemčeno biračko pravo. Prolazi zakonsku proceduru glasanja, čuva tajnost svog glasa i zahteva zaštitu svojih prava ako su ugrožena.",
    coreResponsibilities: [
      "Pristupa biračkom mestu i čeka red na ulazu",
      "Pruža ruku na proveru UV lampom pre preuzimanja materijala",
      "Prilaže važeći lični dokument (LK ili pasoš) radi identifikacije",
      "Potpisuje se u izvod iz biračkog spiska pored svog imena",
      "Omogućava nanošenje spreja na kažiprst desne ruke",
      "Preuzima overeni glasački listić i glasa u tajnosti iza paravana",
      "Presavija listić i ubacuje ga u zapečaćenu glasačku kutiju",
      "Kao prvi birač: pregleda praznu kutiju i potpisuje kontrolni list",
    ],
    strictProhibitions: [
      "Zabranjeno glasanje bez lične isprave ili pod tuđim imenom",
      "Zabranjeno fotografisanje popunjenog glasačkog listića iza paravana",
      "Zabranjeno iznošenje glasačkog listića van biračkog mesta",
      "Zabranjeno narušavanje reda na biračkom mestu",
    ],
    permissions: [
      "submit_formal_objection",
      "record_evidence",
      "vote_in_booth",
    ],
  },
};

/** Proverava da li data uloga ima specifičnu dozvolu. */
export function hasRolePermission(role: SimulationRole, permission: RolePermission): boolean {
  const config = ROLE_CONFIGS[role];
  return config ? config.permissions.includes(permission) : false;
}

/**
 * Filtrira akcije dostupne u svetu za datu ulogu:
 * 1. Ako akcija ima `requiredRole`, prikazuje se samo toj ulozi.
 * 2. Ako akcija nema `requiredRole`, prikazuje se ako nema konfliktnih uloga.
 */
export function filterActionsForRole(actions: WorldAction[], role: SimulationRole): WorldAction[] {
  // Prvo gledamo da li postoje akcije eksplicitno namenjene ovoj ulozi
  const roleSpecific = actions.filter((act) => act.requiredRole === role);
  if (roleSpecific.length > 0) {
    return roleSpecific;
  }
  // Ako nema uže-specifičnih, vraćamo akcije koje nemaju definisan requiredRole
  return actions.filter((act) => !act.requiredRole);
}

/**
 * Validira da li je akcija dozvoljena za datu ulogu.
 */
export function validateRoleAction(
  role: SimulationRole,
  action: WorldAction,
): { allowed: boolean; reason?: string } {
  if (action.requiredRole && action.requiredRole !== role) {
    const targetRole = action.requiredRole as SimulationRole;
    const targetLabel = ROLE_CONFIGS[targetRole]?.label ?? targetRole;
    return {
      allowed: false,
      reason: `Akcija "${action.label}" zahteva ulogu: ${targetLabel}. Trenutna uloga je: ${ROLE_CONFIGS[role].label}.`,
    };
  }
  return { allowed: true };
}

/** Vraća konfiguraciju i vodič za zadatu ulogu. */
export function getRoleGuidance(role: SimulationRole): RoleInfo {
  return ROLE_CONFIGS[role] ?? ROLE_CONFIGS.clan_odbora;
}
