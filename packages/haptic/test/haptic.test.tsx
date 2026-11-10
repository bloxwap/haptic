import { act, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, forwardRef, Profiler, startTransition, StrictMode, Suspense, useState, type ComponentProps } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Haptic, HapticTarget, type HapticInput } from '../src';

const engine = vi.hoisted(() => ({
  construct: vi.fn(), trigger: vi.fn(), cancel: vi.fn(), destroy: vi.fn(),
}));
vi.mock('web-haptics', () => ({ WebHaptics: class {
  constructor(options: unknown) { engine.construct(options); }
  trigger(input: unknown, options: unknown) { return engine.trigger(input, options); }
  cancel() { engine.cancel(); }
  destroy() { engine.destroy(); }
} }));

function ios(vibrate?: () => boolean) {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone');
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('iPhone AppleWebKit/605.1.15');
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
}
function auxiliary(container: HTMLElement) { return container.querySelector<HTMLLabelElement>('label')!; }

beforeEach(() => {
  engine.construct.mockReset(); engine.trigger.mockReset(); engine.cancel.mockReset(); engine.destroy.mockReset();
  engine.trigger.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vi.fn(() => true) });
});

describe('unsupported desktop', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Linux');
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 desktop');
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined });
  });

  it.each([undefined, { debug: false, showSwitch: false }])('skips the engine and body nodes with options %j', webHapticsOptions => {
    const action = vi.fn();
    const view = render(<Haptic webHapticsOptions={webHapticsOptions}><button onClick={action}>Tap</button></Haptic>);
    const append = vi.spyOn(document.body, 'appendChild');
    const nodes = document.body.innerHTML;
    fireEvent.click(view.getByRole('button'));
    expect(action).toHaveBeenCalledTimes(1);
    expect(engine.construct).not.toHaveBeenCalled();
    expect(engine.trigger).not.toHaveBeenCalled();
    expect(append).not.toHaveBeenCalled();
    expect(document.body.innerHTML).toBe(nodes);
  });

  it.each([{ debug: true }, { showSwitch: true }])('preserves desktop feedback with %j', webHapticsOptions => {
    const action = vi.fn();
    const view = render(<Haptic webHapticsOptions={webHapticsOptions}><button onClick={action}>Tap</button></Haptic>);
    fireEvent.click(view.getByRole('button'));
    expect(action).toHaveBeenCalledTimes(1);
    expect(engine.construct).toHaveBeenCalledExactlyOnceWith(webHapticsOptions);
    expect(engine.trigger).toHaveBeenCalledExactlyOnceWith('selection', undefined);
  });

  it('checks vibration support on each tap', () => {
    const action = vi.fn();
    const view = render(<Haptic><button onClick={action}>Tap</button></Haptic>);
    const host = view.getByRole('button');
    fireEvent.click(host);
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: () => true });
    fireEvent.click(host);
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined });
    fireEvent.click(host);
    expect(action).toHaveBeenCalledTimes(3);
    expect(engine.construct).toHaveBeenCalledTimes(1);
    expect(engine.trigger).toHaveBeenCalledTimes(1);
  });
});

describe('vibration target', () => {
  it('constructs no host observers on the vibration path', () => {
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: () => true });
    const observer = vi.spyOn(globalThis, 'MutationObserver');
    const view = render(<Haptic><button>Tap</button></Haptic>);
    expect(observer).not.toHaveBeenCalled();
    view.unmount();
  });

  it('uses committed options while a transition remains suspended', () => {
    const pending = new Promise<void>(() => {});
    function Wait({ enabled }: { enabled: boolean }) { if (!enabled) throw pending; return null; }
    function Example() {
      const [enabled, setEnabled] = useState(true);
      return <>
        <button onClick={() => startTransition(() => setEnabled(false))}>Start transition</button>
        <Suspense fallback={<p>Loading</p>}>
          <Haptic enabled={enabled}><button>Committed target</button></Haptic>
          <Wait enabled={enabled} />
        </Suspense>
      </>;
    }
    const view = render(<Example />);
    fireEvent.click(view.getByRole('button', { name: 'Start transition' }));
    fireEvent.click(view.getByRole('button', { name: 'Committed target' }));
    expect(engine.trigger).toHaveBeenCalledExactlyOnceWith('selection', undefined);
  });

  it.each([null, 'text', []])('rejects invalid children with the characterized error: %j', children => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Haptic>{children as unknown as ComponentProps<typeof Haptic>['children']}</Haptic>)).toThrow('HapticTarget expects exactly one React element child.');
  });

  it('preserves aliases, host identity and untouched handler/ref/attributes', () => {
    expect(Haptic).toBe(HapticTarget);
    const ref = createRef<HTMLButtonElement>();
    const action = vi.fn(), parent = vi.fn();
    const view = render(<div onClick={parent}><Haptic className="grid" style={{ display: 'grid', width: '100%' }}><button ref={ref} aria-label="Save" onClick={action}>Save</button></Haptic></div>);
    const host = view.getByRole('button');
    expect(ref.current).toBe(host);
    expect(host.parentElement!.className).toBe('grid');
    expect(host.parentElement!.style.display).toBe('grid');
    fireEvent.click(host);
    expect(action).toHaveBeenCalledTimes(1); expect(parent).toHaveBeenCalledTimes(1);
    expect(engine.trigger).toHaveBeenCalledExactlyOnceWith('selection', undefined);
    expect(engine.construct).toHaveBeenCalledExactlyOnceWith(undefined);
  });

  it.each(['success', 'warning', 'error', 'light', 'medium', 'heavy', 'soft', 'rigid', 'selection', 'nudge', 'buzz'])('forwards the %s preset', feedback => {
    const { getByRole } = render(<Haptic feedback={feedback}><button>Preset</button></Haptic>);
    fireEvent.click(getByRole('button'));
    expect(engine.trigger).toHaveBeenCalledExactlyOnceWith(feedback, undefined);
  });

  it.each<HapticInput>([20, [10, 5, 10], [{ duration: 10, delay: 2, intensity: 0.7 }], { pattern: [{ duration: 10 }] }])('forwards input %j and options', feedback => {
    const options = { intensity: 0.8 };
    const config = { debug: true, showSwitch: true };
    const { getByRole } = render(<Haptic feedback={feedback} triggerOptions={options} webHapticsOptions={config}><button>Pattern</button></Haptic>);
    fireEvent.click(getByRole('button'));
    expect(engine.trigger).toHaveBeenCalledExactlyOnceWith(feedback, options);
    expect(engine.construct).toHaveBeenCalledExactlyOnceWith(config);
  });

  it.each([{ enabled: false }, { disabled: true }])('keeps actions usable with feedback disabled: %j', props => {
    const action = vi.fn();
    const { getByRole } = render(<Haptic {...props}><button onClick={action}>Silent</button></Haptic>);
    fireEvent.click(getByRole('button'));
    expect(action).toHaveBeenCalledTimes(1); expect(engine.trigger).not.toHaveBeenCalled();
  });

  it.each([true, 'true'] as const)('respects aria-disabled=%s without replacing host semantics', value => {
    const action = vi.fn();
    const { getByRole } = render(<Haptic><button aria-disabled={value} onClick={action}>Disabled feedback</button></Haptic>);
    fireEvent.click(getByRole('button'));
    expect(action).toHaveBeenCalledTimes(1); expect(engine.trigger).not.toHaveBeenCalled();
  });

  it('suppresses feedback for disabled/inert hosts', () => {
    const view = render(<Haptic><button disabled>Blocked</button></Haptic>);
    fireEvent.click(view.getByRole('button'));
    expect(engine.trigger).not.toHaveBeenCalled();
    view.rerender(<div><Haptic><button>Inert</button></Haptic></div>);
    view.getByRole('button').parentElement!.parentElement!.setAttribute('inert', '');
    fireEvent.click(view.getByRole('button'));
    expect(engine.trigger).not.toHaveBeenCalled();
  });

  it.each(['prevent', 'stop'])('retains feedback with child %s while preserving events', mode => {
    const sequence: string[] = [], parent = vi.fn();
    engine.trigger.mockImplementation(() => { sequence.push('feedback'); return Promise.resolve(); });
    const { getByRole } = render(<div onClick={parent}><Haptic><button onClick={event => { sequence.push('action'); if (mode === 'prevent') event.preventDefault(); else event.stopPropagation(); }}>Action</button></Haptic></div>);
    const accepted = fireEvent.click(getByRole('button'));
    expect(sequence).toEqual(['feedback', 'action']);
    expect(parent).toHaveBeenCalledTimes(mode === 'stop' ? 0 : 1);
    expect(accepted).toBe(mode !== 'prevent');
  });

  it('keeps keyboard activation and submit behavior', async () => {
    const submit = vi.fn(event => event.preventDefault());
    const { getByRole } = render(<form onSubmit={submit}><Haptic><button type="submit">Submit</button></Haptic></form>);
    getByRole('button').focus();
    await userEvent.keyboard('{Enter}');
    expect(submit).toHaveBeenCalledTimes(1); expect(engine.trigger).toHaveBeenCalledTimes(1);
  });

  it('retains a custom forwarded ref and nested-content clicks', () => {
    const Custom = forwardRef<HTMLButtonElement, ComponentProps<'button'>>((props, ref) => <button {...props} ref={ref} />);
    const ref = createRef<HTMLButtonElement>(), action = vi.fn();
    const { getByText, getByRole } = render(<Haptic><Custom ref={ref} onClick={action}><span>Nested</span></Custom></Haptic>);
    fireEvent.click(getByText('Nested'));
    expect(ref.current).toBe(getByRole('button')); expect(action).toHaveBeenCalledTimes(1);
    expect(engine.trigger).toHaveBeenCalledTimes(1);
  });

  it('updates feedback without recreating the engine on ordinary rerenders', () => {
    function Counter() { const [count, update] = useState(0); return <Haptic feedback={count ? 'success' : 'selection'}><button onClick={() => update(count + 1)}>{count}</button></Haptic>; }
    const { getByRole, unmount } = render(<StrictMode><Counter /></StrictMode>);
    fireEvent.click(getByRole('button')); fireEvent.click(getByRole('button'));
    expect(engine.construct).toHaveBeenCalledTimes(1);
    expect(engine.trigger.mock.calls.map(call => call[0])).toEqual(['selection', 'success']);
    unmount(); expect(engine.destroy).toHaveBeenCalledTimes(1);
  });

  it('releases the previous engine when its construction options change', () => {
    const view = render(<Haptic webHapticsOptions={{ debug: false }}><button>Options</button></Haptic>);
    fireEvent.click(view.getByRole('button'));
    view.rerender(<Haptic webHapticsOptions={{ debug: true, showSwitch: true }}><button>Options</button></Haptic>);
    expect(engine.destroy).toHaveBeenCalledTimes(1);
    fireEvent.click(view.getByRole('button'));
    expect(engine.construct.mock.calls[1][0]).toEqual({ debug: true, showSwitch: true });
  });

  it('keeps actions available when feedback rejects or throws', async () => {
    const action = vi.fn();
    const view = render(<Haptic><button onClick={action}>Safe</button></Haptic>);
    engine.trigger.mockRejectedValueOnce(new Error('Unavailable'));
    await act(async () => fireEvent.click(view.getByRole('button')));
    engine.trigger.mockImplementationOnce(() => { throw new Error('Unavailable'); });
    fireEvent.click(view.getByRole('button'));
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('disposes resources even if pattern cancellation fails', () => {
    const view = render(<Haptic><button>Cleanup</button></Haptic>);
    fireEvent.click(view.getByRole('button'));
    engine.cancel.mockImplementationOnce(() => { throw new Error('API removed'); });
    view.unmount();
    expect(engine.cancel).toHaveBeenCalledTimes(1);
    expect(engine.destroy).toHaveBeenCalledTimes(1);
  });

  it('handles constructor failure and targets with no DOM host', () => {
    engine.construct.mockImplementationOnce(() => { throw new Error('Unavailable'); });
    const action = vi.fn();
    const view = render(<Haptic><button onClick={action}>Safe</button></Haptic>);
    fireEvent.click(view.getByRole('button')); expect(action).toHaveBeenCalledTimes(1);
    function Empty() { return null; }
    view.rerender(<Haptic><Empty /></Haptic>);
    fireEvent.click(view.container.firstElementChild!);
    expect(engine.trigger).not.toHaveBeenCalled();
  });
});

describe('native iOS target', () => {
  it('constructs and cleans up one host observer on iOS', () => {
    ios();
    const observer = vi.spyOn(globalThis, 'MutationObserver');
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const view = render(<Haptic><button>Tap</button></Haptic>);
    expect(observer).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it.each(['disabled', 'aria-disabled', 'inert'] as const)('never commits an overlay over an initially %s custom host', attribute => {
    ios();
    // React 18 does not render a boolean inert prop, so inert comes from a DOM ancestor.
    function Host() {
      return attribute === 'inert'
        ? <button>Blocked</button>
        : <button {...{ [attribute]: attribute === 'aria-disabled' ? 'true' : true }}>Blocked</button>;
    }
    const container = document.createElement('div');
    if (attribute === 'inert') container.setAttribute('inert', '');
    const commits: boolean[] = [];
    const view = render(<Profiler id="host" onRender={() => {
      commits.push(container.querySelector('input, label') !== null);
    }}><Haptic><Host /></Haptic></Profiler>, { container });
    expect(commits.length).toBeGreaterThan(0);
    expect(commits.every(overlay => !overlay)).toBe(true);
    expect(view.container.querySelector('input, label')).toBeNull();
  });

  it('removes auxiliary controls when a custom target stops rendering a host', async () => {
    ios();
    function Custom({ visible }: { visible: boolean }) { return visible ? <button>Conditional</button> : null; }
    const view = render(<Haptic><Custom visible /></Haptic>);
    expect(view.container.querySelector('input')).not.toBeNull();
    view.rerender(<Haptic><Custom visible={false} /></Haptic>);
    await waitFor(() => expect(view.container.querySelector('input')).toBeNull());
    view.rerender(<Haptic><Custom visible /></Haptic>);
    await waitFor(() => expect(view.container.querySelector('input')).not.toBeNull());
  });

  it('rejects stale overlay activation after its host was removed', async () => {
    ios(); const action = vi.fn();
    const view = render(<Haptic><button onClick={action}>Removed</button></Haptic>);
    const label = auxiliary(view.container), input = view.container.querySelector('input')!;
    await act(async () => {
      view.getByRole('button').remove();
      fireEvent.focus(input); fireEvent.click(label);
      fireEvent.click(input);
    });
    expect(action).not.toHaveBeenCalled();
    expect(view.container.querySelector('input')).toBeNull();
  });

  it('activates the native control before an action disables its feedback', () => {
    ios(); const states: boolean[] = [];
    function SelfDisabling() {
      const [enabled, setEnabled] = useState(true);
      return <Haptic enabled={enabled}><button onClick={() => {
        states.push(document.querySelector<HTMLInputElement>('input[switch]')!.checked);
        setEnabled(false);
      }}>Once</button></Haptic>;
    }
    const view = render(<SelfDisabling />);
    fireEvent.click(auxiliary(view.container));
    expect(states).toEqual([true]);
    expect(view.container.querySelector('input')).toBeNull();
  });

  it('guards direct native-control activation during a canceled gesture', () => {
    ios(); const action = vi.fn();
    const view = render(<Haptic><button onClick={action}>Canceled</button></Haptic>);
    fireEvent.pointerDown(auxiliary(view.container)); fireEvent.pointerCancel(auxiliary(view.container));
    fireEvent.click(view.container.querySelector('input')!);
    expect(action).not.toHaveBeenCalled();
  });

  it('adds a native control after mounting and routes one action with original focus/ref', async () => {
    ios();
    const ref = createRef<HTMLButtonElement>(), action = vi.fn(), parent = vi.fn();
    const view = render(<div onClick={parent}><Haptic><button aria-label="Original" onClick={action} ref={ref}>Tap</button></Haptic></div>);
    const input = view.container.querySelector<HTMLInputElement>('input[switch]')!;
    expect(input).not.toBeNull(); expect(input.tabIndex).toBe(-1); expect(input.getAttribute('aria-hidden')).toBe('true');
    expect(input.hasAttribute('name')).toBe(false);
    expect(input.style.opacity).toBe('0'); expect(input.style.display).toBe(''); expect(input.style.visibility).toBe('');
    expect(auxiliary(view.container).htmlFor).toBe(input.id);
    fireEvent.click(auxiliary(view.container));
    expect(action).toHaveBeenCalledTimes(1); expect(parent).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(view.getByRole('button')); expect(document.activeElement).toBe(ref.current);
    expect(engine.trigger).not.toHaveBeenCalled();
    fireEvent.focus(input); expect(document.activeElement).toBe(ref.current);
  });

  it('keeps native identifiers unique across multiple targets', () => {
    ios();
    const { container } = render(<><Haptic><button>One</button></Haptic><Haptic><button>Two</button></Haptic></>);
    const ids = [...container.querySelectorAll('input')].map(input => input.id);
    expect(new Set(ids).size).toBe(2);
  });

  it.each([{ enabled: false }, { disabled: true }])('omits native controls for props %j', props => {
    ios(); const action = vi.fn();
    const view = render(<Haptic {...props}><button onClick={action}>Silent</button></Haptic>);
    expect(view.container.querySelector('input')).toBeNull();
    fireEvent.click(view.getByRole('button')); expect(action).toHaveBeenCalledTimes(1);
  });

  it('observes host attributes and dynamic enablement', async () => {
    ios();
    const view = render(<Haptic><button>Mutable</button></Haptic>);
    const host = view.getByRole('button');
    await act(async () => host.setAttribute('disabled', ''));
    expect(view.container.querySelector('input')).toBeNull();
    await act(async () => host.removeAttribute('disabled'));
    expect(view.container.querySelector('input')).not.toBeNull();
    await act(async () => host.setAttribute('aria-disabled', 'true'));
    expect(view.container.querySelector('input')).toBeNull();
    await act(async () => { host.removeAttribute('aria-disabled'); host.setAttribute('inert', ''); });
    expect(view.container.querySelector('input, label')).toBeNull();
    await act(async () => host.removeAttribute('inert'));
    expect(view.container.querySelector('input')).not.toBeNull();
    view.rerender(<Haptic enabled={false}><button>Mutable</button></Haptic>);
    expect(view.container.querySelector('input')).toBeNull();
    view.rerender(<Haptic><button aria-disabled={true}>Mutable</button></Haptic>);
    expect(view.container.querySelector('input')).toBeNull();
  });

  it('rejects a click when the live host was just disabled', () => {
    ios(); const action = vi.fn();
    const view = render(<Haptic><button onClick={action}>Mutable</button></Haptic>);
    const label = auxiliary(view.container);
    view.getByRole('button').setAttribute('disabled', '');
    fireEvent.click(view.container.querySelector('input')!);
    fireEvent.click(label); expect(action).not.toHaveBeenCalled();
  });

  it('does not turn pointer sequences into actions', () => {
    ios(); const action = vi.fn();
    const view = render(<Haptic><button onClick={action}>Scroll</button></Haptic>);
    const label = auxiliary(view.container);
    fireEvent.pointerDown(label); fireEvent.pointerMove(label); fireEvent.pointerUp(label);
    expect(action).not.toHaveBeenCalled();
    fireEvent.pointerCancel(label); fireEvent.click(label);
    expect(action).not.toHaveBeenCalled();
  });

  it('cancels moved gestures and resets for the next physical tap', () => {
    ios(); const action = vi.fn();
    const view = render(<Haptic><button onClick={action}>Drag</button></Haptic>);
    const label = auxiliary(view.container);
    const pointer = (type: string, x: number) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperties(event, { clientX: { value: x }, clientY: { value: 0 } });
      fireEvent(label, event);
    };
    pointer('pointermove', 20); // No active gesture yet.
    fireEvent.pointerCancel(label);
    pointer('pointerdown', 0); pointer('pointermove', 20); fireEvent.click(label);
    expect(action).not.toHaveBeenCalled();
    pointer('pointerdown', 0); pointer('pointermove', 2); fireEvent.click(label);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('protects drawers while preserving ordinary ancestor pointer handlers', () => {
    ios(); const pointer = vi.fn();
    const view = render(<div data-vaul-drawer="" onPointerDown={pointer}><Haptic><button>Drawer</button></Haptic></div>);
    fireEvent.pointerDown(auxiliary(view.container)); expect(pointer).not.toHaveBeenCalled();
    view.rerender(<div onPointerDown={pointer}><Haptic><button>Normal</button></Haptic></div>);
    fireEvent.pointerDown(auxiliary(view.container)); expect(pointer).toHaveBeenCalledTimes(1);
  });

  it('retains submit behavior and child event cancellation', () => {
    ios(); const submit = vi.fn(event => event.preventDefault()), parent = vi.fn();
    const view = render(<form onSubmit={submit} onClick={parent}><Haptic><button type="submit">Submit</button></Haptic></form>);
    fireEvent.click(auxiliary(view.container)); expect(submit).toHaveBeenCalledTimes(1); expect(parent).toHaveBeenCalledTimes(1);
    view.rerender(<form onSubmit={submit} onClick={parent}><Haptic><button type="submit" onClick={event => { event.preventDefault(); event.stopPropagation(); }}>Submit</button></Haptic></form>);
    fireEvent.click(auxiliary(view.container)); expect(submit).toHaveBeenCalledTimes(1); expect(parent).toHaveBeenCalledTimes(1);
  });

  it('prefers an available vibration API over native controls', () => {
    ios(() => true);
    const view = render(<Haptic><button>Vibrate</button></Haptic>);
    expect(view.container.querySelector('input')).toBeNull();
    fireEvent.click(view.getByRole('button')); expect(engine.trigger).toHaveBeenCalledTimes(1);
  });
});

it('uses host preferences and application policy without changing the action', () => {
  const action = vi.fn();
  const view = render(<Haptic preferences={{ haptics: false }}><button onClick={action}>Save</button></Haptic>);
  fireEvent.click(view.getByRole('button'));
  view.rerender(<Haptic preferences={{ haptics: true }} policyEnabled={false}><button onClick={action}>Save</button></Haptic>);
  fireEvent.click(view.getByRole('button'));
  expect(action).toHaveBeenCalledTimes(2); expect(engine.construct).not.toHaveBeenCalled();
  view.rerender(<Haptic preferences={{ haptics: true }}><button onClick={action}>Save</button></Haptic>);
  fireEvent.click(view.getByRole('button'));
  expect(engine.trigger).toHaveBeenCalledOnce();
  view.rerender(<Haptic preferences={{ haptics: false }}><button onClick={action}>Save</button></Haptic>);
  expect(engine.cancel).toHaveBeenCalledOnce(); expect(engine.destroy).toHaveBeenCalledOnce();
});

describe('host structure invariants', () => {
  function Pair({ a, b }: { a: () => void; b: () => void }) {
    return <><button onClick={a}>A</button><button onClick={b}>B</button></>;
  }
  const silence = () => vi.spyOn(console, 'error').mockImplementation(() => {});

  it.each(['fragment', 'component'])('fails closed on iOS for a %s child that renders several elements', kind => {
    ios(); const errors = silence();
    const a = vi.fn(), b = vi.fn();
    const child = kind === 'fragment' ? <><button onClick={a}>A</button><button onClick={b}>B</button></> : <Pair a={a} b={b} />;
    const view = render(<Haptic>{child}</Haptic>);
    expect(view.container.querySelector('input, label')).toBeNull();
    fireEvent.click(view.getByRole('button', { name: 'B' }));
    expect(a).not.toHaveBeenCalled(); expect(b).toHaveBeenCalledTimes(1);
    expect(errors).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('exactly one DOM element'));
    view.rerender(<Haptic>{child}</Haptic>);
    expect(errors).toHaveBeenCalledOnce();
  });

  it('fails closed on iOS when text renders beside the host', () => {
    ios(); silence();
    const view = render(<Haptic>{<>Label<button>Tap</button></>}</Haptic>);
    expect(view.container.querySelector('input, label')).toBeNull();
  });

  it('gives no feedback to any element of a multi-element child on vibration browsers', () => {
    silence(); const a = vi.fn(), b = vi.fn();
    const view = render(<Haptic><Pair a={a} b={b} /></Haptic>);
    fireEvent.click(view.getByRole('button', { name: 'A' }));
    fireEvent.click(view.getByRole('button', { name: 'B' }));
    expect(a).toHaveBeenCalledOnce(); expect(b).toHaveBeenCalledOnce();
    expect(engine.trigger).not.toHaveBeenCalled();
  });

  it('recovers when a multi-element child becomes a single element', async () => {
    ios(); const errors = silence();
    function Toggle({ pair }: { pair: boolean }) { return pair ? <><button>A</button><button>B</button></> : <button>A</button>; }
    const view = render(<Haptic><Toggle pair /></Haptic>);
    expect(view.container.querySelector('input')).toBeNull();
    view.rerender(<Haptic><Toggle pair={false} /></Haptic>);
    await waitFor(() => expect(view.container.querySelector('input')).not.toBeNull());
    expect(errors).toHaveBeenCalledOnce();
  });

  it('ignores comment nodes beside the host', async () => {
    ios();
    const view = render(<Haptic><button>Tap</button></Haptic>);
    const wrapper = view.getByRole('button').parentElement!;
    await act(async () => { wrapper.insertBefore(document.createComment('marker'), wrapper.firstChild); });
    expect(view.container.querySelector('input')).not.toBeNull();
  });

  it('routes one action through the innermost iOS target when targets are nested', () => {
    ios(); const errors = silence(); const action = vi.fn();
    const view = render(<Haptic><Haptic><button onClick={action}>Nested</button></Haptic></Haptic>);
    const inputs = view.container.querySelectorAll('input[switch]');
    expect(inputs).toHaveLength(1);
    fireEvent.click(view.container.querySelector('label')!);
    expect(action).toHaveBeenCalledTimes(1);
    expect(errors).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('nested targets'));
  });

  it('defers an outer iOS target whose host contains a target deeper inside', () => {
    ios(); silence(); const action = vi.fn();
    const view = render(<Haptic><div><Haptic><button onClick={action}>Deep</button></Haptic></div></Haptic>);
    expect(view.container.querySelectorAll('input[switch]')).toHaveLength(1);
    fireEvent.click(view.container.querySelector('label')!);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('defers when an inner target mounts later on iOS', async () => {
    ios(); silence();
    function Late({ inner }: { inner: boolean }) {
      return <div>{inner ? <Haptic><button>Inner</button></Haptic> : <button>Inner</button>}</div>;
    }
    const view = render(<Haptic><Late inner={false} /></Haptic>);
    expect(view.container.querySelectorAll('input[switch]')).toHaveLength(1);
    view.rerender(<Haptic><Late inner /></Haptic>);
    await waitFor(() => expect(view.container.querySelectorAll('input[switch]')).toHaveLength(1));
    expect(view.getByRole('button').parentElement!.querySelector('input[switch]')).not.toBeNull();
  });

  it('requests feedback once, from the innermost target, on vibration browsers', () => {
    silence(); const action = vi.fn();
    const view = render(<Haptic feedback="heavy"><div><button>Outer only</button><Haptic feedback="success"><button onClick={action}>Inner</button></Haptic></div></Haptic>);
    fireEvent.click(view.getByRole('button', { name: 'Inner' }));
    expect(action).toHaveBeenCalledOnce();
    expect(engine.trigger).toHaveBeenCalledExactlyOnceWith('success', undefined);
    fireEvent.click(view.getByRole('button', { name: 'Outer only' }));
    expect(engine.trigger).toHaveBeenLastCalledWith('heavy', undefined);
    expect(engine.trigger).toHaveBeenCalledTimes(2);
  });

  it('stays silent in production builds', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const errors = silence();
    try {
      render(<Haptic><Pair a={() => {}} b={() => {}} /></Haptic>);
      expect(errors).not.toHaveBeenCalled();
    } finally { vi.unstubAllEnvs(); }
  });

  it('skips diagnostics without a process global', () => {
    const errors = silence();
    const saved = globalThis.process;
    let view: ReturnType<typeof render>;
    try {
      vi.stubGlobal('process', undefined);
      view = render(<Haptic><Pair a={() => {}} b={() => {}} /></Haptic>);
    } finally { vi.stubGlobal('process', saved); }
    expect(errors).not.toHaveBeenCalled();
    view!.unmount();
  });
});
