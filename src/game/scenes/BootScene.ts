import * as Phaser from "phaser";
import type { GameBridge } from "@/game/bridge/game-bridge";

export class BootScene extends Phaser.Scene {
  private bridge?: GameBridge;

  constructor() {
    super({ key: "BootScene" });
  }

  init(data: { bridge?: GameBridge }) {
    this.bridge = data.bridge;
  }

  create() {
    // Generisanje proceduralnih tekstura za Milestone 1 (bez spoljnih asseta)
    this.generateProceduralTextures();

    // Prelazak na glavnu scenu biračkog mesta
    this.scene.start("PollingStationScene", { bridge: this.bridge });
  }

  private generateProceduralTextures() {
    // 1. Podne pločice (suptilna svetlo siva/plavičasta tekstura)
    const floor = this.make.graphics({ x: 0, y: 0 });
    floor.fillStyle(0x131d2e, 1);
    floor.fillRect(0, 0, 64, 64);
    floor.lineStyle(1, 0x1e2c42, 0.6);
    floor.strokeRect(0, 0, 64, 64);
    floor.generateTexture("floor-tile", 64, 64);
    floor.destroy();

    // 2. Sto za birački odbor i materijal
    const desk = this.make.graphics({ x: 0, y: 0 });
    desk.fillStyle(0x243247, 1);
    desk.fillRoundedRect(0, 0, 120, 50, 6);
    desk.lineStyle(2, 0x3d5272, 1);
    desk.strokeRoundedRect(0, 0, 120, 50, 6);
    // Papiri na stolu
    desk.fillStyle(0xe2e8f0, 0.9);
    desk.fillRect(15, 10, 24, 30);
    desk.fillRect(45, 12, 28, 26);
    desk.generateTexture("table-desk", 120, 50);
    desk.destroy();

    // 3. Paravan za glasanje (sa krilima za tajnost)
    const booth = this.make.graphics({ x: 0, y: 0 });
    booth.fillStyle(0x1c2b3e, 1);
    booth.fillRect(0, 0, 60, 45);
    booth.lineStyle(2, 0x38bdf8, 0.8);
    // U-oblik paravana
    booth.strokeRect(0, 0, 60, 45);
    booth.fillStyle(0x0284c7, 0.2);
    booth.fillRect(5, 5, 50, 35);
    booth.generateTexture("booth", 60, 45);
    booth.destroy();

    // 4. Glasačka kutija (providno telo sa plavim poklopcem)
    const box = this.make.graphics({ x: 0, y: 0 });
    box.fillStyle(0x1e293b, 0.8);
    box.fillRoundedRect(0, 0, 50, 50, 8);
    box.lineStyle(2, 0x38bdf8, 1);
    box.strokeRoundedRect(0, 0, 50, 50, 8);
    // Prorez za listiće
    box.fillStyle(0x38bdf8, 1);
    box.fillRect(15, 6, 20, 3);
    // Kontrolni list na dnu
    box.fillStyle(0xf8fafc, 0.85);
    box.fillRect(16, 32, 18, 10);
    box.generateTexture("ballot-box", 50, 50);
    box.destroy();

    // 5. Stylized NPC silueta (glava + ramena)
    const npc = this.make.graphics({ x: 0, y: 0 });
    // Ramena
    npc.fillStyle(0x475569, 1);
    npc.fillEllipse(18, 22, 24, 12);
    // Glava
    npc.fillStyle(0xf1f5f9, 1);
    npc.fillCircle(18, 14, 9);
    npc.lineStyle(1.5, 0x0ea5e9, 1);
    npc.strokeCircle(18, 14, 9);
    npc.generateTexture("npc-avatar", 36, 36);
    npc.destroy();

    // 6. Plakat u hodniku (E01)
    const poster = this.make.graphics({ x: 0, y: 0 });
    poster.fillStyle(0xef4444, 1);
    poster.fillRect(0, 0, 24, 32);
    poster.lineStyle(1, 0xffffff, 0.8);
    poster.strokeRect(0, 0, 24, 32);
    poster.generateTexture("poster", 24, 32);
    poster.destroy();

    // 7. Veliki sto za prebrojavanje (Counting Table)
    const countDesk = this.make.graphics({ x: 0, y: 0 });
    countDesk.fillStyle(0x1e293b, 1);
    countDesk.fillRoundedRect(0, 0, 480, 180, 12);
    countDesk.lineStyle(3, 0x38bdf8, 0.8);
    countDesk.strokeRoundedRect(0, 0, 480, 180, 12);
    // Unutrašnja podloga stola
    countDesk.fillStyle(0x0f172a, 0.6);
    countDesk.fillRoundedRect(10, 10, 460, 160, 8);
    countDesk.generateTexture("counting-table-surface", 480, 180);
    countDesk.destroy();

    // 8. Snop neupotrebljenih listića (vezan trakom)
    const unusedStack = this.make.graphics({ x: 0, y: 0 });
    unusedStack.fillStyle(0xe2e8f0, 1);
    unusedStack.fillRect(0, 0, 44, 56);
    unusedStack.lineStyle(2, 0x94a3b8, 1);
    unusedStack.strokeRect(0, 0, 44, 56);
    // Sigurnosna traka preko snopa
    unusedStack.fillStyle(0x0284c7, 1);
    unusedStack.fillRect(0, 24, 44, 8);
    unusedStack.generateTexture("stack-unused", 44, 56);
    unusedStack.destroy();

    // 9. Kontrolni list
    const controlDoc = this.make.graphics({ x: 0, y: 0 });
    controlDoc.fillStyle(0xffedd5, 1);
    controlDoc.fillRect(0, 0, 36, 48);
    controlDoc.lineStyle(1.5, 0xf97316, 1);
    controlDoc.strokeRect(0, 0, 36, 48);
    // Pečat i linije potpisa
    controlDoc.fillStyle(0xf97316, 0.6);
    controlDoc.fillCircle(24, 34, 6);
    controlDoc.lineStyle(1, 0x9a3412, 0.8);
    controlDoc.lineBetween(6, 14, 30, 14);
    controlDoc.lineBetween(6, 22, 30, 22);
    controlDoc.generateTexture("doc-control-sheet", 36, 48);
    controlDoc.destroy();

    // 10. Zapisnik o radu biračkog odbora
    const protocol = this.make.graphics({ x: 0, y: 0 });
    protocol.fillStyle(0xf8fafc, 1);
    protocol.fillRect(0, 0, 52, 68);
    protocol.lineStyle(2, 0x2563eb, 1);
    protocol.strokeRect(0, 0, 52, 68);
    // Zlatni amblem / zaglavlje
    protocol.fillStyle(0x3b82f6, 1);
    protocol.fillRect(6, 6, 40, 8);
    protocol.lineStyle(1, 0x64748b, 0.7);
    protocol.lineBetween(8, 22, 44, 22);
    protocol.lineBetween(8, 30, 44, 30);
    protocol.lineBetween(8, 38, 44, 38);
    protocol.lineBetween(8, 46, 44, 46);
    protocol.generateTexture("doc-protocol", 52, 68);
    protocol.destroy();
  }
}
