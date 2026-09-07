import type { SimulationEvent, SimulationRiskBand } from "./types";

/**
 * Autorski tok jednog biračkog dana, od dolaska odbora do predaje materijala.
 * Svaki događaj referencira postojeća pravila preko `ruleIds` i ne sadrži nijedan
 * pravni zaključak koji ne postoji u bazi pravila.
 */
const authoredEvents: SimulationEvent[] = [
  // ---------------------------------------------------------------- PRE OTVARANJA
  {
    id: "E01",
    time: "06:15",
    phase: "pre_otvaranja",
    title: "Dolazak i pregled prostorije",
    description:
      "Stižeš u školu u kojoj je biračko mesto. U hodniku, tri metra od ulaza u prostoriju, stoji plakat jedne izborne liste sa prošlonedeljnog skupa.",
    severity: "nepravilnost",
    riskBand: "irregularity",
    choices: [
      {
        id: "E01-a",
        label: "Zatraži uklanjanje plakata pre otvaranja i zabeleži vreme",
        explanation:
          "Isticanje izbornog propagandnog materijala na biračkom mestu ili neposredno ispred njega zakon navodi kao narušavanje reda. Rešava se pre 07:00, dok još nema birača.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["P12"],
        effects: { scores: { procedure: 3, documentation: 2 }, evidenceDelta: 1, addFlags: ["propaganda-uklonjena"] },
      },
      {
        id: "E01-b",
        label: "Fotografiši plakat u hodniku i prijavi ga posle otvaranja",
        explanation:
          "Zapažanje je tačno, ali plakat treba ukloniti pre nego što prvi birač uđe. Odlaganje znači da je materijal bio istaknut dok su birači ulazili.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["P12"],
        effects: { scores: { procedure: 1, documentation: 2 }, evidenceDelta: 1 },
      },
      {
        id: "E01-c",
        label: "Ne reaguj, plakat je u hodniku a ne u samoj prostoriji",
        explanation:
          "Zabrana se odnosi i na prostor neposredno ispred biračkog mesta, ne samo na prostoriju u kojoj se glasa.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["P12"],
        effects: { scores: { procedure: -2 }, addFlags: ["propaganda-ostala"] },
      },
    ],
  },
  {
    id: "E02",
    time: "06:32",
    phase: "pre_otvaranja",
    title: "Prijem izbornog materijala",
    description:
      "Prebrojavate materijal. Izvod iz biračkog spiska, kutija i kontrolni list su tu, ali je primljeno 940 glasačkih listića, a u izvodu je 986 birača.",
    severity: "info",
    riskBand: "routine",
    choices: [
      {
        id: "E02-a",
        label: "Otvori biračko mesto na vreme i odmah traži dopunu listića od komisije",
        explanation:
          "Manji broj listića od broja upisanih birača sam po sebi nije razlog da se biračko mesto ne otvori. Nedostatak se prijavljuje i rešava u toku dana.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["P04"],
        effects: { scores: { procedure: 3, documentation: 1 }, evidenceDelta: 1 },
      },
      {
        id: "E02-b",
        label: "Ne otvaraj biračko mesto dok ne stigne pun broj listića",
        explanation:
          "Zakon ovaj slučaj tretira drugačije od nedostatka izvoda, kutije ili kontrolnog lista. Neotvaranje bi neosnovano uskratilo pravo glasa biračima u redu.",
        classification: "critical_error",
        outcome: "serious",
        ruleIds: ["P04"],
        effects: { scores: { procedure: -3, voterRights: -3 }, addFlags: ["kasno-otvaranje"] },
      },
      {
        id: "E02-c",
        label: "Otvori mesto, ali nigde ne evidentiraj razliku u broju listića",
        explanation:
          "Otvaranje je ispravno, ali broj primljenih listića kasnije ulazi u računicu zapisnika. Neevidentiranje otežava kontrolu na kraju dana.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["P04", "AN02"],
        effects: { scores: { procedure: 1, documentation: -1 } },
      },
    ],
  },
  {
    id: "E03",
    time: "06:41",
    phase: "pre_otvaranja",
    title: "Raspored paravana",
    description:
      "Paravan je postavljen tako da svako ko stoji kraj stola odbora vidi ruke birača i listić dok ga popunjava.",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    choices: [
      {
        id: "E03-a",
        label: "Premesti paravan tako da niko ne može da vidi popunjavanje listića",
        explanation:
          "Paravani moraju biti raspoređeni tako da ni drugi birači, ni članovi odbora, ni posmatrači ne mogu videti kako birač popunjava listić.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["P11"],
        effects: { scores: { procedure: 2, secrecy: 4 }, addFlags: ["paravan-ispravan"] },
      },
      {
        id: "E03-b",
        label: "Ostavi kako jeste, birači mogu da se okrenu leđima",
        explanation:
          "Tajnost ne sme da zavisi od snalaženja birača. Raspored prostorije je odgovornost biračkog odbora pre otvaranja.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["P11"],
        effects: { scores: { secrecy: -4 }, addFlags: ["paravan-neispravan"] },
      },
    ],
  },
  {
    id: "E04",
    time: "06:52",
    phase: "pre_otvaranja",
    title: "Provera glasačke kutije",
    description: "Kutija je na stolu, prvi birač je već ispred vrata. Treba utvrditi da je prazna i ispravna.",
    severity: "teska_nepravilnost",
    riskBand: "irregularity",
    choices: [
      {
        id: "E04-a",
        label: "Pozovi prvog birača da prisustvuje proveri prazne kutije",
        explanation: "Pred prvim biračem se utvrđuje da je kutija prazna i ispravna, pre ubacivanja kontrolnog lista.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["P05"],
        effects: { scores: { procedure: 4, documentation: 1 }, addFlags: ["kutija-pokazana"] },
      },
      {
        id: "E04-b",
        label: "Odbor sam proveri kutiju i zatvori je pre nego što birač uđe",
        explanation:
          "Provera bez prvog birača gubi svrhu — upravo njegovo prisustvo je javna garancija da je kutija bila prazna.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["P05"],
        effects: { scores: { procedure: -3 }, addFlags: ["kutija-nije-pokazana"] },
      },
    ],
  },
  {
    id: "E05",
    time: "06:58",
    phase: "pre_otvaranja",
    title: "Kontrolni list",
    description:
      "Predsednik odbora popunjava kontrolni list i žuri da zapečati kutiju jer je 07:00 za dva minuta.",
    severity: "ponistavanje",
    riskBand: "annulment",
    choices: [
      {
        id: "E05-a",
        label: "Insistiraj da kontrolni list potpišu prvi birač i član odbora, pa tek onda u kutiju",
        explanation:
          "Kontrolni list potpisuju prvi birač i najmanje jedan član biračkog odbora. Bez toga postoji zakonski osnov za poništavanje glasanja na biračkom mestu.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["P06", "P07", "P08"],
        effects: { scores: { procedure: 5, legalResponse: 2 }, addFlags: ["kontrolni-list-uredan"] },
      },
      {
        id: "E05-b",
        label: "Pusti da se potpiše kasnije, bitno je da mesto proradi u 07:00",
        explanation:
          "Naknadno potpisivanje nije predviđeno. Ako se pri otvaranju kutije utvrdi da kontrolni list nije uredno popunjen i potpisan, to je razlog za poništavanje po službenoj dužnosti.",
        classification: "critical_error",
        outcome: "annulment",
        ruleIds: ["P06", "P07"],
        effects: { scores: { procedure: -5, legalResponse: -3 }, addFlags: ["kontrolni-list-neuredan"] },
      },
      {
        id: "E05-c",
        label: "Zatraži pauzu od dva minuta i uredno završi proceduru pre otvaranja",
        explanation:
          "Kratko kašnjenje otvaranja je manji problem od neispravnog kontrolnog lista; vreme glasanja se u tom slučaju produžava.",
        classification: "acceptable",
        outcome: "prevented",
        ruleIds: ["P06", "Z02"],
        effects: { scores: { procedure: 3, legalResponse: 1 }, addFlags: ["kontrolni-list-uredan", "kasno-otvaranje"] },
      },
    ],
  },

  // ---------------------------------------------------------------- OTVARANJE
  {
    id: "E06",
    time: "07:00",
    phase: "pre_otvaranja",
    title: "Pečaćenje kutije i otvaranje",
    description: "Kontrolni list je u kutiji. Ostaje pečaćenje pred prisutnima.",
    severity: "teska_nepravilnost",
    riskBand: "routine",
    choices: [
      {
        id: "E06-a",
        label: "Zapečati kutiju pred prvim biračem i evidentiraj vreme otvaranja",
        explanation: "Nakon ubacivanja kontrolnog lista kutija se pečati, a vreme otvaranja ulazi u zapisnik.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["P10"],
        effects: { scores: { procedure: 3, documentation: 2 }, evidenceDelta: 1, addFlags: ["kutija-zapecacena"] },
      },
      {
        id: "E06-b",
        label: "Ostavi kutiju nezapečaćenu, pečat ćete staviti kad se smiri gužva",
        explanation:
          "Nezapečaćena kutija tokom glasanja dovodi u pitanje ispravnost celog dana i ne može se naknadno popraviti.",
        classification: "critical_error",
        outcome: "serious",
        ruleIds: ["P10"],
        effects: { scores: { procedure: -4 }, addFlags: ["kutija-bez-pecata"] },
      },
    ],
  },

  // ---------------------------------------------------------------- IDENTIFIKACIJA
  {
    id: "E07",
    time: "07:38",
    phase: "identifikacija",
    title: "Redovan tok identifikacije",
    description:
      "Birač prilazi stolu. Kolega odmah traži ličnu kartu i otvara izvod, ali preskače UV lampu jer „nema šanse da je neko već glasao u 07:38“.",
    severity: "nepravilnost",
    riskBand: "irregularity",
    choices: [
      {
        id: "E07-a",
        label: "Podseti na propisani redosled: UV lampa, identitet, izvod, potpis, sprej, listić",
        explanation:
          "Redosled provere je propisan i primenjuje se kod svakog birača, bez obzira na doba dana.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["I01", "I08"],
        effects: { scores: { procedure: 4 }, addFlags: ["uv-dosledna"] },
      },
      {
        id: "E07-b",
        label: "Pusti ovog birača, ali od sledećeg uvedi punu proceduru",
        explanation:
          "Delimična primena ostavlja rupu u zaštiti od višestrukog glasanja i teško se kasnije objašnjava u zapisniku.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["I01"],
        effects: { scores: { procedure: 1 } },
      },
      {
        id: "E07-c",
        label: "Prihvati logiku kolege, UV lampa je formalnost u ranim satima",
        explanation:
          "UV provera je deo propisane procedure pre izdavanja listića; njeno preskakanje je proceduralna nepravilnost.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["I01"],
        effects: { scores: { procedure: -3 }, addFlags: ["uv-preskakana"] },
      },
    ],
  },
  {
    id: "E08",
    time: "08:12",
    phase: "identifikacija",
    title: "„Pa znamo se ceo život“",
    description:
      "Komšija člana odbora prilazi bez lične karte. Član odbora kaže da ga lično poznaje i traži da mu se izda listić.",
    severity: "nepravilnost",
    riskBand: "irregularity",
    roles: ["clan_odbora", "posmatrac"],
    choices: [
      {
        id: "E08-a",
        label: "Objasni da je isprava obavezna i uputi ga da je donese",
        explanation:
          "Lično poznavanje birača ne zamenjuje utvrđivanje identiteta odgovarajućom javnom ispravom sa fotografijom i JMBG.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["I03", "I04"],
        effects: { scores: { procedure: 4, voterRights: 1 } },
      },
      {
        id: "E08-b",
        label: "Zabeleži prigovor i zatraži da predsednik odbora odluči po propisu",
        explanation:
          "Posmatrač ne vodi proceduru, ali ima pravo da zatraži postupanje po propisu i da događaj evidentira.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["I04", "N02"],
        roles: ["posmatrac"],
        effects: { scores: { procedure: 3, documentation: 2 }, evidenceDelta: 1 },
      },
      {
        id: "E08-c",
        label: "Izdaj listić, čovek je poznat i nema razloga za sumnju",
        explanation:
          "Izdavanje listića bez provere isprave je proceduralna nepravilnost i otvara prostor za osporavanje celog biračkog mesta.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["I03", "I04"],
        roles: ["clan_odbora"],
        effects: { scores: { procedure: -3 }, addFlags: ["identitet-bez-isprave"] },
      },
    ],
  },
  {
    id: "E09",
    time: "09:17",
    phase: "identifikacija",
    title: "UV trag na prstu",
    description:
      "UV lampa pokazuje trag kod birača. On tvrdi da je član biračkog odbora na drugom biračkom mestu i da je tamo već glasao.",
    severity: "proveri",
    riskBand: "irregularity",
    choices: [
      {
        id: "E09-a",
        label: "Zatraži rešenje o imenovanju u birački odbor i tek uz dokaz nastavi proceduru",
        explanation:
          "Zakon predviđa izuzetak za birača koji dokaže da je član biračkog odbora. Bez dokaza, izuzetak ne postoji.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["I02", "I13"],
        effects: { scores: { procedure: 4, legalResponse: 2 }, evidenceDelta: 1, addFlags: ["uv-izuzetak-proveren"] },
      },
      {
        id: "E09-b",
        label: "Odbij glasanje odmah, UV trag je dokaz da je već glasao",
        explanation:
          "Automatska zabrana bez provere isprave uskraćuje pravo glasa osobi koja možda ispunjava zakonski izuzetak.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["I02"],
        effects: { scores: { voterRights: -3, procedure: -1 } },
      },
      {
        id: "E09-c",
        label: "Prihvati objašnjenje na reč i izdaj listić",
        explanation:
          "Bez dokaza ovo je omogućavanje ponovljenog glasanja, što Krivični zakonik tretira kao zloupotrebu prava glasanja.",
        classification: "critical_error",
        outcome: "criminal",
        ruleIds: ["I13", "I11"],
        effects: { scores: { procedure: -4, legalResponse: -3 }, addFlags: ["dozvoljeno-bez-dokaza"] },
      },
    ],
  },
  {
    id: "E10",
    time: "09:40",
    phase: "identifikacija",
    title: "Birač nije u izvodu",
    description:
      "Žena tvrdi da glasa na ovom mestu godinama, ali je nema u izvodu iz biračkog spiska. Ima ličnu kartu sa adresom iz ove ulice.",
    severity: "ponistavanje",
    riskBand: "annulment",
    choices: [
      {
        id: "E10-a",
        label: "Objasni da ne možeš izdati listić i uputi je na lokalnu izbornu komisiju",
        explanation:
          "Omogućavanje glasanja licu koje nije upisano u izvod je jedan od zakonom izričito propisanih razloga za poništavanje glasanja na biračkom mestu.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["I05"],
        effects: { scores: { procedure: 5, voterRights: 2, legalResponse: 2 }, evidenceDelta: 1 },
      },
      {
        id: "E10-b",
        label: "Izdaj listić, očigledno je reč o administrativnoj grešci",
        explanation:
          "Ovo je jedan od četiri slučaja u kojima nadležna izborna komisija poništava glasanje na biračkom mestu po službenoj dužnosti.",
        classification: "critical_error",
        outcome: "annulment",
        ruleIds: ["I05"],
        effects: { scores: { procedure: -6, legalResponse: -4 }, addFlags: ["glasao-van-izvoda"] },
      },
      {
        id: "E10-c",
        label: "Odbij izdavanje listića, ali joj ne objasni šta dalje može da uradi",
        explanation:
          "Odluka je proceduralno ispravna, ali birač ostaje bez informacije o pravnom leku koji mu stoji na raspolaganju.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["I05"],
        effects: { scores: { procedure: 3, voterRights: -1 } },
      },
    ],
  },
  {
    id: "E11",
    time: "10:05",
    phase: "identifikacija",
    title: "Predlog da se birač dopiše",
    description:
      "Nakon prethodnog slučaja, jedan član odbora predlaže da se žena jednostavno dopiše na kraj izvoda „da ne pravimo dramu“.",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    roles: ["clan_odbora", "posmatrac"],
    choices: [
      {
        id: "E11-a",
        label: "Odbij dopisivanje i zatraži da se predlog evidentira u zapisniku",
        explanation:
          "Birački odbor ne sme dopisivati birače u izvod, čak ni kada svi članovi smatraju da je birač izostavljen greškom.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["I06"],
        effects: { scores: { procedure: 4, documentation: 3, legalResponse: 2 }, evidenceDelta: 1 },
      },
      {
        id: "E11-b",
        label: "Odbij dopisivanje, ali ne unosi ništa u zapisnik",
        explanation:
          "Sprečio si nepravilnost, ali bez traga u zapisniku kasnija provera ne može da rekonstruiše šta se dešavalo.",
        classification: "acceptable",
        outcome: "prevented",
        ruleIds: ["I06"],
        effects: { scores: { procedure: 3, documentation: -1 } },
      },
      {
        id: "E11-c",
        label: "Prihvati predlog, odbor je jednoglasan",
        explanation:
          "Jednoglasnost odbora ne menja zabranu. Dopisivanje otvara isti osnov za poništavanje kao i izdavanje listića licu van izvoda.",
        classification: "critical_error",
        outcome: "annulment",
        ruleIds: ["I06", "I05"],
        effects: { scores: { procedure: -6, legalResponse: -3 }, addFlags: ["dopisivanje-izvrseno"] },
      },
    ],
  },

  // ---------------------------------------------------------------- GLASANJE
  {
    id: "E12",
    time: "10:26",
    phase: "glasanje",
    title: "Dvoje iza istog paravana",
    description:
      "Mladić i njegova devojka ulaze zajedno iza paravana i smeju se. Niko od njih nije tražio pomoć niti je pominjao bilo kakvu smetnju.",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    choices: [
      {
        id: "E12-a",
        label: "Prekini grupno glasanje i objasni da birač glasa sam",
        explanation:
          "Izuzetak postoji samo kada birač zbog nepismenosti, slabovidosti, invaliditeta ili drugog razloga ne može sam da popuni listić.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["T01"],
        effects: { scores: { secrecy: 4, procedure: 2 }, addFlags: ["grupno-spreceno"] },
      },
      {
        id: "E12-b",
        label: "Zabeleži slučaj i zatraži od predsednika odbora da reaguje",
        explanation:
          "Posmatrač ne prekida radnju sam, ali evidentira događaj i traži da odbor postupi po propisu.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["T01", "N02"],
        roles: ["posmatrac"],
        effects: { scores: { secrecy: 3, documentation: 2 }, evidenceDelta: 1 },
      },
      {
        id: "E12-c",
        label: "Pusti ih, mladi su i očigledno je bezazleno",
        explanation:
          "Posmatračke misije upravo grupno/porodično glasanje beleže kao jednu od najčešćih nepravilnosti na biračkim mestima.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["T01"],
        effects: { scores: { secrecy: -4 }, addFlags: ["grupno-dozvoljeno"] },
      },
    ],
  },
  {
    id: "E13",
    time: "10:48",
    phase: "glasanje",
    title: "Starija birateljka traži pomoć",
    description:
      "Slabovida birateljka kaže da ne vidi listić i sama zamoli ćerku, koja je došla sa njom, da joj pomogne da zaokruži broj koji joj kaže.",
    severity: "dozvoljeno",
    riskBand: "routine",
    choices: [
      {
        id: "E13-a",
        label: "Dozvoli pomoć jer je birateljka sama odredila pomagača i evidentiraj to",
        explanation:
          "Birač koji zbog slabovidosti ne može sam da popuni listić ima pravo da sam odredi pomagača; pomagač popunjava listić prema njegovom nalogu.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["T01", "T02"],
        effects: { scores: { voterRights: 4, procedure: 2, documentation: 1 }, evidenceDelta: 1 },
      },
      {
        id: "E13-b",
        label: "Zabrani svaku pomoć, glasanje je strogo lično",
        explanation:
          "Ovo je česta zabluda. Institut pomagača postoji upravo za birače koji ne mogu sami da popune listić.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["T02"],
        effects: { scores: { voterRights: -4 }, addFlags: ["pomagac-odbijen"] },
      },
      {
        id: "E13-c",
        label: "Dozvoli, ali odredi da joj pomogne član odbora umesto ćerke",
        explanation:
          "Pomagača bira sam birač. Određivanje pomagača od strane odbora zadire u slobodu odlučivanja birača.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["T02", "V08"],
        effects: { scores: { voterRights: -1, procedure: 1 } },
      },
    ],
  },
  {
    id: "E14",
    time: "11:03",
    phase: "van_birackog_mesta",
    title: "Zahtev za glasanje kod kuće u 11:03",
    description:
      "Sin birača dolazi i traži da komisija dođe kod njegovog oca koji je nepokretan. Sat na zidu pokazuje 11:03.",
    severity: "proveri",
    riskBand: "irregularity",
    roles: ["clan_odbora", "posmatrac"],
    choices: [
      {
        id: "E14-a",
        label: "Objasni da je rok za prijavu istekao u 11:00 i uputi ga na izbornu komisiju",
        explanation:
          "Birački odbor se o glasanju van biračkog mesta obaveštava na dan glasanja najkasnije do 11:00 časova.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["V01"],
        effects: { scores: { procedure: 3, voterRights: 1, documentation: 1 }, evidenceDelta: 1 },
      },
      {
        id: "E14-b",
        label: "Prihvati zahtev, tri minuta zakašnjenja niko neće primetiti",
        explanation:
          "Rok je propisan i proverljiv; naknadno prihvatanje zahteva otvara osporavanje celog postupka glasanja van biračkog mesta.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["V01"],
        effects: { scores: { procedure: -3 }, addFlags: ["rok-van-bm-prekrsen"] },
      },
      {
        id: "E14-c",
        label: "Odbij zahtev bez ikakvog objašnjenja i vrati se poslu",
        explanation: "Odluka je formalno tačna, ali birač i porodica ostaju bez informacije šta im preostaje.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["V01"],
        effects: { scores: { procedure: 2, voterRights: -1 } },
      },
    ],
  },
  {
    id: "E15",
    time: "11:35",
    phase: "van_birackog_mesta",
    title: "Sastav poverenika",
    description:
      "Za ranije prijavljene birače kreće se u obilazak. Predsednik predlaže da idu dva člana, oba imenovana na predlog istog predlagača, „jer treći ne može da se odvoji od stola“.",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    roles: ["clan_odbora", "posmatrac"],
    choices: [
      {
        id: "E15-a",
        label: "Insistiraj na tri člana imenovana na predlog različitih ovlašćenih predlagača",
        explanation:
          "Kod birača idu tri člana biračkog odbora imenovana na predlog različitih ovlašćenih predlagača — to je garancija nepristrasnosti postupka.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["V01", "V02", "V03"],
        effects: { scores: { procedure: 5, legalResponse: 2 }, addFlags: ["poverenici-ispravni"] },
      },
      {
        id: "E15-b",
        label: "Pošalji dvojicu, važno je da birači uopšte glasaju",
        explanation:
          "Nepravilan sastav poverenika dovodi u pitanje ceo postupak glasanja van biračkog mesta, bez obzira na dobru nameru.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["V02", "V03"],
        effects: { scores: { procedure: -4 }, addFlags: ["poverenici-nepravilni"] },
      },
    ],
  },
  {
    id: "E16",
    time: "12:10",
    phase: "van_birackog_mesta",
    title: "Kod birača u stanu",
    description:
      "Birač je popunio listić. Jedan poverenik predlaže da koverat zapečatite napolju u hodniku „da ne smaramo čoveka“.",
    severity: "nepravilnost",
    riskBand: "irregularity",
    roles: ["clan_odbora"],
    choices: [
      {
        id: "E16-a",
        label: "Zapečati koverat pred biračem i traži njegov potpis na potvrdi",
        explanation:
          "Koverat se pečati pred biračem, a bez potpisane potvrde o pravu glasanja van biračkog mesta listić se ne ubacuje u kutiju.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["V06", "V09"],
        effects: { scores: { procedure: 4, documentation: 2 }, evidenceDelta: 1, addFlags: ["potvrda-potpisana"] },
      },
      {
        id: "E16-b",
        label: "Zapečati koverat u hodniku, potvrdu ćete popuniti u povratku",
        explanation:
          "Pečaćenje van vidokruga birača i naknadno popunjavanje potvrde ostavljaju listić bez proverljivog traga.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["V06", "V09"],
        effects: { scores: { procedure: -3, documentation: -2 }, addFlags: ["potvrda-nepotpisana"] },
      },
      {
        id: "E16-c",
        label: "Ostani u prostoriji dok birač popunjava listić da mu pomogneš ako zatreba",
        explanation:
          "Nakon objašnjenja postupka poverenici napuštaju prostoriju u kojoj birač popunjava listić; ostajanje narušava tajnost.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["V07"],
        effects: { scores: { secrecy: -4 } },
      },
    ],
  },
  {
    id: "E17",
    time: "12:45",
    phase: "glasanje",
    title: "Nepoznato lice kraj stola",
    description:
      "Muškarac u jakni bez ikakve oznake sedi na stolici pored člana odbora zaduženog za izvod i povremeno gleda u spisak.",
    severity: "proveri",
    riskBand: "irregularity",
    choices: [
      {
        id: "E17-a",
        label: "Proveri po kom osnovu je tu i udalji ga ako nema akreditaciju ni funkciju",
        explanation:
          "Zadržavanje lica koja nemaju prava ni dužnosti u vezi sa sprovođenjem izbora predstavlja narušavanje reda na biračkom mestu.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["N01"],
        effects: { scores: { procedure: 4, legalResponse: 2 }, evidenceDelta: 1 },
      },
      {
        id: "E17-b",
        label: "Pretpostavi da je posmatrač i ne diraj ga",
        explanation:
          "Akreditovani posmatrač ima pravo prisustva, ali to se utvrđuje uvidom u akreditaciju, ne pretpostavkom.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["N01"],
        effects: { scores: { procedure: -3 }, addFlags: ["neovlasceno-lice-ostalo"] },
      },
    ],
  },
  {
    id: "E18",
    time: "13:20",
    phase: "glasanje",
    title: "Posmatrač i telefon",
    description:
      "Akreditovani posmatrač druge organizacije stalno telefonira iz prostorije i diktira brojeve nekome sa druge strane.",
    severity: "nepravilnost",
    riskBand: "irregularity",
    choices: [
      {
        id: "E18-a",
        label: "Upozori ga na pravila reda i zatraži da telefonira izvan biračkog mesta",
        explanation:
          "Posmatrač mora poštovati pravila reda; birački odbor može udaljiti posmatrača koji koristi sredstva komunikacije i ometa rad.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["N03"],
        effects: { scores: { procedure: 3, legalResponse: 1 } },
      },
      {
        id: "E18-b",
        label: "Odmah ga udalji sa biračkog mesta bez upozorenja",
        explanation:
          "Udaljavanje je krajnja mera; prvo se upozorava, jer posmatranje je zakonom zaštićena funkcija.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["N02", "N03"],
        effects: { scores: { procedure: 1, legalResponse: -1 } },
      },
      {
        id: "E18-c",
        label: "Ne reaguj, posmatrač ionako sme sve",
        explanation:
          "Pravo posmatranja ne uključuje neovlašćeno javljanje podataka iz prostorije tokom glasanja.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["N03", "E03"],
        effects: { scores: { procedure: -2 } },
      },
    ],
  },
  {
    id: "E19",
    time: "14:13",
    phase: "identifikacija",
    title: "„Kod mog imena već postoji potpis“",
    description:
      "Birač koji je danas prvi put došao pokazuje na izvod: pored njegovog imena već stoji potpis. Tvrdi da nije glasao i da nikome nije davao dokumenta.",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    choices: [
      {
        id: "E19-a",
        label: "Zaustavi postupak, obavesti lokalnu izbornu komisiju i unesi ceo događaj u zapisnik",
        explanation:
          "Ovo je visokoprioritetna nepravilnost. Bez evidencije u zapisniku kasnija provera i pravni lek ostaju bez činjenične podloge.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["I07", "ZP02"],
        effects: {
          scores: { procedure: 4, voterRights: 3, documentation: 5, legalResponse: 3 },
          evidenceDelta: 2,
          addFlags: ["incident-evidentiran"],
        },
      },
      {
        id: "E19-b",
        label: "Zabeleži u svoju svesku i nastavi rad, u zapisnik ćeš uneti uveče ako bude vremena",
        explanation:
          "Lična beleška je bolja nego ništa, ali obaveza je da relevantna činjenica i primedba budu unete u zapisnik biračkog odbora.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["I07", "ZP02"],
        effects: { scores: { documentation: 1, voterRights: 1 }, evidenceDelta: 1, addFlags: ["incident-delimicno"] },
      },
      {
        id: "E19-c",
        label: "Reci mu da je verovatno zaboravio i pošalji ga kući",
        explanation:
          "Odbijanje bez provere i bez evidencije uskraćuje biraču pravo i briše trag o mogućoj zloupotrebi.",
        classification: "critical_error",
        outcome: "serious",
        ruleIds: ["I07"],
        effects: {
          scores: { voterRights: -5, documentation: -4, legalResponse: -3 },
          addFlags: ["incident-ignorisan"],
        },
      },
    ],
  },
  {
    id: "E20",
    time: "15:02",
    phase: "glasanje",
    title: "Fotografisanje listića",
    description: "Mladić iza paravana podiže telefon i fotografiše svoj popunjeni listić.",
    severity: "nepravilnost",
    riskBand: "irregularity",
    choices: [
      {
        id: "E20-a",
        label: "Upozori ga na pravila i evidentiraj događaj bez optuživanja",
        explanation:
          "Neovlašćeno fotografisanje na biračkom mestu je narušavanje reda, ali sama fotografija ne dokazuje da je glas kupljen.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["T09"],
        effects: { scores: { secrecy: 3, procedure: 2, documentation: 1 }, evidenceDelta: 1 },
      },
      {
        id: "E20-b",
        label: "Odmah ga optuži da prodaje glas i pozovi policiju",
        explanation:
          "Fotografija sama po sebi nije dokaz kupovine glasa; za to su potrebne dodatne činjenice o koristi ili pritisku.",
        classification: "wrong",
        outcome: "routine",
        ruleIds: ["T09", "KG01"],
        effects: { scores: { legalResponse: -2, procedure: -1 } },
      },
      {
        id: "E20-c",
        label: "Ignoriši, svako radi šta hoće sa svojim listićem",
        explanation:
          "Tajnost glasanja je javni interes, a ne samo privatno pravo birača; ponašanje se evidentira i upozorava.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["T09"],
        effects: { scores: { secrecy: -2 } },
      },
    ],
  },
  {
    id: "E21",
    time: "15:30",
    phase: "svaka",
    title: "Traži se fotografija kao dokaz",
    description:
      "Ispred biračkog mesta muškarac zaustavlja birače, obećava „nadoknadu za gorivo“ i traži da mu pokažu fotografiju popunjenog listića.",
    severity: "krivicno_delo",
    riskBand: "criminal",
    choices: [
      {
        id: "E21-a",
        label: "Zabeleži tačno vreme, opis i svedoke i prijavi policiji preko predsednika odbora",
        explanation:
          "Nuđenje koristi u zamenu za dokaz o načinu glasanja može predstavljati davanje i primanje mita u vezi sa glasanjem.",
        classification: "correct",
        outcome: "criminal",
        ruleIds: ["KG01", "T08"],
        effects: {
          scores: { legalResponse: 5, documentation: 4, secrecy: 2 },
          evidenceDelta: 2,
          addFlags: ["mito-prijavljeno"],
        },
      },
      {
        id: "E21-b",
        label: "Izađi i sam ga oteraj, bez beleške i bez obaveštavanja odbora",
        explanation:
          "Reakcija je razumljiva, ali bez evidencije i prijave nadležnima nema osnova za dalje postupanje.",
        classification: "suboptimal",
        outcome: "serious",
        ruleIds: ["KG01"],
        effects: { scores: { legalResponse: 1, documentation: -2 } },
      },
      {
        id: "E21-c",
        label: "To se dešava ispred, a ne unutar biračkog mesta — ne tiče te se",
        explanation:
          "Radnja se odnosi na glasanje na ovom biračkom mestu; propuštanje evidencije gubi jedini trag o mogućem krivičnom delu.",
        classification: "critical_error",
        outcome: "criminal",
        ruleIds: ["KG01"],
        effects: { scores: { legalResponse: -5, documentation: -3 }, addFlags: ["mito-neprijavljeno"] },
      },
    ],
  },
  {
    id: "E22",
    time: "16:38",
    phase: "identifikacija",
    title: "Spisak sa imenima",
    description:
      "Član odbora vodi na posebnom papiru dve kolone: u jednoj su crtice, u drugoj imena i prezimena onih koji još nisu izašli.",
    severity: "nepravilnost",
    riskBand: "irregularity",
    choices: [
      {
        id: "E22-a",
        label: "Traži da se kolona sa imenima ukloni, brojčana evidencija crticama može da ostane",
        explanation:
          "Brojčana evidencija izlaznosti crticama dostupna svim članovima je dozvoljena; spisak imena onih koji jesu ili nisu izašli nije.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["E01", "E02"],
        effects: { scores: { procedure: 4, legalResponse: 2, documentation: 1 }, evidenceDelta: 1 },
      },
      {
        id: "E22-b",
        label: "Zabrani svaku evidenciju, uključujući crtice",
        explanation:
          "Ovo je česta zabluda: zbirna brojčana evidencija izlaznosti je izričito dozvoljena.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["E01"],
        effects: { scores: { procedure: -1 } },
      },
      {
        id: "E22-c",
        label: "Pusti oba spiska, to je interna stvar člana odbora",
        explanation:
          "Pravljenje neslužbenih spiskova birača koji jesu ili nisu izašli zakon navodi kao narušavanje reda i osnovu za pritisak.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["E02"],
        effects: { scores: { procedure: -3, legalResponse: -2 }, addFlags: ["paralelni-spisak"] },
      },
    ],
  },
  {
    id: "E23",
    time: "17:15",
    phase: "identifikacija",
    title: "Telefonsko javljanje imena",
    description:
      "Iz ćoška prostorije čuje se: „Marković još nije izašao, Petrović jeste, pošalji nekoga po njega.“",
    severity: "nepravilnost",
    riskBand: "serious",
    choices: [
      {
        id: "E23-a",
        label: "Prekini razgovor, zatraži unos u zapisnik i obavesti predsednika odbora",
        explanation:
          "Neovlašćeno davanje obaveštenja o tome koja lica jesu ili nisu izašla zakon izričito navodi kao narušavanje reda.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["E03", "ZP02"],
        effects: { scores: { procedure: 4, documentation: 3, legalResponse: 3 }, evidenceDelta: 2 },
      },
      {
        id: "E23-b",
        label: "Nasmej se i ignoriši, tako je na svakom biračkom mestu",
        explanation:
          "Normalizacija ove prakse je upravo ono što omogućava pritisak na birače tokom izbornog dana.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["E03"],
        effects: { scores: { procedure: -3, legalResponse: -2 }, addFlags: ["javljanje-imena"] },
      },
    ],
  },
  {
    id: "E24",
    time: "18:00",
    phase: "glasanje",
    title: "Sugerisanje broja liste",
    description:
      "Član odbora, dok uručuje listić starijem biraču, tiho dodaje: „Vi ste za broj 3, je l' tako?“",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    choices: [
      {
        id: "E24-a",
        label: "Prekini ga odmah, traži unos u zapisnik i obavesti komisiju",
        explanation:
          "Niko na biračkom mestu ne sme sugerisati biraču za koga da glasa; kada to čini član odbora, težina je veća.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["T03", "ZP02"],
        effects: {
          scores: { secrecy: 4, voterRights: 3, documentation: 3, legalResponse: 3 },
          evidenceDelta: 2,
          addFlags: ["sugestija-prijavljena"],
        },
      },
      {
        id: "E24-b",
        label: "Nasamo mu skreni pažnju posle, da ne pravite scenu pred biračima",
        explanation:
          "Diskrecija ne pomaže biraču koji je već izložen sugestiji; radnja mora prestati odmah i biti evidentirana.",
        classification: "suboptimal",
        outcome: "serious",
        ruleIds: ["T03"],
        effects: { scores: { secrecy: 1, documentation: -1 } },
      },
      {
        id: "E24-c",
        label: "Ne mešaj se, stariji birači često i sami traže pomoć",
        explanation:
          "Pomoć pri popunjavanju je institut pomagača na zahtev birača, a ne sugerisanje izbora od strane odbora.",
        classification: "critical_error",
        outcome: "serious",
        ruleIds: ["T03", "T02"],
        effects: { scores: { secrecy: -5, voterRights: -3 }, addFlags: ["sugestija-tolerisana"] },
      },
    ],
  },
  {
    id: "E25",
    time: "18:40",
    phase: "svaka",
    title: "Pritisak preko posla",
    description:
      "Birateljka ti prilazi uplakana: poslovođa joj je poslao poruku da mora da se slika na biračkom mestu ili gubi smenu.",
    severity: "krivicno_delo",
    riskBand: "criminal",
    choices: [
      {
        id: "E25-a",
        label: "Objasni joj da niko ne sme da traži dokaz o glasanju i pomozi joj da sačuva poruku kao dokaz",
        explanation:
          "Prisiljavanje pretnjom da neko glasa ili ne glasa na određeni način predstavlja krivično delo povrede prava glasanja.",
        classification: "correct",
        outcome: "criminal",
        ruleIds: ["T11", "T10"],
        effects: {
          scores: { voterRights: 5, legalResponse: 4, documentation: 3, secrecy: 2 },
          evidenceDelta: 2,
          addFlags: ["pretnja-dokumentovana"],
        },
      },
      {
        id: "E25-b",
        label: "Reci joj da se ne brine i vrati je u red bez ikakve dalje radnje",
        explanation:
          "Umirivanje bez informacije o pravnom leku ostavlja birateljku pod istim pritiskom i briše trag o pretnji.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["T11"],
        effects: { scores: { voterRights: -2, legalResponse: -3 } },
      },
      {
        id: "E25-c",
        label: "Savetuj joj da se ipak slika, tako će izbeći probleme na poslu",
        explanation:
          "Savet da postupi po pretnji podržava krivično delo i istovremeno narušava tajnost njenog glasa.",
        classification: "critical_error",
        outcome: "criminal",
        ruleIds: ["T11", "T08"],
        effects: { scores: { voterRights: -6, secrecy: -4, legalResponse: -4 }, addFlags: ["pritisak-podrzan"] },
      },
    ],
  },
  {
    id: "E26",
    time: "19:20",
    phase: "glasanje",
    title: "Listić napušta prostoriju",
    description:
      "Primećuješ da birač, umesto da ubaci listić, savija ga i stavlja u unutrašnji džep, pa kreće ka izlazu.",
    severity: "krivicno_delo",
    riskBand: "criminal",
    choices: [
      {
        id: "E26-a",
        label: "Zaustavi iznošenje listića, zatraži unos u zapisnik i obavesti policiju preko predsednika",
        explanation:
          "Službeni glasački listić ne sme napustiti propisani tok glasanja; ovo je klasičan znak organizovane manipulacije poznate kao „bugarski voz“.",
        classification: "correct",
        outcome: "criminal",
        ruleIds: ["BV01", "ZP02"],
        effects: {
          scores: { procedure: 5, legalResponse: 5, documentation: 4 },
          evidenceDelta: 2,
          addFlags: ["listic-zadrzan"],
        },
      },
      {
        id: "E26-b",
        label: "Doviknu mu da vrati listić, ali ne evidentiraj ništa ako ga vrati",
        explanation:
          "Sprečavanje je važno, ali bez evidencije nestaje jedini trag o pokušaju iznošenja službenog listića.",
        classification: "suboptimal",
        outcome: "serious",
        ruleIds: ["BV01"],
        effects: { scores: { procedure: 2, documentation: -2 } },
      },
      {
        id: "E26-c",
        label: "Ne reaguj, verovatno je zaboravio da ga ubaci",
        explanation:
          "Neusaglašen broj izdatih i pronađenih listića kasnije se ne može objasniti, a računica zapisnika puca.",
        classification: "critical_error",
        outcome: "criminal",
        ruleIds: ["BV01", "AN02"],
        effects: { scores: { procedure: -5, counting: -3, legalResponse: -4 }, addFlags: ["listic-iznet"] },
      },
    ],
  },

  // ---------------------------------------------------------------- ZATVARANJE
  {
    id: "E27",
    time: "19:59",
    phase: "zatvaranje",
    title: "Red ispred vrata u 20:00",
    description:
      "Minut pre osam, ispred biračkog mesta stoji sedam ljudi. Jedan član odbora predlaže da se vrata zaključaju tačno u 20:00.",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    choices: [
      {
        id: "E27-a",
        label: "Popiši ko je u redu u 20:00 i omogući svima da glasaju",
        explanation:
          "Svi koji se u 20:00 nalaze na biračkom mestu ili neposredno ispred njega moraju dobiti mogućnost da glasaju.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["Z01"],
        effects: { scores: { voterRights: 5, procedure: 3, documentation: 2 }, evidenceDelta: 1 },
      },
      {
        id: "E27-b",
        label: "Zaključaj vrata u 20:00, zakon je zakon",
        explanation:
          "Zakon upravo štiti birače koji su stigli na vreme; njihovo odbijanje je teška povreda biračkog prava.",
        classification: "critical_error",
        outcome: "serious",
        ruleIds: ["Z01"],
        effects: { scores: { voterRights: -6, procedure: -3 }, addFlags: ["red-odbijen"] },
      },
    ],
  },
  {
    id: "E28",
    time: "20:12",
    phase: "zatvaranje",
    title: "Produženje zbog jutarnjeg kašnjenja",
    description:
      "Neko se seti da je biračko mesto ujutru otvoreno u 07:14 zbog problema sa kontrolnim listom.",
    severity: "proveri",
    riskBand: "routine",
    conditions: { requiresFlags: ["kasno-otvaranje"] },
    choices: [
      {
        id: "E28-a",
        label: "Produži glasanje za vreme kašnjenja i unesi tačno vreme u zapisnik",
        explanation:
          "Ako je otvaranje kasnilo ili je glasanje bilo prekinuto duže od sat vremena, vreme glasanja se produžava za odgovarajući period.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["Z02"],
        effects: { scores: { procedure: 4, voterRights: 3, documentation: 2 }, evidenceDelta: 1 },
      },
      {
        id: "E28-b",
        label: "Zatvori u 20:00, kašnjenje je bilo kratko",
        explanation: "Produženje nije stvar procene odbora; ono proizlazi iz činjenice da je otvaranje kasnilo.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["Z02"],
        effects: { scores: { procedure: -3, voterRights: -2 } },
      },
    ],
  },

  // ---------------------------------------------------------------- BROJANJE
  {
    id: "E29",
    time: "20:25",
    phase: "brojanje",
    title: "Redosled radnji pri brojanju",
    description:
      "Kutija je na stolu i svi su umorni. Predsednik predlaže: „Otvaramo kutiju pa ćemo usput prebrojati i sve ostalo.“",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    choices: [
      {
        id: "E29-a",
        label: "Prvo utvrdi broj birača po potpisima, pa neupotrebljene listiće, pa proveri pečat — tek onda kutija",
        explanation:
          "Redosled je propisan: broj birača koji su glasali, neupotrebljeni listići i stanje kutije utvrđuju se pre otvaranja.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["AN01", "AN02"],
        effects: { scores: { counting: 5, procedure: 3 }, addFlags: ["redosled-postovan"] },
      },
      {
        id: "E29-b",
        label: "Otvori kutiju odmah, brojevi će se ionako sabrati na kraju",
        explanation:
          "Ako se kutija otvori pre utvrđivanja broja birača, kasnija računica se više ne može nezavisno proveriti.",
        classification: "critical_error",
        outcome: "serious",
        ruleIds: ["AN01"],
        effects: { scores: { counting: -5, procedure: -3 }, addFlags: ["redosled-prekrsen"] },
      },
    ],
  },
  {
    id: "E30",
    time: "20:50",
    phase: "brojanje",
    title: "Kontrolni list u kutiji",
    description: "Kutija je otvorena. Traži se kontrolni list ubačen pre početka glasanja.",
    severity: "ponistavanje",
    riskBand: "annulment",
    choices: [
      {
        id: "E30-a",
        label: "Pažljivo pretraži sadržaj kutije i evidentiraj da je kontrolni list pronađen",
        explanation:
          "Nalaz kontrolnog lista se unosi u zapisnik; njegovo odsustvo je zakonski osnov za poništavanje glasanja na biračkom mestu.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["P09"],
        effects: { scores: { counting: 4, documentation: 3, procedure: 2 }, evidenceDelta: 1 },
      },
      {
        id: "E30-b",
        label: "Ako se ne nađe odmah, pređi na brojanje listića i ne pominji to u zapisniku",
        explanation:
          "Prećutkivanje odsustva kontrolnog lista skriva okolnost koju zakon izričito vezuje za poništavanje po službenoj dužnosti.",
        classification: "critical_error",
        outcome: "annulment",
        ruleIds: ["P09", "ZP01"],
        effects: { scores: { counting: -5, documentation: -5, legalResponse: -3 }, addFlags: ["kontrolni-list-precutan"] },
      },
    ],
  },
  {
    id: "E31",
    time: "21:10",
    phase: "brojanje",
    title: "Računica biračkog mesta",
    description:
      "Vreme je da se brojevi slože. Unesi podatke sa svog biračkog mesta i proveri da li računica prolazi kontrolu.",
    severity: "ponistavanje",
    riskBand: "annulment",
    counting: { R: 1000, U: 350, G: 642, B: 650, V: 634, N: 16, listVotes: [402, 232] },
    countingConclusionId: "E31-a",
    choices: [
      {
        id: "E31-a",
        label: "U kutiji je 8 listića više nego birača — unesi tačne brojeve i obavesti komisiju",
        explanation:
          "Kada je broj listića u kutiji veći od broja birača koji su glasali, nadležna izborna komisija poništava glasanje na tom biračkom mestu po službenoj dužnosti.",
        classification: "correct",
        outcome: "annulment",
        ruleIds: ["AN01"],
        effects: {
          scores: { counting: 6, documentation: 4, legalResponse: 4 },
          evidenceDelta: 2,
          addFlags: ["neslaganje-prijavljeno"],
        },
      },
      {
        id: "E31-b",
        label: "Prepravi broj birača na 650 da se brojevi slože",
        explanation:
          "Promena broja glasova ili listića radi „slaganja“ računice može predstavljati falsifikovanje rezultata glasanja.",
        classification: "critical_error",
        outcome: "criminal",
        ruleIds: ["FR01", "AN01"],
        effects: { scores: { counting: -8, legalResponse: -6, documentation: -5 }, addFlags: ["brojevi-prepravljeni"] },
      },
      {
        id: "E31-c",
        label: "Prebroj sve ponovo pre nego što bilo šta upišeš",
        explanation:
          "Ponovno prebrojavanje je ispravan prvi korak; ako se razlika potvrdi, unosi se tačno stanje i obaveštava komisija.",
        classification: "acceptable",
        outcome: "prevented",
        ruleIds: ["AN01"],
        effects: { scores: { counting: 4, procedure: 2 }, evidenceDelta: 1 },
      },
    ],
  },
  {
    id: "E32",
    time: "21:25",
    phase: "brojanje",
    title: "Šta razlika zapravo znači",
    description:
      "Kolega pita da li to znači da su rezultati „nemogući za utvrđivanje“ ili da se glasanje poništava.",
    severity: "info",
    riskBand: "routine",
    choices: [
      {
        id: "E32-a",
        label: "Objasni razliku: višak listića je razlog za poništavanje, a nemogućnost utvrđivanja je druga situacija",
        explanation:
          "Poništavanje po službenoj dužnosti i nemogućnost utvrđivanja rezultata su dve različite pravne situacije, iako obe mogu voditi ponovljenom glasanju.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["AN01", "NR01"],
        effects: { scores: { legalResponse: 4, counting: 2 } },
      },
      {
        id: "E32-b",
        label: "Reci da je svejedno, komisija će već presuditi",
        explanation:
          "Razlika je bitna jer određuje šta se tačno unosi u zapisnik i po kom osnovu komisija postupa.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["NR01"],
        effects: { scores: { legalResponse: -1 } },
      },
    ],
  },

  // ---------------------------------------------------------------- ZAPISNIK
  {
    id: "E33",
    time: "21:50",
    phase: "zapisnik",
    title: "Primedba u zapisnik",
    description:
      "Zapisnik se popunjava. Ti tražiš da se unese sve što je danas evidentirano oko spornog potpisa u izvodu.",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    conditions: { requiresFlags: ["incident-evidentiran"] },
    choices: [
      {
        id: "E33-a",
        label: "Insistiraj da tvoja primedba uđe u zapisnik doslovno, sa vremenom i imenima svedoka",
        explanation:
          "Zapisnik izričito sadrži i primedbe članova biračkog odbora; to je osnov za kasniji prigovor i zahtev za poništavanje.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["ZP02", "I07"],
        effects: {
          scores: { documentation: 6, legalResponse: 5 },
          evidenceDelta: 2,
          addFlags: ["primedba-uneta"],
        },
      },
      {
        id: "E33-b",
        label: "Prihvati skraćenu formulaciju predsednika „bilo je nejasnoća oko jednog potpisa“",
        explanation:
          "Uopštena formulacija bez vremena, radnje i svedoka teško može da posluži kao dokaz u postupku po prigovoru.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["ZP02"],
        effects: { scores: { documentation: 1, legalResponse: -1 } },
      },
    ],
  },
  {
    id: "E34",
    time: "21:50",
    phase: "zapisnik",
    title: "Zapisnik bez traga o incidentu",
    description:
      "Predsednik čita zapisnik: nigde nema pomena o spornom potpisu iz 14:13. Pita da li neko ima primedbu.",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    conditions: { forbidsFlags: ["incident-evidentiran"] },
    choices: [
      {
        id: "E34-a",
        label: "Zatraži da se incident unese sada, po sećanju, sa naznakom da nije zabeležen u trenutku događaja",
        explanation:
          "Naknadni unos je slabiji dokaz od evidencije u trenutku događaja, ali je i dalje bolji od potpuno praznog zapisnika.",
        classification: "acceptable",
        outcome: "prevented",
        ruleIds: ["ZP02", "I07"],
        effects: { scores: { documentation: 2, legalResponse: 2 }, evidenceDelta: 1, addFlags: ["primedba-naknadna"] },
      },
      {
        id: "E34-b",
        label: "Ćuti, nemaš zapisano vreme ni imena pa nema smisla otvarati temu",
        explanation:
          "Bez ijednog traga u zapisniku kasniji prigovor praktično ostaje bez činjenične podloge.",
        classification: "critical_error",
        outcome: "serious",
        ruleIds: ["ZP02"],
        effects: { scores: { documentation: -5, legalResponse: -4 }, addFlags: ["incident-nestao"] },
      },
    ],
  },
  {
    id: "E35",
    time: "22:05",
    phase: "zapisnik",
    title: "Potpisivanje zapisnika",
    description:
      "Zapisnik ti se gura na potpis, ali rubrike sa brojem važećih i nevažećih listića još nisu popunjene. „Popunićemo posle, ljudi čekaju.“",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    choices: [
      {
        id: "E35-a",
        label: "Ne potpisuj dok svi podaci nisu uneti i provereni",
        explanation:
          "Zapisnik mora sadržati sve propisane podatke pre potpisivanja; potpis na nepotpunom zapisniku prenosi odgovornost na tebe.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["ZP01"],
        effects: { scores: { documentation: 6, procedure: 3, legalResponse: 3 }, evidenceDelta: 1 },
      },
      {
        id: "E35-b",
        label: "Potpiši, kolege su korektne i sigurno će uneti tačne brojeve",
        explanation:
          "Nikada ne potpisuj zapisnik čiji relevantni podaci nisu uneti i provereni — kasnija izmena se pripisuje potpisnicima.",
        classification: "critical_error",
        outcome: "serious",
        ruleIds: ["ZP01", "FR01"],
        effects: { scores: { documentation: -6, legalResponse: -4 }, addFlags: ["prazan-zapisnik-potpisan"] },
      },
    ],
  },
  {
    id: "E36",
    time: "22:20",
    phase: "zapisnik",
    title: "Treći primerak na javni uvid",
    description: "Materijal se pakuje. Treći primerak zapisnika stoji u fascikli sa ostalim papirima.",
    severity: "nepravilnost",
    riskBand: "irregularity",
    choices: [
      {
        id: "E36-a",
        label: "Istakni treći primerak na biračkom mestu na javni uvid",
        explanation: "Treći primerak zapisnika ističe se na biračkom mestu na javni uvid — to je osnov javne kontrole rezultata.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["ZP03"],
        effects: { scores: { documentation: 4, procedure: 2, legalResponse: 2 }, evidenceDelta: 1 },
      },
      {
        id: "E36-b",
        label: "Spakuj sve i idi kući, kasno je i niko ionako ne gleda zapisnike",
        explanation:
          "Neisticanje trećeg primerka onemogućava biračima i posmatračima da uporede objavljeni rezultat sa onim što je prebrojano.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["ZP03", "ZP04"],
        effects: { scores: { documentation: -3, legalResponse: -2 }, addFlags: ["zapisnik-neistaknut"] },
      },
    ],
  },
  {
    id: "E37",
    time: "22:35",
    phase: "zapisnik",
    title: "Objavljeni broj se ne poklapa",
    description:
      "Dok pakujete materijal, posmatrač pokazuje fotografiju istaknutog zapisnika: broj važećih listića za jednu listu je za 40 veći od onoga što ste prebrojali.",
    severity: "krivicno_delo",
    riskBand: "criminal",
    choices: [
      {
        id: "E37-a",
        label: "Uporedi sopstvene beleške sa istaknutim zapisnikom i odmah prijavi neslaganje komisiji",
        explanation:
          "Promena broja glasova ili objavljivanje neistinitog rezultata može predstavljati falsifikovanje rezultata glasanja.",
        classification: "correct",
        outcome: "criminal",
        ruleIds: ["ZP04", "FR01"],
        effects: {
          scores: { documentation: 5, legalResponse: 6, counting: 3 },
          evidenceDelta: 2,
          addFlags: ["neslaganje-zapisnika-prijavljeno"],
        },
      },
      {
        id: "E37-b",
        label: "Pretpostavi da je greška u kucanju i pusti komisiju da to primeti",
        explanation:
          "Bez prijave neslaganja u trenutku kada je uočeno, kasnije je gotovo nemoguće dokazati šta je stvarno prebrojano.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["ZP04"],
        effects: { scores: { legalResponse: -4, documentation: -2 } },
      },
      {
        id: "E37-c",
        label: "Nemaš svoje brojeve pa ne možeš ništa da tvrdiš",
        explanation:
          "Ovo je posledica ranijeg propuštanja da se vodi sopstvena evidencija tokom brojanja.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["ZP04", "ZP01"],
        conditions: { forbidsFlags: ["neslaganje-prijavljeno"] },
        effects: { scores: { documentation: -3, legalResponse: -3 } },
      },
    ],
  },

  // ------------------------------------------------- REDOVAN TOK DANA (bez incidenta)
  {
    id: "R01",
    time: "07:22",
    phase: "identifikacija",
    title: "Prvih dvadesetak birača",
    description:
      "Red se kreće mirno. Sve teče po propisanom redosledu i nema nijedne sporne situacije, ali kolega pita treba li nešto da beležite dok je mirno.",
    severity: "dozvoljeno",
    riskBand: "routine",
    choices: [
      {
        id: "R01-a",
        label: "Vodite samo brojčanu evidenciju izlaznosti crticama, dostupnu svim članovima",
        explanation:
          "Članovi odbora zaduženi za birački spisak mogu na posebnom papiru voditi brojčanu evidenciju izlaznosti; podatak mora biti dostupan svim članovima.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["E01", "E04"],
        effects: { scores: { procedure: 3, documentation: 1 } },
      },
      {
        id: "R01-b",
        label: "Ne beležite ništa, izlaznost će se ionako videti iz izvoda",
        explanation:
          "Nije nepravilnost, ali zbirni podatak o izlaznosti tokom dana pomaže odboru da rano uoči nesklad u brojevima.",
        classification: "acceptable",
        outcome: "routine",
        ruleIds: ["E01"],
        effects: { scores: { procedure: 1 } },
      },
    ],
  },
  {
    id: "R02",
    time: "08:05",
    phase: "identifikacija",
    title: "Birač sa pasošem",
    description: "Birač nema ličnu kartu, ali daje važeći pasoš sa fotografijom.",
    severity: "dozvoljeno",
    riskBand: "routine",
    choices: [
      {
        id: "R02-a",
        label: "Prihvati ispravu, proveri podatke u izvodu i nastavi redovnu proceduru",
        explanation:
          "Identitet se utvrđuje ličnom kartom ili drugom odgovarajućom javnom ispravom sa fotografijom.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["I03"],
        effects: { scores: { procedure: 3, voterRights: 2 } },
      },
      {
        id: "R02-b",
        label: "Odbij, samo lična karta važi na biračkom mestu",
        explanation:
          "Odbijanje važeće javne isprave sa fotografijom neosnovano uskraćuje pravo glasa.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["I03"],
        effects: { scores: { voterRights: -3, procedure: -1 } },
      },
    ],
  },
  {
    id: "R03",
    time: "09:55",
    phase: "glasanje",
    title: "Zamena praznog paravana",
    description:
      "Jedan paravan se klima. Nema gužve, može se zameniti rezervnim iz materijala.",
    severity: "dozvoljeno",
    riskBand: "routine",
    choices: [
      {
        id: "R03-a",
        label: "Zameni paravan i proveri da ni novi ne otkriva popunjavanje listića",
        explanation: "Uslovi tajnosti se održavaju tokom celog dana, ne samo pri otvaranju biračkog mesta.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["P11"],
        effects: { scores: { procedure: 2, secrecy: 3 } },
      },
      {
        id: "R03-b",
        label: "Ostavi klimav paravan, do večeri će nekako izdržati",
        explanation: "Klimav paravan tokom dana lako prestane da štiti tajnost glasanja.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["P11"],
        effects: { scores: { secrecy: -2 } },
      },
    ],
  },
  {
    id: "R04",
    time: "11:20",
    phase: "identifikacija",
    title: "Dopuna glasačkih listića",
    description: "Kurir donosi dopunu listića koju ste tražili ujutru. Treba ih preuzeti i evidentirati.",
    severity: "dozvoljeno",
    riskBand: "routine",
    choices: [
      {
        id: "R04-a",
        label: "Prebroj dopunu pred svim članovima i unesi novi ukupan broj primljenih listića",
        explanation:
          "Broj primljenih listića ulazi u večernju računicu: neupotrebljeni plus listići iz kutije ne smeju premašiti primljene.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["AN02"],
        effects: { scores: { procedure: 3, counting: 3, documentation: 2 }, evidenceDelta: 1 },
      },
      {
        id: "R04-b",
        label: "Uzmi paket i stavi ga sa strane, prebrojaćete kasnije",
        explanation:
          "Nezabeležena dopuna je najčešći uzrok večernjeg neslaganja između primljenih i prebrojanih listića.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["AN02"],
        effects: { scores: { counting: -3, documentation: -2 }, addFlags: ["dopuna-neevidentirana"] },
      },
    ],
  },
  {
    id: "R05",
    time: "12:30",
    phase: "glasanje",
    title: "Smena za pauzu",
    description:
      "Dva člana odbora idu na pauzu. Predsednik pita da li može da ostane sam za stolom dvadeset minuta.",
    severity: "proveri",
    riskBand: "routine",
    choices: [
      {
        id: "R05-a",
        label: "Organizuj smenu tako da za stolom uvek ostane više članova različitih predlagača",
        explanation:
          "Uzajamna kontrola članova odbora je osnovna zaštita procedure; nijedna faza ne treba da ostane na jednoj osobi.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["N01"],
        effects: { scores: { procedure: 3, legalResponse: 1 } },
      },
      {
        id: "R05-b",
        label: "Nema problema, poznajemo se svi, neka ostane sam",
        explanation:
          "Poverenje među članovima ne zamenjuje uzajamnu kontrolu koja štiti i same članove odbora od kasnijih sumnji.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["N01"],
        effects: { scores: { procedure: -1 } },
      },
    ],
  },
  {
    id: "R06",
    time: "13:45",
    phase: "glasanje",
    title: "Birač greškom pocepa listić",
    description: "Birač je nespretno pocepao listić i traži novi.",
    severity: "proveri",
    riskBand: "routine",
    choices: [
      {
        id: "R06-a",
        label: "Postupi po uputstvu za oštećen listić i tačno evidentiraj šta je urađeno",
        explanation:
          "Svaki listić mora ostati u računici; oštećeni listići se evidentiraju da bi večernji zbir mogao da se zatvori.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["AN02", "ZP01"],
        effects: { scores: { procedure: 3, counting: 2, documentation: 2 }, evidenceDelta: 1 },
      },
      {
        id: "R06-b",
        label: "Daj mu novi listić, a pocepani baci u korpu",
        explanation:
          "Bacanjem listića gubi se trag i večernja računica više ne može da se zatvori bez neobjašnjive razlike.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["AN02"],
        effects: { scores: { counting: -4, documentation: -2 }, addFlags: ["listic-bacen"] },
      },
    ],
  },
  {
    id: "R07",
    time: "16:05",
    phase: "glasanje",
    title: "Novinari ispred ulaza",
    description:
      "Ekipa lokalne televizije snima ispred škole i traži da uđe i snimi „atmosferu na biračkom mestu“.",
    severity: "proveri",
    riskBand: "routine",
    choices: [
      {
        id: "R07-a",
        label: "Uputi ih da snimanje unutra zavisi od pravila reda i akreditacije, i ne prekidaj glasanje",
        explanation:
          "Neovlašćeno snimanje na biračkom mestu se tretira kao narušavanje reda; pristup zavisi od akreditacije i odluke odbora.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["N01", "T09"],
        effects: { scores: { procedure: 3, secrecy: 2 } },
      },
      {
        id: "R07-b",
        label: "Pusti ih da slobodno snimaju, javnost ima pravo da vidi",
        explanation:
          "Snimanje unutra bez osnova ugrožava tajnost glasanja birača koji su u tom trenutku iza paravana.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["T09", "N01"],
        effects: { scores: { secrecy: -3, procedure: -2 } },
      },
    ],
  },
  {
    id: "R08",
    time: "17:40",
    phase: "glasanje",
    title: "Provera pečata na kutiji",
    description: "Popodnevna zatišja su prilika da se proveri stanje kutije i pečata.",
    severity: "dozvoljeno",
    riskBand: "routine",
    choices: [
      {
        id: "R08-a",
        label: "Proveri pečat pred članovima odbora i zabeleži da je neoštećen",
        explanation:
          "Stanje kutije i pečata je jedan od podataka koji se utvrđuje pre otvaranja kutije na kraju dana.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["P10", "AN01"],
        effects: { scores: { procedure: 3, counting: 2, documentation: 1 }, evidenceDelta: 1 },
      },
      {
        id: "R08-b",
        label: "Nema potrebe, kutija je celo vreme pred nama",
        explanation:
          "Provera je jeftina, a njeno izostajanje kasnije otežava odbranu tvrdnje da je kutija bila ispravna ceo dan.",
        classification: "acceptable",
        outcome: "routine",
        ruleIds: ["P10"],
        effects: { scores: { procedure: 1 } },
      },
    ],
  },
  {
    id: "R09",
    time: "18:20",
    phase: "glasanje",
    title: "Mirno veče uz punu proceduru",
    description:
      "Poslednji sat pre zatvaranja teče bez incidenta. Kolega predlaže da se ubrza tako što se sprej preskoči poslednjim biračima.",
    severity: "nepravilnost",
    riskBand: "routine",
    choices: [
      {
        id: "R09-a",
        label: "Zadrži punu proceduru do poslednjeg birača",
        explanation:
          "UV sprej se nanosi svakom biraču; izuzeci na kraju dana ostavljaju rupu koja se kasnije ne može objasniti.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["I10"],
        effects: { scores: { procedure: 4 } },
      },
      {
        id: "R09-b",
        label: "Preskoči sprej, ionako niko više neće doći na drugo mesto",
        explanation: "Preskakanje obeležavanja je proceduralna nepravilnost i slabi zaštitu od ponovljenog glasanja.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["I10"],
        effects: { scores: { procedure: -3 }, addFlags: ["sprej-preskocen"] },
      },
    ],
  },
  {
    id: "R10",
    time: "20:40",
    phase: "brojanje",
    title: "Neupotrebljeni listići",
    description: "Pre otvaranja kutije treba prebrojati sve neupotrebljene listiće.",
    severity: "dozvoljeno",
    riskBand: "routine",
    choices: [
      {
        id: "R10-a",
        label: "Prebroj neupotrebljene listiće naglas, pred svim članovima, i upiši broj",
        explanation:
          "Neupotrebljeni listići se prebrojavaju pre otvaranja kutije i ulaze u kontrolu: neupotrebljeni plus listići iz kutije ne smeju premašiti primljene.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["AN02"],
        effects: { scores: { counting: 4, procedure: 2, documentation: 2 }, evidenceDelta: 1 },
      },
      {
        id: "R10-b",
        label: "Proceni broj po debljini svežnja da se ubrza",
        explanation:
          "Procena umesto prebrojavanja garantuje da se večernja računica neće zatvoriti tačno.",
        classification: "critical_error",
        outcome: "serious",
        ruleIds: ["AN02"],
        effects: { scores: { counting: -5, documentation: -3 } },
      },
    ],
  },
  {
    id: "R11",
    time: "21:00",
    phase: "brojanje",
    title: "Razvrstavanje na važeće i nevažeće",
    description:
      "Listići se razvrstavaju. Oko dva listića postoji rasprava da li je volja birača jasna.",
    severity: "proveri",
    riskBand: "routine",
    choices: [
      {
        id: "R11-a",
        label: "Odluči u punom sastavu odbora, pred svima, i zabeleži sporne slučajeve",
        explanation:
          "Razvrstavanje mora biti vidljivo svim članovima i posmatračima; sporni listići se evidentiraju u zapisniku.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["ZP01", "N02"],
        effects: { scores: { counting: 4, documentation: 3, procedure: 2 }, evidenceDelta: 1 },
      },
      {
        id: "R11-b",
        label: "Neka predsednik sam odluči da se ne gubi vreme",
        explanation:
          "Samostalno odlučivanje bez mogućnosti kontrole ostalih članova je klasična zamerka na rad odbora.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["ZP01"],
        effects: { scores: { counting: -3, procedure: -2 } },
      },
    ],
  },
  {
    id: "R12",
    time: "22:45",
    phase: "zapisnik",
    title: "Predaja materijala",
    description: "Materijal je spakovan. Ostaje predaja nadležnoj izbornoj komisiji.",
    severity: "dozvoljeno",
    riskBand: "routine",
    choices: [
      {
        id: "R12-a",
        label: "Predaj materijal u propisanom sastavu i zadrži svoj primerak zapisnika",
        explanation:
          "Primerak zapisnika je jedini pouzdan dokaz onoga što je odbor stvarno utvrdio te večeri.",
        classification: "correct",
        outcome: "routine",
        ruleIds: ["ZP03", "ZP04"],
        effects: { scores: { documentation: 4, procedure: 3 }, evidenceDelta: 1 },
      },
      {
        id: "R12-b",
        label: "Predaj sve, uključujući i svoj primerak, i idi kući",
        explanation:
          "Bez sopstvenog primerka kasnije poređenje sa objavljenim rezultatom praktično nije moguće.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["ZP04"],
        effects: { scores: { documentation: -2 } },
      },
    ],
  },

  // ---------------------------------------------------------------- PUT BIRAČA
  {
    id: "B01",
    time: "08:40",
    phase: "identifikacija",
    title: "Dolaziš da glasaš",
    description:
      "Prilaziš stolu sa ličnom kartom. Član odbora te ne provera UV lampom i odmah traži da se potpišeš, pa ti gura listić.",
    severity: "nepravilnost",
    riskBand: "irregularity",
    roles: ["birac"],
    choices: [
      {
        id: "B01-a",
        label: "Ljubazno pitaj da li je preskočena UV provera i sačekaj punu proceduru",
        explanation:
          "Kao birač imaš pravo da očekuješ propisanu proceduru: UV lampa, identitet, izvod, potpis, sprej, pa jedan listić.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["I01", "I08"],
        effects: { scores: { procedure: 4, voterRights: 2 }, evidenceDelta: 1 },
      },
      {
        id: "B01-b",
        label: "Uzmi listić i idi da glasaš, nije tvoj posao da ispravljaš odbor",
        explanation:
          "Razumljivo je, ali propuštena UV provera slabi zaštitu od višestrukog glasanja na tvom biračkom mestu.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["I01"],
        effects: { scores: { procedure: -1 } },
      },
    ],
  },
  {
    id: "B02",
    time: "08:47",
    phase: "glasanje",
    title: "Neko stoji uz tvoj paravan",
    description:
      "Dok popunjavaš listić, primećuješ da nepoznat čovek stoji tik uz paravan i gleda u tvoje ruke.",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    roles: ["birac"],
    choices: [
      {
        id: "B02-a",
        label: "Prekini popunjavanje i zatraži od odbora da lice odmakne od paravana",
        explanation:
          "Niko ne sme prilaziti paravanu dok birač glasa; tajnost tvog glasa je zakonom zaštićena.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["T05", "P11"],
        effects: { scores: { secrecy: 5, voterRights: 3 }, evidenceDelta: 1 },
      },
      {
        id: "B02-b",
        label: "Pokrij listić rukom i požuri da završiš",
        explanation:
          "Snalaženje ne rešava problem: raspored i red na biračkom mestu su obaveza odbora, a ne tvoja.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["T05"],
        effects: { scores: { secrecy: -2 } },
      },
      {
        id: "B02-c",
        label: "Ne reaguj, verovatno samo čeka svoj red",
        explanation:
          "Posmatranje popunjavanja listića je povreda tajnosti glasanja bez obzira na nameru osobe koja stoji uz paravan.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["T05"],
        effects: { scores: { secrecy: -4 } },
      },
    ],
  },
  {
    id: "B03",
    time: "14:13",
    phase: "identifikacija",
    title: "Tvoj potpis je već tu",
    description:
      "Vraćaš se na biračko mesto jer si zaboravio ličnu kartu ujutru. Sada vidiš da pored tvog imena u izvodu već stoji potpis.",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    roles: ["birac"],
    choices: [
      {
        id: "B03-a",
        label: "Zatraži da se to odmah unese u zapisnik i zapiši vreme, imena prisutnih i broj biračkog mesta",
        explanation:
          "Za kasniji zahtev za poništavanje glasanja potrebni su tačno biračko mesto, vreme, opis radnje i dokazi.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["I07", "ZP02"],
        effects: {
          scores: { voterRights: 5, documentation: 5, legalResponse: 4 },
          evidenceDelta: 2,
          addFlags: ["birac-evidentirao"],
        },
      },
      {
        id: "B03-b",
        label: "Napravi scenu i optuži prisutne za krađu glasova",
        explanation:
          "Postojanje potpisa treba proveriti i evidentirati; optužba bez činjenica otežava kasniji postupak i može dovesti do udaljavanja sa biračkog mesta.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["I07"],
        effects: { scores: { legalResponse: -3, documentation: -1 } },
      },
      {
        id: "B03-c",
        label: "Odustani i idi kući, ionako ti niko neće verovati",
        explanation:
          "Birač u roku od 72 časa od zatvaranja biračkog mesta može tražiti poništavanje glasanja ako mu je povređeno biračko pravo — ali samo ako postoji trag o događaju.",
        classification: "critical_error",
        outcome: "serious",
        ruleIds: ["I07"],
        effects: { scores: { voterRights: -5, documentation: -4, legalResponse: -4 } },
      },
    ],
  },
  {
    id: "B04",
    time: "15:30",
    phase: "svaka",
    title: "Ponuda ispred biračkog mesta",
    description:
      "Ispred škole ti prilazi muškarac: „Slikaj listić, dobićeš tri hiljade za gorivo.“",
    severity: "krivicno_delo",
    riskBand: "criminal",
    roles: ["birac"],
    choices: [
      {
        id: "B04-a",
        label: "Odbij, zapamti opis i vreme i prijavi policiji ili tužilaštvu",
        explanation:
          "I nuđenje i primanje koristi u zameni za glasanje mogu predstavljati krivično delo davanja i primanja mita u vezi sa glasanjem.",
        classification: "correct",
        outcome: "criminal",
        ruleIds: ["KG01", "T08"],
        effects: {
          scores: { legalResponse: 6, documentation: 4, secrecy: 3 },
          evidenceDelta: 2,
          addFlags: ["birac-prijavio-mito"],
        },
      },
      {
        id: "B04-b",
        label: "Odbij i produži dalje bez ijedne beleške",
        explanation: "Odbijanje je ispravno, ali bez beleške i prijave ponuda ostaje bez posledica za onoga ko je nudi.",
        classification: "acceptable",
        outcome: "routine",
        ruleIds: ["KG01"],
        effects: { scores: { legalResponse: 2 } },
      },
      {
        id: "B04-c",
        label: "Prihvati, ionako si već odlučio za koga glasaš",
        explanation:
          "Primanje koristi u zamenu za glasanje je kažnjivo isto kao i nuđenje, bez obzira na tvoju stvarnu političku odluku.",
        classification: "critical_error",
        outcome: "criminal",
        ruleIds: ["KG01"],
        effects: { scores: { legalResponse: -6, secrecy: -4 }, addFlags: ["birac-primio-korist"] },
      },
    ],
  },
  {
    id: "B05",
    time: "19:58",
    phase: "zatvaranje",
    title: "Stigao si u 19:58",
    description:
      "Dolaziš dva minuta pre zatvaranja i staješ u red. U 20:00 član odbora kaže da se vrata zatvaraju i da niko više ne glasa.",
    severity: "teska_nepravilnost",
    riskBand: "serious",
    roles: ["birac"],
    choices: [
      {
        id: "B05-a",
        label: "Ostani u redu i mirno objasni da imaš pravo da glasaš jer si stigao pre 20:00",
        explanation:
          "Svi koji se u 20:00 nalaze na biračkom mestu ili neposredno ispred njega u redu moraju dobiti mogućnost da glasaju.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["Z01"],
        effects: { scores: { voterRights: 5, legalResponse: 3 }, evidenceDelta: 1 },
      },
      {
        id: "B05-b",
        label: "Idi kući, zakasnio si i nema smisla raspravljati",
        explanation:
          "Pravo je bilo na tvojoj strani; odustajanjem gubiš glas i mogućnost da tražiš zaštitu u roku od 72 časa.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["Z01"],
        effects: { scores: { voterRights: -4, legalResponse: -2 } },
      },
    ],
  },
  {
    id: "B06",
    time: "22:30",
    phase: "zapisnik",
    title: "Posle zatvaranja",
    description:
      "Rezultati su prebrojani. Razmišljaš šta možeš da uradiš povodom potpisa koji si zatekao pored svog imena.",
    severity: "info",
    riskBand: "routine",
    roles: ["birac"],
    choices: [
      {
        id: "B06-a",
        label: "Pripremi zahtev za poništavanje glasanja i predaj ga u roku od 72 časa",
        explanation:
          "Birač može u roku od 72 časa od zatvaranja biračkog mesta zahtevati poništavanje glasanja na mestu na kojem je upisan, ako mu je povređeno biračko pravo.",
        classification: "correct",
        outcome: "prevented",
        ruleIds: ["I07"],
        effects: { scores: { legalResponse: 6, documentation: 4 }, evidenceDelta: 1 },
      },
      {
        id: "B06-b",
        label: "Objavi sve na društvenim mrežama i čekaj reakciju",
        explanation:
          "Javna objava ne pokreće postupak; rok od 72 časa teče bez obzira na to koliko je objava viđena.",
        classification: "suboptimal",
        outcome: "routine",
        ruleIds: ["I07"],
        effects: { scores: { legalResponse: -1 } },
      },
      {
        id: "B06-c",
        label: "Ne radi ništa, komisija će sama primetiti ako nešto nije u redu",
        explanation: "Bez podnetog zahteva u roku, konkretna povreda tvog biračkog prava ostaje bez ispitivanja.",
        classification: "wrong",
        outcome: "serious",
        ruleIds: ["I07"],
        effects: { scores: { legalResponse: -4 } },
      },
    ],
  },
];

/** Uloge kojima je događaj dostupan kada autor nije eksplicitno naveo drugačije. */
const DEFAULT_EVENT_ROLES: SimulationEvent["roles"] = ["clan_odbora", "posmatrac"];

export const simulationEvents: SimulationEvent[] = authoredEvents
  .map((event) => ({ ...event, roles: event.roles ?? DEFAULT_EVENT_ROLES }))
  .sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));

export const SIMULATOR_EVENT_COUNT = simulationEvents.length;
export const SIMULATOR_CHOICE_COUNT = simulationEvents.reduce((sum, event) => sum + event.choices.length, 0);

export const SIMULATOR_RISK_DISTRIBUTION = simulationEvents.reduce(
  (distribution, event) => ({ ...distribution, [event.riskBand]: (distribution[event.riskBand] ?? 0) + 1 }),
  {} as Record<SimulationRiskBand, number>,
);

/** Udeo pojedinačnog risk band-a u ukupnom danu, zaokružen na ceo procenat. */
export const SIMULATOR_RISK_SHARE = Object.fromEntries(
  Object.entries(SIMULATOR_RISK_DISTRIBUTION).map(([band, count]) => [
    band,
    Math.round((count / SIMULATOR_EVENT_COUNT) * 100),
  ]),
) as Record<SimulationRiskBand, number>;
