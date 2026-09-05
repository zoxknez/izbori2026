# Implementation Report

## Faza 0 — test i tooling temelj

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

## Faza 1 — zajednički domen i formalizacija pravila

Status: **osnovna implementacija završena; preostale su samo eksplicitne hardening stavke**.

Urađeno:

- uvedeni kanonski tipovi za faze, status objave i pravni review;
- uveden Zod domen model sa proverama jedinstvenih ID/slug vrednosti i invariantom da je automatsko poništavanje izvedeno iz `severity === "ponistavanje"`;
- izdvojen čist `validateCounting` engine sa osam testiranih scenarija, uključujući razliku između računskog manjka i zakonskog viška;
- dodat DB model `decision_trees`/`decision_nodes`, tri seedovana stabla i evaluator bez cikličnih putanja;
- `Vidim problem` sada učitava stabla iz baze i prikazuje formalni interaktivni vodič, uz postojeći eksplorator kao detaljni fallback;
- prošireni `rules` i postojeći `sources` model bez pravljenja duplikata `legal_sources` tabele;
- uvedena prva Drizzle migracija i primenjena na Neon bazu, pa je dataset ponovo seedovan: 66 pravila, 8 krivičnih članova, 8 izvora i 3 stabla odluka;
- UI filteri i prikaz koriste pluralne faze, dok je singularno `phase` zadržano samo kao privremena kompatibilnost za stare potrošače.

Provere: domain invariant testovi, `validateCounting`, decision-tree evaluator i production build prolaze. Source provenance polja i Admin publish gate sada postoje; `isAutomaticAnnulment` se trenutno čuva kao obična kolona uz Zod/invariant zaštitu, a ne kao PostgreSQL generated kolona.

## Faza 2 — dataset versioning i offline temelj

Status: **završeno za DB-backed snapshot/offline temelj**.

Urađeno:

- uvedene `dataset_versions` i `dataset_files` tabele sa immutable payload/hash/size manifestom;
- `dataset-validator` koristi Zod, SHA-256 i cross-reference provere za pravila, izvore i grananje odluka;
- `scripts/snapshot-dataset.ts` pravi aktivni server snapshot direktno iz Neon tabela;
- API rute `/api/offline-dataset/current` i `/api/offline-dataset/[version]` vraćaju snapshot uz odgovarajuće cache politike;
- `scripts/freeze-bootstrap.ts` pravi build-time fallback u `public/offline-data/bootstrap/`, bez proglašavanja fallbacka aktivnim datasetom;
- uveden IndexedDB sloj sa `datasetMeta` pointerom i odvojenim store-ovima za buduće incidente, trening, znanje, simulacije i preference;
- `dataset-manager` preuzima, validira i tek potom atomarno aktivira novu verziju;
- Neon migriran i snapshotovan: aktivna verzija sadrži 66 pravila, 8 izvora i 3 decision tree-a.

Provere: typecheck, ESLint, Vitest i production build prolaze. E2E smoke proverava aktivni dataset API; kompletan network-failure E2E ostaje vezan za browser IndexedDB test harness u završnoj integracionoj fazi.

## Faza 3 — trening engine

Status: **engine i coverage implementirani; sadržajno obogaćivanje je otvoreno**.

Urađeno:

- uvedeni tipovi za trening pitanje, izbor, odgovor i knowledge state;
- coverage prag je centralizovan po severity-ju: normal 2, teška nepravilnost 3, krivično delo 4, poništavanje 4 pitanja po pravilu;
- generator trenutno proizvodi 193 pitanja za svih 66 pravila i koristi isti rule/source reference format za dataset snapshot;
- uvedeni mastery, confidence, spaced-repetition intervali, due/weakness weighting i exam score breakdown;
- dodat `/trening/kviz` sa klasifikacionim mit/činjenica pitanjima kao jednim tipom novog engine-a;
- progres i knowledge state se čuvaju u IndexedDB `trainingProgress` store-u.

Provere: coverage, mastery, selection i exam scoring imaju unit testove; typecheck, ESLint i Vitest prolaze. Preostaju production content enrichment (ručno revidirana pitanja umesto generičkih fallback-a), pun exam/progress dashboard i integracioni E2E refresh scenariji.

## Faza 4 — simulator biračkog dana

Status: **engine implementiran; napredni modovi su otvoreni**.

Urađeno:

- uvedeni `SimulationEvent`, `SimulationChoice`, `SimulationCondition`, efekti i reducer-like engine;
- seedovan tok sa 30 događaja i tačno 80 odluka, kroz sve faze izbornog dana;
- uslovi i efekti kontrolišu flagove, score, evidence i fazne prelaze; nedostupne odluke se odbijaju server-independent čistom funkcijom;
- Counting Mode koristi direktno isti `validateCounting()` engine kao `/validator`, bez dupliranja matematike;
- dodat `/simulator/biracki-dan` i čuvanje istorije u IndexedDB `simulationHistory` store-u;
- unit testovi pokrivaju broj događaja/odluka, efekte, scoring, prerequisites i integraciju sa counting validatorom.

Preostaju randomized mode sa formalnim condition ograničenjima u UI-ju, kompletan 30-event E2E tok i detaljniji breakdown rezultata.

## Faza 5 — admin dependency/versioning/auth layer

Status: **osnovna bezbednosna granica završena; puni editor je otvoren**.

Urađeno:

- Auth.js Credentials provider sa JWT sesijom i bcrypt proverom lozinke;
- `admin_users` sa ulogama `SUPER_ADMIN`, `LEGAL_EDITOR`, `CONTENT_EDITOR`, `REVIEWER`;
- `src/proxy.ts` radi samo optimistički redirect, dok publish route ponovo proverava sesiju i RBAC;
- `/api/admin/publish` validira isti `dataset-validator`, upisuje novu dataset verziju/fajl i append-only audit zapis;
- `/admin/login` i osnovna `/admin` kontrolna tabla; nema self-registration, a `scripts/seed-admin.ts` zahteva eksplicitne env vrednosti;
- `AUTH_SECRET` je dodat kao sensitive production env varijabla na Vercelu.

Preostaju kompletan content editor, impact/diff modal, dependency graph dashboard i transakciona publish orkestracija sa punim DB-backed edit modelom.

## Faza 6 — service worker i PWA install sloj

Status: **osnovni PWA sloj i ručno ažuriranje završeni; napredni storage UX je otvoren**.

Urađeno:

- sproveden bundler spike; zbog Next.js 16/Turbopack kombinacije izabran je mali transparentni statički `public/sw.js`, bez webpack workaround-a;
- precache app shell, offline fallback ruta i odvojeni `legal-data-v1` cache za immutable dataset odgovore;
- API dataset se proverava kroz hash/schema/cross-reference pre IndexedDB activation-a;
- lifecycle politika eksplicitno testira `register: false` i `reloadOnOnline: false`, a UI ima offline indikator;
- shell i SW imaju Playwright smoke proveru.

Implementirani su update prompt sa korisničkim aktiviranjem, zaštita od reload-a tokom otvorenog drafta, IndexedDB draft flagovi, IndexedDB migracija sačuvanih incidenata i MiniSearch globalna pretraga. Preostaju storage management UI i puni scenario 9 sa stvarnim online/offline prelazom u browser harness-u.

## Faza 7 — integracija i E2E hardening

Status: **u toku**.

Urađeno:

- dodat cross-module Playwright tok: validator demo → trening učitavanje → simulator odluka;
- dodate accessibility smoke provere za jedan `h1`, `main` landmark i missing image alt na javnim rutama;
- E2E sada pokriva javne rute, offline API, SW/offline fallback, training, simulator i indeksiranu globalnu pretragu (15 testova);
- production build i deployment se proveravaju posle svake veće faze.

Preostaje finalni performance budget sa realnim browser merenjem, scenario 9 online/offline sa incident draftom i kompletan admin publish → dataset → client update E2E.
