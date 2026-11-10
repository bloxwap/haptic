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
  const [{ WebHaptics }, { Haptic }] = await Promise.all([
    import('web-haptics'),
    import('../src/haptic'),
  ]);
  return { WebHaptics, Haptic };
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
  return document.body.querySelector('label[for^="web-haptics-"]');
}

afterEach(() => {
  for (const label of document.body.querySelectorAll('label[for^="web-haptics-"]')) label.remove();
});

describe('real web-haptics engine', () => {
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
    const { WebHaptics, Haptic } = await loadEngine(undefined);
    expect(WebHaptics.isSupported).toBe(false);
    const vibrate = vi.fn(() => true);
    setVibrate(vibrate);
    const pending = trackFrames();
    const view = render(<Haptic><button>Tap</button></Haptic>);
    await act(async () => { fireEvent.click(view.getByRole('button')); });
    expect(vibrate).toHaveBeenCalledOnce();
    expect(engineLabel()).toBeNull();
    expect(pending.size).toBe(0);
    expect(WebHaptics.isSupported).toBe(true);
    view.unmount();
  });

  it('leaves import-time support unchanged when it already matches the live API', async () => {
    const vibrate = vi.fn(() => true);
    const { WebHaptics, Haptic } = await loadEngine(vibrate);
    expect(WebHaptics.isSupported).toBe(true);
    const set = vi.spyOn(Reflect, 'set');
    const view = render(<Haptic><button>Tap</button></Haptic>);
    await act(async () => { fireEvent.click(view.getByRole('button')); });
    expect(vibrate).toHaveBeenCalledOnce();
    expect(engineLabel()).toBeNull();
    expect(set.mock.calls.filter(call => call[1] === 'isSupported')).toEqual([]);
    view.unmount();
  });
});
