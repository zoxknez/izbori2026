import * as Phaser from "phaser";
import type { GameBridge } from "@/game/bridge/game-bridge";
import { SeededRNG } from "@/game/random/seeded-rng";
import {
  generateVoterPopulation,
  NPCStationManager,
  type ActiveVoterEntity,
} from "@/game/systems/npc-system";
import {
  calculateMoveDurationMs,
  STATION_WAYPOINTS,
  type Point2D,
} from "@/game/world/routes";
import type { VoterProfile } from "@/game/machines/voter.machine";
import type { WorldIncidentPresentation } from "@/game/world/world-incident-presentation";
import type { EvidenceRecord } from "@/lib/domain/simulator/live-types";
import { getLogicalMovementPosition, isLogicalMovementComplete, type LogicalMovement } from "@/game/world/logical-movement";
import { ProceduralAudio } from "@/game/audio/procedural-audio";

interface VoterVisual {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
}

interface IncidentVisual {
  container: Phaser.GameObjects.Container;
  incidentId: string;
  presentation: WorldIncidentPresentation;
}

interface EvidenceMarkerVisual {
  container: Phaser.GameObjects.Container;
  recordId: string;
}

export class PollingStationScene extends Phaser.Scene {
  private bridge?: GameBridge;
  private rng!: SeededRNG;
  private npcManager!: NPCStationManager;
  private voterPool: VoterProfile[] = [];
  private nextSpawnTimeMs: number = 2000;
  private elapsedTimeMs: number = 0;

  private voterVisuals = new Map<string, VoterVisual>();
  private selectedIndicator?: Phaser.GameObjects.Graphics;

  private unsubClock?: () => void;
  private unsubSpeed?: () => void;
  private unsubSnapshot?: () => void;
  private unsubRestore?: () => void;
  private unsubPhase?: () => void;
  private isSimPaused: boolean = false;
  private simSpeed: number = 1;
  private acceptingNewVoters = false;
  private incidentVisuals = new Map<string, IncidentVisual>();
  private unsubIncidentPresentations?: () => void;
  private unsubFocusLocation?: () => void;
  private unsubEvidenceMarkers?: () => void;
  private evidenceMarkerVisuals = new Map<string, EvidenceMarkerVisual>();
  private logicalMovements = new Map<string, LogicalMovement>();
  private audio = new ProceduralAudio();
  private unsubAudioSettings?: () => void;
  private unsubAudioCue?: () => void;
  private reducedMotion = false;

  constructor() {
    super({ key: "PollingStationScene" });
  }

  init(data: { bridge?: GameBridge; seed?: number }) {
    this.bridge = data.bridge;
    this.rng = new SeededRNG(data.seed ?? 123456);
    this.npcManager = new NPCStationManager();
    this.voterPool = generateVoterPopulation(this.rng, 20);
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

    // Slušamo autoritativni CLOCK_TICK iz XState / GameBridge-a
    this.unsubClock = this.bridge?.on("CLOCK_TICK", (data) => {
      if (data.paused !== undefined) this.isSimPaused = data.paused;
      if (data.speed !== undefined) this.simSpeed = data.speed;
      const prevMs = this.elapsedTimeMs;
      this.elapsedTimeMs = data.simulationTimeMs;
      const effectiveDelta =
        data.deltaSimMs ?? (data.simulationTimeMs > prevMs ? data.simulationTimeMs - prevMs : 0);
      if (!this.isSimPaused && effectiveDelta > 0) {
        this.stepSimulation(effectiveDelta);
      }
    });

    this.unsubPhase = this.bridge?.on("PHASE_CHANGED", ({ acceptingNewVoters }) => {
      this.acceptingNewVoters = acceptingNewVoters;
    });
    this.unsubAudioSettings = this.bridge?.on("AUDIO_SETTINGS_CHANGED", (settings) => this.audio.setSettings(settings));
    this.unsubAudioCue = this.bridge?.on("AUDIO_CUE_REQUESTED", ({ cue }) => this.audio.play(cue));

    this.unsubSpeed = this.bridge?.on("SPEED_CHANGED", (data) => {
      this.simSpeed = data.speed;
      this.isSimPaused = data.paused;
    });

    this.unsubIncidentPresentations = this.bridge?.on("WORLD_INCIDENT_PRESENTATIONS_CHANGED", ({ incidents }) => {
      const incoming = new Map(incidents.map((incident) => [incident.instanceId, incident]));
      for (const [instanceId, visual] of this.incidentVisuals) {
        if (!incoming.has(instanceId)) {
          if (visual.presentation.resolvedVisual.remove) {
            visual.container.destroy();
            this.incidentVisuals.delete(instanceId);
          } else {
            visual.container.setAlpha(0.35);
          }
        }
      }
      for (const incident of incidents) {
        const existing = this.incidentVisuals.get(incident.instanceId);
        if (existing) continue;
        this.createIncidentVisual(incident.instanceId, incident.presentation);
      }
    });
    this.unsubFocusLocation = this.bridge?.on("FOCUS_LOCATION", ({ locationId, x, y }) => {
      const point = x !== undefined && y !== undefined ? { x, y } : this.getLocationFocusPoint(locationId);
      if (this.reducedMotion) {
        this.cameras.main.setScroll(point.x - this.scale.width / 2, point.y - this.scale.height / 2);
      } else {
        this.cameras.main.pan(point.x, point.y, 450, "Sine.easeInOut");
      }
    });
    this.unsubEvidenceMarkers = this.bridge?.on("EVIDENCE_MARKERS_CHANGED", ({ records }) => {
      const incoming = new Map(records.map((record) => [record.id, record]));
      for (const [recordId, marker] of this.evidenceMarkerVisuals) {
        if (!incoming.has(recordId)) {
          marker.container.destroy();
          this.evidenceMarkerVisuals.delete(recordId);
        }
      }
      for (const record of records) {
        if (!this.evidenceMarkerVisuals.has(record.id)) this.createEvidenceMarker(record);
      }
    });

    this.unsubSnapshot = this.bridge?.on("REQUEST_WORLD_SNAPSHOT", () => {
      this.renderLogicalMovements();
      const activeVoters = this.npcManager.getAllActiveVoters().map((v) => {
        const visual = this.voterVisuals.get(v.profile.id);
        return {
          profile: v.profile,
          actorSnapshot: v.actor.getPersistedSnapshot(),
          currentStation: v.currentStation,
          timeAtStationMs: v.timeAtStationMs,
          assignedBoothIndex: v.assignedBoothIndex,
          progress: v.timeAtStationMs,
          x: visual?.container.x ?? 0,
          y: visual?.container.y ?? 0,
        };
      });
      this.bridge?.emit("WORLD_STATE_SNAPSHOT", {
        // Snapshot always reflects the same simulation instant as the logical world.
        // Rendering is derived just before the payload is captured.
        rngState: this.rng.getState(),
        deterministicCounter: this.elapsedTimeMs,
        activeVoters,
        queueOrder: this.npcManager.getQueueOrder(),
        nextSpawnAtMs: this.nextSpawnTimeMs,
        nextEntityId: this.npcManager.getAllActiveVoters().length + this.npcManager.getCompletedVoterIds().length,
        voterPool: this.voterPool,
        completedVoterIds: this.npcManager.getCompletedVoterIds(),
      });
    });

    this.unsubRestore = this.bridge?.on("RESTORE_WORLD_STATE", (data) => {
      if (data.rngState !== undefined) {
        this.rng.setState(data.rngState);
      }
      if (data.nextSpawnAtMs !== undefined) this.nextSpawnTimeMs = data.nextSpawnAtMs;
      if (data.activeVoters) {
        this.logicalMovements.clear();
        const savedVoters = data.activeVoters as Array<Parameters<NPCStationManager["restoreVoters"]>[0][number] & { x?: number; y?: number }>;
        this.npcManager.restoreVoters(savedVoters, data.queueOrder ?? [], data.completedVoterIds ?? []);
        this.voterPool = (data.voterPool ?? []) as VoterProfile[];
        for (const visual of this.voterVisuals.values()) visual.container.destroy();
        this.voterVisuals.clear();
        const positionById = new Map(savedVoters.map((v) => [v.profile.id, { x: v.x, y: v.y }]));
        for (const entity of this.npcManager.getAllActiveVoters()) this.createVoterVisual(entity, positionById.get(entity.profile.id));
      }
    });

    this.events.on("shutdown", () => {
      this.unsubClock?.();
      this.unsubSpeed?.();
      this.unsubSnapshot?.();
      this.unsubRestore?.();
      this.unsubPhase?.();
      this.unsubIncidentPresentations?.();
      this.unsubFocusLocation?.();
      this.unsubEvidenceMarkers?.();
      this.unsubAudioSettings?.();
      this.unsubAudioCue?.();
      this.audio.destroy();
      for (const marker of this.evidenceMarkerVisuals.values()) marker.container.destroy();
      this.evidenceMarkerVisuals.clear();
    });

    this.events.on("destroy", () => {
      this.unsubClock?.();
      this.unsubSpeed?.();
      this.unsubSnapshot?.();
      this.unsubRestore?.();
      this.unsubPhase?.();
      this.unsubIncidentPresentations?.();
      this.unsubFocusLocation?.();
      this.unsubEvidenceMarkers?.();
      this.unsubAudioSettings?.();
      this.unsubAudioCue?.();
      this.audio.destroy();
      for (const marker of this.evidenceMarkerVisuals.values()) marker.container.destroy();
      this.evidenceMarkerVisuals.clear();
    });

    // 1. Pod biračkog mesta
    this.add.tileSprite(width / 2, height / 2, width - 40, height - 40, "floor-tile");

    // Okvir prostorije (zidovi sa osvetljenom linijom)
    const walls = this.add.graphics();
    walls.lineStyle(4, 0x475569, 1);
    walls.strokeRoundedRect(20, 20, width - 40, height - 40, 14);
    // Suptilna neonska konturna linija
    walls.lineStyle(1.5, 0x38bdf8, 0.4);
    walls.strokeRoundedRect(22, 22, width - 44, height - 44, 12);

    // Oznake zona sa jasnim pill bedževima
    this.createHeaderPill(85, 34, "🚪 ULAZ / HODNIK", "#38bdf8");
    this.createHeaderPill(width - 70, 34, "🚶 IZLAZ", "#10b981");
    this.createHeaderPill(width / 2, 34, "🏛️ BIRAČKO MESTO BR. 14", "#f1f5f9", 0.95);

    // 2. Stanica 0: Plakat u hodniku (E01)
    const poster = this.add.sprite(50, 95, "poster");
    this.setupHotspot(poster, "hallway-poster", "entrance", "Plakat u hodniku");
    this.createStationBadge(50, 122, "⚠️ Plakat", "#ef4444");

    // 3. Stanica 1: UV stanica
    const uvTable = this.add.sprite(150, 160, "table-desk");
    this.setupHotspot(uvTable, "uv-lamp-check", "uv-station", "UV Lampa");
    this.createStationBadge(150, 200, "1. UV provera", "#38bdf8");

    // 4. Stanica 2 & 3: Birački spisak i listići
    const rollTable = this.add.sprite(320, 160, "table-desk");
    this.setupHotspot(rollTable, "voter-roll-table", "voter-roll-desk", "Birački spisak");
    this.createStationBadge(320, 200, "2. Spisak i potpis", "#34d399");

    const ballotTable = this.add.sprite(490, 160, "table-desk");
    this.setupHotspot(ballotTable, "ballot-table", "spray-station", "Izdavanje listića");
    this.createStationBadge(490, 200, "3. Sprej i listići", "#fbbf24");

    // 5. Sto biračkog odbora sa rezervnim materijalom (E02)
    const boardTable = this.add.sprite(200, 480, "table-desk");
    this.setupHotspot(boardTable, "material-ballot-stack", "board-table", "Materijal i listići");
    this.createStationBadge(200, 520, "Sto biračkog odbora", "#818cf8");

    // 6. Stanica 4: Paravani za glasanje (E03)
    const booth1 = this.add.sprite(680, 150, "booth");
    const booth2 = this.add.sprite(760, 150, "booth");
    const booth3 = this.add.sprite(840, 150, "booth");
    this.setupHotspot(booth1, "booth-angle", "voting-booths", "Paravan 1");
    this.setupHotspot(booth2, "booth-2", "voting-booths", "Paravan 2");
    this.setupHotspot(booth3, "booth-3", "voting-booths", "Paravan 3");
    this.createStationBadge(760, 200, "4. Paravani za glasanje", "#38bdf8");

    // 7. Stanica 5: Glasačka kutija (E04, E05, E06)
    const box = this.add.sprite(760, 340, "ballot-box");
    this.setupHotspot(box, "empty-box", "ballot-box-station", "Glasačka kutija");
    this.createStationBadge(760, 385, "5. Glasačka kutija", "#60a5fa", 1);

    // 8. Prostor za posmatrače
    const observerDesk = this.add.sprite(500, 480, "table-desk");
    this.setupHotspot(observerDesk, "observer-desk", "observer-area", "Sto posmatrača");
    this.createStationBadge(500, 520, "Sto posmatrača", "#a78bfa");

    // Indikator selekcije
    this.selectedIndicator = this.add.graphics();

    // Mobile pan podrška: prevlačenje kamere prevlačenjem/dodirom
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown) {
        this.cameras.main.scrollX -= (p.x - p.prevPosition.x) / this.cameras.main.zoom;
        this.cameras.main.scrollY -= (p.y - p.prevPosition.y) / this.cameras.main.zoom;
      }
    });

    // Točkić miša / pinch zoom (0.85x do 1.4x)
    this.input.on("wheel", (_p: Phaser.Input.Pointer, _over: unknown[], _dx: number, dy: number) => {
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom - dy * 0.001, 0.85, 1.4);
      this.cameras.main.setZoom(newZoom);
    });

    // Obaveštenje Bridge-u da je svet spreman
    this.bridge?.emit("WORLD_READY", { width, height });
  }

  update(_time: number, _delta: number) {
    // Phaser update frame se ne koristi za nezavisno koračanje simulacije.
    // Autoritet za tok vremena ima isključivo XState preko CLOCK_TICK poruka.
  }

  private stepSimulation(effectiveDelta: number) {
    // Novi birači ulaze samo dok XState kaže da je glasanje otvoreno.
    if (this.acceptingNewVoters && this.elapsedTimeMs >= this.nextSpawnTimeMs && this.voterPool.length > 0) {
      // Maksimalno 6 birača u isto vreme u prostoriji (performanse i vizuelna preglednost)
      if (this.npcManager.getAllActiveVoters().length < 6) {
        this.spawnNextVoter();
      }
      this.nextSpawnTimeMs = this.elapsedTimeMs + this.rng.integer(7000, 14000);
    }

    // Ažuriranje kretanja i stanja svih stanica
    const { moves, completed } = this.npcManager.updateStationProgress(effectiveDelta);

    // Obrada kretanja
    for (const move of moves) {
      const visual = this.voterVisuals.get(move.voterId);
      const entity = this.npcManager.getActiveVoter(move.voterId);
      if (!visual || !entity) continue;

      const targetPoint = this.getTargetPoint(move.to, move.boothIndex);
      const duration = calculateMoveDurationMs(
        { x: visual.container.x, y: visual.container.y },
        targetPoint,
        entity.profile.walkSpeed,
      );

      this.logicalMovements.set(move.voterId, {
        from: { x: visual.container.x, y: visual.container.y },
        to: targetPoint,
        startedAtSimulationMs: this.elapsedTimeMs,
        durationSimulationMs: duration,
      });
    }

    // Ažuriranje pozicija u redu za one koji čekaju
    for (const entity of this.npcManager.getAllActiveVoters()) {
      if (entity.currentStation === "queue") {
        const queuePos = this.npcManager.getQueuePosition(entity.profile.id);
        const slot =
          STATION_WAYPOINTS.queue_slots[Math.min(queuePos, STATION_WAYPOINTS.queue_slots.length - 1)];
        const visual = this.voterVisuals.get(entity.profile.id);
        if (visual && slot) {
          const dx = Math.abs(visual.container.x - slot.x);
          const dy = Math.abs(visual.container.y - slot.y);
          if (dx > 3 || dy > 3) {
            const current = this.logicalMovements.get(entity.profile.id);
            if (!current || current.to.x !== slot.x || current.to.y !== slot.y) {
              this.logicalMovements.set(entity.profile.id, {
                from: { x: visual.container.x, y: visual.container.y },
                to: slot,
                startedAtSimulationMs: this.elapsedTimeMs,
                durationSimulationMs: 400,
              });
            }
          }
        }
      }
    }

    this.renderLogicalMovements();

    // Uklanjanje završenih birača
    for (const completedId of completed) {
      this.logicalMovements.delete(completedId);
      const visual = this.voterVisuals.get(completedId);
      if (visual) {
        this.tweens.add({
          targets: visual.container,
          alpha: 0,
          duration: 600,
          onComplete: () => {
            visual.container.destroy();
            this.voterVisuals.delete(completedId);
          },
        });
      }
    }

    // Obavesti sistem o metrikama
    this.bridge?.emit("NPC_METRICS_UPDATED", {
      activeVoterCount: this.npcManager.getAllActiveVoters().length,
      queueLength: this.npcManager.getQueueLength(),
    });
  }

  /** Derives render position from the authoritative simulation clock. */
  private renderLogicalMovements() {
    for (const [voterId, movement] of this.logicalMovements) {
      const visual = this.voterVisuals.get(voterId);
      if (!visual) {
        this.logicalMovements.delete(voterId);
        continue;
      }
      const position = getLogicalMovementPosition(movement, this.elapsedTimeMs);
      visual.container.x = position.x;
      visual.container.y = position.y;
      visual.container.setDepth(visual.container.y);
      if (isLogicalMovementComplete(movement, this.elapsedTimeMs)) this.logicalMovements.delete(voterId);
    }
  }

  private spawnNextVoter() {
    const nextProfile = this.voterPool.shift();
    if (!nextProfile) return;

    const entity = this.npcManager.spawnVoter(nextProfile);
    this.createVoterVisual(entity);
  }

  private createIncidentVisual(incidentId: string, presentation: WorldIncidentPresentation) {
    const { x, y } = presentation.visual.anchor;
    const color = presentation.attention.awareness === "high" ? 0xf59e0b : presentation.attention.awareness === "medium" ? 0x38bdf8 : 0xa78bfa;
    const container = this.add.container(x, y).setDepth(30);
    const ring = this.add.graphics();
    ring.lineStyle(2, color, 0.85);
    ring.strokeCircle(0, 0, 28);
    const badge = this.add.text(0, -40, `! ${presentation.attention.label}`, {
      fontSize: "10px", color: "#f8fafc", fontFamily: "sans-serif", fontStyle: "bold",
      backgroundColor: "rgba(15, 23, 42, 0.9)", padding: { x: 5, y: 3 },
    }).setOrigin(0.5);
    container.add([ring, badge]);
    if (presentation.attention.pulse) {
      if (!this.reducedMotion) this.tweens.add({ targets: ring, alpha: 0.35, scale: 1.18, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    container.setInteractive(new Phaser.Geom.Circle(0, 0, 34), Phaser.Geom.Circle.Contains);
    container.on("pointerdown", () => this.bridge?.emit("HOTSPOT_CLICKED", {
      hotspotId: presentation.hotspotTarget,
      locationId: presentation.locationId,
      title: presentation.attention.label,
    }));
    container.on("pointerdown", () => this.audio.play("incident"));
    this.incidentVisuals.set(incidentId, { container, incidentId, presentation });
  }

  private createEvidenceMarker(record: EvidenceRecord) {
    const point = this.getLocationFocusPoint(record.locationId);
    const container = this.add.container(point.x + 18, point.y - 18).setDepth(40);
    const pin = this.add.graphics();
    pin.fillStyle(0x10b981, 0.95);
    pin.fillCircle(0, 0, 9);
    pin.lineStyle(2, 0xecfdf5, 0.95);
    pin.strokeCircle(0, 0, 9);
    const label = this.add.text(0, -22, "✓ dokaz", {
      fontSize: "9px", color: "#d1fae5", fontFamily: "sans-serif", fontStyle: "bold",
      backgroundColor: "rgba(6, 78, 59, 0.92)", padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    container.add([pin, label]);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, 14), Phaser.Geom.Circle.Contains);
    container.on("pointerdown", () => this.bridge?.emit("HOTSPOT_CLICKED", {
      hotspotId: `evidence-${record.id}`,
      locationId: record.locationId,
      title: `Dokaz zabeležen u ${record.timestamp}`,
    }));
    this.evidenceMarkerVisuals.set(record.id, { container, recordId: record.id });
  }

  private getLocationFocusPoint(locationId: string): Point2D {
    const points: Record<string, Point2D> = {
      entrance: { x: 50, y: 95 },
      "uv-station": { x: 150, y: 160 },
      "voter-roll-desk": { x: 320, y: 160 },
      "voting-booths": { x: 760, y: 150 },
      "ballot-box-station": { x: 760, y: 340 },
      "observer-area": { x: 500, y: 480 },
    };
    return points[locationId] ?? { x: 500, y: 300 };
  }

  private createVoterVisual(entity: ActiveVoterEntity, savedPosition?: Partial<Point2D>) {
    const startPos = savedPosition?.x !== undefined && savedPosition.y !== undefined ? savedPosition as Point2D : STATION_WAYPOINTS.entrance;
    const container = this.add.container(startPos.x, startPos.y);
    container.setDepth(startPos.y);

    const sprite = this.add.sprite(0, 0, "npc-avatar");
    sprite.setInteractive({ useHandCursor: true });

    // Različita boja ramena zavisno od pola i starosti
    if (entity.profile.gender === "z") {
      sprite.setTint(0xf472b6);
    } else if (entity.profile.ageCategory === "senior") {
      sprite.setTint(0xa78bfa);
    }

    const label = this.add.text(0, -22, entity.profile.name, {
      fontSize: "9px",
      color: "#f8fafc",
      fontFamily: "sans-serif",
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5);

    container.add([sprite, label]);

    // Subtle waiting/idle motion: visual feedback only, never simulation state.
    if (!this.reducedMotion) this.tweens.add({
      targets: sprite,
      y: -2,
      duration: entity.currentStation === "queue" ? 900 : 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Klik na birača omogućava inspekciju
    sprite.on("pointerdown", () => {
      this.highlightContainer(container);
      this.bridge?.emit("HOTSPOT_CLICKED", {
        hotspotId: entity.profile.id,
        locationId: `voter-station-${entity.currentStation}`,
        title: `Birač: ${entity.profile.name}`,
      });
    });

    this.voterVisuals.set(entity.profile.id, { container, sprite, label });
  }

  private getTargetPoint(station: string, boothIndex?: number): Point2D {
    switch (station) {
      case "uv":
        return STATION_WAYPOINTS.uv_station;
      case "identification":
        return STATION_WAYPOINTS.identification;
      case "voter_roll":
        return STATION_WAYPOINTS.voter_roll;
      case "spray":
        return STATION_WAYPOINTS.spray;
      case "receive_ballot":
        return STATION_WAYPOINTS.receive_ballot;
      case "booth": {
        const idx = boothIndex ?? 0;
        return STATION_WAYPOINTS.booths[idx] ?? STATION_WAYPOINTS.booths[0];
      }
      case "ballot_box":
        return STATION_WAYPOINTS.ballot_box;
      case "exiting":
        return STATION_WAYPOINTS.exit_door;
      default:
        return STATION_WAYPOINTS.entrance;
    }
  }

  private setupHotspot(
    sprite: Phaser.GameObjects.Sprite,
    hotspotId: string,
    locationId: string,
    title: string,
  ) {
    sprite.setInteractive({ useHandCursor: true });

    sprite.on("pointerover", () => {
      sprite.setTint(0x7dd3fc);
      this.bridge?.emit("HOTSPOT_HOVERED", { hotspotId });
    });

    sprite.on("pointerout", () => {
      sprite.clearTint();
      this.bridge?.emit("HOTSPOT_HOVERED", { hotspotId: null });
    });

    sprite.on("pointerdown", () => {
      this.highlightObject(sprite);
      this.bridge?.emit("HOTSPOT_CLICKED", {
        hotspotId,
        locationId,
        title,
      });
    });
  }

  private highlightObject(target: Phaser.GameObjects.Sprite) {
    if (!this.selectedIndicator) return;
    this.selectedIndicator.clear();
    this.selectedIndicator.lineStyle(2, 0x38bdf8, 1);
    this.selectedIndicator.strokeCircle(target.x, target.y, Math.max(target.width, target.height) * 0.7);

    this.tweens.add({
      targets: target,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 150,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private highlightContainer(container: Phaser.GameObjects.Container) {
    if (!this.selectedIndicator) return;
    this.selectedIndicator.clear();
    this.selectedIndicator.lineStyle(2, 0x38bdf8, 1);
    this.selectedIndicator.strokeCircle(container.x, container.y, 24);

    this.tweens.add({
      targets: container,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 150,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private createHeaderPill(x: number, y: number, text: number | string, color: string, alpha = 0.85) {
    const txt = this.add
      .text(x, y, String(text), {
        fontSize: "11px",
        color,
        fontFamily: "sans-serif",
        fontStyle: "bold",
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5);

    return txt;
  }

  private createStationBadge(x: number, y: number, label: string, color: string, _depth = 0) {
    const badge = this.add
      .text(x, y, label, {
        fontSize: "10px",
        color,
        fontFamily: "sans-serif",
        fontStyle: "bold",
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5);

    // Blago pulsiranje za bolju interaktivnu uočljivost
    if (!this.reducedMotion) this.tweens.add({
      targets: badge,
      alpha: 0.75,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    return badge;
  }
}
