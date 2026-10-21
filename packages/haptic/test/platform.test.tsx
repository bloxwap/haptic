import { act, render, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { Haptic, isIOSWebKitWithoutVibration, useIOSNativeHaptics } from '../src';

function identity(platform: string, userAgent: string, maxTouchPoints = 0, vibrate?: () => boolean): Navigator {
  return { platform, userAgent, maxTouchPoints, vibrate } as unknown as Navigator;
}

describe('platform contract', () => {
  it.each([
    ['iPhone', 'iPhone AppleWebKit/605.1.15', 0, true],
    ['iPad', 'iPad AppleWebKit/605.1.15', 0, true],
    ['iPod', 'iPod AppleWebKit/605.1.15', 0, true],
    ['MacIntel', 'Macintosh AppleWebKit/605.1.15', 5, true],
    ['MacIntel', 'Macintosh AppleWebKit/605.1.15', 1, false],
    ['iPhone', 'iPhone Gecko/20100101', 5, false],
    ['Linux x86_64', 'Chrome AppleWebKit/537.36', 5, false],
    ['MacIntel', 'Macintosh AppleWebKit/605.1.15', 0, false],
  ])('routes %s / %s / %d touch points', (platform, agent, touches, expected) => {
    expect(isIOSWebKitWithoutVibration(identity(platform, agent, touches))).toBe(expected);
  });

  it('prefers vibration capability even with an Apple identity', () => {
    expect(isIOSWebKitWithoutVibration(identity('iPhone', 'AppleWebKit', 5, () => true))).toBe(false);
  });

  it('works without any browser navigator', () => {
    vi.stubGlobal('navigator', undefined);
    expect(isIOSWebKitWithoutVibration()).toBe(false);
    expect(isIOSWebKitWithoutVibration(undefined)).toBe(false);
  });

  it('uses the ambient navigator by default', () => {
    vi.stubGlobal('navigator', identity('iPhone', 'AppleWebKit', 5));
    expect(isIOSWebKitWithoutVibration()).toBe(true);
    const { result } = renderHook(useIOSNativeHaptics, { wrapper: StrictMode });
    expect(result.current).toBe(true);
  });

  it('returns native routing on the first client-only createRoot render', async () => {
    vi.stubGlobal('navigator', identity('iPhone', 'AppleWebKit', 5));
    const renders: boolean[] = [];
    function HookOutput() {
      const native = useIOSNativeHaptics();
      renders.push(native);
      return <output>{String(native)}</output>;
    }
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => root.render(<HookOutput />));
    expect(renders).toEqual([true]);
    expect(container.textContent).toBe('true');
    await act(async () => root.unmount());
  });

  it('preserves server markup and hydrates before adding native controls', async () => {
    const renders: boolean[] = [];
    function Example() {
      renders.push(useIOSNativeHaptics());
      return <Haptic><button>Hydrate</button></Haptic>;
    }
    const tree = <Example />;
    // Server rendering must not read browser globals, even when they exist.
    const navigatorRead = vi.fn(() => { throw new Error('navigator read during SSR'); });
    vi.stubGlobal('navigator', undefined);
    const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')!;
    Object.defineProperty(globalThis, 'navigator', { configurable: true, get: navigatorRead });
    let markup: string;
    try {
      markup = renderToString(tree);
    } finally {
      Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
    }
    expect(navigatorRead).not.toHaveBeenCalled();
    expect(markup).toBe('<span style="position:relative;display:inline-grid"><button>Hydrate</button></span>');
    expect(renders).toEqual([false]);
    vi.stubGlobal('navigator', identity('iPhone', 'AppleWebKit', 5));
    expect(renderToString(tree)).toBe(markup);
    renders.length = 0;
    const container = document.createElement('div');
    container.innerHTML = markup;
    document.body.append(container);
    expect(container.querySelector('input')).toBeNull();
    const errors = vi.fn();
    const consoleError = vi.spyOn(console, 'error');
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(container, tree, { onRecoverableError: errors }); });
    expect(renders).toEqual([false, true]);
    expect(container.querySelector('input[switch]')).not.toBeNull();
    expect(errors).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    await act(async () => root!.unmount());
    container.remove();
  });

  it('keeps unsupported browser hooks false', () => {
    const { result } = renderHook(useIOSNativeHaptics);
    expect(result.current).toBe(false);
    render(<Haptic><button>Safe</button></Haptic>);
  });
});
