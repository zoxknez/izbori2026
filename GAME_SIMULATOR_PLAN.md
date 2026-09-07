# GAME SIMULATOR PLAN: Interaktivna 2D simulacija biračkog dana (Phaser 4 + XState 5 + Next.js 16)

## 1. Audit trenutnog stanja repozitorijuma

### 1.1 Postojeća arhitektura simulatora
- **Pravni domen i seed podaci**:
  - `src/lib/domain/simulator/types.ts`: Definisane uloge (`clan_odbora`, `posmatrac`, `birac`), režimi (`guided`, `randomized`, `hard`), faze (`pre_otvaranja`, `otvaranje`, `glasanje`, `glasanje_van_bm`, `zatvaranje`, `brojanje`, `zapisnik`, `predaja`), 6 kategorija bodovanja (`procedure`, `secrecy`, `voterRights`, `documentation`, `counting`, `legalResponse`), klasifikacija odluka (`correct`, `acceptable`, `suboptimal`, `wrong`, `critical_error`) i integracija sa `CountingInput` / `CountingResult`.
  - `src/lib/domain/simulator/engine.ts`: Headless domen rešava: proveru preduslova (`conditionMatches`), filtriranje po ulogama (`eventsForRole`), dostupnost odluka (`availableChoices`), primenu efekata sa hard-mode penalima (`applyChoice`), određivanje sledećeg događaja (`pickNextEvent`), računanje debrief-a (`computeDebrief`) i matematičku proveru brojanja (`validateCounting`).
  - `src/lib/domain/simulator/seed-events.ts`: 55+ autorski modelovanih situacija (E01-E55) sa rigoroznim referencama na pravila (`ruleIds`), bez improvizovanih pravnih zaključaka.
- **Korisnički interfejs i prezentacija**:
  - `src/components/simulation-game.tsx`: Trenutno implementiran kao sekvencijalni kartični kviz sa A/B/C/D odgovorima, trenutnim progress barovima za 6 kategorija i instant feedback-om u guided režimu.
  - **Napomena o rutama**: Lokalni working tree uvodi `/izborni-dan` kao kanonsku rutu sa trajnim preusmerenjem sa `/simulator/biracki-dan`. GitHub master još uvek drži `/simulator/biracki-dan` kao primarnu. Zadržavamo `/izborni-dan` kao ciljnu kanonsku rutu uz trajni redirect sa stare rute.
- **Offline i perzistencija**:
  - `src/lib/offline/indexed-db.ts`: Baza `izbori-offline` (verzija 1) sa prodavnicama `simulationHistory`, `userPreferences`, `trainingProgress`, `incidentNotes`, `knowledgeState`, `datasetFiles`, `datasetMeta`.
  - `public/sw.js`: Ručni Service Worker koji kešira shell (uključujući `/izborni-dan`) i immutable dataset snapshot-ove, sa zaštitom od neželjenog reload-a tokom rada.
- **Automatizovani testovi i čuvari**:
  - `src/lib/domain/simulator/engine.test.ts`: 14 jediničnih testova koji dokazuju grananje, odložene posledice, uloge, determinizam i counting validator.
  - `scripts/check-domain-guards.ts`, `scripts/check-training-coverage.ts`, `scripts/freeze-bootstrap.ts`: Strogi build skriptovi koji garantuju integritet domena i tipova.

---

## 2. Arhitektonski invarijanti i slojeviti model

### 2.1 Arhitektonski invarijanti
1. **Single Domain Source of Truth**:
   - Pravilo: *Ako podatak utiče na pravni ishod, skor, ruleIds, flagove ili odložene posledice, isključivi vlasnik je pravni domen (`SimulationState`). Ako podatak opisuje trenutno stanje živog sveta (pozicije, aktivni tajmeri, selekcija, animacije), vlasnik je XState / Game Runtime.*
   - XState kontekst **ne sadrži sopstvene paralelne flagove ili skorove**. XState drži `domainState: SimulationState` i menja ga isključivo kroz domenske funkcije.
2. **Domen podržava paralelne incidente bez promene starog simulatora**:
   - Postojeći `applyChoice()` je sekvencijalan (`currentEventId` → efekat → `pickNextEvent()`).
   - Uvodi se `resolveChoice()` koja primenjuje efekte na `SimulationState` bez obaveznog biranja sledećeg događaja.
   - `applyChoice()` ostaje 100% backwards-compatible wrapper oko `resolveChoice()` i `pickNextEvent()`.
3. **Nema sintetičkih kazni u Game Layer-u (Svaki ishod je autorski)**:
   - Ako korisnik propusti incident ili mu istekne vreme, Game Layer ne izmišlja posledice (npr. `-4 documentation`).
   - Svaki incident ima definisan `timeout: { simulationSeconds, choiceId }` koji se mapira na postojeći autorski `SimulationChoice`.
4. **Potpuni determinizam (Zero `Math.random()`)**:
   - Sve nasumične odluke (spawn birača, kašnjenja, red, noise događaji) idu kroz instancu `SeededRNG`.
   - `seed + actionLog = identična simulacija`.
5. **Simulacioni sat umesto `setTimeout`**:
   - Vreme igre teče kroz `simulationTimeMs` i diskretne `TICK` poruke (`deltaSimulationMs`).
   - Tajmeri incidenata se proveravaju kao `expiresAtSimulationTime <= currentSimulationTime`. Radi dosledno na 1x, 2x, 4x, pauzi i replay-u.
6. **Instance-Scoped Bridge**:
   - `createGameBridge()` kreira instancu po pokrenutoj igri; nema globalnog singleton-a koji bi uzrokovao curenje memorije na Fast Refresh-u ili unmount-u.
7. **Zero Disruption postojećeg interfejsa**:
   - `src/components/simulation-game.tsx` ostaje netaknut. Novi mod se aktivira kroz `simulator-mode-selector.tsx` uz opciju izbora klasičnog i 2D simulatora.

---

## 3. Detaljni dizajn komponenti i modela

### 3.1 Domain refactor za paralelne incidente (`src/lib/domain/simulator/`)
```typescript
// Nova čista funkcija koja razrešava samo efekte odluke:
export function resolveChoice(
  state: SimulationState,
  event: SimulationEvent,
  choice: SimulationChoice,
): SimulationState;

// Postojeći applyChoice postaje backwards-compatible wrapper:
export function applyChoice(
  state: SimulationState,
  event: SimulationEvent,
  choice: SimulationChoice,
  events: SimulationEvent[],
): SimulationState;
```

### 3.2 World Incident Binding i Active Incident
```typescript
export interface IncidentTrigger {
  type: "time" | "voter_arrival" | "flag" | "manual";
  simulationTime?: string; // HH:MM
  requiredFlags?: string[];
  roleFilter?: SimulationRole[];
}

export interface WorldIncidentBinding {
  eventId: string;
  trigger: IncidentTrigger;
  locationId: string;
  hotspotTarget: string;
  actions: Array<{
    worldActionId: string;
    label: string;
    choiceId: string;
    requiredRole?: SimulationRole;
  }>;
  timeout?: {
    simulationSeconds: number;
    choiceId: string; // Autorski ishod ako korisnik propusti incident
  };
}

export interface ActiveIncident {
  instanceId: string;
  eventId: string;
  binding: WorldIncidentBinding;
  spawnedAtSimulationTimeMs: number;
  expiresAtSimulationTimeMs?: number;
  locationId: string;
  isInspected: boolean;
}
```

### 3.3 Strukturirani Evidence Model
```typescript
export interface EvidenceRecord {
  id: string;
  eventId?: string;
  incidentInstanceId?: string;
  simulationTimeMs: number;
  timestamp: string; // "13:24"
  locationId: string; // npr. "voter-roll-desk", "booth-2", "entrance"
  observedFacts: string[];
  assumptions: string[];
  witnesses: string[];
  relatedRuleIds: string[];
  createdByRole: SimulationRole;
  source: "manual" | "world_interaction" | "system_generated";
  completeness: {
    time: boolean;
    location: boolean;
    facts: boolean;
    witnesses: boolean;
  };
}
```

### 3.4 Deterministic Seeded RNG (`src/game/random/seeded-rng.ts`)
```typescript
export class SeededRNG {
  constructor(seed: number);
  next(): number; // [0, 1)
  integer(min: number, max: number): number;
  pick<T>(items: T[]): T;
  chance(probability: number): boolean;
  getState(): number;
  setState(state: number): void;
}
```

### 3.5 XState 5 Game Orchestration Context
```typescript
export interface ElectionGameContext {
  runId: string;
  seed: number;
  rngState: number;
  
  // Isključivi vlasnik pravnog stanja:
  domainState: SimulationState;
  
  // Isključivo runtime / svet stanje:
  simulationTimeMs: number;
  speedMultiplier: 1 | 2 | 4;
  paused: boolean;
  
  activeIncidents: ActiveIncident[];
  evidenceNotebook: EvidenceRecord[];
  actionLog: GameActionLogEntry[];
  selectedHotspotId?: string;
  worldReady: boolean;
}
```

---

## 4. Next.js 16 Client Boundary i UI struktura

U skladu sa Next.js 16 preporukama za SSR-safe Client komponente:

```
src/app/izborni-dan/page.tsx (Server Component)
    │
    ▼
src/components/simulator/simulator-mode-selector.tsx ("use client")
    ├── [view === "classic"] ──► <SimulationGame /> (Netaknuta postojeća komponenta)
    └── [view === "game_2d"] ──► <DynamicGameSimulatorShell /> (next/dynamic sa { ssr: false })
                                      │
                                      ▼
                               src/components/simulator/game-simulator-shell.tsx
                                      │
                                      ▼
                               src/components/simulator/game-canvas.tsx
                                      │
                                      ▼
                               Phaser 4.2.1 Game Instance
```

---

## 5. Prilagođeni plan po fazama (Milestones M0 - M10)

| Faza | Cilj i sadržaj | Quality Gate | Status |
| :--- | :--- | :--- | :--- |
| **M0** | **Domain refactor za concurrent live simulation**:<br>• Izdvajanje `resolveChoice()` iz `applyChoice()` (100% backwards-compatible).<br>• Definisanje `WorldIncidentBinding`, `ActiveIncident`, `GameActionLogEntry`, `EvidenceRecord`.<br>• Implementacija `SeededRNG` i simulation clock matematike.<br>• Unit testovi za paralelne incidente i determinizam. | `npm run typecheck`<br>`npm test` | **ZAVRŠENO (12 test fajlova, 62 testa prolaze, build zelen)** |
| **M1** | **Phaser 4 / Next 16 / XState 5 spike + Bridge**:<br>• Instalacija `phaser@4.2.1`, `xstate@^5.32.6`, `@xstate/react@^5.0.5`.<br>• Instance-scoped `createGameBridge()`.<br>• `BootScene` + `PollingStationScene` (prostorija, 1 demo NPC, klik na sto/paravan).<br>• `simulator-mode-selector.tsx` sa `next/dynamic({ ssr: false })`. | `npm run typecheck`<br>`npm test`<br>`npm run build` | **ZAVRŠENO (14 test fajlova, 69 unit testova, Playwright E2E zelen, build zelen)** |
| **M2** | **Regularan tok birača + deterministički sat/RNG**:<br>• `VoterMachine` i waypoint kretanje kroz svih 7 stanica.<br>• Red, UV, identifikacija, spisak, sprej, listić, paravan, kutija, izlaz.<br>• 15-20 NPC birača, noise ponašanja (pitanja, pauze).<br>• Sat 06:00 → 20:00 (1x, 2x, 4x, pauza). | `npm run typecheck`<br>`npm test` | **ZAVRŠENO (17 test fajlova, 75 unit testova, Playwright E2E zelen, build zelen)** |
| **M3** | **E01-E10 kao World Incidents**:<br>• Prevođenje prvih 10 autorskih scenarija u svet (npr. E01 plakat, E03 paravan, E07 UV lampa, E08 isprava, E09 UV trag, E10 spisak).<br>• Kontekstualni panel akcija u React HUD-u sa filtriranjem po ulogama.<br>• Rešavanje incidenata pozivom `resolveChoice()`. | Unit testovi mapiranja<br>`npm test` | **ZAVRŠENO (17 test fajlova, 76 unit testova, Playwright E2E zelen, build zelen)** |
| **M4** | **Missed Incidents + Evidence Notebook + Odložene posledice**:<br>• Timeout neprimećenih incidenata (mapira se na `choiceId`).<br>• Strukturirana beležnica (činjenice vs pretpostavke).<br>• Realistic Mode (skriven skor i klasifikacija tokom dana).<br>• Odložene posledice (jutarnji problem otkriva se uveče). | Testovi za timeout i dokaze | **ZAVRŠENO (18 test fajlova, 80 unit testova, Playwright E2E zelen, build zelen)** |
| **M5** | **Diferencijacija uloga (Član BO, Posmatrač, Birač)**:<br>• Član BO: operativne radnje (premesti, unesi, organizuj).<br>• Posmatrač: nadgledanje, beležnica, skretanje pažnje predsedniku.<br>• Birač: prolazak kroz lično glasanje i zaštitu biračkog prava.<br>• Vodič kroz pravni položaj, ovlašćenja i zabrane po ulogama.<br>• Dinamička promena uloge u UI (`CHANGE_ROLE`). | Testovi dozvola po ulogama<br>`npm test`<br>Playwright E2E | **ZAVRŠENO (19 test fajlova, 87 unit testova, Playwright E2E zelen, build zelen)** |
| **M6** | **Counting Scene + Zapisnik**:<br>• Noćno osvetljenje i prelazak u `CountingScene` u 20:00.<br>• Centralni sto za brojanje (6 hotspota: neupotrebljeni, spisak, kontrolni list, kutija, sortiranje, zapisnik).<br>• Zvanični modal Zapisnika BO sa rubrikama 1–7 i statusnim bedževima Pravila A–D.<br>• Isključiva upotreba postojećeg `validateCounting()` i `validateRecordForensics()` (nula duplirane logike).<br>• Forenzička provera kontrolnog lista (čl. 116 ZINP), upis primedbi posmatrača i potpisivanje članova BO. | 20 test fajlova (93 testa)<br>Playwright E2E zelen<br>Next.js build zelen | **ZAVRŠENO (Paritet sa `validateCounting` i `validateRecordForensics`, testiran E2E tok posmatrača i člana BO)** |
| **M7** | **Replay + Save/Resume (GameSaveV1)**:<br>• Šema `GameSaveV1` bez sirovog XState stabla, perzistirana u IndexedDB (`simulationHistory`).<br>• Automatsko čuvanje na ključne akcije i ručno čuvanje u HUD-u.<br>• Baner za nastavak partije na ponovnom otvaranju stranice sa rehidratacijom mašine.<br>• Deterministički replay motor (`replaySimulation`) koji reprodukuje 100% identične bodove, flegove i istoriju iz `seed + actionLog`.<br>• Interaktivni `ReplayModal` sa koračanjem, prikazom po 6 kategorija bodova i JSON izvozom. | 21 test fajl (96 testova)<br>Playwright E2E zelen<br>Next.js build zelen | **ZAVRŠENO (Deterministička reprodukcija, IndexedDB perzistencija i Replay UI)** |
| **M8** | **Full Offline**:<br>• Proširenje precache liste u `public/sw.js` na `/simulator/biracki-dan`.<br>• Cache-first strategija za Next.js statičke skripte (`/_next/static/`), CSS, game assets (`/game-assets/`) i fontove u `SHELL_CACHE`.<br>• Zaštita od prekida toka i izolacija admin/auth ruta.<br>• Unit testovi konfiguracije i keš politika u `service-worker-config.test.ts`. | 21 test fajl (97 testova)<br>Playwright E2E zelen<br>Next.js build zelen | **ZAVRŠENO (Precache i Cache-First za skripte, assete i offline simulaciju)** |
| **M9** | **Mobile + A11y + Performance + Polish**:<br>• Mobile pan/drag i zoom podrška (pointermove & wheel) u scenama glasanja i brojanja.<br>• Responzivni Phaser `Scale.FIT` i automatsko centriranje za sve veličine ekrana.<br>• A11y tastaturni DOM fallback za sve interaktivne stanice i incidente (`Tab` / `Space` / `Enter`).<br>• Budžet performansi (maksimalno 6 NPC istovremeno, automatsko pauziranje na `visibilityState === "hidden"`, strogi unmount cleanup).<br>• `aria-live="off"` za brzi sat i `aria-live="polite"` za značajne statusne promene. | Playwright e2e testovi<br>`npm test`<br>Next.js build | **ZAVRŠENO (Mobile pan/zoom, A11y DOM fallback, 60/30 FPS budžet)** |
| **M10** | **Migracija celokupne biblioteke scenarija (E11–E30)**:<br>• Povezivanje preostalih 20 autorskih scenarija u `WORLD_INCIDENT_BINDINGS`.<br>• Autentične radnje za sve tri uloge (`clan_odbora`, `posmatrac`, `birac`), tačke u prostoru i autorski timeout-i.<br>• Specijalizovano filtriranje uloga za fazu brojanja glasova (`roleFilter: ["clan_odbora", "posmatrac"]` za E29 i E30).<br>• Validacija integriteta svih autorskih mapiranja (`validateIncidentBindings`).<br>• 2D mod kao primarni interaktivni doživljaj uz zadržavanje klasičnih kartica kao 100% netaknutog fallback-a. | 21 test fajl (97 testova)<br>Playwright E2E zelen<br>Next.js build zelen | **ZAVRŠENO (Svih 30 scenarija integrisano u 2D svet sa punom diferencijacijom uloga i autorskim posledicama)** |

---

## 6. A11y i budžet performansi

- **Pristupačnost (A11y)**:
  - `aria-live="off"` za brzi sat simulacije.
  - `aria-live="polite"` za promenu faze, novi uočeni incident, rezultat akcije, pauzu i debrief.
  - DOM lista aktivnih interaktivnih objekata i incidenata za navigaciju tastaturom (`Tab` / `Enter` / `Space`).
  - Podrška za `prefers-reduced-motion`.
- **Budžet performansi**:
  - Desktop: 60 FPS.
  - Mobile: 30+ FPS, uz ograničenje aktivnih NPC-eva (do 15 istovremeno).
  - Automatsko pauziranje game loop-a na `document.visibilityState === "hidden"`.
  - Strogi cleanup (`bridge.destroy()`, `game.destroy(true)`) na unmount React komponente.
