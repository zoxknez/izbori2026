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
