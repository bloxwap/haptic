import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

function desktop() {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Linux');
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 desktop');
}

function setVibrate(value: (() => boolean) | undefined) {
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value });
}

async function loadEngine(vibrate: (() => boolean) | undefined) {
  vi.resetModules();
  desktop();
  setVibrate(vibrate);
  return import('../src/haptic');
}

function trackFrames() {
  const pending = new Set<number>();
  let next = 1;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    pending.add(next);
    void callback;
    return next++;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    pending.delete(id);
  });
  return pending;
}

class FakeAudioContext {
  sampleRate = 8000;
  destination = {};
  state = 'running';
  close = vi.fn(() => {
    this.state = 'closed';
    return Promise.resolve();
  });
  resume() { return Promise.resolve(); }
  createBiquadFilter() {
    return { type: '', frequency: { value: 0 }, Q: { value: 0 }, connect() {} };
  }
  createGain() {
    return { gain: { value: 0 }, connect() {} };
  }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(Math.max(1, length)) };
  }
  createBufferSource() {
    const source = {
      buffer: null as { getChannelData: (channel: number) => Float32Array } | null,
      connect() {},
      disconnect() {},
      start() {},
      onended: null as null | (() => void),
    };
    return source;
  }
}

function engineLabel() {
  return document.body.querySelector('label[data-haptic-preview]');
}

afterEach(() => {
  for (const label of document.body.querySelectorAll('label[data-haptic-preview]')) label.remove();
});

describe('browser feedback lifecycle', () => {
  it.each([{ debug: true }, { showSwitch: true }])('removes %j DOM and stops its animation frame on unmount', async webHapticsOptions => {
    const { Haptic } = await loadEngine(undefined);
    const pending = trackFrames();
    const contexts: FakeAudioContext[] = [];
    if (webHapticsOptions.debug) {
      vi.stubGlobal('AudioContext', class extends FakeAudioContext {
        constructor() {
          super();
          contexts.push(this);
        }
      });
    }
    const view = render(<Haptic webHapticsOptions={webHapticsOptions} feedback={1000}><button>Tap</button></Haptic>);
    await act(async () => { fireEvent.click(view.getByRole('button')); });
    expect(engineLabel()).not.toBeNull();
    expect(pending.size).toBeGreaterThan(0);
    view.unmount();
    expect(engineLabel()).toBeNull();
    expect(pending.size).toBe(0);
    if (webHapticsOptions.debug) expect(contexts.map(context => context.close)).toEqual([expect.any(Function)]);
    expect(contexts.every(context => context.state === 'closed')).toBe(true);
  });

  it('vibrates when navigator.vibrate appears after the engine module evaluates', async () => {
    const { Haptic } = await loadEngine(undefined);
    const vibrate = vi.fn(() => true);
    setVibrate(vibrate);
    const pending = trackFrames();
    const view = render(<Haptic><button>Tap</button></Haptic>);
    await act(async () => { fireEvent.click(view.getByRole('button')); });
    expect(vibrate).toHaveBeenCalledOnce();
    expect(engineLabel()).toBeNull();
    expect(pending.size).toBe(0);
    view.unmount();
  });

  it('does not mutate third-party support flags', async () => {
    const vibrate = vi.fn(() => true);
    const { Haptic } = await loadEngine(vibrate);
    const set = vi.spyOn(Reflect, 'set');
    const view = render(<Haptic><button>Tap</button></Haptic>);
    await act(async () => { fireEvent.click(view.getByRole('button')); });
    expect(vibrate).toHaveBeenCalledOnce();
    expect(engineLabel()).toBeNull();
    expect(set.mock.calls.filter(call => call[1] === 'isSupported')).toEqual([]);
    view.unmount();
  });
});

it('only cancels the actuator when the disposed component still owns it', async () => {
  const vibrate = vi.fn(() => true); const { Haptic } = await loadEngine(vibrate);
  const a = render(<Haptic><button>A</button></Haptic>), b = render(<Haptic feedback="buzz"><button>B</button></Haptic>);
  fireEvent.click(a.getByText('A')); fireEvent.click(b.getByText('B')); vibrate.mockClear();
  a.unmount(); expect(vibrate).not.toHaveBeenCalled(); b.unmount(); expect(vibrate).toHaveBeenCalledExactlyOnceWith(0);
});
it('component cleanup cannot cancel an imperative request through either public API', async () => {
  const vibrate = vi.fn(() => true); const { Haptic } = await loadEngine(vibrate);
  const { triggerHaptic } = await import('../src/trigger'); const { haptics } = await import('../src/web');
  for (const request of [() => triggerHaptic('buzz'), () => haptics.success()]) {
    const view = render(<Haptic><button>Target</button></Haptic>);
    fireEvent.click(view.getByText('Target')); await request(); vibrate.mockClear(); view.unmount(); expect(vibrate).not.toHaveBeenCalled();
  }
});
it('contains actuator failures during cleanup and keeps ownership on rejected requests', async () => {
  const vibrate = vi.fn(() => true); const { BrowserFeedback } = await import('../src/preview'); setVibrate(vibrate);
  const a = new BrowserFeedback(), b = new BrowserFeedback(); await a.trigger('selection');
  vibrate.mockReturnValueOnce(false); await b.trigger('selection'); b.destroy();
  setVibrate(undefined); expect(() => a.destroy()).not.toThrow();
});
it('never restarts a delayed preview after cancellation or destruction during audio resume', async () => {
  const { BrowserFeedback } = await import('../src/preview'); setVibrate(vi.fn(() => true));
  const frames = trackFrames();
  for (const operation of ['cancel', 'destroy'] as const) {
    let resolve!: () => void;
    vi.stubGlobal('AudioContext', class extends FakeAudioContext { state = 'suspended'; resume() { return new Promise<void>(yes => { resolve = yes; }); } });
    const engine = new BrowserFeedback({ debug: true });
    const pending = engine.trigger([{ duration: 100, delay: 10 }]); engine[operation](); resolve(); await pending;
    expect(frames.size).toBe(0); engine.destroy(); expect(engineLabel()).toBeNull();
  }
});
it('rejects empty and invalid patterns and remains inert after destruction', async () => {
  const { BrowserFeedback } = await import('../src/preview'); const vibrate = vi.fn(() => true); setVibrate(vibrate);
  const engine = new BrowserFeedback(); await engine.trigger('missing'); await engine.trigger([]); await engine.trigger(0); engine.destroy(); engine.destroy(); await engine.trigger('selection');
  expect(vibrate).not.toHaveBeenCalled();
});
it('encodes component patterns with the corrected silent/full-strength timeline', async () => {
  const vibrate = vi.fn(() => true); const { Haptic } = await loadEngine(vibrate);
  const view = render(<Haptic feedback={[{ duration: 10, intensity: 1 }, { duration: 20, intensity: 0 }]}><button>Timeline</button></Haptic>);
  fireEvent.click(view.getByText('Timeline')); expect(vibrate).toHaveBeenCalledExactlyOnceWith([10, 20]); view.unmount();
});

it('runs preview delays and silent segments to completion, reusing audio and releasing each source', async () => {
  const { BrowserFeedback } = await import('../src/preview');
  setVibrate(undefined);
  vi.spyOn(performance, 'now').mockReturnValue(100);
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => frames.push(frame));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const disconnect = vi.fn();
  const sources = vi.fn(() => ({ buffer: null, connect() {}, disconnect, onended: null as (() => void) | null, start() { this.onended?.(); } }));
  const contexts = vi.fn();
  vi.stubGlobal('AudioContext', class extends FakeAudioContext {
    state = 'suspended';
    constructor() { super(); contexts(); }
    createBufferSource = sources;
  });
  const engine = new BrowserFeedback({ debug: true, showSwitch: true });
  const pattern = [{ duration: 60, delay: 20 }, { duration: 40, intensity: 0 }, { duration: 60 }];
  await engine.trigger(pattern);
  const checkbox = engineLabel()!.querySelector('input')!;
  expect(checkbox.checked).toBe(false);
  for (const time of [110, 120, 125, 180, 230, 280]) frames.shift()!(time);
  expect(sources).toHaveBeenCalledTimes(2);
  expect(disconnect).toHaveBeenCalledTimes(2);
  expect(frames).toHaveLength(0);
  await engine.trigger('selection');
  expect(contexts).toHaveBeenCalledOnce();
  expect(document.querySelectorAll('[data-haptic-preview]')).toHaveLength(1);
  engine.destroy();
});

it('ignores stale frames without losing the replacement frame or mutating removed DOM', async () => {
  const { BrowserFeedback } = await import('../src/preview');
  setVibrate(undefined);
  vi.stubGlobal('AudioContext', undefined);
  const frames = new Map<number, FrameRequestCallback>();
  let next = 0;
  vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => { frames.set(++next, frame); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const engine = new BrowserFeedback({ debug: true, showSwitch: true });
  await engine.trigger(100);
  const stale = frames.get(1)!;
  await engine.trigger(200);
  const current = frames.get(2)!;
  const checkbox = engineLabel()!.querySelector('input')!;
  const checked = checkbox.checked;
  stale(performance.now());
  expect([...frames.keys()]).toEqual([2]);
  engine.destroy();
  current(performance.now());
  expect(frames.size).toBe(0);
  expect(checkbox.checked).toBe(checked);
  expect(engineLabel()).toBeNull();
});

it.each(['throw', 'reject'] as const)('contains preview failure and %s from audio cleanup', async failure => {
  const { BrowserFeedback } = await import('../src/preview');
  setVibrate(undefined);
  const frames = trackFrames();
  vi.stubGlobal('AudioContext', class extends FakeAudioContext {
    createBuffer(): never { throw new Error('Audio device unavailable'); }
    close = vi.fn(() => {
      if (failure === 'throw') throw new Error('Already closed');
      return Promise.reject(new Error('Close failed'));
    });
  });
  const engine = new BrowserFeedback({ debug: true });
  await expect(engine.trigger(100)).resolves.toBeUndefined();
  expect(frames.size).toBe(0);
  expect(() => engine.destroy()).not.toThrow();
  await Promise.resolve();
  expect(engineLabel()).toBeNull();
});
