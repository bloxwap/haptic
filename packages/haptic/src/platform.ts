"use client";

import { useEffect, useState } from 'react';

/** Select the native-switch path; this is routing, not a hardware capability test. */
export function isIOSWebKitWithoutVibration(
  navigatorLike: Navigator | undefined = typeof navigator === 'undefined' ? undefined : navigator,
): boolean {
  if (!navigatorLike || typeof navigatorLike.vibrate === 'function') return false;
  const appleMobile = /iPhone|iPad|iPod/.test(navigatorLike.platform) ||
    (navigatorLike.platform === 'MacIntel' && navigatorLike.maxTouchPoints > 1);
  return appleMobile && /AppleWebKit/.test(navigatorLike.userAgent);
}

/** Resolve routing after mount so server and initial client markup agree. */
export function useIOSNativeHaptics(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => { setNative(isIOSWebKitWithoutVibration()); }, []);
  return native;
}
