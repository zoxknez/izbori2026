import type { SimulationRole } from "./types";
import type { WorldAction, WorldIncidentBinding } from "./live-types";

export type RolePermission =
  // Birački odbor (Čl. 98 i 105 ZINP)
  | "interrupt_voting_for_order"       // Čl. 98: Prekid glasanja radi uspostavljanja reda
  | "add_board_member_remark"         // Čl. 105: Unos primedbe člana BO u Zapisnik BO
  | "sign_protocol"                   // Potpisivanje Zapisnika BO
  | "inspect_voter_id"                // Čl. 93: Provera lične isprave birača
  | "apply_spray_and_uv"              // Rukovanje UV lampom i sprejom
  | "manipulate_materials"            // Rukovanje listićima i kutijom
  | "relocate_booths"                 // Zaštita tajnosti glasanja
  
  // Posmatrač (Čl. 168 ZINP)
  | "request_board_attention"         // Skretanje pažnje predsedniku BO na nepravilnost
  | "add_observer_record_remark"      // Čl. 168: Unos primedbe u poseban zapisnik posmatrača
  | "contact_observer_mission"        // Izveštavanje posmatračke misije
  
  // Birač (Čl. 148-149 ZINP)
  | "prepare_voter_legal_remedy"      // Zahtev za poništavanje glasanja (rok 72h, čl. 148-149)
  | "cast_ballot"                     // Lično glasanje
  | "protect_ballot_secrecy"          // Odbijanje glasanja ako je paravan izložen
  
  // Zajedničko
  | "record_evidence";                // Unos zapažanja u internu beležnicu dokaza

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
      "Kontrola ličnih isprava birača i identifikacija u biračkom spisku (član 93 ZINP)",
      "Pravilna primena UV lampe (pre) i spreja (posle glasanja)",
      "Uručenje glasačkih listića i obezbeđivanje potpune tajnosti iza paravana",
      "Održavanje reda u prostoriji i zabrana propagande u krugu od 50 metara",
      "Prebrojavanje glasova i potpisivanje Zapisnika o radu biračkog odbora",
    ],
    strictProhibitions: [
      "Zabranjeno omogućavanje glasanja bez lične karte ili druge odgovarajuće javne isprave sa fotografijom i JMBG (član 93 ZINP)",
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
      "interrupt_voting_for_order",
      "add_board_member_remark",
    ],
  },
  posmatrac: {
    role: "posmatrac",
    label: "Ovlašćeni posmatrač",
    shortLabel: "Posmatrač",
    badgeColor: "sky",
    summary:
      "Nezavisni akreditovani posmatrač izborne misije. Prati zakonitost rada biračkog odbora, evidentira činjenice u beležnicu i unosi primedbe u poseban zapisnik o posmatračima (član 168 ZINP).",
    coreResponsibilities: [
      "Prati pripremu prostorije, proveru kutije i kontrolnog lista",
      "Beleži tok glasanja sa tačnim vremenom, akterima i lokacijom",
      "Razdvaja neposredno uočene činjenice od pretpostavki ili glasina",
      "Skreće pažnju predsedniku biračkog odbora na uočene nepravilnosti",
      "Zahteva unošenje primedbi u poseban zapisnik o prisustvu posmatrača (član 168 ZINP)",
      "Obaveštava koordinacioni centar posmatračke misije",
    ],
    strictProhibitions: [
      "STROGO ZABRANJENO fizičko rukovanje izbornim materijalom (listići, kutija, spisak)",
      "Zabranjeno ometanje rada biračkog odbora ili samostalno premeštanje inventara",
      "Zabranjeno sugerisanje biračima kako da glasaju",
      "Zabranjeno narušavanje neutralnosti posmatračke uloge",
    ],
    permissions: [
      "request_board_attention",
      "add_observer_record_remark",
      "contact_observer_mission",
      "record_evidence",
    ],
  },
  birac: {
    role: "birac",
    label: "Građanin birač",
    shortLabel: "Birač",
    badgeColor: "emerald",
    summary:
      "Građanin koji ostvaruje Ustavom zajemčeno biračko pravo. Prolazi zakonsku proceduru glasanja, čuva tajnost svog glasa i zahteva pravnu zaštitu ako su mu prava povređena (članovi 148 i 149 ZINP).",
    coreResponsibilities: [
      "Pristupa biračkom mestu i čeka red na ulazu",
      "Pruža ruku na proveru UV lampom pre preuzimanja materijala",
      "Prilaže ličnu kartu ili drugu odgovarajuću javnu ispravu sa fotografijom i JMBG (član 93 ZINP) radi identifikacije",
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
      "prepare_voter_legal_remedy",
      "record_evidence",
      "cast_ballot",
      "protect_ballot_secrecy",
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
