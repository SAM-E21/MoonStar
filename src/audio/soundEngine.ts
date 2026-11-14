class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(mute ? 0 : 0.025, this.ctx.currentTime, 0.15);
    }
  }

  public startAmbient(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.ambientOsc) return;
    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 65.41; // Low C2 lunar hum
      filter.type = 'lowpass';
      filter.frequency.value = 220;
      gain.gain.value = this.muted ? 0 : 0.022;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      this.ambientOsc = osc;
      this.ambientGain = gain;
    } catch {
      // Audio blocked by browser policy until interaction
    }
  }

  public playTone(freq: number, duration = 0.12, type: OscillatorType = 'triangle', volume = 0.08): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.02);
    } catch {
      // Ignore
    }
  }

  public playClick(): void {
    this.playTone(580, 0.07, 'sine', 0.06);
  }

  public playSelectModule(): void {
    this.playTone(440, 0.08, 'triangle', 0.06);
    setTimeout(() => this.playTone(660, 0.11, 'triangle', 0.05), 45);
  }

  public playActionSuccess(): void {
    this.playTone(523.25, 0.09, 'triangle', 0.07);
    setTimeout(() => this.playTone(659.25, 0.1, 'triangle', 0.06), 60);
    setTimeout(() => this.playTone(783.99, 0.14, 'sine', 0.06), 120);
  }

  public playAlert(): void {
    this.playTone(340, 0.14, 'sawtooth', 0.05);
    setTimeout(() => this.playTone(280, 0.18, 'sawtooth', 0.05), 140);
  }

  public playLaunch(): void {
    this.playTone(261.63, 0.12, 'triangle', 0.07);
    setTimeout(() => this.playTone(392.0, 0.14, 'triangle', 0.07), 90);
    setTimeout(() => this.playTone(523.25, 0.22, 'sine', 0.08), 180);
  }
}

export const soundEngine = new SoundEngine();
