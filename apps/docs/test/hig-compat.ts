import type { HapticTargetProps } from '@bloxwap/haptic';
import { canTriggerHaptic, triggerHaptic } from '@bloxwap/haptic';
import {
  createHapticAdapter,
  type FeedbackEvent as HapticFeedbackEvent,
  type FeedbackIntent as HapticFeedbackIntent,
  type FeedbackPreferences as HapticFeedbackPreferences,
} from '@bloxwap/haptic/feedback';
import type {
  FeedbackAdapter,
  FeedbackEvent,
  FeedbackIntent,
  FeedbackPreferences,
} from '@bloxwap/hig/contracts/feedback';
import type { HapticFeedbackTarget, ImperativeHapticBackend } from '@bloxwap/hig/feedback/web';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assignable<A extends B, B> = true;
type Expect<T extends true> = T;
type PropsOf<T> = T extends (props: infer P, ...args: never[]) => unknown ? P : never;

/** @bloxwap/haptic/feedback stays assignable to the installed @bloxwap/hig contracts. */
type _intent = Expect<Equal<HapticFeedbackIntent, FeedbackIntent>>;
type _eventToHaptic = Expect<Assignable<FeedbackEvent, HapticFeedbackEvent>>;
type _eventFromHaptic = Expect<Assignable<HapticFeedbackEvent, FeedbackEvent>>;
type _preferencesToHaptic = Expect<Assignable<FeedbackPreferences, HapticFeedbackPreferences>>;
type _preferencesFromHaptic = Expect<Assignable<HapticFeedbackPreferences, FeedbackPreferences>>;
type _adapter = Expect<Assignable<ReturnType<typeof createHapticAdapter>, FeedbackAdapter>>;
type _backend = Expect<Assignable<
  { canTriggerHaptic: typeof canTriggerHaptic; triggerHaptic: typeof triggerHaptic },
  ImperativeHapticBackend
>>;
type _target = Expect<Equal<
  PropsOf<typeof HapticFeedbackTarget>,
  Omit<HapticTargetProps, 'enabled' | 'webHapticsOptions'> & { eligible?: boolean }
>>;

export type HapticHigCompatibility =
  _intent | _eventToHaptic | _eventFromHaptic | _preferencesToHaptic | _preferencesFromHaptic | _adapter | _backend | _target;
