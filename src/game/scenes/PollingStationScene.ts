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

    // 1. Pod biračkog mesta
    this.add.tileSprite(width / 2, height / 2, width - 40, height - 40, "floor-tile");

    // Okvir prostorije (zidovi)
    const walls = this.add.graphics();
    walls.lineStyle(4, 0x334155, 1);
    walls.strokeRoundedRect(20, 20, width - 40, height - 40, 12);

    // Oznake zona
    this.add.text(40, 32, "ULAZ / HODNIK", {
      fontSize: "11px",
      color: "#64748b",
      fontFamily: "sans-serif",
      fontStyle: "bold",
    });

    this.add.text(width - 120, 32, "IZLAZ", {
      fontSize: "11px",
      color: "#64748b",
      fontFamily: "sans-serif",
      fontStyle: "bold",
    });

    this.add.text(width / 2 - 80, 32, "BIRAČKO MESTO BR. 14", {
      fontSize: "12px",
      color: "#94a3b8",
      fontFamily: "sans-serif",
      fontStyle: "bold",
    });

    // 2. Stanica 0: Plakat u hodniku (E01)
    const poster = this.add.sprite(50, 90, "poster");
    this.setupHotspot(poster, "hallway-poster", "entrance", "Plakat u hodniku");

    // 3. Stanica 1: UV stanica
    const uvTable = this.add.sprite(150, 160, "table-desk");
    this.add.text(150, 195, "UV provera", { fontSize: "10px", color: "#94a3b8" }).setOrigin(0.5);
    this.setupHotspot(uvTable, "uv-lamp-check", "uv-station", "UV Lampa");

    // 4. Stanica 2 & 3: Birački spisak i listići
    const rollTable = this.add.sprite(320, 160, "table-desk");
    this.add.text(320, 195, "Spisak i potpis", { fontSize: "10px", color: "#94a3b8" }).setOrigin(0.5);
    this.setupHotspot(rollTable, "voter-roll-table", "voter-roll-desk", "Birački spisak");

    const ballotTable = this.add.sprite(490, 160, "table-desk");
    this.add.text(490, 195, "Sprej i listići", { fontSize: "10px", color: "#94a3b8" }).setOrigin(0.5);
    this.setupHotspot(ballotTable, "ballot-table", "spray-station", "Izdavanje listića");

    // 5. Sto biračkog odbora sa rezervnim materijalom (E02)
    const boardTable = this.add.sprite(200, 480, "table-desk");
    this.add.text(200, 515, "Sto odbora / Materijal", { fontSize: "10px", color: "#94a3b8" }).setOrigin(0.5);
    this.setupHotspot(boardTable, "material-ballot-stack", "board-table", "Materijal i listići");

    // 6. Stanica 4: Paravani za glasanje (E03)
    const booth1 = this.add.sprite(680, 150, "booth");
    const booth2 = this.add.sprite(760, 150, "booth");
    const booth3 = this.add.sprite(840, 150, "booth");
    this.add.text(760, 195, "Paravani za glasanje", { fontSize: "10px", color: "#94a3b8" }).setOrigin(0.5);
    this.setupHotspot(booth1, "booth-angle", "voting-booths", "Paravan 1");
    this.setupHotspot(booth2, "booth-2", "voting-booths", "Paravan 2");
    this.setupHotspot(booth3, "booth-3", "voting-booths", "Paravan 3");

    // 7. Stanica 5: Glasačka kutija (E04, E05, E06)
    const box = this.add.sprite(760, 340, "ballot-box");
    this.add.text(760, 380, "Glasačka kutija", { fontSize: "10px", color: "#38bdf8" }).setOrigin(0.5);
    this.setupHotspot(box, "empty-box", "ballot-box-station", "Glasačka kutija");

    // 8. Prostor za posmatrače
    const observerDesk = this.add.sprite(500, 480, "table-desk");
    this.add.text(500, 515, "Posmatrači", { fontSize: "10px", color: "#94a3b8" }).setOrigin(0.5);
    this.setupHotspot(observerDesk, "observer-desk", "observer-area", "Sto posmatrača");

    // Indikator selekcije
    this.selectedIndicator = this.add.graphics();

    // Spawnovanje prvog birača odmah radi trenutnog prikaza
    this.spawnNextVoter();

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

  update(_time: number, delta: number) {
    this.elapsedTimeMs += delta;

    // Spawnovanje novih birača sa pauzama
    if (this.elapsedTimeMs >= this.nextSpawnTimeMs && this.voterPool.length > 0) {
      // Maksimalno 6 birača u isto vreme u prostoriji (perfomance & visual clarity)
      if (this.npcManager.getAllActiveVoters().length < 6) {
        this.spawnNextVoter();
      }
      this.nextSpawnTimeMs = this.elapsedTimeMs + this.rng.integer(7000, 14000);
    }

    // Ažuriranje kretanja i stanja svih stanica
    const { moves, completed } = this.npcManager.updateStationProgress(delta);

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
}
