import type { HapticInput, TriggerOptions, WebHapticsOptions } from 'web-haptics';
import { prepareFeedback, type FeedbackPulse } from './trigger';
import { cancelVibration, requestVibration } from './vibration';

/** Browser vibration and optional audio/visual preview with an explicit lifetime. */
export class BrowserFeedback {
  private disposed = false;
  private generation = 0;
  private frame: number | undefined;
  private audio: AudioContext | undefined;
  private label: HTMLLabelElement | undefined;
  private checkbox: HTMLInputElement | undefined;
  constructor(private readonly options: WebHapticsOptions = {}) {}

  async trigger(input: HapticInput, options?: TriggerOptions): Promise<void> {
    if (this.disposed) return;
    const feedback = prepareFeedback(input, options);
    if (!feedback || !feedback.pattern.some((duration, index) => index % 2 === 0 && duration > 0)) return;
    this.stopPreview();
    const generation = this.generation;
    if (typeof navigator.vibrate === 'function') requestVibration(feedback.pattern, this);
    if (!this.options.debug && !this.options.showSwitch) return;
    const checkbox = this.ensureDOM();
    if (this.options.debug && typeof AudioContext !== 'undefined') {
      this.audio ??= new AudioContext();
      if (this.audio.state === 'suspended') await this.audio.resume();
    }
    // resume() can finish after cancel, replacement, disabling, or unmount.
    if (this.disposed || this.generation !== generation) return;
    this.run(feedback.events, generation, checkbox);
  }

  private ensureDOM(): HTMLInputElement {
    if (this.checkbox) return this.checkbox;
    const label = document.createElement('label');
    label.textContent = 'Haptic feedback';
    label.dataset.hapticPreview = '';
    label.style.cssText = 'position:fixed;bottom:10px;left:10px;padding:5px 10px;background:#000b;color:white;z-index:9999';
    label.hidden = !this.options.showSwitch;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.tabIndex = -1;
    label.append(checkbox);
    document.body.append(label);
    this.label = label;
    this.checkbox = checkbox;
    return checkbox;
  }

  private tick(intensity: number, checkbox: HTMLInputElement): void {
    checkbox.checked = !checkbox.checked;
    if (!this.audio) return;
    const buffer = this.audio.createBuffer(1, Math.ceil(this.audio.sampleRate * 0.004), this.audio.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index++) samples[index] = (Math.random() * 2 - 1) * Math.exp(-index / 25) * intensity * 0.5;
    const source = this.audio.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audio.destination);
    source.onended = () => source.disconnect();
    source.start();
  }

  private run(events: FeedbackPulse[], generation: number, checkbox: HTMLInputElement): void {
    let elapsed = 0;
    const segments = events.map(event => {
      const start = elapsed + event.delay;
      elapsed = start + event.duration;
      return { ...event, start, end: elapsed };
    });
    const start = performance.now();
    let lastTick = -Infinity;
    const frame = (now: number) => {
      if (this.disposed || generation !== this.generation) return;
      this.frame = undefined;
      const time = now - start;
      if (time >= elapsed) return;
      const segment = segments.find(event => time >= event.start && time < event.end);
      try {
        if (segment && segment.intensity > 0 && time - lastTick >= 16 + (1 - segment.intensity) * 184) {
          this.tick(segment.intensity, checkbox);
          lastTick = time;
        }
        this.frame = requestAnimationFrame(frame);
      } catch { this.stopPreview(); }
    };
    frame(start);
  }

  private stopPreview(): void {
    this.generation++;
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
  }
  cancel(): void { this.stopPreview(); cancelVibration(this); }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancel();
    this.label?.remove();
    this.label = undefined;
    this.checkbox = undefined;
    const audio = this.audio;
    this.audio = undefined;
    try { if (audio) void audio.close().catch(() => {}); } catch { /* Cleanup stays best-effort. */ }
  }
}
