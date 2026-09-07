import type { WorldIncidentBinding } from "./live-types";
import { simulationEvents } from "./seed-events";

/**
 * Autorska mapiranja događaja iz baze pravila u tačke interakcije u 2D svetu.
 * Svaka uloga (Član BO, Posmatrač, Birač) dobija autentične radnje prilagođene
 * svom pravnom položaju, dok se svi ishodi mapiraju na postojeće autorske choiceId-jeve.
 * Svaki propušteni incident (timeout) NIKADA ne izmišlja sopstveni efekat,
 * već se mapira na postojeći autorski choiceId.
 */
export const WORLD_INCIDENT_BINDINGS: Record<string, WorldIncidentBinding> = {
  E01: {
    eventId: "E01",
    trigger: {
      type: "time",
      simulationTime: "06:15",
    },
    locationId: "entrance",
    hotspotTarget: "hallway-poster",
    actions: [
      // Član odbora: operativno uklanjanje materijala
      {
        worldActionId: "remove_poster_board",
        label: "Ukloni plakat pre otvaranja i zabeleži vreme u evidenciju",
        choiceId: "E01-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "photo_poster_board",
        label: "Fotografiši plakat u hodniku i prijavi ga posle otvaranja",
        choiceId: "E01-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "ignore_poster_board",
        label: "Ne reaguj, plakat je u hodniku a ne u samoj prostoriji",
        choiceId: "E01-c",
        requiredRole: "clan_odbora",
      },
      // Posmatrač: nadzor i skretanje pažnje predsedniku BO
      {
        worldActionId: "alert_board_poster_observer",
        label: "Skreni pažnju predsedniku BO da hitno ukloni plakat pre otvaranja",
        choiceId: "E01-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "log_poster_observer",
        label: "Zabeleži plakat u beležnicu dokaza sa fotografijom za misiju",
        choiceId: "E01-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "pass_poster_observer",
        label: "Ne preduzimaj radnju, sačekaj zvanično otvaranje biračkog mesta",
        choiceId: "E01-c",
        requiredRole: "posmatrac",
      },
      // Birač: zahtev za poštovanje pravila i slobodnog pristupa
      {
        worldActionId: "demand_poster_removal_voter",
        label: "Zahtevaj od odbora da ukloni propagandni plakat sa ulaza",
        choiceId: "E01-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "report_poster_voter",
        label: "Prijavi plakat prisutnim posmatračima na ulazu",
        choiceId: "E01-b",
        requiredRole: "birac",
      },
      {
        worldActionId: "ignore_poster_voter",
        label: "Prođi pored plakata bez obraćanja pažnje",
        choiceId: "E01-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 45,
      choiceId: "E01-c",
      label: "Vreme za reakciju je isteklo - plakat je ostao istaknut pred biračima.",
    },
  },

  E02: {
    eventId: "E02",
    trigger: {
      type: "time",
      simulationTime: "06:32",
    },
    locationId: "board-table",
    hotspotTarget: "material-ballot-stack",
    actions: [
      // Član odbora
      {
        worldActionId: "open_request_more_ballots",
        label: "Otvori biračko mesto na vreme i odmah traži dopunu listića",
        choiceId: "E02-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "halt_opening_wait_ballots",
        label: "Ne otvaraj biračko mesto dok ne stigne pun broj listića",
        choiceId: "E02-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "open_without_logging_difference",
        label: "Otvori mesto, ali nigde ne evidentiraj razliku u broju listića",
        choiceId: "E02-c",
        requiredRole: "clan_odbora",
      },
      // Posmatrač
      {
        worldActionId: "demand_ballot_count_record",
        label: "Zahtevaj da se tačan manjak listića odmah unese u zapisnik pre glasanja",
        choiceId: "E02-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "insist_on_halting_opening",
        label: "Zahtevaj obustavu otvaranja dok se manjak materijala ne reši",
        choiceId: "E02-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "silent_on_ballot_shortage",
        label: "Ne mešaj se u prebrojavanje materijala biračkog odbora",
        choiceId: "E02-c",
        requiredRole: "posmatrac",
      },
      // Birač
      {
        worldActionId: "wait_for_ballot_resolution",
        label: "Sačekaj strpljivo u redu dok odbor rešava evidenciju materijala",
        choiceId: "E02-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "protest_ballot_delay",
        label: "Negoduj zbog kašnjenja i zahtevaj otvaranje odmah",
        choiceId: "E02-b",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 45,
      choiceId: "E02-c",
      label: "Materijal nije proveren i razlika u broju listića ostala je neevidentirana.",
    },
  },

  E03: {
    eventId: "E03",
    trigger: {
      type: "time",
      simulationTime: "06:41",
    },
    locationId: "voting-booths",
    hotspotTarget: "booth-angle",
    actions: [
      // Član odbora
      {
        worldActionId: "relocate_booth_correctly",
        label: "Premesti paravan tako da niko ne može da vidi popunjavanje",
        choiceId: "E03-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "leave_booth_visible",
        label: "Ostavi kako jeste, birači mogu da se okrenu leđima",
        choiceId: "E03-b",
        requiredRole: "clan_odbora",
      },
      // Posmatrač
      {
        worldActionId: "demand_booth_turn",
        label: "Zahtevaj od predsednika BO da se paravan odmah okrene radi tajnosti",
        choiceId: "E03-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "ignore_booth_angle_observer",
        label: "Zabeleži nepravilan položaj paravana bez intervencije prema odboru",
        choiceId: "E03-b",
        requiredRole: "posmatrac",
      },
      // Birač
      {
        worldActionId: "demand_secrecy_protection",
        label: "Odbij glasanje iza otvorenog paravana dok se ne obezbedi tajnost",
        choiceId: "E03-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "vote_regardless_of_visibility",
        label: "Glasaj bez obzira što je paravan okrenut ka prozorima",
        choiceId: "E03-b",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 40,
      choiceId: "E03-b",
      label: "Paravan je ostao okrenut tako da je tajnost glasanja ugrožena.",
    },
  },

  E04: {
    eventId: "E04",
    trigger: {
      type: "time",
      simulationTime: "06:52",
    },
    locationId: "ballot-box-station",
    hotspotTarget: "empty-box",
    actions: [
      // Član odbora
      {
        worldActionId: "invite_first_voter_for_box",
        label: "Pozovi prvog birača da prisustvuje proveri prazne kutije",
        choiceId: "E04-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "seal_box_without_voter",
        label: "Odbor sam proveri kutiju i zatvori je pre nego što birač uđe",
        choiceId: "E04-b",
        requiredRole: "clan_odbora",
      },
      // Posmatrač
      {
        worldActionId: "insist_first_voter_present",
        label: "Upozori odbor da prvi birač mora prisustvovati proveri prazne kutije",
        choiceId: "E04-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "allow_box_check_without_voter",
        label: "Dozvoli odboru da pregleda i zatvori kutiju bez prisustva prvog birača",
        choiceId: "E04-b",
        requiredRole: "posmatrac",
      },
      // Birač
      {
        worldActionId: "participate_as_first_voter",
        label: "Kao prvi birač, pregledaj praznu kutiju zajedno sa članovima odbora",
        choiceId: "E04-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "decline_box_inspection",
        label: "Odbij da priđeš kutiji pre početka glasanja",
        choiceId: "E04-b",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E04-b",
      label: "Kutija je zatvorena bez prisustva prvog birača.",
    },
  },

  E05: {
    eventId: "E05",
    trigger: {
      type: "time",
      simulationTime: "06:58",
    },
    locationId: "ballot-box-station",
    hotspotTarget: "control-sheet",
    actions: [
      // Član odbora
      {
        worldActionId: "demand_signatures_on_control_sheet",
        label: "Insistiraj da kontrolni list potpišu prvi birač i član odbora",
        choiceId: "E05-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "allow_signing_later",
        label: "Pusti da se potpiše kasnije, bitno je otvoriti u 07:00",
        choiceId: "E05-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "request_two_minute_pause",
        label: "Zatraži pauzu od dva minuta i uredno završi proceduru",
        choiceId: "E05-c",
        requiredRole: "clan_odbora",
      },
      // Posmatrač
      {
        worldActionId: "verify_control_sheet_signatures",
        label: "Zahtevaj da prvi birač i član BO odmah potpišu kontrolni list",
        choiceId: "E05-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "overlook_missing_signature",
        label: "Prećuti nedostatak potpisa na kontrolnom listu",
        choiceId: "E05-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "suggest_short_delay_for_sheet",
        label: "Predloži kratko odlaganje od dva minuta da se list uredno popuni",
        choiceId: "E05-c",
        requiredRole: "posmatrac",
      },
      // Birač
      {
        worldActionId: "sign_control_sheet_properly",
        label: "Potpiši kontrolni list kao prvi birač tek nakon što ga član BO potpiše",
        choiceId: "E05-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "refuse_control_sheet_sign",
        label: "Odbij da potpišeš kontrolni list bez obrazloženja",
        choiceId: "E05-b",
        requiredRole: "birac",
      },
      {
        worldActionId: "wait_for_proper_control_sheet",
        label: "Sačekaj dva minuta dok odbor ne pripremi list uredno",
        choiceId: "E05-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E05-b",
      label: "Kontrolni list je ubačen u kutiju neuredan i bez svih potpisa.",
    },
  },

  E06: {
    eventId: "E06",
    trigger: {
      type: "time",
      simulationTime: "07:00",
    },
    locationId: "ballot-box-station",
    hotspotTarget: "box-seal",
    actions: [
      // Član odbora
      {
        worldActionId: "seal_box_and_log_opening",
        label: "Zapečati kutiju pred prvim biračem i evidentiraj vreme",
        choiceId: "E06-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "leave_box_unsealed_for_now",
        label: "Ostavi kutiju nezapečaćenu dok se ne smiri gužva",
        choiceId: "E06-b",
        requiredRole: "clan_odbora",
      },
      // Posmatrač
      {
        worldActionId: "verify_box_sealing_observer",
        label: "Zahtevaj da se kutija zapečati u prisustvu prvog birača pre glasanja",
        choiceId: "E06-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "allow_unsealed_box_observer",
        label: "Dozvoli otpočinjanje glasanja sa nezapečaćenom kutijom",
        choiceId: "E06-b",
        requiredRole: "posmatrac",
      },
      // Birač
      {
        worldActionId: "demand_sealed_box_voter",
        label: "Posmatraj pečaćenje kutije i potvrdi da je zatvorena pre glasanja",
        choiceId: "E06-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "ignore_unsealed_box_voter",
        label: "Ubacuj listić u nezapečaćenu kutiju bez prigovora",
        choiceId: "E06-b",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 30,
      choiceId: "E06-b",
      label: "Kutija je ostala nezapečaćena tokom glasanja.",
    },
  },

  E07: {
    eventId: "E07",
    trigger: {
      type: "time",
      simulationTime: "07:38",
    },
    locationId: "uv-station",
    hotspotTarget: "uv-lamp-check",
    actions: [
      // Član odbora
      {
        worldActionId: "remind_uv_sequence",
        label: "Podseti na propisani redosled: UV lampa pre izdavanja",
        choiceId: "E07-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "allow_single_uv_skip",
        label: "Pusti ovog birača, ali od sledećeg traži punu proceduru",
        choiceId: "E07-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "ignore_uv_skip",
        label: "Ne reaguj, kolega vodi svoj deo posla",
        choiceId: "E07-c",
        requiredRole: "clan_odbora",
      },
      // Posmatrač
      {
        worldActionId: "alert_uv_skip_observer",
        label: "Evidentiraj propust i usmeno upozori člana odbora na UV stanici",
        choiceId: "E07-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "log_uv_skip_for_report",
        label: "Zabeleži propust UV provere u beležnicu za statistiku misije",
        choiceId: "E07-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "ignore_uv_skip_observer",
        label: "Prećuti propuštanje birača bez UV provere",
        choiceId: "E07-c",
        requiredRole: "posmatrac",
      },
      // Birač
      {
        worldActionId: "demand_uv_check_voter",
        label: "Insistiraj da ti provere ruku UV lampom pre preuzimanja listića",
        choiceId: "E07-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "accept_uv_skip_voter",
        label: "Prihvati listić i reci da ćeš pružiti ruku sledeći put",
        choiceId: "E07-b",
        requiredRole: "birac",
      },
      {
        worldActionId: "pass_uv_skip_voter",
        label: "Prećuti i nastavi ka paravanu bez UV provere",
        choiceId: "E07-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 25,
      choiceId: "E07-c",
      label: "Birač je propušten bez UV provere; nepravilnost je prošla bez reakcije.",
    },
  },

  E08: {
    eventId: "E08",
    trigger: {
      type: "time",
      simulationTime: "08:12",
    },
    locationId: "voter-roll-desk",
    hotspotTarget: "voter-roll-table",
    actions: [
      // Član odbora
      {
        worldActionId: "require_id_document",
        label: "Objasni da je isprava obavezna i uputi ga da je donese",
        choiceId: "E08-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "issue_ballot_without_id",
        label: "Izdaj listić na poverenje, čovek je poznat u mestu",
        choiceId: "E08-c",
        requiredRole: "clan_odbora",
      },
      // Posmatrač
      {
        worldActionId: "record_id_complaint",
        label: "Zabeleži prigovor i zatraži odluku predsednika odbora",
        choiceId: "E08-b",
        requiredRole: "posmatrac",
      },
      // Birač
      {
        worldActionId: "present_valid_id_voter",
        label: "Pokaži važeću ličnu kartu ili pasoš radi nesumnjive provere",
        choiceId: "E08-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "demand_vote_on_trust_voter",
        label: "Insistiraj da glasaš na reč i poznanstvo bez ličnog dokumenta",
        choiceId: "E08-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 30,
      choiceId: "E08-c",
      label: "Birač je propušten da glasa bez provere lične isprave.",
    },
  },

  E09: {
    eventId: "E09",
    trigger: {
      type: "time",
      simulationTime: "09:17",
    },
    locationId: "uv-station",
    hotspotTarget: "uv-lamp-check",
    actions: [
      // Član odbora
      {
        worldActionId: "request_appointment_proof",
        label: "Zatraži rešenje o imenovanju u birački odbor pre glasanja",
        choiceId: "E09-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "reject_voting_immediately",
        label: "Odbij glasanje odmah, UV trag je dokaz da je već glasao",
        choiceId: "E09-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "accept_verbal_excuse",
        label: "Prihvati objašnjenje na reč i izdaj listić",
        choiceId: "E09-c",
        requiredRole: "clan_odbora",
      },
      // Posmatrač
      {
        worldActionId: "insist_on_appointment_proof_observer",
        label: "Insistiraj na zvaničnom rešenju o imenovanju pre nego što se biraču dozvoli glasanje",
        choiceId: "E09-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "demand_immediate_rejection_observer",
        label: "Zahtevaj momentalno odbijanje glasanja zbog postojanja UV traga",
        choiceId: "E09-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "ignore_spray_trace_observer",
        label: "Ne reaguj na verbalno objašnjenje birača o poreklu spreja",
        choiceId: "E09-c",
        requiredRole: "posmatrac",
      },
      // Birač
      {
        worldActionId: "show_appointment_solution_voter",
        label: "Priloži rešenje o radu u biračkom odboru koje objašnjava kontakt sa sprejom",
        choiceId: "E09-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "accept_uv_denial_voter",
        label: "Prihvati odbijanje ako nemaš zvanično rešenje",
        choiceId: "E09-b",
        requiredRole: "birac",
      },
      {
        worldActionId: "claim_cleaning_spray_voter",
        label: "Tvrdio da je sprej od čišćenja ili kućnih poslova",
        choiceId: "E09-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 30,
      choiceId: "E09-c",
      label: "Omogućeno je ponovljeno glasanje bez zakonom propisanog dokaza.",
    },
  },

  E10: {
    eventId: "E10",
    trigger: {
      type: "time",
      simulationTime: "09:40",
    },
    locationId: "voter-roll-desk",
    hotspotTarget: "voter-roll-table",
    actions: [
      // Član odbora
      {
        worldActionId: "refuse_and_instruct_commission",
        label: "Objasni da ne može glasati i uputi na lokalnu izbornu komisiju",
        choiceId: "E10-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "issue_ballot_anyway",
        label: "Izdaj listić mimo biračkog spiska (očigledna greška)",
        choiceId: "E10-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "refuse_without_instruction",
        label: "Odbij izdavanje listića, ali bez pravne pouke biraču",
        choiceId: "E10-c",
        requiredRole: "clan_odbora",
      },
      // Posmatrač
      {
        worldActionId: "verify_proper_instruction_observer",
        label: "Prati postupanje odbora i osiguraj da biraču daju pouku o OIK/GIK",
        choiceId: "E10-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "warn_grave_breach_observer",
        label: "Upozori odbor na tešku povredu ako pokušaju da izdaju listić bez spiska",
        choiceId: "E10-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "note_lack_of_instruction_observer",
        label: "Zabeleži odbijanje bez pravne pouke kao proceduralni propust",
        choiceId: "E10-c",
        requiredRole: "posmatrac",
      },
      // Birač
      {
        worldActionId: "request_voter_roll_verification_voter",
        label: "Zatraži uvid u spisak i uputstvo za hitnu proveru u opštinskoj komisiji",
        choiceId: "E10-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "demand_ballot_despite_roll_voter",
        label: "Zahtevaj da ti izdaju listić iako nisi pronađen u spisku",
        choiceId: "E10-b",
        requiredRole: "birac",
      },
      {
        worldActionId: "leave_silently_voter",
        label: "Napusti biračko mesto bez traženja objašnjenja ili pouke",
        choiceId: "E10-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E10-b",
      label: "Birač koji nije upisan u izvod je glasao (razlog za poništavanje!).",
    },
  },
  E11: {
    eventId: "E11",
    trigger: { type: "time", simulationTime: "10:05" },
    locationId: "voter-roll-desk",
    hotspotTarget: "voter-roll-table",
    actions: [
      {
        worldActionId: "reject_write_in_board",
        label: "Odbij dopisivanje i zatraži da se predlog evidentira u zapisniku",
        choiceId: "E11-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "reject_write_in_silent_board",
        label: "Odbij dopisivanje, ali ne unosi ništa u zapisnik",
        choiceId: "E11-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "accept_write_in_board",
        label: "Prihvati predlog, odbor je jednoglasan",
        choiceId: "E11-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "alert_illegal_write_in_observer",
        label: "Upozori odbor da je svako dopisivanje u birački spisak teško kršenje zakona",
        choiceId: "E11-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "note_write_in_attempt_observer",
        label: "Zabeleži pokušaj dopisivanja u beležnicu",
        choiceId: "E11-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "pass_write_in_observer",
        label: "Ne mešaj se u odluku članova odbora",
        choiceId: "E11-c",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "insist_on_legal_status_voter",
        label: "Zahtevaj da se proveri tvoj status u registru bez nezakonitog dopisivanja",
        choiceId: "E11-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "demand_immediate_write_in_voter",
        label: "Insistiraj da te dopišu ručno na licu mesta",
        choiceId: "E11-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 40,
      choiceId: "E11-c",
      label: "Nezakonito dopisivanje birača u spisak je prošlo bez reakcije.",
    },
  },
  E12: {
    eventId: "E12",
    trigger: { type: "time", simulationTime: "10:26" },
    locationId: "voting-booths",
    hotspotTarget: "booth-left",
    actions: [
      {
        worldActionId: "stop_group_voting_board",
        label: "Prekini grupno glasanje i objasni da birač glasa sam",
        choiceId: "E12-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "log_group_voting_board",
        label: "Zabeleži slučaj i zatraži od predsednika odbora da reaguje",
        choiceId: "E12-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "allow_group_voting_board",
        label: "Pusti ih, mladi su i očigledno je bezazleno",
        choiceId: "E12-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "demand_booth_clearing_observer",
        label: "Zahtevaj od odbora da osigura tajnost glasanja iza paravana",
        choiceId: "E12-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "record_booth_violation_observer",
        label: "Upiši povredu tajnosti glasanja u beležnicu",
        choiceId: "E12-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "ignore_booth_group_observer",
        label: "Zanemari grupno glasanje",
        choiceId: "E12-c",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "insist_on_privacy_voter",
        label: "Zahtevaj da drugi birač napusti paravan dok glasaš",
        choiceId: "E12-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "tolerate_booth_intrusion_voter",
        label: "Dozvoli drugoj osobi da gleda kako glasaš",
        choiceId: "E12-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E12-c",
      label: "Narušena tajnost glasanja - dvoje iza istog paravana bez reakcije.",
    },
  },
  E13: {
    eventId: "E13",
    trigger: { type: "time", simulationTime: "10:48" },
    locationId: "voting-booths",
    hotspotTarget: "booth-middle",
    actions: [
      {
        worldActionId: "allow_helper_with_record_board",
        label: "Dozvoli pomoć jer je birateljka sama odredila pomagača i evidentiraj to",
        choiceId: "E13-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "forbid_helper_board",
        label: "Zabrani svaku pomoć, glasanje je strogo lično",
        choiceId: "E13-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "board_member_helps_board",
        label: "Dozvoli, ali odredi da joj pomogne član odbora umesto ćerke",
        choiceId: "E13-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "verify_helper_rules_observer",
        label: "Proveri da li je pomagač biran od strane birača a ne od strane odbora",
        choiceId: "E13-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "oppose_board_helping_observer",
        label: "Upozori da član odbora nipošto ne sme biti pomagač",
        choiceId: "E13-c",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "choose_trusted_helper_voter",
        label: "Odredi lice od sopstvenog poverenja da ti pomogne pri glasanju",
        choiceId: "E13-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "accept_board_dictation_voter",
        label: "Prihvati da ti član odbora popuni listić",
        choiceId: "E13-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E13-c",
      label: "Član odbora je popunio listić biraču umesto pomagača od poverenja.",
    },
  },
  E14: {
    eventId: "E14",
    trigger: { type: "time", simulationTime: "11:03" },
    locationId: "entrance",
    hotspotTarget: "entrance-door",
    actions: [
      {
        worldActionId: "reject_late_home_vote_board",
        label: "Objasni da je rok za prijavu istekao u 11:00 i uputi ga na izbornu komisiju",
        choiceId: "E14-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "accept_late_home_vote_board",
        label: "Prihvati zahtev, tri minuta zakašnjenja niko neće primetiti",
        choiceId: "E14-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "dismiss_without_info_board",
        label: "Odbij zahtev bez ikakvog objašnjenja i vrati se poslu",
        choiceId: "E14-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "monitor_deadline_home_vote_observer",
        label: "Konstatuj istek roka u 11:00 i prati zakonitost odluke odbora",
        choiceId: "E14-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "object_late_home_acceptance_observer",
        label: "Podnesi primedbu ako odbor prihvati zahtev nakon 11:00",
        choiceId: "E14-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "inquire_commission_home_voter",
        label: "Zatraži potvrdu o roku i pravno uputstvo opštinske komisije",
        choiceId: "E14-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "press_board_home_voter",
        label: "Pritiskaj odbor da napravi izuzetak mimo propisanog roka",
        choiceId: "E14-b",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 40,
      choiceId: "E14-b",
      label: "Nezakonito primljen zahtev za glasanje van biračkog mesta nakon 11:00.",
    },
  },
  E15: {
    eventId: "E15",
    trigger: { type: "time", simulationTime: "11:35" },
    locationId: "ballot-box-area",
    hotspotTarget: "ballot-box",
    actions: [
      {
        worldActionId: "insist_three_trustees_board",
        label: "Insistiraj na tri člana imenovana na predlog različitih ovlašćenih predlagača",
        choiceId: "E15-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "send_two_trustees_board",
        label: "Pošalji dvojicu, važno je da birači uopšte glasaju",
        choiceId: "E15-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "demand_legal_trustees_observer",
        label: "Upozori odbor na zakonsku obavezu od 3 poverenika različitih lista",
        choiceId: "E15-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "record_illegal_trustees_observer",
        label: "Zabeleži slanje samo 2 poverenika kao tešku neregularnost",
        choiceId: "E15-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "observe_trustee_departure_voter",
        label: "Isprati odlazak poverenika u skladu sa propisima",
        choiceId: "E15-a",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 40,
      choiceId: "E15-b",
      label: "Poverenici upućeni u nepotpunom sastavu (razlog za poništavanje glasanja van BM).",
    },
  },
  E16: {
    eventId: "E16",
    trigger: { type: "time", simulationTime: "12:10" },
    locationId: "entrance",
    hotspotTarget: "entrance-door",
    actions: [
      {
        worldActionId: "seal_in_front_of_voter_board",
        label: "Zapečati koverat pred biračem i traži njegov potpis na potvrdi",
        choiceId: "E16-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "seal_in_hallway_board",
        label: "Zapečati koverat u hodniku, potvrdu ćete popuniti u povratku",
        choiceId: "E16-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "stay_in_room_board",
        label: "Ostani u prostoriji dok birač popunjava listić da mu pomogneš ako zatreba",
        choiceId: "E16-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "monitor_sealed_envelope_observer",
        label: "Proveri da li je koverat zapečaćen pred biračem sa potpisom na potvrdi",
        choiceId: "E16-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "flag_hallway_sealing_observer",
        label: "Zabeleži pečaćenje van prisustva birača",
        choiceId: "E16-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "demand_sealed_in_presence_voter",
        label: "Zahtevaj da se službeni koverat zapečati pred tobom u stanu",
        choiceId: "E16-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "allow_hallway_sealing_voter",
        label: "Dozvoli poverenicima da koverat zapečate u hodniku",
        choiceId: "E16-b",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 40,
      choiceId: "E16-b",
      label: "Nepravilno postupanje van BM: koverat zapečaćen van prisustva birača.",
    },
  },
  E17: {
    eventId: "E17",
    trigger: { type: "time", simulationTime: "12:45" },
    locationId: "voter-roll-desk",
    hotspotTarget: "voter-roll-table",
    actions: [
      {
        worldActionId: "remove_unauthorized_person_board",
        label: "Proveri po kom osnovu je tu i udalji ga ako nema akreditaciju ni funkciju",
        choiceId: "E17-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "assume_observer_board",
        label: "Pretpostavi da je posmatrač i ne diraj ga",
        choiceId: "E17-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "challenge_unauthorized_person_observer",
        label: "Zatraži proveru službene akreditacije lica kraj stola",
        choiceId: "E17-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "ignore_stranger_observer",
        label: "Ignoriši nepoznato lice",
        choiceId: "E17-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "report_stranger_at_table_voter",
        label: "Prijavi prisustvo nepoznatog lica kraj biračkog spiska",
        choiceId: "E17-a",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E17-b",
      label: "Neovlašćeno lice boravi kraj biračkog materijala bez akreditacije.",
    },
  },
  E18: {
    eventId: "E18",
    trigger: { type: "time", simulationTime: "13:20" },
    locationId: "observer-area",
    hotspotTarget: "observer-desk",
    actions: [
      {
        worldActionId: "warn_phone_use_board",
        label: "Upozori ga na pravila reda i zatraži da telefonira izvan biračkog mesta",
        choiceId: "E18-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "expel_without_warning_board",
        label: "Odmah ga udalji sa biračkog mesta bez upozorenja",
        choiceId: "E18-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "ignore_observer_phone_board",
        label: "Ne reaguj, posmatrač ionako sme sve",
        choiceId: "E18-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "self_regulate_phone_observer",
        label: "Poštuj pravila o zabrani korišćenja telefona na biračkom mestu",
        choiceId: "E18-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "argue_phone_right_observer",
        label: "Insistiraj na pravu na telefonski razgovor tokom glasanja",
        choiceId: "E18-c",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "request_quiet_booth_voter",
        label: "Zatraži red na biračkom mestu radi nesmetanog glasanja",
        choiceId: "E18-a",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E18-c",
      label: "Narušen red na biračkom mestu upotrebom telefona bez opomene.",
    },
  },
  E19: {
    eventId: "E19",
    trigger: { type: "time", simulationTime: "14:13" },
    locationId: "voter-roll-desk",
    hotspotTarget: "voter-roll-table",
    actions: [
      {
        worldActionId: "halt_and_notify_commission_board",
        label: "Zaustavi postupak, obavesti lokalnu izbornu komisiju i unesi ceo događaj u zapisnik",
        choiceId: "E19-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "note_in_notebook_only_board",
        label: "Zabeleži u svoju svesku i nastavi rad, u zapisnik ćeš uneti uveče ako bude vremena",
        choiceId: "E19-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "dismiss_voter_claimed_signed_board",
        label: "Reci mu da je verovatno zaboravio i pošalji ga kući",
        choiceId: "E19-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "demand_immediate_protocol_entry_observer",
        label: "Insistiraj na momentalnom obaveštavanju OIK/GIK i unosu u zapisnik",
        choiceId: "E19-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "record_dual_signature_issue_observer",
        label: "Zabeleži sumnju na glasanje umesto drugog lica u beležnicu",
        choiceId: "E19-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "remain_passive_dual_sign_observer",
        label: "Ne reaguj na tvrdnju birača",
        choiceId: "E19-c",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "demand_protection_of_vote_voter",
        label: "Zahtevaj zaštitu svog biračkog prava i službenu belešku u zapisniku",
        choiceId: "E19-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "leave_without_protest_voter",
        label: "Otiđi kući bez unete primedbe",
        choiceId: "E19-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 40,
      choiceId: "E19-c",
      label: "Teška povreda: birač sprečen da glasa zbog postojećeg potpisa bez istrage.",
    },
  },
  E20: {
    eventId: "E20",
    trigger: { type: "time", simulationTime: "15:02" },
    locationId: "voting-booths",
    hotspotTarget: "booth-right",
    actions: [
      {
        worldActionId: "warn_photo_and_record_board",
        label: "Upozori ga na pravila i evidentiraj događaj bez optuživanja",
        choiceId: "E20-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "accuse_and_call_police_board",
        label: "Odmah ga optuži da prodaje glas i pozovi policiju",
        choiceId: "E20-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "ignore_ballot_photo_board",
        label: "Ignoriši, svako radi šta hoće sa svojim listićem",
        choiceId: "E20-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "alert_secret_ballot_breach_observer",
        label: "Upozori odbor na fotografisanje listića iza paravana",
        choiceId: "E20-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "overreact_call_police_observer",
        label: "Zahtevaj momentalno hapšenje birača",
        choiceId: "E20-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "delete_photo_apologize_voter",
        label: "Uvaži opomenu i obriši fotografiju listića",
        choiceId: "E20-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "insist_on_taking_photo_voter",
        label: "Slikaj listić uprkos zabrani",
        choiceId: "E20-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E20-c",
      label: "Povreda tajnosti glasanja fotografisanjem listića bez reakcije odbora.",
    },
  },
  E21: {
    eventId: "E21",
    trigger: { type: "time", simulationTime: "15:30" },
    locationId: "entrance",
    hotspotTarget: "entrance-door",
    actions: [
      {
        worldActionId: "record_and_police_pressure_board",
        label: "Zabeleži tačno vreme, opis i svedoke i prijavi policiji preko predsednika odbora",
        choiceId: "E21-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "chase_alone_board",
        label: "Izađi i sam ga oteraj, bez beleške i bez obaveštavanja odbora",
        choiceId: "E21-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "ignore_outside_pressure_board",
        label: "To se dešava ispred, a ne unutar biračkog mesta - ne tiče te se",
        choiceId: "E21-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "report_external_pressure_observer",
        label: "Zahtevaj da predsednik BO obavesti policiju o pritisku na birače ispred ulaza",
        choiceId: "E21-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "refuse_to_show_photo_voter",
        label: "Odbij pritisak i prijavi ucenjivača članovima biračkog odbora",
        choiceId: "E21-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "succumb_to_pressure_voter",
        label: "Pokaži sliku listića licu ispred biračkog mesta",
        choiceId: "E21-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 40,
      choiceId: "E21-c",
      label: "Krivično delo pritiska na birače ispred ulaza prošlo bez prijave.",
    },
  },
  E22: {
    eventId: "E22",
    trigger: { type: "time", simulationTime: "16:38" },
    locationId: "voter-roll-desk",
    hotspotTarget: "voter-roll-table",
    actions: [
      {
        worldActionId: "remove_names_keep_tallies_board",
        label: "Traži da se kolona sa imenima ukloni, brojčana evidencija crticama može da ostane",
        choiceId: "E22-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "ban_all_tallies_board",
        label: "Zabrani svaku evidenciju, uključujući crtice",
        choiceId: "E22-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "allow_parallel_lists_board",
        label: "Pusti oba spiska, to je interna stvar člana odbora",
        choiceId: "E22-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "object_to_parallel_lists_observer",
        label: "Zahtevaj hitno oduzimanje paralelnog spiska sa imenima birača",
        choiceId: "E22-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "protest_name_recording_voter",
        label: "Zatraži objašnjenje zašto se tvoje ime upisuje u poseban papir",
        choiceId: "E22-a",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E22-c",
      label: "Vođenje paralelnog biračkog spiska sa imenima tolerisano na BM.",
    },
  },
  E23: {
    eventId: "E23",
    trigger: { type: "time", simulationTime: "17:15" },
    locationId: "voter-roll-desk",
    hotspotTarget: "voter-roll-table",
    actions: [
      {
        worldActionId: "stop_phone_names_board",
        label: "Prekini razgovor, zatraži unos u zapisnik i obavesti predsednika odbora",
        choiceId: "E23-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "ignore_phone_names_board",
        label: "Nasmej se i ignoriši, tako je na svakom biračkom mestu",
        choiceId: "E23-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "demand_immediate_phone_halt_observer",
        label: "Zahtevaj prekid javljanja imena birača i momentalni unos u zapisnik",
        choiceId: "E23-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "object_to_phone_broadcast_voter",
        label: "Pobuni se što se tvoj identitet telefonom saopštava trećim licima",
        choiceId: "E23-a",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E23-b",
      label: "Telefonsko javljanje imena glasača prošlo bez sankcije i unosa u zapisnik.",
    },
  },
  E24: {
    eventId: "E24",
    trigger: { type: "time", simulationTime: "18:00" },
    locationId: "voting-booths",
    hotspotTarget: "booth-middle",
    actions: [
      {
        worldActionId: "halt_suggesting_vote_board",
        label: "Prekini ga odmah, traži unos u zapisnik i obavesti komisiju",
        choiceId: "E24-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "quietly_caution_later_board",
        label: "Nasamo mu skreni pažnju posle, da ne pravite scenu pred biračima",
        choiceId: "E24-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "ignore_suggesting_board",
        label: "Ne mešaj se, stariji birači često i sami traže pomoć",
        choiceId: "E24-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "demand_expulsion_for_campaigning_observer",
        label: "Upozori na kršenje izborne tišine i sugerisanje glasanja na BM",
        choiceId: "E24-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "refuse_suggested_vote_voter",
        label: "Odbij sugerisanje i opomeni člana odbora da ne sme da utiče na birače",
        choiceId: "E24-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "accept_suggestion_voter",
        label: "Poslušaj sugestiju i zaokruži broj koji ti je rečen",
        choiceId: "E24-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E24-c",
      label: "Član biračkog odbora nesmetano sugerisao biračima za koga da glasaju.",
    },
  },
  E25: {
    eventId: "E25",
    trigger: { type: "time", simulationTime: "18:40" },
    locationId: "voting-booths",
    hotspotTarget: "booth-left",
    actions: [
      {
        worldActionId: "inform_free_vote_board",
        label: "Objasni joj da niko ne sme da traži dokaz o glasanju i pomozi joj da sačuva poruku kao dokaz",
        choiceId: "E25-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "return_to_line_board",
        label: "Reci joj da se ne brine i vrati je u red bez ikakve dalje radnje",
        choiceId: "E25-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "advise_photo_board",
        label: "Savetuj joj da se ipak slika, tako će izbeći probleme na poslu",
        choiceId: "E25-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "support_voter_freedom_observer",
        label: "Pruži pravnu informaciju biraču o zaštiti tajnosti glasanja i prijavljivanju ucene",
        choiceId: "E25-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "vote_by_conscience_save_evidence_voter",
        label: "Glasaj po sopstvenoj savesti i sačuvaj poruku poslodavca kao dokaz ucene",
        choiceId: "E25-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "comply_with_boss_voter",
        label: "Slikaj listić kako bi poslodavcu poslala traženi dokaz",
        choiceId: "E25-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E25-c",
      label: "Biračica podlegla uceni na poslu jer odbor nije pružio zaštitu slobode glasanja.",
    },
  },
  E26: {
    eventId: "E26",
    trigger: { type: "time", simulationTime: "19:20" },
    locationId: "ballot-box-area",
    hotspotTarget: "ballot-box",
    actions: [
      {
        worldActionId: "stop_ballot_removal_board",
        label: "Zaustavi iznošenje listića, zatraži unos u zapisnik i obavesti policiju preko predsednika",
        choiceId: "E26-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "shout_return_board",
        label: "Doviknu mu da vrati listić, ali ne evidentiraj ništa ako ga vrati",
        choiceId: "E26-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "ignore_missing_ballot_board",
        label: "Ne reaguj, verovatno je zaboravio da ga ubaci",
        choiceId: "E26-c",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "demand_police_ballot_removal_observer",
        label: "Zahtevaj hitno sprečavanje iznošenja listića (sumnja na bugarski voz)",
        choiceId: "E26-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "insert_ballot_properly_voter",
        label: "Ubaci listić u glasačku kutiju pre napuštanja prostorije",
        choiceId: "E26-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "pocket_ballot_voter",
        label: "Stavi listić u džep i napusti biračko mesto",
        choiceId: "E26-c",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E26-c",
      label: "Iznošenje glasačkog listića sa biračkog mesta prošlo neprimećeno (bugarski voz).",
    },
  },
  E27: {
    eventId: "E27",
    trigger: { type: "time", simulationTime: "19:59" },
    locationId: "entrance",
    hotspotTarget: "entrance-door",
    actions: [
      {
        worldActionId: "roster_queue_at_eight_board",
        label: "Popiši ko je u redu u 20:00 i omogući svima da glasaju",
        choiceId: "E27-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "lock_doors_abruptly_board",
        label: "Zaključaj vrata u 20:00, zakon je zakon",
        choiceId: "E27-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "insist_allow_queue_vote_observer",
        label: "Upozori odbor da svi birači zatečeni u redu u 20:00 imaju zakonsko pravo da glasaju",
        choiceId: "E27-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "claim_right_to_vote_in_line_voter",
        label: "Pozovi se na zakon i zahtevaj da ti se omogući glasanje jer si u redu pre 20:00",
        choiceId: "E27-a",
        requiredRole: "birac",
      },
      {
        worldActionId: "leave_when_locked_voter",
        label: "Okreni se i idi kući bez glasanja",
        choiceId: "E27-b",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E27-b",
      label: "Birači u redu u 20:00 nezakonito sprečeni da glasaju zatvaranjem vrata.",
    },
  },
  E28: {
    eventId: "E28",
    trigger: { type: "time", simulationTime: "20:12" },
    locationId: "voter-roll-desk",
    hotspotTarget: "counting-voter-roll",
    actions: [
      {
        worldActionId: "extend_time_log_protocol_board",
        label: "Produži glasanje za vreme kašnjenja i unesi tačno vreme u zapisnik",
        choiceId: "E28-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "close_at_eight_despite_delay_board",
        label: "Zatvori u 20:00, kašnjenje je bilo kratko",
        choiceId: "E28-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "remind_extension_requirement_observer",
        label: "Podseti odbor na zakonsku obavezu produženja glasanja srazmerno jutarnjem kašnjenju",
        choiceId: "E28-a",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "demand_extension_compensation_voter",
        label: "Zahtevaj da biračko mesto radi duže zbog kašnjenja u otvaranju",
        choiceId: "E28-a",
        requiredRole: "birac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E28-b",
      label: "Propušteno produženje glasanja srazmerno jutarnjem prekidu.",
    },
  },
  E29: {
    eventId: "E29",
    trigger: { type: "time", simulationTime: "20:25" },
    locationId: "counting-table",
    hotspotTarget: "counting-box-ballots",
    roleFilter: ["clan_odbora", "posmatrac"],
    actions: [
      {
        worldActionId: "follow_counting_sequence_board",
        label: "Prvo utvrdi broj birača po potpisima, pa neupotrebljene listiće, pa proveri pečat - tek onda kutija",
        choiceId: "E29-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "open_box_prematurely_board",
        label: "Otvori kutiju odmah, brojevi će se ionako sabrati na kraju",
        choiceId: "E29-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "enforce_counting_order_observer",
        label: "Upozori odbor na striktan zakonski redosled prebrojavanja pre otvaranja kutije",
        choiceId: "E29-a",
        requiredRole: "posmatrac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E29-b",
      label: "Narušen zakonski redosled prebrojavanja glasova (otvorena kutija pre spiska).",
    },
  },
  E30: {
    eventId: "E30",
    trigger: { type: "time", simulationTime: "20:50" },
    locationId: "counting-table",
    hotspotTarget: "counting-control-sheet",
    roleFilter: ["clan_odbora", "posmatrac"],
    actions: [
      {
        worldActionId: "search_and_record_control_sheet_board",
        label: "Pažljivo pretraži sadržaj kutije i evidentiraj da je kontrolni list pronađen",
        choiceId: "E30-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "count_without_control_sheet_board",
        label: "Ako se ne nađe odmah, pređi na brojanje listića i ne pominji to u zapisniku",
        choiceId: "E30-b",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "demand_control_sheet_verification_observer",
        label: "Zahtevaj rigoroznu proveru kontrolnog lista i potpis na Zapisnik",
        choiceId: "E30-a",
        requiredRole: "posmatrac",
      },
    ],
    timeout: {
      simulationSeconds: 35,
      choiceId: "E30-b",
      label: "Kontrolni list u kutiji nije uredno konstatovan pre brojanja.",
    },
  },
};

/**
 * Validira da svako definisano mapiranje referencira stvarni SimulationEvent ID
 * i stvarne autorske SimulationChoice ID-eve, uključujući i timeout.
 */
export function validateIncidentBindings(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const eventMap = new Map(simulationEvents.map((event) => [event.id, event]));

  for (const [bindingId, binding] of Object.entries(WORLD_INCIDENT_BINDINGS)) {
    const event = eventMap.get(binding.eventId);
    if (!event) {
      errors.push(`Binding ${bindingId} referencira nepostojeći eventId: ${binding.eventId}`);
      continue;
    }

    const choiceIds = new Set(event.choices.map((c) => c.id));

    for (const action of binding.actions) {
      if (!choiceIds.has(action.choiceId)) {
        errors.push(`Binding ${bindingId} action ${action.worldActionId} ima nevažeći choiceId: ${action.choiceId}`);
      }
    }

    if (binding.timeout && !choiceIds.has(binding.timeout.choiceId)) {
      errors.push(`Binding ${bindingId} timeout ima nevažeći choiceId: ${binding.timeout.choiceId}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
