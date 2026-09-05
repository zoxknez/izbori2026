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

## Faza 2 — dataset versioning i offline temelj

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

Provere: typecheck, ESLint, Vitest i production build prolaze. Dataset snapshot trenutno sadrži 66 pravila, 8 izvora, 3 stabla, 193 training reference-a i 80 simulation reference-a.

## Faza 3 — trening engine

Status: **engine, coverage, vežba i ispit implementirani; ručna pravna redakcija pitanja je otvorena**.

Urađeno:

- uvedeni tipovi za trening pitanje, izbor, odgovor i knowledge state;
- coverage prag je centralizovan po severity-ju: normal 2, teška nepravilnost 3, krivično delo 4, poništavanje 4 pitanja po pravilu;
- generator trenutno proizvodi 193 pitanja za svih 66 pravila, koristi sadržajno različite scenarije zasnovane na akcijama/dokazima/efektima i isti rule/source reference format za dataset snapshot;
- uvedeni mastery, confidence, spaced-repetition intervali, due/weakness weighting i exam score breakdown;
- dodat `/trening/kviz` sa klasifikacionim mit/činjenica pitanjima, režimom vežbe (12) i ispita (20), mastery dashboard-om i breakdown-om po težini;
- progres i knowledge state se čuvaju u IndexedDB `trainingProgress` store-u.

Provere: coverage, mastery, selection i exam scoring imaju unit testove; typecheck, ESLint, Vitest i build coverage gate prolaze. Preostaje samo ručna legal/content redakcija promptova i objašnjenja.

## Faza 4 — simulator biračkog dana

Status: **engine, vođeni i randomizovani režim implementirani**.

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

## Faza 5 — admin dependency/versioning/auth layer

Status: **auth, RBAC, content editor, dependency dashboard i publish workflow implementirani**.

Urađeno:

- Auth.js Credentials provider sa JWT sesijom i bcrypt proverom lozinke;
- `admin_users` sa ulogama `SUPER_ADMIN`, `LEGAL_EDITOR`, `CONTENT_EDITOR`, `REVIEWER`;
- `src/proxy.ts` radi samo optimistički redirect, dok publish route ponovo proverava sesiju i RBAC;
- `/api/admin/publish` validira isti `dataset-validator`, upisuje novu dataset verziju/fajl i append-only audit zapis u jednoj Neon batch transakciji;
- `/admin/rules` i `PATCH /api/admin/rules/[id]` omogućavaju RBAC-controlled content/status izmene uz pre/post audit zapis; `/admin` prikazuje source dependency graph i publish kontrolu;
- `/admin/login` i osnovna `/admin` kontrolna tabla; nema self-registration, a `scripts/seed-admin.ts` zahteva eksplicitne env vrednosti;
- `AUTH_SECRET` je dodat kao sensitive production env varijabla na Vercelu.

Urađen je i diff/impact modal za pravila, kao i DB-backed editor izvora sa verzijom, periodom važenja,
supersession statusom i stvarnom stale-propagacijom kroz zavisna pravila i decision-tree grane. Napredniji
editor decision-tree čvorova ostaje opciono proširenje; osnovni DB-backed rule/source editor, dependency
graph i transakcioni snapshot publish su završeni.

## Faza 6 — service worker i PWA install sloj

Status: **završeno za osnovni PWA/update/storage scope**.

Urađeno:

- sproveden bundler spike; zbog Next.js 16/Turbopack kombinacije izabran je mali transparentni statički `public/sw.js`, bez webpack workaround-a;
- precache app shell, stale-while-revalidate navigacioni shell, offline fallback ruta i odvojeni `legal-data-v1` cache za immutable dataset odgovore;
- API dataset se proverava kroz hash/schema/cross-reference pre IndexedDB activation-a;
- lifecycle politika eksplicitno testira `register: false` i `reloadOnOnline: false`, a UI ima offline indikator;
- shell i SW imaju Playwright smoke proveru.

Implementirani su update prompt sa korisničkim aktiviranjem, zaštita od reload-a tokom otvorenog drafta, IndexedDB draft flagovi, IndexedDB migracija sačuvanih incidenata, MiniSearch globalna pretraga i storage-management panel. Serwist ostaje svesno izostavljen posle dokumentovanog Turbopack spike-a.

## Faza 7 — integracija i E2E hardening

Status: **u toku**.

Urađeno:

- dodat cross-module Playwright tok: validator demo → trening učitavanje → simulator odluka;
- dodate accessibility smoke provere za jedan `h1`, `main` landmark i missing image alt na javnim rutama;
- E2E sada pokriva javne rute, offline API, SW/offline fallback, training practice/exam sa breakdown-om i IndexedDB stanjem, randomizovani i kompletan 30-event simulator, indeksiranu globalnu pretragu, admin RBAC guard za pravila/izvore/publish i incident draft kroz online/offline prelaz; dodat je i browser performance budget (21 test prolazi);
- production build i deployment se proveravaju posle svake veće faze.

Preostaje authenticated Admin publish → dataset → client update E2E, jer test admin nalog/fixture nije
kreiran bez korisničkih kredencijala. Ne postoji self-registration; javni deo aplikacije i server-side
RBAC guard su provereni bez izlaganja privilegovanih podataka.

