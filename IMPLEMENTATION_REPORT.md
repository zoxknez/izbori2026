# Implementation Report

## Faza 0 - test i tooling temelj

Status: završeno 5. septembra 2026.

Urađeno:

- uveden Vitest za unit testove;
- uveden Playwright za browser smoke testove;
- dodat eksplicitni `npm run typecheck`;
- postojeći test generatora hronologije migriran sa Node test runner-a na Vitest;
- dodat smoke test za javne rute, validator i generator incidenta.
- test konfiguracija koristi Vitest 5 i Playwright 1.63 uz Node 22 tipove.

Exit kriterijum je ispunjen: lint, typecheck, unit testovi i Playwright smoke test protiv `next dev`
prolaze bez grešaka.

Napomena o zavisnostima: `npm audit --omit=dev` je čist. Puni audit prijavljuje četiri umerena
nalaza u razvojnom lancu `drizzle-kit`/zastareli `esbuild`; `npm audit fix --force` bi uveo breaking
downgrade, pa je zamena tog migracionog toolchain-a ostavljena za tehničku hardening stavku.

## Faza 1 - zajednički domen i formalizacija pravila

Status: **završeno**.

Urađeno:

- uvedeni kanonski tipovi za faze, status objave i pravni review;
- uveden Zod domen model sa proverama jedinstvenih ID/slug vrednosti i invariantom da je automatsko poništavanje izvedeno iz `severity === "ponistavanje"`;
- `isAutomaticAnnulment` je PostgreSQL generated column, a seed više ne može da ga upisuje kao nezavisnu vrednost;
- izdvojen čist `validateCounting` engine sa osam testiranih scenarija, uključujući razliku između računskog manjka i zakonskog viška;
- dodat DB model `decision_trees`/`decision_nodes`, tri seedovana stabla i evaluator bez cikličnih putanja;
- `Vidim problem` sada učitava stabla iz baze i prikazuje formalni interaktivni vodič, uz postojeći eksplorator kao detaljni fallback;
- prošireni `rules` i postojeći `sources` model bez pravljenja duplikata `legal_sources` tabele; source `type` je usklađen sa planiranim `law/bylaw/rik/court/odihr/observer_report/other` modelom;
- dodat je formalni dependency graph sa source→rule, source→training/simulation i source→decision-tree granama, kao i stale propagation obračun;
- uvedene su centralizovane Zod šeme u `src/schemas/*`, sa re-exportom za postojeće domain/offline potrošače;
- uvedena prva Drizzle migracija i primenjena na Neon bazu, pa je dataset ponovo seedovan: 66 pravila, 8 krivičnih članova, 8 izvora i 3 stabla odluka;
- UI, seed, snapshot i baza sada koriste samo pluralne `phases`; legacy kolona `rules.phase` uklonjena je migracijom `0006_remove-legacy-phase.sql`.

Provere: domain invariant testovi, `validateCounting`, decision-tree evaluator, dependency graph i production build prolaze. Dodat je `domain:guards` build gate koji odbija sirovi severity render u JSX-u.

## Faza 2 - dataset versioning i offline temelj

Status: **završeno za DB-backed snapshot/offline temelj**.

Urađeno:

- uvedene `dataset_versions` i `dataset_files` tabele sa immutable payload/hash/size manifestom;
- `dataset-validator` koristi Zod, SHA-256 i cross-reference provere za pravila, izvore i grananje odluka;
- `scripts/snapshot-dataset.ts` pravi aktivni server snapshot direktno iz Neon tabela;
- API rute `/api/offline-dataset/current` i `/api/offline-dataset/[version]` vraćaju snapshot uz odgovarajuće cache politike;
- `scripts/freeze-bootstrap.ts` pravi build-time fallback u `public/offline-data/bootstrap/`, bez proglašavanja fallbacka aktivnim datasetom;
- uveden IndexedDB sloj sa `datasetMeta` pointerom i odvojenim store-ovima za incidente, trening, znanje, simulacije i preference;
- `dataset-manager` preuzima, validira i tek potom atomarno aktivira novu verziju;
- Neon migriran i snapshotovan: aktivna verzija sadrži 66 pravila, 8 izvora i 3 decision tree-a.
- dodata DB-level parcijalna unique zaštita da u svakom trenutku postoji najviše jedan `active` dataset; offline downloader proverava i top-level manifest, verziju i usklađenost svih snapshot fajlova pre activation-a.

Provere: typecheck, ESLint, Vitest i production build prolaze; testiran je i rollback pointera kada
preuzimanje zakaže posle prvog fajla. Dataset snapshot trenutno sadrži 66 pravila, 8 izvora, 3 stabla,
193 training reference-a i 136 simulation reference-a.

## Faza 3 - trening engine

Status: **engine, coverage, vežba i ispit implementirani; ručna pravna redakcija pitanja je otvorena**.

Urađeno:

- uvedeni tipovi za trening pitanje, izbor, odgovor i knowledge state;
- coverage prag je centralizovan po severity-ju: normal 2, teška nepravilnost 3, krivično delo 4, poništavanje 4 pitanja po pravilu;
- generator trenutno proizvodi 193 pitanja za svih 66 pravila, koristi sadržajno različite scenarije zasnovane na akcijama/dokazima/efektima i isti rule/source reference format za dataset snapshot;
- uvedeni mastery, confidence, spaced-repetition intervali, due/weakness weighting i exam score breakdown;
- dodat `/trening/kviz` sa klasifikacionim mit/činjenica pitanjima, režimom vežbe (12) i ispita (20), mastery dashboard-om i breakdown-om po težini;
- progres i knowledge state se čuvaju u IndexedDB `trainingProgress` store-u.

Provere: coverage, mastery, selection i exam scoring imaju unit testove; typecheck, ESLint, Vitest i build coverage gate prolaze. Preostaje samo ručna legal/content redakcija promptova i objašnjenja.

## Faza 4 - simulator biračkog dana (početni milestone)

Status: **osnovni engine milestone; kasnija nadogradnja sadržaja i 2D sveta je opisana niže**.

Napomena: brojke od 30 događaja i 80 odluka u ovom istorijskom odeljku odnose se na početnu verziju
pre nadogradnje simulatora od 7. septembra 2026. Aktuelni sadržaj ima 55 događaja i 136 odluka.

Urađeno:

- uvedeni `SimulationEvent`, `SimulationChoice`, `SimulationCondition`, efekti i reducer-like engine;
- seedovan tok sa 30 događaja i tačno 80 odluka, kroz sve faze izbornog dana, sa rule referencama za simulator dataset;
- uslovi i efekti kontrolišu flagove, score, evidence i fazne prelaze; nedostupne odluke se odbijaju server-independent čistom funkcijom;
- Counting Mode koristi direktno isti `validateCounting()` engine kao `/validator`, bez dupliranja matematike;
- dodat `/simulator/biracki-dan` i čuvanje istorije u IndexedDB `simulationHistory` store-u;
- unit testovi pokrivaju broj događaja/odluka, efekte, scoring, prerequisites i integraciju sa counting validatorom.

Provere uključuju randomizovani izbor samo među neposećenim događajima koji zadovoljavaju condition-e,
eksplicitnu 50/25/15/7/3 raspodelu rizika i kompletan 30-event E2E tok. Detaljniji analitički breakdown
rezultata ostaje opciono unapređenje.

## Faza 5 - admin dependency/versioning/auth layer

Status: **auth, RBAC, content editor, dependency dashboard i publish workflow implementirani**.

Urađeno:

- Auth.js Credentials provider sa JWT sesijom i bcrypt proverom lozinke;
- `admin_users` sa ulogama `SUPER_ADMIN`, `LEGAL_EDITOR`, `CONTENT_EDITOR`, `REVIEWER`;
- `src/proxy.ts` radi samo optimistički redirect, dok publish route ponovo proverava sesiju i RBAC;
- svaki admin prikaz i API mutacija dodatno razrešava `session.user.id` u aktivan red `admin_users`, pa deaktivacija naloga ili promena uloge odmah poništava staru JWT sesiju;
- `/api/admin/publish` validira isti `dataset-validator`, upisuje novu dataset verziju/fajl i append-only audit zapis u jednoj Neon batch transakciji; DB-level partial unique index sprečava konkurentne publish pozive da ostave više aktivnih verzija;
- ID kolone za admin korisnike, audit actor reference i dataset version reference podržavaju UUID identifikatore bez truncation rizika (`varchar(64)`), potvrđeno stvarnim authenticated fixture testom;
- `/admin/rules` i `PATCH /api/admin/rules/[id]` omogućavaju RBAC-controlled content/status izmene uz pre/post audit zapis; `/admin` prikazuje source dependency graph i publish kontrolu;
- `/admin/login` i osnovna `/admin` kontrolna tabla; nema self-registration, a `scripts/seed-admin.ts` zahteva eksplicitne env vrednosti;
- `AUTH_SECRET` je dodat kao sensitive production env varijabla na Vercelu.

Urađen je i diff/impact modal za pravila, coverage dashboard zasnovan na generatoru, DB-backed editor izvora sa verzijom, periodom važenja,
supersession statusom i stvarnom stale-propagacijom kroz zavisna pravila i decision-tree grane. Napredniji
editor pojedinačnih decision-tree čvorova ostaje opciono proširenje; metapodaci/statusi stabala i audit pregled
su dostupni kroz DB-backed admin rute, a osnovni rule/source/tree editor, dependency graph i transakcioni snapshot
publish su završeni.

## Faza 6 - service worker i PWA install sloj

Status: **završeno za osnovni PWA/update/storage scope**.

Urađeno:

- sproveden bundler spike; zbog Next.js 16/Turbopack kombinacije izabran je mali transparentni statički `public/sw.js`, bez webpack workaround-a;
- precache app shell, stale-while-revalidate navigacioni shell, offline fallback ruta i odvojeni `legal-data-v1` cache za immutable dataset odgovore;
- API dataset se proverava kroz hash/schema/cross-reference pre IndexedDB activation-a;
- lifecycle politika eksplicitno testira `register: false` i `reloadOnOnline: false`, a UI ima offline indikator;
- shell i SW imaju Playwright smoke proveru.

Implementirani su update prompt sa korisničkim aktiviranjem, zaštita od reload-a tokom otvorenog drafta, IndexedDB draft flagovi, IndexedDB migracija sačuvanih incidenata, MiniSearch globalna pretraga i storage-management panel. Serwist ostaje svesno izostavljen posle dokumentovanog Turbopack spike-a.

## Faza 7 - integracija i E2E hardening

Status: **završeno**.

Urađeno:

- dodat cross-module Playwright tok: validator demo → trening učitavanje → simulator odluka;
- dodate accessibility smoke provere za jedan `h1`, `main` landmark i missing image alt na javnim rutama;
- E2E sada pokriva javne rute, offline API, SW/offline fallback, training practice/exam sa breakdown-om i IndexedDB stanjem, simulator tokove kroz uloge i režime, indeksiranu globalnu pretragu, admin RBAC guard za pravila/izvore/publish i incident draft kroz online/offline prelaz; dodat je i browser performance budget;
- authenticated Admin publish → dataset → client update tok je izvršen sa stvarnim admin nalogom na kratkotrajnom Neon branch-u: login, publish nove verzije, `/api/offline-dataset/current`, download, hash/schema/cross-reference validacija i IndexedDB activation su prošli; branch i test nalog su obrisani posle testa, production branch nije menjan;
- production build i deployment se proveravaju posle svake veće faze.

Implementacioni exit kriterijum je ispunjen. `tests/e2e/admin-publish.spec.ts` se u standardnom
lokalnom run-u preskače kada nema izolovanih fixture kredencijala, ali je isti tok izvršen i potvrđen
na privremenom Neon branch-u. Produkcioni admin nalog nije kreiran bez korisničkih kredencijala.
Ne postoji self-registration. Ručna pravna redakcija generisanih trening objašnjenja ostaje domen-
proces za pravnog reviewera, a ne automatizovana zamena za pravnu proveru.

## Content/legal QA - završena korekcija kritičnih formulacija

Primarni izvori su ponovo provereni 6. septembra 2026. RIK-ov važeći tekst Zakona o izboru narodnih
poslanika potvrđuje tok iz čl. 89, 91-98, 102, 104-106 i razliku između nemogućnosti utvrđivanja
rezultata (čl. 115) i poništavanja po službenoj dužnosti (čl. 116). Zakon o lokalnim izborima i
Zakon o izboru predsednika Republike upućuju na primenu pravila Zakona o izboru narodnih poslanika
za pitanja koja posebno ne uređuju. Krivični zakonik je proveren za čl. 155-161.

Korigovano je sledeće:

- javni UI više ne predstavlja poništavanje kao trenutnu automatsku radnju odbora; jasno navodi da
  nadležna izborna komisija donosi odluku po službenoj dužnosti;
- uklonjeni su saveti o naknadnom dopisivanju potpisa/podataka i uvedeno je razlikovanje radnje pre
  pečaćenja od evidentiranja propusta nakon početka glasanja;
- uklonjen je savet da se lice fizički zadržava; sada se naglašavaju bezbednost, predsednik odbora
  i policija kada okolnosti to zahtevaju;
- uklonjena je neprecizna kvalifikacija propagande kao automatskog prekršaja i dodate su bezbedne
  operativne radnje za kritična krivičnopravna pravila.
- migracija `0010_content-legal-hardening.sql` je uslovno uskladila DB-backed pravila sa ovim
  korekcijama i ostavila append-only audit trag; aktivni offline dataset je zatim obnovljen kao
  `2026.09.06-legal-hardening-52693e2`;
- detalj pravila (`/pravila/[slug]`) prebačen je na dinamičko DB čitanje, jer pravni sadržaj ne sme
  ostati iza sat vremena ISR keša nakon Admin publish/source promene.

Ovo je content hardening, ne zamena za potpis pravnog reviewera. RIK-ova stranica sa zakonima i
podzakonskim aktima ostaje kanonski ulaz za nove izmene; supersession izvora mora pokrenuti stale
workflow i novi validirani publish.


## Nadogradnja simulatora i treninga (7. septembar 2026)

Povod: dubinska analiza je pokazala da su Faza 3 i Faza 4 imale ispravan engine, ali šablonski
sadržaj — 30 „događaja" sa identičnim tekstom odluka, pitanja generisana iz četiri fiksne matrice,
nijedna stvarna posledica i nijedan misconception mehanizam.

### Simulator biračkog dana

- Sadržaj je prepisan kao autorski tok: **55 događaja i 136 odluka**, svaki sa satnicom
  (06:15–22:45), sopstvenim tekstom situacije i posebnim obrazloženjem po odluci.
- Raspodela rizika je sada realna: 33% rutina, 24% proceduralna nepravilnost, 27% ozbiljno,
  9% moguće krivično delo, 7% osnov za poništavanje. Ranije je rutina bila 14%, što je učilo
  korisnika da je svaka situacija krađa.
- Odluke su klasifikovane u pet nivoa (`correct` 56, `acceptable` 7, `suboptimal` 21, `wrong` 32,
  `critical_error` 20) umesto ranijeg binarnog modela.
- Uvedene su **stvarne posledice**: odluka o spornom potpisu u 14:13 postavlja flag koji određuje
  koji se događaj zapisnika uveče uopšte pojavljuje (`E33` naspram `E34`), a jutarnje kašnjenje
  otvara večernje pitanje o produženju glasanja.
- Uloge su odvojeni tokovi: član odbora 49 događaja, posmatrač 48, birač 6 događaja pisanih iz
  perspektive prava glasa. Uz to su dodati izbor vrste izbora i tri režima (vođeni, nasumični,
  teški sa duplim kaznama).
- Skor se meri po **šest kategorija** (procedura, tajnost, prava birača, dokumentovanje, brojanje,
  pravna reakcija) sa maksimumom izvedenim iz stvarno dostupnih odluka, pa procenat ima značenje.
- Debrief daje narativni rezime, listu kritičnih grešaka, pravila za ponavljanje i dugme
  „Ponovi samo moje greške" koje pokreće skraćeni tok samo kroz promašene događaje.
- Counting Mode u 21:10 prikazuje brojeve biračkog mesta i pušta ih kroz isti `validateCounting()`
  koji koristi javni `/validator` — bez druge implementacije matematike.
- Stanje se čuva u IndexedDB posle svake odluke, sa ponudom „Nastavi dan" pri povratku.

### Trening

- Uvedena je **banka autorskih pitanja** (27 pitanja) koja ima prednost nad generisanim; generator
  i dalje popunjava coverage prag (ukupno 193 pitanja za 66 pravila).
- Tipovi pitanja prošireni sa dva na šest u upotrebi: `sequence` (sa dugmadima gore/dole radi
  pristupačnosti), `multi_choice`, `true_false`, `numeric`, `classification`, `scenario`.
- Implementiran je **misconception engine**: 12 imenovanih zabluda, pogrešan odgovor obeležava
  zabludu, selektor je zatim cilja drugačije formulisanim pitanjem, a zabluda se smatra
  ispravljenom tek posle dva uzastopna tačna odgovora. Stanje se čuva u IndexedDB.
- Povratna informacija posle odgovora imenuje zabludu kada je prepoznata i objašnjava zašto
  pogrešan odgovor deluje logično.

### PWA i ispravke

- Service worker: dodato brisanje zastarelih keševa pri aktivaciji, prošireni precache
  (`/vidim-problem`, `/kontrolor`, `/prijavi`, `/izvori`, `/rokovi`, manifest), eksplicitno
  isključenje admin i auth ruta iz keša, i fallback na keš kada mreža padne usred dataset zahteva.
- Dodata je provera nove verzije pravnog dataseta sa **banerom za kritičnu izmenu**
  (`updatePriority`), koji se ne prikazuje korisniku koji još nije preuzeo nijedan dataset.
- `scroll-padding-top` rešava stvarni problem: sticky header je prekrivao element na koji se
  skroluje, pa je klik na dugme ispod njega bio presretnut.
- Hover animacije više ne pomeraju geometriju dugmadi (pomeranje pod kursorom je otežavalo klik
  i blokiralo automatizovane provere); ostaju ulazne animacije i tap feedback.

### Provere

- Unit: **113 testova u 26 test fajlova**, uključujući pakete za simulator (uloge, posledice,
  debrief, teški režim, retry režim) i trening (tipovi odgovora, misconception životni ciklus).
- E2E: **34 testa u 4 fajla** (admin publish se preskače bez izolovanih fixture kredencijala), sa
  tokovima za put birača, ceo dan člana odbora, nasumični režim, modal accessibility i zablude.
- `npm run build` prolazi sa svim gate-ovima; aktivni dataset je obnovljen kao
  `2026.09.07-simulator-training-upgrade` (66 pravila, 193 trening reference, 136 simulation
  referenci, 3 stabla odluka).

Ograničenje koje ostaje: autorska pitanja i simulacioni tekstovi su pisani prema postojećim
pravilima iz baze i ne uvode nove pravne tvrdnje, ali pravna redakcija formulacija i dalje traži
potpis pravnog reviewera pre nego što se tretiraju kao proverene.
