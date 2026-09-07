/**
 * Deterministički generator pseudoslučajnih brojeva (Mulberry32).
 * Strogi zahtev simulacije: u igri se NIGDE ne koristi Math.random().
 * Za isti početni seed i istu sekvencu poziva, generiše identične ishode.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) {
      this.state = 0x6d2b79f5;
    }
  }

  /**
   * Vraća broj u intervalu [0, 1).
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Vraća ceo broj u inkluzivnom rasponu [min, max].
   */
  integer(min: number, max: number): number {
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Bira slučajan element iz niza.
   */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("SeededRNG.pick ne može birati iz praznog niza.");
    }
    const index = this.integer(0, items.length - 1);
    return items[index];
  }

  /**
   * Vraća true sa datom verovatnoćom [0, 1].
   */
  chance(probability: number): boolean {
    if (probability <= 0) return false;
    if (probability >= 1) return true;
    return this.next() < probability;
  }

  /**
   * Vraća serijalizovano interno stanje generatora za Save/Resume i Replay.
   */
  getState(): number {
    return this.state;
  }

  /**
   * Postavlja interno stanje generatora.
   */
  setState(state: number): void {
    this.state = state >>> 0;
  }
}
