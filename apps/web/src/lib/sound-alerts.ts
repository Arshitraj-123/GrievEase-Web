/**
 * Web Audio API synthesizer for GrievEase in-app alerts.
 * Zero external mp3/wav audio assets or 3rd-party CDNs.
 * Produces emergency sirens, visitor doorbell chimes, and notification pips.
 */

class SoundAlertService {
  private ctx: AudioContext | null = null;
  private sirenOscillator: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenActive = false;
  private sirenInterval: any = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('grievease_audio_muted') === 'true';
  }

  public setMuted(muted: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('grievease_audio_muted', muted ? 'true' : 'false');
    if (muted) {
      this.stopSiren();
    }
  }

  /**
   * Two-tone pleasant chime for incoming visitor approval requests.
   */
  public playDoorbellChime(): void {
    if (this.isMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: E5 (659 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: C5 (523 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.25);
      gain2.gain.setValueAtTime(0.35, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.85);
    } catch {
      // Audio playback permitted only after user interaction
    }
  }

  /**
   * Loud repeating emergency warble siren for active SOS alerts.
   */
  public startEmergencySiren(): void {
    if (this.isMuted() || this.isSirenActive) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      this.isSirenActive = true;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.sirenOscillator = osc;
      this.sirenGain = gain;

      // Warble pitch up and down every 400ms
      let high = false;
      this.sirenInterval = setInterval(() => {
        if (!this.sirenOscillator || !this.ctx || this.ctx.state === 'closed') {
          this.stopSiren();
          return;
        }
        const now = this.ctx.currentTime;
        const targetFreq = high ? 650 : 980;
        this.sirenOscillator.frequency.cancelScheduledValues(now);
        this.sirenOscillator.frequency.linearRampToValueAtTime(targetFreq, now + 0.35);
        high = !high;
      }, 400);
    } catch {
      this.stopSiren();
    }
  }

  /**
   * Stop active emergency siren.
   */
  public stopSiren(): void {
    this.isSirenActive = false;
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.stop();
        this.sirenOscillator.disconnect();
      } catch {}
      this.sirenOscillator = null;
    }
    if (this.sirenGain) {
      try {
        this.sirenGain.disconnect();
      } catch {}
      this.sirenGain = null;
    }
  }

  /**
   * Short notification pip for general alerts.
   */
  public playNotificationPip(): void {
    if (this.isMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1050, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }
}

export const soundAlerts = new SoundAlertService();
