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

interface VoterVisual {
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
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

    this.unsubPhase = this.bridge?.on("PHASE_CHANGED", ({ phase }) => {
      this.acceptingNewVoters = phase === "voting";
    });

    this.unsubSpeed = this.bridge?.on("SPEED_CHANGED", (data) => {
      this.simSpeed = data.speed;
      this.isSimPaused = data.paused;
    });

    this.unsubSnapshot = this.bridge?.on("REQUEST_WORLD_SNAPSHOT", () => {
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
      if (data.activeVoters) {
        this.npcManager.restoreVoters(data.activeVoters as Parameters<NPCStationManager["restoreVoters"]>[0], data.queueOrder ?? [], data.completedVoterIds ?? []);
        this.voterPool = (data.voterPool ?? []) as VoterProfile[];
        for (const visual of this.voterVisuals.values()) visual.container.destroy();
        this.voterVisuals.clear();
        for (const entity of this.npcManager.getAllActiveVoters()) this.createVoterVisual(entity);
      }
    });

    this.events.on("shutdown", () => {
      this.unsubClock?.();
      this.unsubSpeed?.();
      this.unsubSnapshot?.();
      this.unsubRestore?.();
      this.unsubPhase?.();
    });

    this.events.on("destroy", () => {
      this.unsubClock?.();
      this.unsubSpeed?.();
      this.unsubSnapshot?.();
      this.unsubRestore?.();
      this.unsubPhase?.();
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

      this.tweens.add({
        targets: visual.container,
        x: targetPoint.x,
        y: targetPoint.y,
        duration,
        ease: "Linear",
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
            this.tweens.add({
              targets: visual.container,
              x: slot.x,
              y: slot.y,
              duration: 400,
              ease: "Sine.easeOut",
            });
          }
        }
      }
    }

    // Uklanjanje završenih birača
    for (const completedId of completed) {
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

  private spawnNextVoter() {
    const nextProfile = this.voterPool.shift();
    if (!nextProfile) return;

    const entity = this.npcManager.spawnVoter(nextProfile);
    this.createVoterVisual(entity);
  }

  private createVoterVisual(entity: ActiveVoterEntity) {
    const startPos = STATION_WAYPOINTS.entrance;
    const container = this.add.container(startPos.x, startPos.y);

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
    this.tweens.add({
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
