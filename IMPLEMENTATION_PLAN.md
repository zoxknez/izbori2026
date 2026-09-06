# Implementation Plan - Trening / Simulator / Admin / PWA Offline

**Verzija: v2 (Revision 1).** Status: **plan sproveden; Faze 0-7 završene.**

## Revision 1 - šta se promenilo u odnosu na v1 i zašto

v1 je bio strukturno dobar (redosled faza, `results-validator` dedup, PWA atomic-update-pre-SW-a
princip) ali je imao 10 rupa koje bi kasnije postale skupe arhitektonske greške. Sve su ugrađene
direktno u tekst plana ispod, ne kao spisak na strani:

| # | Problem u v1 | Ispravka u v2 |
|---|---|---|
| 1 | Dva "source of truth" (`src/content/*` i Neon) bez jasnog trenutka prelaska | §6.1 **Canonical Source Cutover** - eksplicitan, neopoziv trenutak posle kog `src/content/*` više nikad ne sme da upiše preko admin-uređenog sadržaja |
| 2 | Admin je trebalo da piše `public/offline-data/*.json` u runtime-u | §5 Faza 2/5 i §6.3 - dataset postaje **DB-backed immutable snapshot** (`dataset_versions`/`dataset_files`) servirán preko `/api/offline-dataset/*`; filesystem export ostaje samo kao build-time bootstrap fallback |
| 3 | 120 seed pitanja matematički nemoguće za 66×2 + kritična | §5 Faza 3 - minimum se **izvodi iz coverage pravila** (2/3/4/4 po težini), ne iz fiksne cifre; build/CI pada ako coverage nije zadovoljen |
| 4 | `reviewStatus` mešao workflow i "da li je javno vidljivo" | §2.1 - razdvojeno na `publicationStatus` (draft/published/archived) i `reviewStatus` (unreviewed…verified/stale), nezavisne ose |
| 5 | Plan je pretpostavljao `middleware.ts` | §5 Faza 5 - `src/proxy.ts` (Next.js 16 konvencija) samo za optimističku proveru + **obavezna server-side RBAC provera u svakoj Server Action/Route Handler mutaciji** |
| 6 | Serwist + Next 16/Turbopack kombinacija nije zaključana | §5 Faza 6 - eksplicitna odluka + spike, `reloadOnOnline: false`, `register: false` |
| 7 | "DecisionTree" je i dalje bio samo filter po `phase` | §2.2 i §5 Faza 1 - pravi `DecisionNode`/`DecisionOption` graf, DB-backed, premešten u Fazu 1 |
| 8 | `sources` (postojeća tabela) + `legal_sources` (nova) = dupli domen | §2.2, §6 - **jedna** tabela, `sources` se proširuje kolonama, nema paralelnog modela |
| 9 | `severity: "krivicno_delo"` mogao bi da procuri kao gola labela u UI | §2.1, §8 - zaključan invarijant + test: UI labela je uvek "Moguće krivično delo" |
| 10 | `isAutomaticAnnulment` i `severity === "ponistavanje"` mogli su da divergiraju | §2.1, §8 - Zod/domain invarijant + test da su nužno ekvivalentni |

Nijedna od ovih izmena ne menja redosled faza niti ruši ono što je u v1 bilo tačno (rezultat-validator
dedup, PWA-pre-SW princip, simulator state/effects engine) - sve je i dalje odobreno bez izmena.

---

## 1. Trenutna arhitektura (baseline, septembar 2026)

| Sloj | Šta postoji danas |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4 |
| Baza | Neon Postgres (serverless HTTP driver), Drizzle ORM. Tabele: `rules`, `criminal_articles`, `sources` (`src/lib/db/schema.ts`) |
| Sadržaj (danas) | Izvor istine za sadržaj su TS fajlovi u `src/content/*.ts` (66 pravila, 8 krivičnih dela, 7 izvora), upisani u Neon preko `scripts/seed.ts` (upsert, idempotentno) - **ovo je privremeno, videti §6.1** |
| Data access | `src/lib/data.ts` - server-only Drizzle upiti |
| Domain tipovi | `src/lib/types.ts` - `Rule`, `Severity`, `LawReference`, `MythCheck`, `SEVERITY_META` |
| UI sistem | Ručno pisan dizajn-sistem (ne shadcn) u `src/components/ui/*` |
| Javne rute | `/`, `/pravila`, `/pravila/[slug]`, `/vidim-problem`, `/validator`, `/kontrolor`, `/krivicna-dela`, `/mit-ili-cinjenica`, `/izvori`, `/rokovi`, `/van-birackog-mesta`, `/prijavi` |
| "Decision tree" | `ProblemWizard` filtrira `Rule[]` po `phase` - **nije** formalni graf. Postaje formalni model u Fazi 1 (§2.2) |
| Trening/kviz | Samo `myth-quiz.tsx` (single-choice nad `Rule.mythCheck`) |
| Incident beleške | `localStorage` (ne IndexedDB), bez `id/status/relatedRuleIds` |
| Admin, Auth, PWA/SW, IndexedDB, testovi | **Ne postoje ni u jednom obliku** |
| Validator brojeva | `zapisnik-validator.tsx` - 4 formule hardkodirane u JSX, nije izdvojen modul |

Napomena: na ovom repou trenutno paralelno (van ove sesije/plana) teče vizuelni redizajn javnih
stranica (hero, `/pravila`, `Container`, header/footer, `RulesExplorer` grid/list/sort/paginacija).
Taj rad ne menja ništa iz ovog plana - plan se bavi isključivo domenskim/data/infra slojem
(Neon šema, IndexedDB, SW, admin, testovi), ne izgledom komponenata. Jedina dodirna tačka je da
svaka nova/izmenjena komponenta mora nastaviti da čita `Rule` kroz `src/lib/data.ts`, ne da uvodi
sopstvena polja mimo tipa (npr. već je uočeno da neke novododate komponente referenciraju
`rule.pravniOsnov`, polje koje ne postoji na `Rule` - to je greška te paralelne izmene, rešava se
nezavisno od ovog plana, ne uvoditi je kao "novi zahtev" u domenski model).

### 1.1 Šta je direktno iskoristivo bez menjanja

- Neon + Drizzle kao **canonical, admin-writable store** (§6.1).
- `Rule` tip je ~85% identičan traženom `ElectionRule`; razlike su tačno navedene u §2.1.
- Severity taksonomija (`dozvoljeno…ponistavanje`) ostaje na srpskom - §2.1.
- `PHASE_META`/`PHASE_ORDER` postaje osnova za `ElectionPhase` enum.
- Dizajn-sistem (`components/ui/*`) ostaje za javni deo; Admin panel sme da uvede shadcn/ui
  (§7 - ostaje otvorena preporuka, ne blokira ništa).

---

## 2. Promene domenskog modela (Faza 1 preduslov za sve ostalo)

### 2.1 `Rule` → `ElectionRule`: šta se menja, šta ne

| Polje iz specifikacije | Odluka |
|---|---|
| `severity` enum (EN) | **Ne menjati vrednosti**, ostaje srpski enum. **Novi invarijant (blokira build):** `SEVERITY_META.krivicno_delo.label` mora biti tačno `"Moguće krivično delo"` - nijedna komponenta ne sme renderovati `rule.severity` sirovo kao tekst, uvek kroz `SEVERITY_META[severity].label`. Test: statička provera da nijedan `.tsx` fajl ne radi `{rule.severity}` direktno u JSX tekstualnom čvoru (ESLint custom rule ili grep-based CI provera) + unit test na sadržaj `SEVERITY_META`. |
| `phases: ElectionPhase[]` (plural) | Realna izmena - dodati `phases jsonb`, backfill iz `phase`, ukloniti `phase` posle prelaska UI-ja. Rešava hak `phase: "svaka"`. |
| `isAutomaticAnnulment` vs `severity === "ponistavanje"` | **Novi invarijant:** ova dva moraju uvek biti ekvivalentna. Ne čuvati kao dva nezavisna polja koja mogu divergirati. Implementacija: `isAutomaticAnnulment` postaje **computed/generated** (Postgres generated column `isAutomaticAnnulment = (severity = 'ponistavanje')`, ili barem Zod `.refine()` koji odbija upis gde se razlikuju) + unit test koji to proverava za svih 66 zapisa i za svaki novi upis kroz Admin. |
| `publicationStatus` / `reviewStatus` | **Razdvojeno u dve nezavisne ose** (v1 greška #4):<br>`publicationStatus: "draft" \| "published" \| "archived"`<br>`reviewStatus: "unreviewed" \| "content_review" \| "legal_review" \| "verified" \| "stale"`<br>Moguće (i očekivano) stanje: `publicationStatus="published"` + `reviewStatus="stale"` → javni UI prikazuje pravilo uz baner "⚠️ Ovo pravilo je još dostupno, ali zahteva pravnu proveru nakon izmene izvora." Isti par polja se dodaje i na `training_questions`, `simulation_events`, `decision_trees` radi konzistentnog workflow-a. |
| `whatToCheck / controllerActions / voterActions / observerActions / evidenceChecklist / doNotDo / lawReferences / relatedSlugs / mythCheck` | Bez izmena, imena ostaju ista. |
| `validFrom / validUntil / lastLegalReview` | Kolone već postoje, dodati u `toRule()` mapiranje, popuniti realne vrednosti kroz Admin. |

### 2.2 Novi domenski tipovi

```
src/lib/domain/
  rules/
    types.ts             # Rule (prošireno), Severity, ElectionPhase, ElectionType
    severity.ts           # SR enum -> UI label mapa; jedino mesto koje sme da definiše labelu
    invariants.ts          # isAutomaticAnnulment <-> severity provera (deljeno Zod + runtime)
    decision-tree/
      types.ts             # DecisionTree, DecisionNode (question | result), DecisionOption
      evaluate.ts           # čist evaluator: (tree, answers[]) -> ruleIds
  legal/
    types.ts               # LegalSource = PROŠIRENA postojeća `sources` tabela (ne nova), + supersedes
    dependency-graph.ts     # broji reference: source -> rules -> training/simulator/decision-tree
  training/
    types.ts                # TrainingQuestion, TrainingChoice, KnowledgeState
    coverage.ts               # coverage pravilo po težini (§5 Faza 3) - jedini izvor "minimalnog broja"
    mastery.ts
    selection-engine.ts
  simulator/
    types.ts
    engine.ts
    seed-events.ts
  results-validator/
    index.ts                  # isti engine za /validator i simulator counting mode
  offline/
    dataset-types.ts           # DatasetVersion, DatasetFile, OfflineDatasetManifest (DB-backed, §6.3)
  audit/
    types.ts
```

**Decision tree je sada u Fazi 1, ne odloženo.** Model:

```ts
type DecisionNode =
  | {
      type: "question";
      id: string;
      prompt: string;
      options: { label: string; nextNodeId: string }[];
    }
  | {
      type: "result";
      ruleIds: RuleId[];
    };
```

Primer koji mora proći kroz stvarni graf (ne kroz `rule.phases` filter): "Dvoje ljudi ulazi iza
paravana" → `Da li biraču treba pomoć?` → DA → `Da li je birač sam izabrao pomagača?` → DA/NE →
dva različita `result` node-a sa različitim `ruleIds`. Tek sa ovim modelom admin dependency graph
(Faza 5) tačno tvrdi "Rule I05 koristi 2 decision-tree grane".

### 2.3 Legal source - jedan model, ne dva

**v1 greška #8 ispravljena.** Nema nove `legal_sources` tabele. Postojeća `sources` tabela se
proširuje:

```
sources  (postojeća tabela, ALTER, ne nova)
  + type            ("law" | "bylaw" | "rik" | "court" | "odihr" | "observer_report" | "other")
  + publisher        text
  + version          text
  + validFrom         date
  + validUntil         date
  + status              ("active" | "superseded" | "archived")
  + supersedesId         FK -> sources.id (nullable)
  + lastCheckedAt         timestamp
```

Jedan ID namespace, jedan dependency graph, nema pitanja "da li pravilo referencira `sources.id`
ili `legal_sources.id`". `rule.lawReferences` i dalje referenciraju ovu tabelu (po `sourceId` ili po
tekstualnom `article` - precizira se u Fazi 1 kad se piše migracija).

### 2.4 Šta ostaje van Neon-a (IndexedDB / client-only)

`IncidentNote` (prošireni `IncidentData` iz `lib/incident.ts` sa `id/status/relatedRuleIds`),
`KnowledgeState`, `questionHistory`, `simulationHistory`, `userPreferences`, i **lokalni pokazivač
aktivne verzije dataseta** (`activeDatasetVersion`, §6.3) - potpuno user-local, nikad na serveru.

---

## 3. `results-validator` - deduplikacija pravila A-D

Bez izmena u odnosu na v1 - ovaj deo je odobren kao ispravan. Danas su 4 formule hardkodirane u
`zapisnik-validator.tsx`; izdvajaju se u `src/lib/domain/results-validator/index.ts` i koriste ih i
`/validator` i simulatorov Counting Mode (Faza 4). **Nema drugog engine-a za brojanje bilo gde u
aplikaciji.**

---

## 4. Mapiranje foldera specifikacije → postojeći repo

```
src/
  app/
    trening/
      page.tsx
      kviz/page.tsx
      lekcije/page.tsx
      progres/page.tsx
      simulator/page.tsx

    admin/
      login/page.tsx
      page.tsx
      rules/
      sources/                 # jedan model, §2.3 - nema admin/legal-sources
      decision-trees/           # NOVO u odnosu na v1 (Faza 1 formalizacija)
      simulator/
      training/
      audit/

    api/
      offline-dataset/
        current/route.ts        # NOVO - zamenjuje filesystem export iz v1 (§6.3)
        [version]/
          manifest/route.ts
          rules/route.ts
          sources/route.ts
          training/route.ts
          simulation/route.ts
          decision-trees/route.ts

    (postojeće javne rute bez izmena)

  components/
    ui/                          # POSTOJI, bez izmena
    rules/ training/ simulator/ admin/   # NOVO

  lib/
    domain/                       # §2.2
    offline/
      indexed-db.ts
      dataset-manager.ts           # sada gađa /api/offline-dataset/*, ne fajl-sistem
      dataset-validator.ts
      search-index.ts
    db/                            # POSTOJI, proširuje se
    proxy.ts                        # Next.js 16 - NE middleware.ts (§5 Faza 5)

  content/
    rules/ training/ simulations/    # bootstrap/dev fixtures posle cutover-a, §6.1

  schemas/                           # Zod: rule, source, question, simulation, decision-tree, incident

  tests/
    unit/   e2e/
```

---

## 5. Redosled implementacije (faze)

Isti redosled kao u v1 (nema promene): **shared domain → dataset/versioning → training → simulator
→ admin → integracija/testovi → PWA/SW.** Svaka faza ima izlazni kriterijum; sledeća se ne otvara
dok prethodna nema stabilan API + testove.

### Faza 0 - Test i tooling temelj
Bez izmena u odnosu na v1: Vitest + Playwright, `npm run test` / `test:e2e` / `typecheck`.

**Exit:** placeholder testovi prolaze, Playwright smoke test protiv `next dev` prolazi.

### Faza 1 - Shared rule/domain layer (prošireno u odnosu na v1)
- Migracija: `rules.phases` (jsonb), `sources` prošireni (§2.3), `publicationStatus`/`reviewStatus`
  razdvajanje (§2.1) na `rules` (i pripremljeno za `training_questions`/`simulation_events`/
  `decision_trees` kad te tabele nastanu u Fazama 3/4).
- `isAutomaticAnnulment` postaje generated/invarijant-proveren (§2.1).
- `src/lib/domain/rules/*`, `results-validator/*` (§3).
- **Decision tree formalni model** (§2.2) - `decision_trees`/`decision_nodes` tabele, `evaluate.ts`
  čista funkcija, migracija postojećeg `ProblemWizard`-a da čita stvarni graf umesto da filtrira
  `Rule[]` po `phase` inline. Minimalno 3 realna stabla u seed-u (uključujući "pomagač iza
  paravana" primer iz §2.2) da dependency graph u Fazi 5 ima šta da broji.
- Zod šeme u `src/schemas/*` kao single source za TS tipove (`z.infer`) i za runtime validaciju
  (offline dataset, admin forme, `invariants.ts`).

**Exit:** unit testovi za `validateCounting` (svih 8 test-case-ova), za `isAutomaticAnnulment`
invarijant (66/66 zapisa + odbijen upis koji krši invarijantu), za `SEVERITY_META.krivicno_delo.label`
lock, za `evaluate()` na sva 3 seed decision-tree-a. Postojeće javne stranice rade identično
(regresija: build + lint + manuelna provera).

### Faza 2 - Dataset versioning temelj (DB-backed, ne filesystem - v1 greška #2 ispravljena)
- Nove tabele: `dataset_versions` (`id, version, status, updatePriority, legalReviewDate,
  manifestHash, createdAt, publishedAt`), `dataset_files` (`id, datasetVersionId, filename, payload,
  sha256, size`).
- `src/lib/offline/dataset-validator.ts` - Zod + cross-reference provera (svaki `ruleId`/`sourceId`
  iz training/simulation/decision-tree mora postojati u istom snapshotu) - **isti modul** koji će
  Admin (Faza 5) koristiti da blokira publish.
- Build/seed skript (`scripts/snapshot-dataset.ts`) pravi **prvu** `dataset_versions` verziju direktno
  iz postojećih Neon tabela (bez admin UI-ja, koji dolazi tek u Fazi 5) - dokazuje da cevovod radi
  end-to-end pre nego što postoji ijedan red admin koda.
- `app/api/offline-dataset/*` route handleri - čitaju iz `dataset_files` po verziji, `current`
  vraća poslednju `status = "active"` verziju. Imutabilno po dizajnu: URL sadrži verziju, pa je
  agresivno HTTP/CDN keširanje bezbedno.
- **Build-time bootstrap fallback** (jedina uloga filesystem-a u ovom sloju): `scripts/
  freeze-bootstrap.ts` pokreće se u `next build` i zamrzava poslednju aktivnu verziju u
  `public/offline-data/bootstrap/*.json` - koristi se **isključivo** kad klijent prvi put instalira
  app i `/api/offline-dataset/current` nije dostupan. Nikad se ne tretira kao "aktivna" verzija ako
  je ijedna verzija ikad uspešno preuzeta sa servera.
- `src/lib/offline/indexed-db.ts` (preko `idb` paketa): `datasetMeta` (uključujući
  `activeDatasetVersion` pointer), `incidentNotes`, `trainingProgress`, `knowledgeState`,
  `simulationHistory`, `userPreferences`. Odvojeno od Cache Storage (koji dolazi u Fazi 6).
- `src/lib/offline/dataset-manager.ts` - atomic update: fetch u temp → validate (hash + schema +
  cross-ref) → tek onda activate pointer u IndexedDB. Migracija `IncidentForm` sa `localStorage` na
  ovaj IndexedDB sloj.

**Exit:** unit testovi za dataset-validator (hash mismatch/missing cross-ref/invalid schema →
reject; sve validno → activate). E2E (bez SW-a, čisto na `dataset-manager` + `/api/offline-dataset/*`
nivou): "novi dataset postoji → simuliraj network failure na 70% → stara verzija ostaje aktivna."

### Faza 3 - Trening engine (matematika ispravljena - v1 greška #3)
- `src/lib/domain/training/{types,coverage,mastery,selection-engine}.ts`.
- **Coverage pravilo je izvor minimuma, ne fiksna cifra:**

  ```
  normal rule (dozvoljeno/info/proveri/nepravilnost)  >= 2 pitanja
  teska_nepravilnost                                    >= 3 pitanja
  krivicno_delo                                          >= 4 pitanja
  ponistavanje                                            >= 4 pitanja
  ```

  Build/CI korak (`scripts/check-training-coverage.ts`) prolazi samo ako je pravilo zadovoljeno za
  svih 66 pravila; ukupan broj pitanja je posledica ove formule (za trenutnih 66 pravila to je
  **160+**, tačan broj se ne hardkoduje u planu niti u kodu - Admin coverage dashboard (Faza 5)
  prikazuje isto pravilo uživo).
- Proširiti `myth-quiz.tsx` u pun `/trening/kviz` - mit-ili-činjenica ostaje kao `classification` tip
  pitanja unutar novog sistema.
- Misconception engine, spaced repetition, confidence input, exam mode, progress dashboard - kao u
  originalnom promptu §3-§13, bez izmena.

**Exit:** unit testovi za mastery, selection weights, exam scoring, spaced repetition, **coverage
checker** (odbija build ako bilo koje pravilo padne ispod praga). E2E: odgovori→refresh→progress
ostaje, pogreši→ponovi greške→sličan follow-up, završi ispit→breakdown.

### Faza 4 - Simulator engine
Bez izmena u odnosu na v1 (odobreno kao ispravno postavljeno): event/choice/effects reducer,
prerequisites, 30 događaja/80 odluka sa 50/25/15/7/3% raspodelom, Counting Mode poziva **isti**
`validateCounting()` iz §3, randomized mode sa eksplicitnim `SimulationCondition` ograničenjima.

**Exit:** isti kao v1 - unit (prerequisites/effects/scoring/phase-transitions/random-constraints +
integracija sa `validateCounting`), E2E ceo tok iz originalnog prompta §17.

### Faza 5 - Admin: dependency/versioning/auth layer (prošireno - v1 greške #1, #5 ispravljene)
- **Auth:** `src/proxy.ts` (Next.js 16 konvencija, **ne** `middleware.ts`) radi samo optimističku
  proveru ("da li uopšte postoji sesija") radi brzog redirekta na `/admin/login`. **Svaka** Server
  Action, Route Handler i DB mutacija unutar `/admin/*` ponovo, samostalno proverava sesiju + RBAC
  server-side - prolazak kroz proxy **nikad** se ne tretira kao dokaz autorizacije. Auth.js
  Credentials provider + nova `admin_users` tabela (bcrypt, `role` enum
  `SUPER_ADMIN/LEGAL_EDITOR/CONTENT_EDITOR/REVIEWER`), bez self-registracije.
- **Canonical Source Cutover (v1 greška #1):** prva uspešna izmena pravila kroz Admin UI je trenutak
  posle kog `scripts/seed.ts` **prestaje da se pokreće nad produkcionom Neon bazom**. Skripta ostaje
  u repou samo za lokalni/dev bootstrap (fresh clone → prazna dev baza). Ovo se eksplicitno
  dokumentuje u `README.md` i tehnički sprečava dodavanjem `NODE_ENV`/env-flag provere u
  `scripts/seed.ts` koja odbija da radi ako `dataset_versions` tabela već ima bar jednu `status =
  "active"` verziju nastalu kroz Admin publish (razlikuje se od Faza 2 bootstrap snapshot-a po
  `publishedBy` polju).
- Nove tabele: `admin_users`, `audit_log` (append-only). `sources` proširenje već iz Faze 1 (§2.3).
- Dependency graph koristi formalni decision-tree model iz Faze 1 (§2.2), ne aproksimaciju.
- **Publish flow piše u `dataset_versions`/`dataset_files` transakciono** (§6.3 detalji), poziva isti
  `dataset-validator.ts` iz Faze 2 - ne novi validator za admin. Ako validacija padne, publish se
  blokira (v1 zahtev, bez izmena).
- Impact modal, diff view, coverage dashboard (sada nad realnom formulom iz Faze 3), global search
  - kao u originalnom promptu.

**Exit:** unit testovi za permissions (uključujući "proxy prošao ali server-side provera odbija"
scenario), status transitions (`publicationStatus`/`reviewStatus` nezavisno), source supersession →
stale propagation, dependency calculation (sa decision-tree granama), publish validation. E2E tok iz
originalnog prompta §22 + novi slučaj: content editor sa važećom sesijom pokuša direktan API poziv
koji zaobilazi UI dugme za publish → server-side RBAC i dalje odbija.

### Faza 6 - Service Worker / PWA install sloj (zaključane odluke - v1 greška #6 ispravljena)
- **Bundler odluka, zaključana pre početka faze (ne ostavljeno agentu da nasumično bira usred rada):**
  Next.js 16 podrazumevano koristi Turbopack i za `dev` i za `build`. Serwistov zvanični
  getting-started vodič je pisan za webpack. Pre početka Faze 6 uraditi kratak spike (pola dana):
  probati Serwistov Turbopack-specifičan setup; ako prođe bez workaround-a → koristiti ga (opcija A,
  poželjna, ostaje na Turbopacku svuda). Ako ne prođe čisto → produkcioni build eksplicitno prelazi
  na `next build --webpack` **samo za ovaj korak** (opcija B), sa TODO komentarom i linkom na
  Serwist/Next.js issue koji prati Turbopack podršku, da se ukloni čim bude podržano. Ovo se upisuje
  u `README.md` pre nego što ijedan SW kod nastane.
- Konfiguracija je od početka: **`register: false`** (ručna registracija/update UX, ne Serwist
  default) i **`reloadOnOnline: false`** (Serwist default je `true`, direktno kosi zahtev "nikad ne
  reloaduj korisnika dok piše incident ili rešava simulator" - mora biti eksplicitno isključeno, ne
  ostavljeno na default).
- Precache app shell (§4 mapiranje), `stale-while-revalidate` za shell, `cache-first + eksplicitna
  provera` za `legal-data-*` cache - koji sada znači: keširani odgovori sa `/api/offline-dataset/*`,
  ne statični fajlovi (posledica §6.3 ispravke).
- Update UX, critical update traka, offline indikator, storage management, fallback offline ruta,
  dev-only debug panel - kao u originalnom promptu, bez izmena.
- MiniSearch indeks nad `title/summary/aliases/keywords` (`aliases`/`informalQueries` polje dodato na
  `Rule` u Fazi 1 šemi, popunjeno za ~15 najčešće traženih pravila).
- SW lifecycle: pre reload-a proverava IndexedDB "draft in progress" flag (incident/simulation/quiz)
  iz Faza 2-4.

**Exit:** Playwright test matrica - scenariji 1-8 iz originalnog prompta §25, **plus** scenario 9:
verifikuj da je `reloadOnOnline` zaista isključen (simuliraj online/offline prelaz usred otvorenog
incident drafta, tekst preživljava bez reload-a).

### Faza 7 - Integracija i pun E2E
Bez izmena u odnosu na v1: cross-modul E2E (admin publish → nova `dataset_versions` verzija → PWA
update prompt → simulator/trening/validator odmah koriste novu verziju), performance budget,
accessibility offline provera.

**Exit:** `IMPLEMENTATION_REPORT.md` (§10).

---

## 6. Migracija podataka - konkretni koraci

1. `npx drizzle-kit generate` (prelazak sa `push` na generisane migracije, istorija u `drizzle/`) za:
   `rules.phases`, `rules.publicationStatus`/`reviewStatus` split, `isAutomaticAnnulment` kao
   generated column, `sources` proširenje (§2.3, **ne** nova tabela), `decision_trees`/
   `decision_nodes`, `dataset_versions`/`dataset_files`, `admin_users`, `audit_log`.
2. Backfill: `phases = [phase]` za svih 66 zapisa (ručna korekcija za `kupovina-glasova`/
   `bugarski-voz`), `publicationStatus = "published"` + `reviewStatus = "verified"` za svih 66
   postojećih zapisa (već su bili de-facto objavljeni i pravno provereni pre ovog plana).
3. `sources` proširenje: postojećih 7 zapisa dobija `type/publisher/status="active"` bez novog ID
   namespace-a.
4. **§6.1 Canonical Source Cutover** (detalji u Fazi 5): od trenutka prve admin izmene,
   `scripts/seed.ts` se tehnički onemogućava nad produkcionom bazom (env-flag provera). Ostaje
   isključivo kao dev/fresh-clone bootstrap alat.

**Nema rušenja postojećih ruta.** Sve izmene su aditivne (nove kolone/tabele) dok traje migracija;
brisanje stare `phase` kolone i stare `reviewStatus` vrednosti dešava se tek pošto sav čitajući kod
pređe na nova polja (kraj Faze 1).

---

## 7. Odluke i status realizacije

| Pitanje | Preporuka | Status |
|---|---|---|
| Admin UI biblioteka | shadcn/ui **samo** unutar `components/admin/*` | Svesno nije uvedena; postojeći admin UI je dovoljan |
| Admin autentikacija | Auth.js Credentials + `admin_users` u istom Neon-u | **Zaključano i implementirano** |
| SW bundler (Turbopack vs webpack za build koraka) | Opcija A (Turbopack) posle spike-a, fallback opcija B | **Zaključano kao proces** (§5 Faza 6) - ishod spike-a se upisuje u `IMPLEMENTATION_REPORT.md` |
| Search indeks | MiniSearch | **Zaključano i implementirano** |
| Migracije | `generate`+`migrate` umesto `push` | **Zaključano** - vidi §6, stavka 1 |

Preostaje samo redovni pravni/content review kada RIK objavi novi zakon, izmenu ili novo uputstvo; takva promena treba da pokrene stale workflow i novi Admin publish.

---

## 8. Test strategija (dopunjeno invarijantama iz Revision 1)

- **Vitest** za sve `lib/domain/*` module, plus novi invarijant testovi koji ne postoje nigde drugde
  u planu i lako bi se preskočili da nisu eksplicitno navedeni:
  - `SEVERITY_META.krivicno_delo.label === "Moguće krivično delo"` (i test da nijedna komponenta ne
    renderuje sirov `severity` string - statička grep/lint provera kao deo `npm run typecheck`).
  - `isAutomaticAnnulment === (severity === "ponistavanje")` za svih 66 zapisa + za svaki novi Zod
    upis.
  - `publicationStatus`/`reviewStatus` nezavisnost (moguće je `published` + `stale` istovremeno; test
    da se to ispravno prikazuje kao baner, ne kao skriveno pravilo).
  - Dataset validator: hash mismatch, missing cross-reference, invalid schema, sve validno.
  - RBAC: proxy-level provera prolazi, ali server-side provera odbija neovlašćenu mutaciju.
- **Playwright** za tokove koji zahtevaju pravi browser state (IndexedDB, offline mod, SW lifecycle,
  admin publish workflow, `reloadOnOnline: false` verifikacija).
- Nijedna faza iz §5 se ne smatra završenom bez testova iz njenog "Exit" kriterijuma.

---

## 9. Šta ovaj plan namerno NE radi

- Ne uvodi politički klasifikovan sadržaj niti menja neutralan ton postojećih 66 pravila.
- Ne migrira javni dizajn-sistem na shadcn/ui (samo admin).
- Ne uvodi obavezan nalog za javni deo sajta.
- Plan je implementiran kroz Fazu 7; ovaj dokument sada služi kao arhitektonska i operativna evidencija.
- Ne dira paralelni vizuelni redizajn javnih stranica koji trenutno teče van ove sesije (§1
  napomena) - jedino traži da svaka nova komponenta ostane unutar `Rule` tipa iz `src/lib/types.ts`.

---

## 10. Sledeći deliverable

Po završetku svake faze iz §5 ažuriran je `IMPLEMENTATION_REPORT.md` sa:
urađenim funkcijama, arhitektonskim odlukama (uključujući ishod Turbopack/webpack spike-a iz Faze 6),
testovima, poznatim ograničenjima, dataset coverage tabelom (realan broj pitanja iz §5 Faza 3
formule), i preporučenim sledećim korakom.

Za dalje održavanje, sledeći deliverable je periodični pravni/content review: proveriti aktuelne RIK
zakone i uputstva, označiti zavisne zapise kao `stale` kada se izvor zameni i objaviti novi validirani
dataset tek nakon pregleda.
