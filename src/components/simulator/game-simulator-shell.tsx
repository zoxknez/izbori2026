"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Volume2,
  VolumeX,
  ExternalLink,
} from "lucide-react";
import { ZmaiIcon } from "@/components/icons/zmai-icon";
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
  computeCanonicalStateHash,
  type GameSaveV1,
  type GameSaveV2,
  type WorldSimulationSaveState,
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
import { getWorldIncidentPresentation } from "@/game/world/world-incident-presentation";
import { SIMULATION_MODE_PROFILES } from "@/game/config/simulation-mode-profile";
import { buildDebriefTimeline } from "@/lib/domain/simulator/debrief-timeline";

interface GameSimulatorShellProps {
  initialRole?: SimulationRole;
  initialSeed?: number;
  initialMode?: "guided" | "realistic" | "stress";
}

export function GameSimulatorShell({
  initialRole = "clan_odbora",
  initialSeed,
  initialMode = "guided",
}: GameSimulatorShellProps) {
  // 1. Instance-scoped GameBridge
  const bridge = useMemo(() => createGameBridge(), []);

  // Save & Replay stanja
  const [activeSave, setActiveSave] = useState<GameSaveV2 | GameSaveV1 | null>(null);
  const [resumableSave, setResumableSave] = useState<GameSaveV2 | GameSaveV1 | null>(null);
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [worldSnapshot, setWorldSnapshot] = useState<WorldSimulationSaveState | null>(null);
  const worldSnapshotRef = useRef<WorldSimulationSaveState | null>(null);

  // 2. XState 5 Machine instanca (rehidrira se iz sačuvane sesije ukoliko postoji)
  const machine = useMemo(
    () =>
      createElectionDayMachine({
        role: initialRole,
        seed: initialSeed,
        mode: initialMode,
        save: activeSave ?? undefined,
      }),
    [initialRole, initialSeed, initialMode, activeSave],
  );

  const [state, send, actorRef] = useActor(
    machine,
    activeSave && "machineSnapshot" in activeSave && activeSave.machineSnapshot
      ? { snapshot: activeSave.machineSnapshot as never }
      : undefined,
  );
  const context = state.context;
  const activeSaveRef = useRef<GameSaveV2 | GameSaveV1 | null>(activeSave);
  const legalInterruptionsRef = useRef(context.legalInterruptions);

  useEffect(() => {
    activeSaveRef.current = activeSave;
  }, [activeSave]);

  useEffect(() => {
    legalInterruptionsRef.current = context.legalInterruptions;
  }, [context.legalInterruptions]);

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

  // Automatsko perzistiranje toka simulacije u IndexedDB (periodično ili na promenu akcija/faza, ne na svaki tick sata)
  useEffect(() => {
    if (
      context.actionLog.length === 0 &&
      context.evidenceNotebook.length === 0 &&
      !context.countingSession
    ) {
      return;
    }

    let isSubscribed = true;
    void (async () => {
      try {
        const snapshot = actorRef?.getPersistedSnapshot?.();
        // Freeze one coherent world version before the async WebCrypto hash.
        const worldForSave = worldSnapshotRef.current ?? worldSnapshot ?? {
          rngState: context.seed,
          deterministicCounter: context.deterministicCounter,
          nextEntityId: context.activeVoterCount,
          activeVoters: [],
          queueOrder: [],
          nextSpawnAtMs: 0,
          legalInterruptions: context.legalInterruptions,
        };
        const hash = await computeCanonicalStateHash({
          runId: context.runId,
          seed: context.seed,
          simulationTimeMs: context.simulationTimeMs,
          scores: context.domainState.scores,
          flags: context.domainState.flags,
          actionLogLength: context.actionLog.length,
          pollSchedule: context.pollSchedule,
          decisionHistory: context.domainState.history,
          activeIncidentIds: context.activeIncidents.map((i) => i.instanceId),
          missedIncidentIds: context.missedIncidents.map((i) => i.instanceId),
          boardProtocol: context.boardProtocol,
          rngState: worldForSave.rngState,
        });

        const saveObj: GameSaveV2 = {
          version: 2,
          runId: context.runId,
          savedAt: new Date().toISOString(),
          seed: context.seed,
          mode: context.mode,
          role: context.domainState.role,
          simulationTimeMs: context.simulationTimeMs,
          currentPhase: context.currentPhase,
          machineSnapshot: snapshot,
          domainState: context.domainState,
          worldSimulation: worldForSave,
          pollSchedule: context.pollSchedule,
          actionLog: context.actionLog,
          evidenceNotebook: context.evidenceNotebook,
          boardProtocol: context.boardProtocol,
          observerRecord: context.observerRecord,
          countingSession: context.countingSession,
          activeIncidentIds: context.activeIncidents.map((incident) => incident.instanceId),
          missedIncidentIds: context.missedIncidents.map((incident) => incident.instanceId),
          stateHash: hash,
        };

        if (isSubscribed) {
          await saveGameSession(saveObj);
        }
      } catch {
        // tiho ignorišemo greške u autosave-u
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [
    context.runId,
    context.seed,
    context.mode,
    context.domainState.role,
    context.currentPhase,
    context.actionLog.length,
    context.evidenceNotebook.length,
    context.countingSession,
    context.boardProtocol,
    context.observerRecord,
    worldSnapshot,
    actorRef,
  ]);

  const handleSaveGame = async () => {
    bridge.emit("REQUEST_WORLD_SNAPSHOT", {});
    const snapshot = actorRef?.getPersistedSnapshot?.();
    // The same frozen object must feed both the hash and the persisted payload.
    const worldForSave = worldSnapshotRef.current ?? worldSnapshot ?? {
      rngState: context.seed,
      deterministicCounter: context.deterministicCounter,
      nextEntityId: context.activeVoterCount,
      activeVoters: [],
      queueOrder: [],
      nextSpawnAtMs: 0,
      legalInterruptions: context.legalInterruptions,
    };
    const hash = await computeCanonicalStateHash({
      runId: context.runId,
      seed: context.seed,
      simulationTimeMs: context.simulationTimeMs,
      scores: context.domainState.scores,
      flags: context.domainState.flags,
      actionLogLength: context.actionLog.length,
      pollSchedule: context.pollSchedule,
      decisionHistory: context.domainState.history,
      activeIncidentIds: context.activeIncidents.map((i) => i.instanceId),
      missedIncidentIds: context.missedIncidents.map((i) => i.instanceId),
      boardProtocol: context.boardProtocol,
      rngState: worldForSave.rngState,
    });

    const saveObj: GameSaveV2 = {
      version: 2,
      runId: context.runId,
      savedAt: new Date().toISOString(),
      seed: context.seed,
      mode: context.mode,
      role: context.domainState.role,
      simulationTimeMs: context.simulationTimeMs,
      currentPhase: context.currentPhase,
      machineSnapshot: snapshot,
      domainState: context.domainState,
      worldSimulation: worldForSave,
      pollSchedule: context.pollSchedule,
      actionLog: context.actionLog,
      evidenceNotebook: context.evidenceNotebook,
      boardProtocol: context.boardProtocol,
      observerRecord: context.observerRecord,
      countingSession: context.countingSession,
      activeIncidentIds: context.activeIncidents.map((incident) => incident.instanceId),
      missedIncidentIds: context.missedIncidents.map((incident) => incident.instanceId),
      stateHash: hash,
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
  const [incidentCursor, setIncidentCursor] = useState(0);

  // Modal stanja
  const [isEvidenceTrayOpen, setIsEvidenceTrayOpen] = useState(false);
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isCountingModalOpen, setIsCountingModalOpen] = useState(false);
  const [previewRole, setPreviewRole] = useState<SimulationRole>(initialRole);

  // Status poruka za povratnu informaciju
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.12);

  const focusIncidentAt = useCallback((requestedIndex: number) => {
    const incidents = context.activeIncidents;
    if (incidents.length === 0) return;

    const index = ((requestedIndex % incidents.length) + incidents.length) % incidents.length;
    const incident = incidents[index];
    setIncidentCursor(index);
    setSelectedHotspot({
      hotspotId: incident.binding.hotspotTarget,
      locationId: incident.locationId,
      title: `Situacija: ${incident.eventId}`,
    });
    send({ type: "SELECT_HOTSPOT", hotspotId: incident.binding.hotspotTarget });
    bridge.emit("FOCUS_LOCATION", { locationId: incident.locationId });
    setStatusNotification(`Situacija ${index + 1}/${incidents.length}: ${incident.binding.locationId}. Kamera je fokusirana na mesto događaja.`);
  }, [bridge, context.activeIncidents, send]);

  useEffect(() => {
    setIncidentCursor((current) => Math.min(current, Math.max(0, context.activeIncidents.length - 1)));
  }, [context.activeIncidents.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        context.activeIncidents.length === 0
      ) {
        return;
      }

      if (event.key === "]") {
        event.preventDefault();
        focusIncidentAt(incidentCursor + 1);
      }
      if (event.key === "[") {
        event.preventDefault();
        focusIncidentAt(incidentCursor - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [context.activeIncidents.length, focusIncidentAt, incidentCursor]);

  const canClosePolls = useMemo(() => {
    const isScheduledClose = context.simulationTimeMs >= context.pollSchedule.effectiveCloseTimeMs;
    const isEarlyCloseLegal =
      context.pollSchedule.earlyCloseAtMs !== undefined &&
      context.simulationTimeMs >= context.pollSchedule.earlyCloseAtMs;
    return isScheduledClose || isEarlyCloseLegal;
  }, [context.simulationTimeMs, context.pollSchedule]);

  const handleClosePolls = () => {
    send({ type: "CLOSE_POLLS" });
    setStatusNotification("Nastupilo vreme zatvaranja (čl. 99 ZINP). Zatečeni birači u hodniku završavaju glasanje.");
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleFinishClosingAndCount = () => {
    send({ type: "FINISH_CLOSING" });
    bridge.emit("SWITCH_SCENE", { sceneKey: "CountingScene" });
    setIsCountingModalOpen(true);
    setStatusNotification("Svi zatečeni birači su glasali. Biračko mesto je zatvoreno, počinje prebrojavanje (čl. 100+ ZINP).");
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // 3. Povezivanje Bridge-a sa XState mašinom i autoritativnim vremenom
  useEffect(() => {
    bridge.emit("CLOCK_TICK", {
      simulationTimeMs: context.simulationTimeMs,
      paused: context.paused || context.systemPaused,
      speed: context.speed,
    });
    bridge.emit("PHASE_CHANGED", {
      phase: context.currentPhase,
      acceptingNewVoters: context.currentPhase === "voting",
    });
  }, [bridge, context.currentPhase, context.simulationTimeMs, context.paused, context.systemPaused, context.speed]);

  useEffect(() => {
    bridge.emit("WORLD_INCIDENT_PRESENTATIONS_CHANGED", {
      incidents: context.activeIncidents.map((incident) => ({
        ...incident,
        presentation: getWorldIncidentPresentation(incident),
      })),
    });
  }, [bridge, context.activeIncidents]);

  useEffect(() => {
    bridge.emit("EVIDENCE_MARKERS_CHANGED", { records: context.evidenceNotebook });
  }, [bridge, context.evidenceNotebook]);

  useEffect(() => {
    bridge.emit("AUDIO_SETTINGS_CHANGED", { muted: audioMuted, volume: audioVolume });
  }, [audioMuted, audioVolume, bridge]);

  useEffect(() => {
    bridge.emit("ROLE_CHANGED", { role: context.domainState.role });
  }, [bridge, context.domainState.role]);

  useEffect(() => {
    const unsubWorldReady = bridge.on("WORLD_READY", () => {
      send({ type: "WORLD_READY" });
      if (activeSaveRef.current?.version === 2) {
        bridge.emit("RESTORE_WORLD_STATE", activeSaveRef.current.worldSimulation);
      }
      bridge.emit("REQUEST_WORLD_SNAPSHOT", {});
    });

    const unsubWorldSnapshot = bridge.on("WORLD_STATE_SNAPSHOT", (data) => {
      const next = { ...data, legalInterruptions: legalInterruptionsRef.current };
      worldSnapshotRef.current = next;
      setWorldSnapshot(next);
    });

    const unsubClick = bridge.on("HOTSPOT_CLICKED", (data) => {
      setSelectedHotspot(data);
      send({ type: "SELECT_HOTSPOT", hotspotId: data.hotspotId });
      if (data.hotspotId === "counting-protocol") {
        setIsCountingModalOpen(true);
      }
    });

    const unsubNpcMetrics = bridge.on("NPC_METRICS_UPDATED", (data) => {
      send({
        type: "UPDATE_NPC_METRICS",
        activeVoterCount: data.activeVoterCount,
        queueLength: data.queueLength,
      });
    });

    // Simulacioni tajmer loop (šalje diskretne TICK poruke u milisekundama)
    let lastRealTime = performance.now();
    const intervalId = window.setInterval(() => {
      const now = performance.now();
      const deltaRealMs = now - lastRealTime;
      lastRealTime = now;
      send({ type: "TICK", deltaRealMs });
    }, 100);
    const snapshotIntervalId = window.setInterval(() => {
      bridge.emit("REQUEST_WORLD_SNAPSHOT", {});
    }, 5000);
    const handlePageHide = () => bridge.emit("REQUEST_WORLD_SNAPSHOT", {});
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      unsubWorldReady();
      unsubWorldSnapshot();
      unsubClick();
      unsubNpcMetrics();
      clearInterval(intervalId);
      clearInterval(snapshotIntervalId);
      window.removeEventListener("pagehide", handlePageHide);
      bridge.destroy();
    };
  }, [bridge, send]);

  // P1-5: Automatsko pauziranje pri skrivenom tabu (visibilitychange)
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.webdriver) {
      return;
    }
    const handleVisibilityChange = () => {
      if (document.hidden) {
        send({ type: "SYSTEM_PAUSE" });
        // Capture the latest deterministic world before the tab is suspended.
        // The snapshot also invalidates the autosave effect's world reference,
        // so the next persisted save uses the same world version it renders.
        bridge.emit("REQUEST_WORLD_SNAPSHOT", {});
      } else {
        send({ type: "SYSTEM_RESUME" });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [bridge, send]);

  // P0-8: Aktivni incident na selektovanom mestu
  const activeIncident = useMemo(() => {
    if (!selectedHotspot) return null;
    return context.activeIncidents.find(
      (inc) =>
        inc.binding.hotspotTarget === selectedHotspot.hotspotId ||
        inc.locationId === selectedHotspot.locationId,
    );
  }, [selectedHotspot, context.activeIncidents]);

  const activeBinding = useMemo(() => {
    if (!activeIncident) return null;
    return activeIncident.binding;
  }, [activeIncident]);

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
    bridge.emit("AUDIO_CUE_REQUESTED", { cue: "ui" });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  const currentRoleConfig = ROLE_CONFIGS[context.domainState.role];
  const modeProfile = SIMULATION_MODE_PROFILES[context.mode];

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
          <div className="flex flex-1 flex-wrap items-center gap-2">
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

      {/* 1. TOP HUD BAR (Visoko kontrastna komandna tabla) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/90 bg-gradient-to-r from-surface via-surface-2/90 to-surface px-4 py-3 shadow-lg backdrop-blur">
        {/* Sat i faza sa digitalnim izgledom */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-brand/40 bg-black/60 px-3.5 py-1.5 shadow-inner ring-1 ring-brand/30">
            <Clock className="h-4 w-4 text-brand animate-pulse" />
            <span
              className="font-mono text-base font-extrabold tracking-wider text-brand"
              aria-live="off" // A11y invariant: sat se često menja, aria-live isključen
            >
              {clockString}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="font-bold text-ink">Faza:</span>
            <span className="rounded-md bg-surface-2 px-2 py-0.5 font-medium text-ink-dim border border-border/60">
              {context.currentPhase === "pre_opening" && "Priprema pre otvaranja (06:00-07:00)"}
              {context.currentPhase === "voting" && "Glasanje u toku (07:00-20:00)"}
              {context.currentPhase === "closing" && "Zatvaranje i pražnjenje reda (20:00+)"}
              {context.currentPhase === "counting" && "Prebrojavanje i Zapisnik (20:00+)"}
              {context.currentPhase === "protocol" && "Overa Zapisnika biračkog odbora"}
              {context.currentPhase === "handover" && "Primopredaja izbornog materijala"}
              {context.currentPhase === "debrief" && "Završni debrief smene"}
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
              "flex h-8 w-8 items-center justify-center rounded-xl border transition-all",
              context.paused
                ? "border-amber-500/50 bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/30"
                : "border-border bg-surface-2 text-ink hover:border-brand/60 hover:text-brand",
            )}
            title={context.paused ? "Nastavi simulaciju" : "Pauziraj simulaciju"}
            aria-label={context.paused ? "Nastavi simulaciju" : "Pauziraj simulaciju"}
          >
            {context.paused ? <Play className="h-4 w-4 fill-amber-400" /> : <Pause className="h-4 w-4" />}
          </button>

          {([1, 2, 4] as const).map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => send({ type: "SET_SPEED", speed: spd })}
              className={cn(
                "h-8 rounded-xl px-2.5 text-xs font-bold transition-all",
                context.speed === spd && !context.paused
                  ? "bg-brand text-brand-ink shadow-md ring-2 ring-brand/40"
                  : "border border-border/80 bg-surface-2 text-ink-dim hover:text-ink hover:border-border",
              )}
            >
              {spd}x
            </button>
          ))}

          <button
            type="button"
            onClick={() => setAudioMuted((muted) => !muted)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface-2 text-ink-dim hover:border-brand/60 hover:text-brand"
            aria-label={audioMuted ? "Uključi zvuk" : "Isključi zvuk"}
            aria-pressed={audioMuted}
            title={audioMuted ? "Uključi zvuk" : "Isključi zvuk"}
          >
            {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <label className="sr-only" htmlFor="simulator-volume">Jačina zvuka</label>
          <input id="simulator-volume" type="range" min="0" max="1" step="0.01" value={audioVolume} onChange={(event) => setAudioVolume(Number(event.target.value))} className="hidden w-16 accent-brand sm:block" />

          {context.currentPhase !== "counting" && context.currentPhase !== "closed" && (
            <button
              type="button"
              data-testid="fast-forward-to-closing-button"
              onClick={() => {
                if (context.currentPhase === "pre_opening") {
                  send({ type: "ADVANCE_SIMULATION_TO", targetMs: context.pollSchedule.actualOpenTimeMs });
                  send({ type: "START_VOTING" });
                }
                send({
                  type: "ADVANCE_SIMULATION_TO",
                  targetMs: context.pollSchedule.effectiveCloseTimeMs,
                });
              }}
              className="flex h-8 items-center gap-1 rounded-xl border border-border/80 bg-surface-2 px-2.5 text-xs font-bold text-ink-dim hover:text-brand hover:border-brand/40 transition-all shadow-sm"
              title="Premotaj simulaciju do kraja glasanja (20:00)"
            >
              <FastForward className="h-3.5 w-3.5 text-brand" />
              <span className="hidden sm:inline">20:00</span>
            </button>
          )}
        </div>

        {/* Status uloge, brojanje, evidencija i debrief */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pitaj ZmAI dugme - otvara /zmai u novom tabu */}
          <a
            href="/zmai"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="ask-zmai-button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/60 transition-all shadow-sm"
            title="Pitaj ZmAI (CRTA AI asistenta) za savet ili proveru propisa (otvara se u novom tabu)"
          >
            <ZmaiIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pitaj ZmAI</span>
            <span className="sm:hidden">ZmAI</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </a>

          {/* Dugme za pregled i promenu uloge sa bojama specifičnim za svaku ulogu */}
          <button
            type="button"
            data-testid="role-selector-button"
            onClick={() => {
              setPreviewRole(context.domainState.role);
              setIsRoleModalOpen(true);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm",
              context.domainState.role === "clan_odbora" &&
                "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25",
              context.domainState.role === "posmatrac" &&
                "border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25",
              context.domainState.role === "birac" &&
                "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
            )}
            title="Klikni za vodič kroz ulogu i izbor perspektive"
          >
            {context.domainState.role === "clan_odbora" && <Gavel className="h-3.5 w-3.5 text-amber-400" />}
            {context.domainState.role === "posmatrac" && <Eye className="h-3.5 w-3.5 text-sky-400" />}
            {context.domainState.role === "birac" && <Vote className="h-3.5 w-3.5 text-emerald-400" />}
            <span>{currentRoleConfig.shortLabel}</span>
          </button>

          {/* Dugmad toka izbora po fazama (čl. 91, 99, 100 ZINP) */}
          {context.currentPhase === "pre_opening" && (
            <button
              type="button"
              data-testid="start-voting-button"
              onClick={() => send({ type: "START_VOTING" })}
              disabled={context.simulationTimeMs < context.pollSchedule.actualOpenTimeMs}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand/40 bg-brand/15 px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/25 shadow-sm"
              title="Zvanično otvori biračko mesto u 07:00 (čl. 91 ZINP)"
            >
              <Vote className="h-3.5 w-3.5" />
              <span>Otvori biračko mesto</span>
            </button>
          )}

          {context.currentPhase === "voting" && (
            <button
              type="button"
              data-testid="close-polls-button"
              disabled={!canClosePolls}
              onClick={handleClosePolls}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-sm",
                canClosePolls
                  ? "border-amber-500/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                  : "border-border/60 bg-surface-2 text-ink-dim opacity-60 cursor-not-allowed",
              )}
              title={
                canClosePolls
                  ? "Zatvori biračko mesto u 20:00 (čl. 99 ZINP)"
                  : `Glasanje traje do ${msToTimeString(context.pollSchedule.effectiveCloseTimeMs)} (trenutno ${clockString})`
              }
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Zatvori biračko mesto (čl. 99)</span>
            </button>
          )}

          {context.currentPhase === "closing" && (
            <button
              type="button"
              data-testid="finish-closing-button"
              disabled={context.queueLength > 0 || context.activeVoterCount > 0}
              onClick={handleFinishClosingAndCount}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-sm",
                context.queueLength === 0 && context.activeVoterCount === 0
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300 opacity-80 cursor-not-allowed",
              )}
              title={
                context.queueLength === 0 && context.activeVoterCount === 0
                  ? "Svi birači u hodniku su glasali. Pređi na prebrojavanje (čl. 100+ ZINP)"
                  : `Sačekajte da birači u redu završe glasanje (preostalo: ${context.queueLength + context.activeVoterCount})`
              }
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>
                {context.queueLength === 0 && context.activeVoterCount === 0
                  ? "Započni prebrojavanje"
                  : `Završetak glasanja (${context.queueLength + context.activeVoterCount})`}
              </span>
            </button>
          )}

          {context.currentPhase === "counting" && (
            <button
              type="button"
              data-testid="open-protocol-button"
              onClick={() => setIsCountingModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/50 bg-sky-500/20 px-3 py-1.5 text-xs font-bold text-sky-300 transition hover:bg-sky-500/30 shadow-md"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Zapisnik BO {context.countingSession?.isProtocolSigned ? "(Overen)" : ""}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="replay-button"
            onClick={() => setIsReplayOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
            title="Pregled toka i deterministički replay"
          >
            <History className="h-3.5 w-3.5 text-sky-400" />
            <span>Replay ({context.actionLog.length})</span>
          </button>

          <button
            type="button"
            data-testid="save-game-button"
            onClick={handleSaveGame}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
            title="Sačuvaj trenutno stanje partije u memoriji uređaja"
          >
            <Save className="h-3.5 w-3.5 text-brand" />
            <span>{saveFeedback ? saveFeedback : "Sačuvaj"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEvidenceTrayOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand/40 bg-brand/15 px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-brand/25 shadow-sm"
          >
            <NotebookPen className="h-3.5 w-3.5" />
            <span>Dokazi: {context.evidenceNotebook.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDebriefOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand/40 hover:text-brand"
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
            <span className="hidden rounded-md border border-amber-500/25 bg-surface/60 px-2 py-1 text-[10px] font-semibold text-amber-300 sm:inline">
              {context.mode === "guided" ? "Vođeni fokus" : context.mode === "realistic" ? "Realni pritisak" : "Stres: više problema"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {context.activeIncidents.map((incident, incidentIndex) => {
                const remainingSeconds = incident.expiresAtSimulationTimeMs === undefined
                  ? null
                  : Math.max(0, Math.ceil((incident.expiresAtSimulationTimeMs - context.simulationTimeMs) / 1000));
                return (
                  <button
                    key={incident.instanceId}
                    type="button"
                    title={remainingSeconds === null ? "Incident je aktivan dok se ne obradi" : `Preostalo vreme za reakciju: ${remainingSeconds} sekundi`}
                    onClick={() => focusIncidentAt(incidentIndex)}
                    aria-current={incidentCursor === incidentIndex ? "true" : undefined}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-[11px] font-semibold text-ink transition hover:border-amber-400 hover:text-amber-300",
                      incidentCursor === incidentIndex
                        ? "border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/50"
                        : "border-amber-500/30 bg-surface/70",
                    )}
                  >
                    <span>{incident.binding.locationId} · {incident.eventId}</span>
                    <span className={cn("font-mono text-[10px]", remainingSeconds !== null && remainingSeconds <= 10 ? "text-rose-400" : "text-amber-300")}>
                      {remainingSeconds === null ? "praćenje" : `⏱ ${remainingSeconds}s`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {modeProfile.showWorldHints && (
            <p className="text-[11px] font-medium text-amber-300/90">
              Savet: prvo pogledaj zonu sa aktivnim indikatorom, zatim izaberi ulogu odgovarajuću radnju.
            </p>
          )}

          <div className="flex items-center gap-1.5">
            {context.activeIncidents.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => focusIncidentAt(incidentCursor - 1)}
                  className="rounded-xl border border-amber-500/30 px-2.5 py-1.5 text-xs font-bold text-amber-300 transition hover:border-amber-400 hover:bg-amber-500/10"
                  aria-label="Prethodna aktivna situacija"
                  title="Prethodna situacija ([)"
                >
                  ←
                </button>
                <span className="rounded-lg border border-amber-500/20 bg-surface/60 px-2 py-1.5 font-mono text-[10px] font-bold text-amber-200" aria-live="polite">
                  {incidentCursor + 1}/{context.activeIncidents.length}
                </span>
                <button
                  type="button"
                  onClick={() => focusIncidentAt(incidentCursor + 1)}
                  className="rounded-xl border border-amber-500/30 px-2.5 py-1.5 text-xs font-bold text-amber-300 transition hover:border-amber-400 hover:bg-amber-500/10"
                  aria-label="Sledeća aktivna situacija"
                  title="Sledeća situacija (])"
                >
                  →
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => focusIncidentAt(incidentCursor)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/30"
              title="Fokusiraj izabranu situaciju u svetu (Fokus menjaš tasterima [ i ])"
            >
              <span>Fokusiraj u svetu</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. GLAVNI CANVAS (PHASER) */}
      <div className="relative">
        <GameCanvas key={context.runId} bridge={bridge} seed={context.seed} />
        <button
          type="button"
          data-testid="reset-camera-button"
          onClick={() => bridge.emit("RESET_CAMERA", {})}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-surface/90 text-ink-dim shadow-lg backdrop-blur transition hover:border-brand/60 hover:text-brand"
          aria-label="Resetuj prikaz kamere"
          title="Resetuj prikaz kamere"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Obaveštenje ako je selektovan objekat */}
        {statusNotification && (
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-surface/95 px-3.5 py-2 text-xs font-semibold text-emerald-400 shadow-lg backdrop-blur">
            <CheckCircle2 className="h-4 w-4" />
            <span>{statusNotification}</span>
          </div>
        )}
      </div>

      {/* 4. KONTEKSTUALNI ACTION PANEL ZA SELEKTOVANI HOTSPOT */}
      <div
        className={cn(
          "rounded-2xl border p-4 shadow-md transition-all",
          selectedHotspot
            ? "border-brand/60 bg-gradient-to-r from-surface via-surface-2/80 to-surface ring-1 ring-brand/30 shadow-brand/5"
            : "border-border/80 bg-surface/80",
        )}
      >
        {selectedHotspot ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-brand animate-ping" />
                <h3 className="text-sm font-extrabold text-ink">
                  Selektovano: <span className="text-brand">{selectedHotspot.title}</span>
                </h3>
              </div>
              <p className="mt-1 text-xs text-ink-dim">
                Lokacija u prostoru: <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-ink border border-border/60">{selectedHotspot.locationId}</code>
                <span className="mx-2 text-border">•</span>
                Aktivna uloga: <span className="font-bold text-ink">{currentRoleConfig.shortLabel}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEvidenceTrayOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink hover:border-brand/60 hover:text-brand transition shadow-sm"
              >
                <NotebookPen className="h-3.5 w-3.5 text-brand" />
                <span>Upiši u beležnicu dokaza</span>
              </button>

              {availableActions.map((act) => (
                <button
                  key={act.worldActionId}
                  type="button"
                  onClick={() =>
                    handleActionClick(act.worldActionId, act.choiceId, activeBinding!.eventId, act.label)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-extrabold text-brand-ink shadow-md transition-all hover:bg-brand-strong hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{act.label}</span>
                </button>
              ))}

              {selectedHotspot.hotspotId.startsWith("counting-") && (
                <button
                  type="button"
                  data-testid="inspect-protocol-btn"
                  onClick={() => setIsCountingModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-sky-500"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>Otvori Zapisnik o radu BO</span>
                </button>
              )}

              {!activeBinding && !selectedHotspot.hotspotId.startsWith("counting-") && (
                <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs text-ink-dim border border-border/70">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Stanica funkcioniše regularno. Nema uočenih nepravilnosti.</span>
                </div>
              )}

              {availableActions.length === 0 && activeBinding && !selectedHotspot.hotspotId.startsWith("counting-") && (
                <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs text-ink-dim border border-border/70 italic">
                  <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Ova situacija ne zahteva neposrednu radnju uloge &quot;{currentRoleConfig.shortLabel}&quot;.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-ink-dim">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <span className="font-medium">
                {context.currentPhase === "counting"
                  ? "Biračko mesto je zatvoreno u 20:00. Kliknite na sto za prebrojavanje ili Zapisnik za utvrđivanje rezultata."
                  : "Klikni na stanicu (UV lampa, spisak, sprej, paravan, kutija) ili birača u prostoru za detaljan pregled i radnje."}
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-ink-faint">
              <span>🖱️ Pan: drag</span>
              <span>•</span>
              <span>🔍 Zoom: točkić</span>
            </div>
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
                bridge.emit("FOCUS_LOCATION", { locationId: item.loc });
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
        onAddEvidence={(record) => {
          send({ type: "ADD_EVIDENCE", record });
          setStatusNotification(`Zabeleženo u beležnicu dokaza (${record.timestamp})`);
          bridge.emit("AUDIO_CUE_REQUESTED", { cue: "evidence" });
          setTimeout(() => setStatusNotification(null), 3000);
        }}
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
              const timeline = buildDebriefTimeline(context.actionLog, context.evidenceNotebook, context.missedIncidents);

              return (
                <div className="mt-4 flex flex-col gap-4">
                  <div className="rounded-2xl border border-border bg-surface-2 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-ink">Hronologija smene</h3>
                    {timeline.length === 0 ? (
                      <p className="mt-2 text-xs text-ink-dim">Još nema zabeleženih događaja.</p>
                    ) : (
                      <ol className="mt-3 space-y-2 border-l border-border pl-4">
                        {timeline.slice(-12).map((entry) => (
                          <li key={entry.id} className="relative text-xs">
                            <span className={cn("absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface-2", entry.kind === "timeout" ? "bg-amber-400" : entry.kind === "evidence" ? "bg-emerald-400" : "bg-sky-400")} />
                            <div className="flex items-center gap-2 font-bold text-ink"><span className="font-mono text-[10px] text-ink-dim">{entry.timestamp || "--:--"}</span><span>{entry.label}</span></div>
                            {entry.detail && <p className="mt-0.5 text-ink-dim">{entry.detail}</p>}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
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
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {([
                        ["Vreme", (record: (typeof context.evidenceNotebook)[number]) => record.completeness.time],
                        ["Lokacija", (record: (typeof context.evidenceNotebook)[number]) => record.completeness.location],
                        ["Činjenice", (record: (typeof context.evidenceNotebook)[number]) => record.completeness.facts],
                        ["Svedoci", (record: (typeof context.evidenceNotebook)[number]) => record.completeness.witnesses],
                      ] as const).map(([label, check]) => {
                        const percentage = context.evidenceNotebook.length === 0
                          ? 0
                          : Math.round((context.evidenceNotebook.filter(check).length / context.evidenceNotebook.length) * 100);
                        return (
                          <div key={label} className="rounded-xl border border-border/70 bg-surface p-2.5">
                            <div className="text-[10px] font-semibold text-ink-dim">{label}</div>
                            <div className={cn("mt-1 text-sm font-black", percentage >= 80 ? "text-emerald-400" : percentage >= 50 ? "text-amber-400" : "text-rose-400")}>{percentage}%</div>
                          </div>
                        );
                      })}
                    </div>
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
        boardProtocol={context.boardProtocol}
        observerRecord={context.observerRecord}
        onAddBoardRemark={(text) => send({ type: "ADD_BOARD_REMARK", member: "Član biračkog odbora", text })}
        onAddObserverRemark={(text) => {
          const observer = context.observerRecord.observers[0];
          if (observer) send({ type: "ADD_OBSERVER_REMARK", observerId: observer.id, organization: observer.organization, text });
        }}
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
