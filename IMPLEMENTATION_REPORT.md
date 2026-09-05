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

Status: **u toku**.

Urađeno:

- uvedeni kanonski tipovi za faze, status objave i pravni review;
- uveden Zod domen model sa proverama jedinstvenih ID/slug vrednosti i invariantom da je automatsko poništavanje izvedeno iz `severity === "ponistavanje"`;
- izdvojen čist `validateCounting` engine sa osam testiranih scenarija, uključujući razliku između računskog manjka i zakonskog viška;
- dodat DB model `decision_trees`/`decision_nodes`, tri seedovana stabla i evaluator bez cikličnih putanja;
- `Vidim problem` sada učitava stabla iz baze i prikazuje formalni interaktivni vodič, uz postojeći eksplorator kao detaljni fallback;
- prošireni `rules` i postojeći `sources` model bez pravljenja duplikata `legal_sources` tabele;
- uvedena prva Drizzle migracija i primenjena na Neon bazu, pa je dataset ponovo seedovan: 66 pravila, 8 krivičnih članova, 8 izvora i 3 stabla odluka;
- UI filteri i prikaz koriste pluralne faze, dok je singularno `phase` zadržano samo kao privremena kompatibilnost za stare potrošače.

Provere posle ove iteracije: typecheck, ESLint i Vitest prolaze (4 test fajla, 14 testova). Faza 1 još nije zatvorena dok se ne završe potpuni source provenance model, admin publish gate i preostale faze iz plana.

## Faza 2 — dataset versioning i offline temelj

Status: **u toku**.

Urađeno:

- uvedene `dataset_versions` i `dataset_files` tabele sa immutable payload/hash/size manifestom;
- `dataset-validator` koristi Zod, SHA-256 i cross-reference provere za pravila, izvore i grananje odluka;
- `scripts/snapshot-dataset.ts` pravi aktivni server snapshot direktno iz Neon tabela;
- API rute `/api/offline-dataset/current` i `/api/offline-dataset/[version]` vraćaju snapshot uz odgovarajuće cache politike;
- `scripts/freeze-bootstrap.ts` pravi build-time fallback u `public/offline-data/bootstrap/`, bez proglašavanja fallbacka aktivnim datasetom;
- uveden IndexedDB sloj sa `datasetMeta` pointerom i odvojenim store-ovima za buduće incidente, trening, znanje, simulacije i preference;
- `dataset-manager` preuzima, validira i tek potom atomarno aktivira novu verziju;
- Neon migriran i snapshotovan: aktivna verzija sadrži 66 pravila, 8 izvora i 3 decision tree-a.

Provere: typecheck, ESLint, Vitest (5 fajlova / 18 testova) i production build prolaze. E2E smoke sada proverava i aktivni dataset API; kompletan network-failure E2E ostaje vezan za browser IndexedDB test harness u završnoj integracionoj fazi.
