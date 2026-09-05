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
