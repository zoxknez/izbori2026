import * as Phaser from "phaser";
import type { GameBridge } from "@/game/bridge/game-bridge";

export class BootScene extends Phaser.Scene {
  private bridge?: GameBridge;

  private seed?: number;

  constructor() {
    super({ key: "BootScene" });
  }

  init(data: { bridge?: GameBridge; seed?: number }) {
    this.bridge = data.bridge;
    this.seed = data.seed;
  }

  create() {
    // Generisanje proceduralnih tekstura za Milestone 1 (bez spoljnih asseta)
    this.generateProceduralTextures();

    // Prelazak na glavnu scenu biračkog mesta
    this.scene.start("PollingStationScene", { bridge: this.bridge, seed: this.seed });
  }

  private generateProceduralTextures() {
    // 1. Podne pločice (poboljšan kontrast, moderna plavičasto-siva osnova)
    const floor = this.make.graphics({ x: 0, y: 0 });
    floor.fillStyle(0x182232, 1);
    floor.fillRect(0, 0, 64, 64);
    floor.lineStyle(1, 0x27394f, 0.8);
    floor.strokeRect(0, 0, 64, 64);
    // Unutrašnji suptilni okvir za dubinu
    floor.fillStyle(0x1e2b3e, 0.6);
    floor.fillRoundedRect(3, 3, 58, 58, 4);
    floor.generateTexture("floor-tile", 64, 64);
    floor.destroy();

    // 2. Sto za birački odbor i stanice (kristalno jasan kontrast)
    const desk = this.make.graphics({ x: 0, y: 0 });
    desk.fillStyle(0x22334a, 1);
    desk.fillRoundedRect(0, 0, 124, 52, 8);
    desk.lineStyle(2, 0x476385, 1);
    desk.strokeRoundedRect(0, 0, 124, 52, 8);
    // Unutrašnja radna površina
    desk.fillStyle(0x2a3e59, 1);
    desk.fillRoundedRect(4, 4, 116, 44, 6);
    // Papiri i fascikle na stolu (beli i svetlo plavi)
    desk.fillStyle(0xf8fafc, 0.95);
    desk.fillRect(16, 10, 26, 32);
    desk.fillStyle(0x38bdf8, 0.9);
    desk.fillRect(52, 12, 30, 28);
    // Olovka
    desk.fillStyle(0xf59e0b, 1);
    desk.fillRect(90, 14, 4, 24);
    desk.generateTexture("table-desk", 124, 52);
    desk.destroy();

    // 3. Paravan za glasanje (sa jasnim krilima za tajnost i svetlijim prorezom)
    const booth = this.make.graphics({ x: 0, y: 0 });
    booth.fillStyle(0x1a2e40, 1);
    booth.fillRoundedRect(0, 0, 64, 48, 4);
    booth.lineStyle(2, 0x38bdf8, 1);
    booth.strokeRoundedRect(0, 0, 64, 48, 4);
    // Zavesa / unutrašnjost paravana
    booth.fillStyle(0x0284c7, 0.35);
    booth.fillRect(6, 6, 52, 36);
    // Polica za glasanje
    booth.fillStyle(0x38bdf8, 0.8);
    booth.fillRect(14, 30, 36, 6);
    booth.generateTexture("booth", 64, 48);
    booth.destroy();

    // 4. Glasačka kutija (poluprovidno akrilno telo sa plavim poklopcem i uočljivim kontrolnim listom)
    const box = this.make.graphics({ x: 0, y: 0 });
    box.fillStyle(0x1e293b, 0.9);
    box.fillRoundedRect(0, 0, 54, 54, 8);
    box.lineStyle(2.5, 0x38bdf8, 1);
    box.strokeRoundedRect(0, 0, 54, 54, 8);
    // Prorez za glasačke listiće na vrhu
    box.fillStyle(0x38bdf8, 1);
    box.fillRoundedRect(14, 6, 26, 5, 2);
    // Plavi zvanični pečat / brava
    box.fillStyle(0x0ea5e9, 1);
    box.fillCircle(44, 18, 4);
    // Kontrolni list na dnu kutije (bela hartija sa crvenim pečatom)
    box.fillStyle(0xffffff, 0.95);
    box.fillRect(16, 32, 22, 12);
    box.fillStyle(0xef4444, 0.9);
    box.fillCircle(22, 38, 3);
    box.generateTexture("ballot-box", 54, 54);
    box.destroy();

    // 5. Stylized NPC silueta birača (glava + ramena sa visokom vidljivošću)
    const npc = this.make.graphics({ x: 0, y: 0 });
    // Senka ispod
    npc.fillStyle(0x0f172a, 0.6);
    npc.fillCircle(18, 22, 14);
    // Ramena (tamnoplavo odelo)
    npc.fillStyle(0x334155, 1);
    npc.fillEllipse(18, 23, 26, 14);
    npc.lineStyle(1.5, 0x64748b, 1);
    npc.strokeEllipse(18, 23, 26, 14);
    // Glava
    npc.fillStyle(0xf8fafc, 1);
    npc.fillCircle(18, 13, 9);
    npc.lineStyle(2, 0x38bdf8, 1);
    npc.strokeCircle(18, 13, 9);
    npc.generateTexture("npc-avatar", 36, 36);
    npc.destroy();

    // 6. Plakat u hodniku (E01) sa jasnim upozorenjem
    const poster = this.make.graphics({ x: 0, y: 0 });
    poster.fillStyle(0xdc2626, 1);
    poster.fillRoundedRect(0, 0, 28, 36, 4);
    poster.lineStyle(2, 0xffffff, 1);
    poster.strokeRoundedRect(0, 0, 28, 36, 4);
    // Simbol zabrane / tekst plakata
    poster.fillStyle(0xffffff, 1);
    poster.fillRect(6, 8, 16, 3);
    poster.fillRect(6, 14, 16, 2);
    poster.fillRect(6, 18, 16, 2);
    poster.fillStyle(0xfef08a, 1);
    poster.fillCircle(14, 27, 4);
    poster.generateTexture("poster", 28, 36);
    poster.destroy();

    // 7. Veliki sto za prebrojavanje (Counting Table)
    const countDesk = this.make.graphics({ x: 0, y: 0 });
    countDesk.fillStyle(0x1e293b, 1);
    countDesk.fillRoundedRect(0, 0, 480, 180, 14);
    countDesk.lineStyle(3, 0x38bdf8, 1);
    countDesk.strokeRoundedRect(0, 0, 480, 180, 14);
    // Unutrašnja osvetljena podloga stola
    countDesk.fillStyle(0x172235, 1);
    countDesk.fillRoundedRect(10, 10, 460, 160, 10);
    countDesk.lineStyle(1.5, 0x334b6e, 0.8);
    countDesk.strokeRoundedRect(10, 10, 460, 160, 10);
    countDesk.generateTexture("counting-table-surface", 480, 180);
    countDesk.destroy();

    // 8. Snop neupotrebljenih listića (vezan plavom trakom)
    const unusedStack = this.make.graphics({ x: 0, y: 0 });
    unusedStack.fillStyle(0xf8fafc, 1);
    unusedStack.fillRoundedRect(0, 0, 46, 58, 4);
    unusedStack.lineStyle(2, 0x94a3b8, 1);
    unusedStack.strokeRoundedRect(0, 0, 46, 58, 4);
    // Sigurnosna traka preko snopa
    unusedStack.fillStyle(0x0284c7, 1);
    unusedStack.fillRect(0, 25, 46, 9);
    unusedStack.generateTexture("stack-unused", 46, 58);
    unusedStack.destroy();

    // 9. Kontrolni list sa zlatno-narandžastim pečatom
    const controlDoc = this.make.graphics({ x: 0, y: 0 });
    controlDoc.fillStyle(0xffedd5, 1);
    controlDoc.fillRoundedRect(0, 0, 38, 50, 3);
    controlDoc.lineStyle(2, 0xf97316, 1);
    controlDoc.strokeRoundedRect(0, 0, 38, 50, 3);
    // Pečat i linije potpisa
    controlDoc.fillStyle(0xf97316, 0.8);
    controlDoc.fillCircle(26, 35, 7);
    controlDoc.lineStyle(1.5, 0x9a3412, 0.9);
    controlDoc.lineBetween(6, 14, 32, 14);
    controlDoc.lineBetween(6, 22, 32, 22);
    controlDoc.generateTexture("doc-control-sheet", 38, 50);
    controlDoc.destroy();

    // 10. Zapisnik o radu biračkog odbora sa plavim zaglavljem
    const protocol = this.make.graphics({ x: 0, y: 0 });
    protocol.fillStyle(0xffffff, 1);
    protocol.fillRoundedRect(0, 0, 54, 70, 4);
    protocol.lineStyle(2.5, 0x2563eb, 1);
    protocol.strokeRoundedRect(0, 0, 54, 70, 4);
    // Plavo zaglavlje
    protocol.fillStyle(0x3b82f6, 1);
    protocol.fillRect(6, 6, 42, 10);
    protocol.lineStyle(1.5, 0x64748b, 0.8);
    protocol.lineBetween(8, 24, 46, 24);
    protocol.lineBetween(8, 33, 46, 33);
    protocol.lineBetween(8, 42, 46, 42);
    protocol.lineBetween(8, 51, 46, 51);
    // Crveni pečat na dnu
    protocol.fillStyle(0xef4444, 0.85);
    protocol.fillCircle(38, 58, 6);
    protocol.generateTexture("doc-protocol", 54, 70);
    protocol.destroy();
  }
}
