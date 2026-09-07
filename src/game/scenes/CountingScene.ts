import * as Phaser from "phaser";
import type { GameBridge } from "@/game/bridge/game-bridge";
import { COUNTING_WORKFLOW_STEPS, nextCountingWorkflowStep } from "@/game/world/counting-workflow";
import { ProceduralAudio } from "@/game/audio/procedural-audio";

export interface CountingSceneData {
  bridge?: GameBridge;
  role?: string;
  hasControlListError?: boolean;
}

export class CountingScene extends Phaser.Scene {
  private bridge?: GameBridge;
  private selectedIndicator?: Phaser.GameObjects.Graphics;
  private workflowStep = 0;
  private workflowStatus?: Phaser.GameObjects.Text;
  private workflowProgress?: Phaser.GameObjects.Graphics;
  private workflowBadges = new Map<string, Phaser.GameObjects.Text>();
  private audio = new ProceduralAudio();
  private unsubAudioSettings?: () => void;
  private unsubAudioCue?: () => void;
  private unsubResetCamera?: () => void;
  private unsubAdvanceWorkflow?: () => void;
  private reducedMotion = false;

  constructor() {
    super({ key: "CountingScene" });
  }

  init(data: CountingSceneData) {
    this.bridge = data.bridge;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    this.unsubAudioSettings = this.bridge?.on("AUDIO_SETTINGS_CHANGED", (settings) => this.audio.setSettings(settings));
    this.unsubAudioCue = this.bridge?.on("AUDIO_CUE_REQUESTED", ({ cue }) => this.audio.play(cue));
    this.unsubResetCamera = this.bridge?.on("RESET_CAMERA", () => {
      this.cameras.main.centerOn(this.scale.width / 2, this.scale.height / 2);
      this.cameras.main.setZoom(1);
    });
    this.unsubAdvanceWorkflow = this.bridge?.on("ADVANCE_COUNTING_WORKFLOW", ({ hotspotId }) => {
      this.handleWorkflowInteraction(hotspotId);
    });

    // 1. Noćna atmosfera prostorije (zatvoreno biračko mesto posle 20:00)
    this.add.tileSprite(width / 2, height / 2, width - 40, height - 40, "floor-tile").setTint(0x8899aa);

    // Zidovi sa noćnim okvirom
    const walls = this.add.graphics();
    walls.lineStyle(4, 0x1e293b, 1);
    walls.strokeRoundedRect(20, 20, width - 40, height - 40, 12);

    // Oznaka faze u zaglavlju
    this.add.text(40, 32, "BIRAČKO MESTO ZATVORENO U 20:00", {
      fontSize: "12px",
      color: "#f59e0b",
      fontFamily: "sans-serif",
      fontStyle: "bold",
    });

    this.add.text(width - 260, 32, "FAZA: PREBROJAVANJE GLASOVA", {
      fontSize: "11px",
      color: "#38bdf8",
      fontFamily: "sans-serif",
      fontStyle: "bold",
    });

    // 2. Centralni sto za prebrojavanje (Counting Table)
    const tableCenterX = width / 2;
    const tableCenterY = height / 2 + 10;
    const table = this.add.sprite(tableCenterX, tableCenterY, "counting-table-surface");

    // Osvetljenje iznad stola za brojanje (topli reflektor za radnu noćnu atmosferu)
    const tableLight = this.add.graphics();
    tableLight.fillStyle(0x38bdf8, 0.08);
    tableLight.fillEllipse(tableCenterX, tableCenterY, 520, 220);

    this.add.text(tableCenterX, tableCenterY - 72, "📋 STO ZA PREBROJAVANJE I UTVRĐIVANJE REZULTATA", {
      fontSize: "11px",
      color: "#f8fafc",
      fontFamily: "sans-serif",
      fontStyle: "bold",
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      padding: { x: 10, y: 3 },
    }).setOrigin(0.5);
    this.workflowStatus = this.add.text(tableCenterX, tableCenterY + 72, "Tok rada: 1/6 · Neupotrebljeni listići", {
      fontSize: "10px",
      color: "#bae6fd",
      fontFamily: "sans-serif",
      fontStyle: "bold",
      backgroundColor: "rgba(15, 23, 42, 0.88)",
      padding: { x: 8, y: 3 },
    }).setOrigin(0.5);
    this.workflowProgress = this.add.graphics();

    // 3. Stanica 1: Neupotrebljeni listići (U)
    const unusedSprite = this.add.sprite(tableCenterX - 180, tableCenterY - 10, "stack-unused");
    this.createCountingBadge("counting-unused", tableCenterX - 180, tableCenterY + 34, "1. Neupotrebljeni (U)", "#cbd5e1");
    this.setupHotspot(unusedSprite, "counting-unused", "counting-table", "1. Neupotrebljeni listići (U)");

    // 4. Stanica 2: Birački spisak (G)
    const rollSprite = this.add.sprite(tableCenterX - 100, tableCenterY - 10, "table-desk").setScale(0.55);
    this.createCountingBadge("counting-voter-roll", tableCenterX - 100, tableCenterY + 34, "2. Spisak birača (G)", "#34d399");
    this.setupHotspot(rollSprite, "counting-voter-roll", "counting-table", "2. Birački spisak i potpisani birači (G)");

    // 5. Stanica 3: Kontrolni list u kutiji
    const controlSprite = this.add.sprite(tableCenterX - 20, tableCenterY - 10, "doc-control-sheet");
    this.createCountingBadge("counting-control-sheet", tableCenterX - 20, tableCenterY + 34, "3. Kontrolni list", "#fb923c");
    this.setupHotspot(controlSprite, "counting-control-sheet", "counting-table", "3. Kontrolni list u glasačkoj kutiji");

    // 6. Stanica 4: Listići u kutiji (B)
    const boxBallotsSprite = this.add.sprite(tableCenterX + 60, tableCenterY - 10, "ballot-box").setScale(0.8);
    this.createCountingBadge("counting-box-ballots", tableCenterX + 60, tableCenterY + 34, "4. Iz kutije (B)", "#38bdf8");
    this.setupHotspot(boxBallotsSprite, "counting-box-ballots", "counting-table", "4. Listići u glasačkoj kutiji (B)");

    // 7. Stanica 5: Razvrstavanje (V i N)
    const sortedSprite = this.add.sprite(tableCenterX + 130, tableCenterY - 10, "stack-unused").setTint(0x10b981);
    this.createCountingBadge("counting-sorting", tableCenterX + 130, tableCenterY + 34, "5. Važeći / Nevažeći", "#10b981");
    this.setupHotspot(sortedSprite, "counting-sorting", "counting-table", "5. Razvrstavanje: Važeći (V) i Nevažeći (N)");

    // 8. Stanica 6 & 7: Zapisnik o radu biračkog odbora
    const protocolSprite = this.add.sprite(tableCenterX + 195, tableCenterY - 10, "doc-protocol");
    this.createCountingBadge("counting-protocol", tableCenterX + 195, tableCenterY + 38, "6. Zapisnik BO", "#60a5fa");
    this.setupHotspot(protocolSprite, "counting-protocol", "counting-table", "6. Zapisnik o radu biračkog odbora");

    // 9. Članovi biračkog odbora sede oko stola (ozbiljna radna atmosfera)
    const boardSeats = [
      { x: tableCenterX - 140, y: tableCenterY - 105, label: "Član BO 1" },
      { x: tableCenterX, y: tableCenterY - 105, label: "Predsednik BO" },
      { x: tableCenterX + 140, y: tableCenterY - 105, label: "Član BO 2" },
      { x: tableCenterX - 140, y: tableCenterY + 105, label: "Član BO 3" },
      { x: tableCenterX + 140, y: tableCenterY + 105, label: "Član BO 4" },
    ];

    for (const seat of boardSeats) {
      const avatar = this.add.sprite(seat.x, seat.y, "npc-avatar");
      avatar.setScale(0.85);
      this.add.text(seat.x, seat.y + 20, seat.label, {
        fontSize: "9px",
        color: "#94a3b8",
        fontFamily: "sans-serif",
        fontStyle: "bold",
      }).setOrigin(0.5);
    }

    // 10. Posmatrači prate sa propisane udaljenosti (bez dodirivanja stola)
    const observerZone = this.add.graphics();
    observerZone.lineStyle(1.5, 0x0284c7, 0.6);
    observerZone.strokeRoundedRect(tableCenterX - 220, tableCenterY + 125, 440, 36, 8);
    this.add.text(tableCenterX, tableCenterY + 130, "👁️ ZONA ZA POSMATRAČE (Nadzor bez fizičkog dodirivanja materijala)", {
      fontSize: "9px",
      color: "#38bdf8",
      fontFamily: "sans-serif",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const observerAvatars = [tableCenterX - 100, tableCenterX, tableCenterX + 100];
    for (const ox of observerAvatars) {
      const obs = this.add.sprite(ox, tableCenterY + 145, "npc-avatar");
      obs.setScale(0.65).setTint(0x38bdf8);
    }

    // Indikator selekcije
    this.selectedIndicator = this.add.graphics();
    this.refreshWorkflowPresentation();

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

    // Obaveštenje Bridge-u da je brojanje spremno
    this.bridge?.emit("WORLD_READY", { width, height });
    this.events.once("shutdown", () => {
      this.unsubAudioSettings?.();
      this.unsubAudioCue?.();
      this.unsubResetCamera?.();
      this.unsubAdvanceWorkflow?.();
      this.audio.destroy();
    });
  }

  private setupHotspot(
    target: Phaser.GameObjects.Sprite,
    hotspotId: string,
    locationId: string,
    title: string,
  ) {
    target.setInteractive({ useHandCursor: true });

    target.on("pointerover", () => {
      target.setScale(target.scaleX * 1.08, target.scaleY * 1.08);
      this.bridge?.emit("HOTSPOT_HOVERED", { hotspotId });
    });

    target.on("pointerout", () => {
      target.setScale(target.scaleX / 1.08, target.scaleY / 1.08);
      this.bridge?.emit("HOTSPOT_HOVERED", { hotspotId: null });
    });

    target.on("pointerdown", () => {
      if (this.selectedIndicator) {
        this.selectedIndicator.clear();
        this.selectedIndicator.lineStyle(2, 0x38bdf8, 0.9);
        this.selectedIndicator.strokeCircle(target.x, target.y, Math.max(target.width, target.height) * 0.7);
      }

      this.bridge?.emit("HOTSPOT_CLICKED", {
        hotspotId,
        locationId,
        title,
      });
      this.bridge?.emit("AUDIO_CUE_REQUESTED", { cue: "ui" });
      this.handleWorkflowInteraction(hotspotId, target);
    });
  }

  private handleWorkflowInteraction(hotspotId: string, target?: Phaser.GameObjects.Sprite) {
    if (this.workflowStep >= COUNTING_WORKFLOW_STEPS.length) return;
    const nextStep = nextCountingWorkflowStep(this.workflowStep, hotspotId);
    if (nextStep === this.workflowStep) {
      this.workflowStatus?.setColor("#fbbf24").setText(
        `Tok rada: ${this.workflowStep + 1}/6 · prvo: ${COUNTING_WORKFLOW_STEPS[this.workflowStep].label}`,
      );
      if (!this.reducedMotion && target) this.tweens.add({ targets: target, x: target.x + 3, duration: 70, yoyo: true, repeat: 2 });
      return;
    }
    this.workflowStep = nextStep;
    if (this.workflowStep === COUNTING_WORKFLOW_STEPS.length) {
      this.workflowStatus?.setColor("#6ee7b7").setText("Tok rada: završen · podaci se proveravaju kroz zapisnik");
    } else {
      this.workflowStatus?.setColor("#bae6fd").setText(
        `Tok rada: ${this.workflowStep + 1}/6 · ${COUNTING_WORKFLOW_STEPS[this.workflowStep].label}`,
      );
    }
    if (!this.reducedMotion && target) this.tweens.add({ targets: target, scaleX: target.scaleX * 1.12, scaleY: target.scaleY * 1.12, duration: 140, yoyo: true });
    this.refreshWorkflowPresentation();
  }

  private refreshWorkflowPresentation() {
    const completedColor = "#6ee7b7";
    const currentColor = "#bae6fd";
    const pendingColor = "#64748b";
    for (let index = 0; index < COUNTING_WORKFLOW_STEPS.length; index += 1) {
      const step = COUNTING_WORKFLOW_STEPS[index];
      const badge = this.workflowBadges.get(step.hotspotId);
      if (!badge) continue;
      const isComplete = index < this.workflowStep;
      const isCurrent = index === this.workflowStep;
      badge.setColor(isComplete ? completedColor : isCurrent ? currentColor : pendingColor);
      badge.setAlpha(isComplete || isCurrent ? 1 : 0.66);
      badge.setText(`${isComplete ? "✓ " : isCurrent ? "› " : ""}${index + 1}. ${step.label}`);
    }

    if (!this.workflowProgress || !this.workflowStatus) return;
    this.workflowProgress.clear();
    const total = COUNTING_WORKFLOW_STEPS.length;
    const blockWidth = 38;
    const gap = 5;
    const startX = this.workflowStatus.x - (total * blockWidth + (total - 1) * gap) / 2;
    const y = this.workflowStatus.y + 24;
    for (let index = 0; index < total; index += 1) {
      const color = index < this.workflowStep ? 0x34d399 : index === this.workflowStep ? 0x38bdf8 : 0x334155;
      this.workflowProgress.fillStyle(color, index <= this.workflowStep ? 0.95 : 0.58);
      this.workflowProgress.fillRoundedRect(startX + index * (blockWidth + gap), y, blockWidth, 5, 2);
    }
  }

  private createCountingBadge(hotspotId: string, x: number, y: number, label: string, color: string) {
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

    if (!this.reducedMotion) this.tweens.add({
      targets: badge,
      alpha: 0.8,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.workflowBadges.set(hotspotId, badge);

    return badge;
  }
}
