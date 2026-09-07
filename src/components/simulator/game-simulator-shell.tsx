"use client";

import { useEffect, useMemo, useState } from "react";
import { useActor } from "@xstate/react";
import {
  Clock,
  Eye,
  FastForward,
  Gavel,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Vote,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  X,
  Info,
  FileCheck2,
  Save,
  History,
} from "lucide-react";
import { createGameBridge } from "@/game/bridge/game-bridge";
import {
  createElectionDayMachine,
  evaluateDelayedConsequences,
} from "@/game/machines/election-day.machine";
import { GameCanvas } from "./game-canvas";
import { EvidenceTray } from "./evidence-tray";
import { CountingProtocolModal } from "./counting-protocol-modal";
import { ReplayModal } from "./replay-modal";
import {
  saveGameSession,
  loadGameSession,
  clearGameSession,
  type GameSaveV1,
} from "@/lib/domain/simulator/game-save";
import { initializeCountingSession } from "@/lib/domain/simulator/counting-session";
import { WORLD_INCIDENT_BINDINGS } from "@/lib/domain/simulator/incident-binding";
import { computeDebrief } from "@/lib/domain/simulator/engine";
import { msToTimeString } from "@/game/clock/simulation-clock";
import type { SimulationRole } from "@/lib/domain/simulator/types";
import {
  ROLE_CONFIGS,
  filterActionsForRole,
  getRoleGuidance,
} from "@/lib/domain/simulator/role-permissions";
import { cn } from "@/lib/utils";

interface GameSimulatorShellProps {
  initialRole?: SimulationRole;
  initialSeed?: number;
}

export function GameSimulatorShell({
  initialRole = "clan_odbora",
  initialSeed,
}: GameSimulatorShellProps) {
  // 1. Instance-scoped GameBridge
  const bridge = useMemo(() => createGameBridge(), []);

  // Save & Replay stanja
  const [activeSave, setActiveSave] = useState<GameSaveV1 | null>(null);
  const [resumableSave, setResumableSave] = useState<GameSaveV1 | null>(null);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // 2. XState 5 Machine instanca (rehidrira se iz sačuvane sesije ukoliko postoji)
  const machine = useMemo(
    () =>
      createElectionDayMachine({
        role: initialRole,
        seed: initialSeed,
        save: activeSave ?? undefined,
      }),
    [initialRole, initialSeed, activeSave],
  );

  const [state, send] = useActor(machine);
  const context = state.context;

  // Provera postojanja sačuvane sesije na pokretanju
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const existing = await loadGameSession();
        if (!cancelled && existing && existing.runId !== context.runId) {
          setResumableSave(existing);
        }
      } catch {
        // IndexedDB nedostupan
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [context.runId]);

  // Automatsko perzistiranje toka simulacije u IndexedDB
  useEffect(() => {
    if (
      context.actionLog.length > 0 ||
      context.evidenceNotebook.length > 0 ||
      context.countingSession
    ) {
      const saveObj: GameSaveV1 = {
        version: 1,
        runId: context.runId,
        savedAt: new Date().toISOString(),
        seed: context.seed,
        mode: context.mode,
        role: context.domainState.role,
        simulationTimeMs: context.simulationTimeMs,
        currentPhase: context.currentPhase,
        domainState: context.domainState,
        actionLog: context.actionLog,
        evidenceNotebook: context.evidenceNotebook,
        countingSession: context.countingSession,
      };
      void saveGameSession(saveObj);
    }
  }, [
    context.runId,
    context.seed,
    context.mode,
    context.domainState,
    context.simulationTimeMs,
    context.currentPhase,
    context.actionLog,
    context.evidenceNotebook,
    context.countingSession,
  ]);

  const handleSaveGame = async () => {
    const saveObj: GameSaveV1 = {
      version: 1,
      runId: context.runId,
      savedAt: new Date().toISOString(),
      seed: context.seed,
      mode: context.mode,
      role: context.domainState.role,
      simulationTimeMs: context.simulationTimeMs,
      currentPhase: context.currentPhase,
      domainState: context.domainState,
      actionLog: context.actionLog,
      evidenceNotebook: context.evidenceNotebook,
      countingSession: context.countingSession,
    };
    await saveGameSession(saveObj);
    setSaveFeedback("Sačuvano!");
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  // Lokalno stanje interfejsa za selektovani hotspot
  const [selectedHotspot, setSelectedHotspot] = useState<{
    hotspotId: string;
    locationId: string;
    title: string;
  } | null>(null);

  // Modal stanja
  const [isEvidenceTrayOpen, setIsEvidenceTrayOpen] = useState(false);
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCountingModalOpen, setIsCountingModalOpen] = useState(false);
  const [previewRole, setPreviewRole] = useState<SimulationRole>(initialRole);

  // Status poruka za povratnu informaciju
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const handleStartCounting = () => {
    send({ type: "START_COUNTING" });
    bridge.emit("SWITCH_SCENE", { sceneKey: "CountingScene" });
    setStatusNotification("Biračko mesto je zatvoreno u 20:00. Započeto je prebrojavanje glasova.");
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // 3. Povezivanje Bridge-a sa XState mašinom i React stanjem
  useEffect(() => {
    const unsubWorldReady = bridge.on("WORLD_READY", () => {
      send({ type: "WORLD_READY" });
    });

    const unsubClick = bridge.on("HOTSPOT_CLICKED", (data) => {
      setSelectedHotspot(data);
      send({ type: "SELECT_HOTSPOT", hotspotId: data.hotspotId });
      if (data.hotspotId === "counting-protocol") {
        setIsCountingModalOpen(true);
      }
    });

    // Simulacioni tajmer loop (šalje diskretne TICK poruke u milisekundama)
    let lastRealTime = performance.now();
    const intervalId = window.setInterval(() => {
      const now = performance.now();
      const deltaRealMs = now - lastRealTime;
      lastRealTime = now;
      send({ type: "TICK", deltaRealMs });
    }, 100);

    return () => {
      unsubWorldReady();
      unsubClick();
      clearInterval(intervalId);
      bridge.destroy();
    };
  }, [bridge, send]);

  // Aktivna vezivanja za trenutno selektovani hotspot
  const activeBinding = useMemo(() => {
    if (!selectedHotspot) return null;
    return Object.values(WORLD_INCIDENT_BINDINGS).find(
      (b) => b.hotspotTarget === selectedHotspot.hotspotId || b.locationId === selectedHotspot.locationId,
    );
  }, [selectedHotspot]);

  // Akcije specifične za ulogu
  const availableActions = useMemo(() => {
    if (!activeBinding) return [];
    return filterActionsForRole(activeBinding.actions, context.domainState.role);
  }, [activeBinding, context.domainState.role]);

  const clockString = msToTimeString(context.simulationTimeMs);

  const handleActionClick = (worldActionId: string, choiceId: string, eventId: string, label: string) => {
    send({
      type: "TRIGGER_WORLD_ACTION",
      eventId,
      choiceId,
      worldActionId,
    });
    setStatusNotification(`Preduzeta radnja: ${label}`);
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleRecordEvidence = () => {
    if (!selectedHotspot) return;
    const roleConfig = ROLE_CONFIGS[context.domainState.role];
    send({
      type: "ADD_EVIDENCE",
      record: {
        id: `ev-${Date.now()}`,
        simulationTimeMs: context.simulationTimeMs,
        timestamp: clockString,
        locationId: selectedHotspot.locationId,
        observedFacts: [`Zapažanje na lokaciji: ${selectedHotspot.title}`],
        assumptions: [],
        witnesses: [roleConfig.shortLabel],
        relatedRuleIds: [],
        createdByRole: context.domainState.role,
        source: "world_interaction",
        completeness: {
          time: true,
          location: true,
          facts: true,
          witnesses: true,
        },
      },
    });
    setStatusNotification(`Zabeleženo u beležnicu dokaza (${selectedHotspot.title})`);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const currentRoleConfig = ROLE_CONFIGS[context.domainState.role];

  return (
    <div className="flex flex-col gap-4">
      {/* 0. NOTIFIKACIJA ZA NASTAVAK PRETHODNO SAČUVANE PARTIJE */}
      {resumableSave && (
        <div
          data-testid="resumable-save-banner"
          className="flex flex-col gap-2 rounded-2xl border border-brand/40 bg-brand/10 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="text-xs font-medium text-ink">
              Pronađena sačuvana partija od{" "}
              <strong className="font-bold text-brand">
                {msToTimeString(resumableSave.simulationTimeMs)}
              </strong>{" "}
              (Uloga:{" "}
              <span className="font-semibold text-ink">
                {ROLE_CONFIGS[resumableSave.role]?.shortLabel ?? resumableSave.role}
              </span>
              , {resumableSave.actionLog.length} zabeleženih akcija).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="resume-game-button"
              onClick={() => {
                setActiveSave(resumableSave);
                setResumableSave(null);
                setStatusNotification("Uspešno nastavljena sačuvana partija!");
                setTimeout(() => setStatusNotification(null), 3000);
              }}
              className="rounded-xl bg-brand px-3.5 py-1.5 text-xs font-bold text-brand-contrast shadow-sm hover:opacity-90"
            >
              Nastavi partiju
            </button>
            <button
              type="button"
              data-testid="discard-save-button"
              onClick={() => {
                void clearGameSession();
                setResumableSave(null);
              }}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink-dim hover:text-ink hover:bg-surface-2"
            >
              Započni novu
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP HUD BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface px-4 py-3 shadow-sm">
        {/* Sat i faza */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-1.5 text-ink">
            <Clock className="h-4 w-4 text-brand" />
            <span
              className="font-mono text-base font-bold tracking-tight"
              aria-live="off" // A11y invariant: sat se često menja, aria-live isključen
            >
              {clockString}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-dim">
            <span className="font-semibold text-ink">Faza:</span>
            <span>
              {context.currentPhase === "pre_opening" && "Priprema pre otvaranja (06:00-07:00)"}
              {context.currentPhase === "voting" && "Glasanje u toku (07:00-20:00)"}
              {context.currentPhase === "counting" && "Prebrojavanje i Zapisnik (20:00+)"}
              {context.currentPhase === "closed" && "Zatvoreno biračko mesto"}
            </span>
          </div>
        </div>

        {/* Kontrole vremena */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => send({ type: "TOGGLE_PAUSE" })}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
              context.paused
                ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                : "border-border bg-surface-2 text-ink hover:border-brand/40",
            )}
            title={context.paused ? "Nastavi simulaciju" : "Pauziraj simulaciju"}
            aria-label={context.paused ? "Nastavi simulaciju" : "Pauziraj simulaciju"}
          >
            {context.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>

          {([1, 2, 4] as const).map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => send({ type: "SET_SPEED", speed: spd })}
              className={cn(
                "h-8 rounded-lg px-2.5 text-xs font-semibold transition-colors",
                context.speed === spd && !context.paused
                  ? "bg-brand text-brand-contrast shadow-sm"
                  : "border border-border bg-surface-2 text-ink-dim hover:text-ink",
              )}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Status uloge, brojanje, evidencija i debrief */}
        <div className="flex items-center gap-2">
          {/* Dugme za pregled i promenu uloge */}
          <button
            type="button"
            data-testid="role-selector-button"
            onClick={() => {
              setPreviewRole(context.domainState.role);
              setIsRoleModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-ink transition hover:border-brand/40"
            title="Klikni za vodič kroz ulogu i izbor perspektive"
          >
            {context.domainState.role === "clan_odbora" && <Gavel className="h-3.5 w-3.5 text-brand" />}
            {context.domainState.role === "posmatrac" && <Eye className="h-3.5 w-3.5 text-sky-400" />}
            {context.domainState.role === "birac" && <Vote className="h-3.5 w-3.5 text-emerald-400" />}
            <span className="font-semibold">{currentRoleConfig.shortLabel}</span>
          </button>

          {/* Dugme za brojanje glasova / Zapisnik */}
          {context.currentPhase === "counting" ? (
            <button
              type="button"
              data-testid="open-protocol-button"
              onClick={() => setIsCountingModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-400 transition hover:bg-sky-500/20 shadow-sm"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Zapisnik BO {context.countingSession?.isProtocolSigned ? "(Overen)" : ""}</span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="start-counting-button"
              onClick={handleStartCounting}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
              title="Zatvori biračko mesto u 20:00 i pređi na prebrojavanje"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Zatvori i broji (20:00)</span>
            </button>
          )}

          <button
            type="button"
            data-testid="replay-button"
            onClick={() => setIsReplayOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
            title="Pregled toka i deterministički replay"
          >
            <History className="h-3.5 w-3.5" />
            <span>Replay ({context.actionLog.length})</span>
          </button>

          <button
            type="button"
            data-testid="save-game-button"
            onClick={handleSaveGame}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
            title="Sačuvaj trenutno stanje partije u memoriji uređaja"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saveFeedback ? saveFeedback : "Sačuvaj"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEvidenceTrayOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand transition hover:bg-brand/20"
          >
            <NotebookPen className="h-3.5 w-3.5" />
            <span>Dokazi: {context.evidenceNotebook.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDebriefOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
          >
            <span>Završi smenu</span>
          </button>
        </div>
      </div>

      {/* ARIA Live notifikacija za značajne promene */}
      <div className="sr-only" aria-live="polite">
        {statusNotification}
      </div>

      {/* 2. AKTIVNE SITUACIJE U PROSTORU (INCIDENT TICKER) */}
      {context.activeIncidents.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            <span className="text-xs font-bold text-amber-500">
              Uočena situacija na biračkom mestu ({context.activeIncidents.length}):
            </span>
            <span className="text-xs font-medium text-ink">
              {context.activeIncidents[0].binding.locationId} (Događaj {context.activeIncidents[0].eventId})
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const inc = context.activeIncidents[0];
              setSelectedHotspot({
                hotspotId: inc.binding.hotspotTarget,
                locationId: inc.locationId,
                title: `Situacija: ${inc.eventId}`,
              });
              send({ type: "SELECT_HOTSPOT", hotspotId: inc.binding.hotspotTarget });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/30"
          >
            <span>Fokusiraj u svetu</span>
          </button>
        </div>
      )}

      {/* 3. GLAVNI CANVAS (PHASER) */}
      <div className="relative">
        <GameCanvas bridge={bridge} />

        {/* Obaveštenje ako je selektovan objekat */}
        {statusNotification && (
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-surface/95 px-3.5 py-2 text-xs font-semibold text-emerald-400 shadow-lg backdrop-blur">
            <CheckCircle2 className="h-4 w-4" />
            <span>{statusNotification}</span>
          </div>
        )}
      </div>

      {/* 4. KONTEKSTUALNI ACTION PANEL ZA SELEKTOVANI HOTSPOT */}
      <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-sm">
        {selectedHotspot ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold text-ink">Selektovano: {selectedHotspot.title}</h3>
              </div>
              <p className="mt-0.5 text-xs text-ink-dim">
                Lokacija u prostoru: <code className="rounded bg-surface-2 px-1 py-0.5">{selectedHotspot.locationId}</code>
                <span className="mx-2">•</span>
                Uloga: <span className="font-semibold text-ink">{currentRoleConfig.shortLabel}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRecordEvidence}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-ink hover:border-brand/40"
              >
                <NotebookPen className="h-3.5 w-3.5 text-brand" />
                <span>Upiši u beležnicu</span>
              </button>

              {availableActions.map((act) => (
                <button
                  key={act.worldActionId}
                  type="button"
                  onClick={() =>
                    handleActionClick(act.worldActionId, act.choiceId, activeBinding!.eventId, act.label)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-brand-contrast shadow-sm transition hover:opacity-90"
                >
                  <span>{act.label}</span>
                </button>
              ))}

              {selectedHotspot.hotspotId.startsWith("counting-") && (
                <button
                  type="button"
                  data-testid="inspect-protocol-btn"
                  onClick={() => setIsCountingModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-500"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>Otvori Zapisnik o radu BO</span>
                </button>
              )}

              {availableActions.length === 0 && activeBinding && !selectedHotspot.hotspotId.startsWith("counting-") && (
                <div className="flex items-center gap-2 text-xs text-ink-dim italic">
                  <Info className="h-3.5 w-3.5 text-amber-400" />
                  <span>Ova situacija ne zahteva radnju uloge &quot;{currentRoleConfig.shortLabel}&quot;.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-ink-dim">
            <span>
              {context.currentPhase === "counting"
                ? "📊 Izborno mesto je zatvoreno. Kliknite na sto za prebrojavanje ili Zapisnik za utvrđivanje rezultata."
                : "💡 Klikni na stanicu, paravan ili materijal u prostoru biračkog mesta za pregled i akcije."}
            </span>
            <span className="hidden sm:inline">Uloga: {currentRoleConfig.label}</span>
          </div>
        )}
      </div>

      {/* 5. A11Y DOM FALLBACK PANEL (Tastaturna alternativa canvasu) */}
      <div className="rounded-2xl border border-dashed border-border/70 bg-surface-2/40 p-4">
        <h4 className="text-xs font-bold tracking-wide text-ink-dim uppercase">
          Pristupačnost (A11y): {context.currentPhase === "counting" ? "Sto za prebrojavanje" : "Stanice i objekti u prostoru"}
        </h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {(context.currentPhase === "counting"
            ? [
                { id: "counting-unused", loc: "counting-table", title: "1. Neupotrebljeni listići (U)" },
                { id: "counting-voter-roll", loc: "counting-table", title: "2. Birački spisak (G)" },
                { id: "counting-control-sheet", loc: "counting-table", title: "3. Kontrolni list u kutiji" },
                { id: "counting-box-ballots", loc: "counting-table", title: "4. Listići u kutiji (B)" },
                { id: "counting-sorting", loc: "counting-table", title: "5. Razvrstavanje: Važeći/Nevažeći" },
                { id: "counting-protocol", loc: "counting-table", title: "6. Zapisnik o radu BO" },
              ]
            : [
                { id: "hallway-poster", loc: "entrance", title: "Plakat u hodniku" },
                { id: "uv-lamp-check", loc: "uv-station", title: "UV lampa" },
                { id: "voter-roll-table", loc: "voter-roll-desk", title: "Birački spisak" },
                { id: "ballot-table", loc: "spray-station", title: "Izdavanje listića" },
                { id: "material-ballot-stack", loc: "board-table", title: "Sto odbora / Materijal" },
                { id: "booth-angle", loc: "voting-booths", title: "Paravani za glasanje" },
                { id: "empty-box", loc: "ballot-box-station", title: "Glasačka kutija" },
              ]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedHotspot({
                  hotspotId: item.id,
                  locationId: item.loc,
                  title: item.title,
                });
                send({ type: "SELECT_HOTSPOT", hotspotId: item.id });
              }}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                selectedHotspot?.hotspotId === item.id
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-surface text-ink hover:border-border/80",
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* 6. MODAL ZA IZBOR I VODIČ KROZ ULOGU */}
      {isRoleModalOpen && (
        <div
          data-testid="role-guidance-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-border bg-surface p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Pravni položaj i uloga u simulaciji</h2>
                <p className="text-xs text-ink-dim">Izaberi perspektivu iz koje doživljavaš rad biračkog mesta</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="rounded-xl p-2 text-ink-dim hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Role Switcher Tabs */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["clan_odbora", "posmatrac", "birac"] as const).map((r) => {
                const cfg = ROLE_CONFIGS[r];
                const isCurrent = context.domainState.role === r;
                const isSelected = previewRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPreviewRole(r)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center transition",
                      isSelected
                        ? "border-brand bg-brand/10 text-brand shadow-sm font-bold"
                        : "border-border bg-surface-2/60 text-ink-dim hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    {r === "clan_odbora" && <Gavel className="h-5 w-5" />}
                    {r === "posmatrac" && <Eye className="h-5 w-5" />}
                    {r === "birac" && <Vote className="h-5 w-5" />}
                    <span className="text-xs">{cfg.shortLabel}</span>
                    {isCurrent && (
                      <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-semibold text-brand">
                        Aktivna
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Preview Role Details */}
            {(() => {
              const previewConfig = ROLE_CONFIGS[previewRole];
              const isCurrent = context.domainState.role === previewRole;

              return (
                <div className="mt-5 flex flex-col gap-4">
                  <div className="rounded-2xl border border-border/80 bg-surface-2/50 p-4">
                    <h3 className="text-sm font-bold text-ink">{previewConfig.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-dim">{previewConfig.summary}</p>
                  </div>

                  {/* Ključne odgovornosti */}
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Ključne odgovornosti i ovlašćenja:</span>
                    </div>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-ink/90">
                      {previewConfig.coreResponsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stroge zakonske zabrane */}
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wide">
                      <ShieldAlert className="h-4 w-4" />
                      <span>Stroge zakonske zabrane:</span>
                    </div>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-ink/90">
                      {previewConfig.strictProhibitions.map((proh, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{proh}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dugme za promenu uloge */}
                  <div className="mt-2 flex items-center justify-between border-t border-border/80 pt-4">
                    <span className="text-xs text-ink-dim">
                      {isCurrent
                        ? "Ova uloga je trenutno aktivna."
                        : "Promena uloge prilagođava dostupne akcije u prostoru."}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRoleModalOpen(false)}
                        className="rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-2"
                      >
                        Zatvori
                      </button>
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            send({ type: "CHANGE_ROLE", role: previewRole });
                            setStatusNotification(`Uloga promenjena u: ${previewConfig.label}`);
                            setIsRoleModalOpen(false);
                            setTimeout(() => setStatusNotification(null), 3000);
                          }}
                          className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-contrast shadow-sm hover:opacity-90"
                        >
                          Aktiviraj ulogu: {previewConfig.shortLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 7. BELEŽNICA DOKAZA (EVIDENCE TRAY) */}
      <EvidenceTray
        isOpen={isEvidenceTrayOpen}
        onClose={() => setIsEvidenceTrayOpen(false)}
        evidenceList={context.evidenceNotebook}
        currentClock={clockString}
        currentSimulationTimeMs={context.simulationTimeMs}
        currentRole={context.domainState.role}
        selectedLocationId={selectedHotspot?.locationId}
        onAddEvidence={(record) => send({ type: "ADD_EVIDENCE", record })}
      />

      {/* 8. ZAVRŠNI DEBRIEF MODAL (ODLOŽENE POSLEDICE & EVALUACIJA) */}
      {isDebriefOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-border bg-surface p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Debrief smene i odložene posledice</h2>
                <p className="text-xs text-ink-dim">Analiza zakonitosti i dokaznog traga na kraju dana</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDebriefOpen(false)}
                className="rounded-xl p-2 text-ink-dim hover:bg-surface-2 hover:text-ink"
              >
                ✕
              </button>
            </div>

            {/* Procena odloženih posledica */}
            {(() => {
              const consequences = evaluateDelayedConsequences(
                context.domainState,
                context.evidenceNotebook,
              );
              const debrief = computeDebrief(context.domainState);

              return (
                <div className="mt-4 flex flex-col gap-4">
                  {/* Rizik poništavanja */}
                  {consequences.hasAnnulmentRisk ? (
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                        <span>⚠ KRITIČAN RIZIK: Poništavanje glasanja po službenoj dužnosti</span>
                      </div>
                      <ul className="mt-2 list-disc pl-5 text-xs text-rose-300 space-y-1">
                        {consequences.annulmentReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Nema zakonskih osnova za poništavanje glasanja po službenoj dužnosti</span>
                      </div>
                    </div>
                  )}

                  {/* Propuštene situacije */}
                  <div className="rounded-2xl border border-border bg-surface-2 p-4">
                    <h3 className="text-xs font-bold text-ink uppercase tracking-wide">
                      Propuštene situacije tokom smene ({context.missedIncidents.length}):
                    </h3>
                    {context.missedIncidents.length === 0 ? (
                      <p className="mt-1 text-xs text-emerald-400">
                        ✓ Nijedna proceduralna situacija nije istekla bez reakcije.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-xs text-ink-dim">
                        {context.missedIncidents.map((m) => (
                          <li key={m.instanceId} className="flex items-center gap-2 text-amber-400">
                            <span>•</span>
                            <span>
                              Događaj {m.eventId} ({m.binding.locationId}): Vreme za reakciju je isteklo.
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Kvalitet evidencije */}
                  <div className="rounded-2xl border border-border bg-surface-2 p-4">
                    <h3 className="text-xs font-bold text-ink uppercase tracking-wide">
                      Ocena dokaznog lanca u beležnici:
                    </h3>
                    <p className="mt-1 text-xs text-ink-dim">
                      {consequences.documentationWeakness
                        ? "⚠ Slab dokazni trag: Zabeležene primedbe nemaju potvrđene svedoke ili nedostaju činjenice za prigovor."
                        : "✓ Solidan dokazni trag: Činjenice i svedoci su evidentirani sa vremenom nastanka."}
                    </p>
                  </div>

                  {/* Ukupan skor */}
                  <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-ink-dim">Ukupan proceduralni učinak:</h4>
                      <div className="text-2xl font-black text-brand">{debrief.totalPercentage}%</div>
                    </div>
                    <div className="text-right text-xs text-ink-dim">
                      Rešenih odluka: {context.domainState.history.length}
                      <br />
                      Zabeleženih dokaza: {context.evidenceNotebook.length}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDebriefOpen(false)}
                      className="rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-brand-contrast shadow-sm hover:opacity-90"
                    >
                      Nastavi smenu
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 9. ZAPISNIK O RADU BIRAČKOG ODBORA (COUNTING PROTOCOL MODAL) */}
      <CountingProtocolModal
        isOpen={isCountingModalOpen}
        onClose={() => setIsCountingModalOpen(false)}
        session={context.countingSession ?? initializeCountingSession(context.domainState)}
        currentRole={context.domainState.role}
        onUpdateSession={(updated) => send({ type: "UPDATE_COUNTING_SESSION", session: updated })}
      />

      {/* 10. DETERMINISTIČKI REPLAY I REVIZIJA ODLUKA */}
      <ReplayModal
        isOpen={isReplayOpen}
        onClose={() => setIsReplayOpen(false)}
        seed={context.seed}
        mode={context.mode}
        role={context.domainState.role}
        actionLog={context.actionLog}
        currentDomainState={context.domainState}
      />
    </div>
  );
}
