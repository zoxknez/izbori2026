export type ProceduralAudioCue = "ui" | "incident" | "evidence" | "phase" | "ambient" | "counting";

export const PROCEDURAL_AUDIO_CUES: Record<ProceduralAudioCue, { frequency: number; durationMs: number }> = {
  ui: { frequency: 520, durationMs: 45 },
  incident: { frequency: 280, durationMs: 120 },
  evidence: { frequency: 740, durationMs: 90 },
  phase: { frequency: 410, durationMs: 180 },
  ambient: { frequency: 145, durationMs: 240 },
  counting: { frequency: 220, durationMs: 70 },
};

/** Lightweight, license-free audio. It creates AudioContext only after a cue. */
export class ProceduralAudio {
  private audioContext: AudioContext | null = null;
  private muted = false;
  private volume = 0.12;
  private ambientTimer: number | null = null;
  private ambientCue: "ambient" | "counting" | null = null;

  setSettings(settings: { muted: boolean; volume: number }) {
    this.muted = settings.muted;
    this.volume = Math.max(0, Math.min(1, settings.volume));
  }

  play(cue: ProceduralAudioCue) {
    if (this.muted || this.volume <= 0 || typeof window === "undefined") return;
    try {
      const AudioContextCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      this.audioContext ??= new AudioContextCtor();
      void this.audioContext.resume();
      const now = this.audioContext.currentTime;
      const config = PROCEDURAL_AUDIO_CUES[cue];
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = cue === "incident" ? "triangle" : cue === "ambient" ? "sine" : "sine";
      oscillator.frequency.setValueAtTime(config.frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(this.volume, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + config.durationMs / 1000);
      oscillator.connect(gain).connect(this.audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + config.durationMs / 1000 + 0.02);
    } catch {
      // Audio restrictions must never block the simulator.
    }
  }

  /** Starts a very quiet, user-gesture-triggered room texture. */
  startAmbient(cue: "ambient" | "counting") {
    if (typeof window === "undefined") return;
    if (this.ambientCue === cue && this.ambientTimer !== null) return;
    this.stopAmbient();
    this.ambientCue = cue;
    this.play(cue);
    this.ambientTimer = window.setInterval(() => this.play(cue), cue === "ambient" ? 4800 : 3200);
  }

  stopAmbient() {
    if (this.ambientTimer !== null && typeof window !== "undefined") window.clearInterval(this.ambientTimer);
    this.ambientTimer = null;
    this.ambientCue = null;
  }

  destroy() {
    this.stopAmbient();
    void this.audioContext?.close();
    this.audioContext = null;
  }
}
