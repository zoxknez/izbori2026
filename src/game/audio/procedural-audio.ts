export type ProceduralAudioCue = "ui" | "incident" | "evidence" | "phase";

export const PROCEDURAL_AUDIO_CUES: Record<ProceduralAudioCue, { frequency: number; durationMs: number }> = {
  ui: { frequency: 520, durationMs: 45 },
  incident: { frequency: 280, durationMs: 120 },
  evidence: { frequency: 740, durationMs: 90 },
  phase: { frequency: 410, durationMs: 180 },
};

/** Lightweight, license-free audio. It creates AudioContext only after a cue. */
export class ProceduralAudio {
  private audioContext: AudioContext | null = null;
  private muted = false;
  private volume = 0.12;

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
      oscillator.type = cue === "incident" ? "triangle" : "sine";
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

  destroy() {
    void this.audioContext?.close();
    this.audioContext = null;
  }
}
