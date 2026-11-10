"use client";

import {
  isValidElement, useEffect, useId, useLayoutEffect, useRef, useState,
  type CSSProperties, type MouseEvent, type ReactElement,
} from 'react';
import { WebHaptics, type HapticInput, type TriggerOptions, type WebHapticsOptions } from 'web-haptics';
import { useIOSNativeHaptics } from './platform';
import type { FeedbackPreferences } from './feedback';

const useCommittedEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;
/** Marks each target wrapper so nested targets can defer to the innermost one. */
const TARGET = 'data-haptic-target';
const NESTED = `[${TARGET}]`;

declare const process: { env: { NODE_ENV?: string } };
/** Development-only diagnostics; bundlers strip the body in production builds. */
function warnInDevelopment(check: () => string | undefined): void {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const message = check();
      if (message) console.error(`HapticTarget: ${message}`);
    }
  } catch { /* Unbundled browsers have no process global; diagnostics are optional. */ }
}

type HostProps = {
  disabled?: boolean;
  'aria-disabled'?: boolean | 'true' | 'false';
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

export interface HapticTargetProps {
  /**
   * One target element that renders exactly one DOM element. Its handlers, attributes, and ref are retained.
   * A child that renders several elements (such as a fragment) keeps its actions but gets no feedback.
   */
  children: ReactElement<HostProps>;
  /** Enable feedback. Defaults to true. */
  enabled?: boolean;
  /** Host-owned HIG preferences; motion is independent from haptics. */
  preferences?: Pick<FeedbackPreferences, 'haptics'>;
  /** Application policy veto. */
  policyEnabled?: boolean;
  /** Disable feedback without disabling the original action. Defaults to false. */
  disabled?: boolean;
  /** Vibration preset or pattern; defaults to selection. iOS uses its system tick. */
  feedback?: HapticInput;
  /** Per-trigger intensity options. */
  triggerOptions?: TriggerOptions;
  /** Engine options, including desktop debug audio and its visible switch. */
  webHapticsOptions?: WebHapticsOptions;
  /** Positioning wrapper class. */
  className?: string;
  /** Override the wrapper's inline-grid layout. */
  style?: CSSProperties;
}

function hostDisabled(host: HTMLElement): boolean {
  return host.matches(':disabled') || host.getAttribute('aria-disabled') === 'true' ||
    host.closest('[inert]') !== null;
}

function dispose(engine: WebHaptics | null): void {
  if (!engine) return;
  try { engine.cancel(); } catch { /* A removed vibration API must not prevent resource cleanup. */ }
  engine.destroy();
}

/** Add physical-tap feedback while keeping the original React target intact. */
export function HapticTarget({
  children, enabled: intentEnabled = true, preferences, policyEnabled = true, disabled = false, feedback = 'selection',
  triggerOptions, webHapticsOptions, className, style,
}: HapticTargetProps): ReactElement {
  if (!isValidElement(children)) throw new Error('HapticTarget expects exactly one React element child.');
  const enabled = intentEnabled && policyEnabled && (preferences?.haptics ?? true);
  const child = children;
  const native = useIOSNativeHaptics();
  const wrapper = useRef<HTMLSpanElement>(null);
  const nativeSwitch = useRef<HTMLInputElement>(null);
  const nativeLabel = useRef<HTMLLabelElement>(null);
  const engine = useRef<WebHaptics | null>(null);
  const current = useRef({ enabled, disabled, feedback, triggerOptions, webHapticsOptions, native });
  useCommittedEffect(() => {
    // A suspended render must not change the visible target's event behavior.
    current.current = { enabled, disabled, feedback, triggerOptions, webHapticsOptions, native };
  });
  // Stay blocked until the committed host has been checked on the native path.
  const [blockedHost, setBlockedHost] = useState(true);
  const blocked = useRef(true);
  const updateBlocked = (next: boolean) => {
    // Skip redundant updates, such as the observer seeing the overlay's own insertion.
    if (blocked.current === next) return;
    blocked.current = next;
    setBlockedHost(next);
  };
  const gesture = useRef<{ x: number; y: number; canceled: boolean } | null>(null);
  const switchId = useId();
  /** The single rendered host, or null when the child rendered no element or more than one node. */
  const readHost = () => {
    let host: HTMLElement | null = null;
    for (const node of wrapper.current!.childNodes) {
      if (node === nativeSwitch.current || node === nativeLabel.current || node.nodeType === Node.COMMENT_NODE) continue;
      if (host || node.nodeType !== Node.ELEMENT_NODE) return null;
      host = node as HTMLElement;
    }
    return host;
  };
  /** An inner target owns its own taps; an outer overlay would click the wrong element. */
  const containsTarget = (host: HTMLElement) => host.matches(NESTED) || host.querySelector(NESTED) !== null;
  const warned = useRef<string | undefined>(undefined);
  useCommittedEffect(() => {
    warnInDevelopment(() => {
      const root = wrapper.current!;
      const nodes = [...root.childNodes].filter(node =>
        node !== nativeSwitch.current && node !== nativeLabel.current && node.nodeType !== Node.COMMENT_NODE);
      const message = nodes.length > 1
        ? 'the child must render exactly one DOM element; feedback is disabled for this target.'
        : nodes[0]?.nodeType === Node.ELEMENT_NODE && containsTarget(nodes[0] as HTMLElement)
          ? 'nested targets are not supported; the innermost target handles taps inside it.'
          : undefined;
      const report = message !== warned.current ? message : undefined;
      warned.current = message;
      return report;
    });
  });

  useCommittedEffect(() => {
    if (!native) {
      updateBlocked(true);
      return;
    }
    const root = wrapper.current!;
    const synchronize = () => {
      const host = readHost();
      updateBlocked(host ? hostDisabled(host) || containsTarget(host) : true);
    };
    synchronize();
    const observer = new MutationObserver(synchronize);
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'inert'] });

    return () => observer.disconnect();
  }, [native]);

  useEffect(() => {
    const root = wrapper.current!;
    const requestFeedback = (event: Event) => {
      const options = current.current;
      const host = readHost();
      const target = event.target as Element;
      if (!host || !host.contains(target) || target.closest(NESTED) !== root || options.native || !options.enabled || options.disabled || hostDisabled(host)) return;
      if (typeof navigator.vibrate !== 'function' && !options.webHapticsOptions?.debug && !options.webHapticsOptions?.showSwitch) return;
      try {
        engine.current ??= new WebHaptics(options.webHapticsOptions);
        void engine.current.trigger(options.feedback, options.triggerOptions).catch(() => {});
      } catch {
        // Feedback failure must leave the original action available.
      }
    };
    // Native capture runs before React's delegated handlers, including stopped clicks.
    root.addEventListener('click', requestFeedback, true);
    return () => {
      root.removeEventListener('click', requestFeedback, true);
      dispose(engine.current);
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    // Changing engine settings or platform releases old patterns/resources.
    dispose(engine.current);
    engine.current = null;
  }, [native, webHapticsOptions?.debug, webHapticsOptions?.showSwitch]);

  useEffect(() => {
    if (!enabled || disabled) {
      dispose(engine.current);
      engine.current = null;
    }
  }, [enabled, disabled]);

  const nativeTarget = native && enabled && !disabled && !blockedHost &&
    !child.props.disabled && child.props['aria-disabled'] !== true && child.props['aria-disabled'] !== 'true';

  const focusHost = () => {
    readHost()?.focus({ preventScroll: true });
  };
  const guardLabel = (event: MouseEvent<HTMLLabelElement>) => {
    event.stopPropagation();
    const host = readHost();
    if (!host || gesture.current?.canceled || hostDisabled(host)) {
      gesture.current = null;
      event.preventDefault();
    }
  };
  const activateHost = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const host = readHost();
    const canceled = gesture.current?.canceled;
    gesture.current = null;
    if (!host || canceled || hostDisabled(host)) {
      event.preventDefault();
      return;
    }
    focusHost();
    host.click();
    // The switch is already activated before an action can disable or unmount it.
  };

  return (
    <span ref={wrapper} {...{ [TARGET]: '' }} className={className} style={{ position: 'relative', display: 'inline-grid', ...style }}>
      {child}
      {nativeTarget && <>
        <input
          ref={nativeSwitch}
          {...{ switch: '' }}
          id={switchId}
          type="checkbox"
          aria-hidden="true"
          tabIndex={-1}
          onClick={activateHost}
          onFocus={focusHost}
          style={{ appearance: 'auto', position: 'absolute', inset: 0, width: '100%', height: '100%', margin: 0, opacity: 0, pointerEvents: 'none' }}
        />
        <label
          ref={nativeLabel}
          htmlFor={switchId}
          aria-hidden="true"
          onClick={guardLabel}
          onPointerDown={event => {
            gesture.current = { x: event.clientX, y: event.clientY, canceled: false };
            if (event.currentTarget.closest('[data-vaul-drawer]')) event.stopPropagation();
          }}
          onPointerMove={event => {
            const start = gesture.current;
            if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) start.canceled = true;
          }}
          onPointerCancel={() => {
            if (gesture.current) gesture.current.canceled = true;
          }}
          style={{ position: 'absolute', inset: 0, cursor: 'inherit', touchAction: 'manipulation' }}
        />
      </>}
    </span>
  );
}

/** Short alias for HapticTarget. */
export const Haptic = HapticTarget;
