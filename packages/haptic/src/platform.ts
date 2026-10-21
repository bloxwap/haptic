"use client";

import { useSyncExternalStore } from 'react';

/** Select the native-switch path; this is routing, not a hardware capability test. */
export function isIOSWebKitWithoutVibration(
  navigatorLike: Navigator | undefined = typeof navigator === 'undefined' ? undefined : navigator,
): boolean {
  if (!navigatorLike || typeof navigatorLike.vibrate === 'function') return false;
  const appleMobile = /iPhone|iPad|iPod/.test(navigatorLike.platform) ||
    (navigatorLike.platform === 'MacIntel' && navigatorLike.maxTouchPoints > 1);
  return appleMobile && /AppleWebKit/.test(navigatorLike.userAgent);
}

const noopSubscribe = () => () => {};
const serverSnapshot = () => false;

/**
 * Resolve routing on the first client-only render. Server rendering and the first
 * hydration render return false, then resolve client routing after hydration.
 */
export function useIOSNativeHaptics(): boolean {
  return useSyncExternalStore(noopSubscribe, isIOSWebKitWithoutVibration, serverSnapshot);
}
