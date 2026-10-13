import { expect, it, vi } from 'vitest';
import { createNativeHapticAdapter, createHapticAdapter, semanticHaptics, type FeedbackEvent, type FeedbackPreferences } from '../src/feedback';
const event: FeedbackEvent = { id: '1', source: 'save', intent: 'activate', origin: 'keyboard' };
const preferences: FeedbackPreferences = { version: 1, haptics: true, sound: false, volume: 0, motion: false };
function setup() {
  const backend = { capability: { available: true, mechanism: 'native-haptics' as const, observed: false }, trigger: vi.fn(), cancel: vi.fn(), dispose: vi.fn() };
  return { backend, adapter: createHapticAdapter(backend) };
}
it('maps every HIG phase, preserving silent defaults and independent motion/sound', async () => {
  const { backend, adapter } = setup();
  expect(adapter.capability.observed).toBe(false);
  for (const intent of Object.keys(semanticHaptics) as FeedbackEvent['intent'][]) {
    backend.trigger.mockClear(); await adapter.play({ ...event, intent }, preferences);
    const cue = semanticHaptics[intent];
    if (cue) expect(backend.trigger).toHaveBeenCalledExactlyOnceWith(cue);
    else expect(backend.trigger).not.toHaveBeenCalled();
  }
  await adapter.play({ ...event, impact: 'heavy' }, preferences);
  expect(backend.trigger).toHaveBeenLastCalledWith('heavy');
  expect(backend.cancel).toHaveBeenCalledOnce();
});
it('gates preferences, eligibility, capabilities, background and disposal', async () => {
  const { backend, adapter } = setup();
  await adapter.play(event, { ...preferences, haptics: false });
  for (const flag of ['cancelled', 'disabled', 'busy', 'suppressed']) await adapter.play({ ...event, [flag]: true }, preferences);
  backend.capability.available = false; await adapter.play(event, preferences);
  backend.capability.available = true;
  await adapter.setBackground(true); await adapter.play(event, preferences);
  expect(backend.trigger).not.toHaveBeenCalled();
  await adapter.setBackground(false); await adapter.play(event, preferences);
  expect(backend.trigger).toHaveBeenCalledOnce();
  await adapter.cancel(); await adapter.dispose(); await adapter.dispose();
  await adapter.play(event, preferences);
  expect(backend.trigger).toHaveBeenCalledOnce(); expect(backend.dispose).toHaveBeenCalledOnce();
});
it('absorbs synchronous throws and asynchronous failures', async () => {
  const { backend, adapter } = setup();
  backend.trigger.mockImplementationOnce(() => { throw Error('unavailable'); }).mockRejectedValueOnce(Error('rejected'));
  await adapter.play(event, preferences); await adapter.play(event, preferences);
  backend.cancel.mockRejectedValue(Error('cancel')); backend.dispose.mockImplementation(() => { throw Error('dispose'); });
  await adapter.play({ ...event, intent: 'cancel' }, preferences);
  await adapter.cancel(); await adapter.setBackground(true); await adapter.dispose();
});

it('bridges native selection, each impact and each notification without importing Expo', async () => {
  const facade = { ImpactFeedbackStyle: { Light: 'L', Medium: 'M', Heavy: 'H' }, NotificationFeedbackType: { Success: 'S', Warning: 'W', Error: 'E' }, selectionAsync: vi.fn().mockResolvedValue(undefined), impactAsync: vi.fn().mockResolvedValue(undefined), notificationAsync: vi.fn().mockResolvedValue(undefined) };
  const adapter = createNativeHapticAdapter(facade, { available: true, mechanism: 'native-haptics', observed: false });
  await adapter.play(event, preferences);
  expect(facade.selectionAsync).toHaveBeenCalledOnce();
  for (const impact of ['light', 'medium', 'heavy'] as const) await adapter.play({ ...event, impact }, preferences);
  expect(facade.impactAsync.mock.calls).toEqual([['L'], ['M'], ['H']]);
  for (const intent of ['success', 'warning', 'error'] as const) await adapter.play({ ...event, intent }, preferences);
  expect(facade.notificationAsync.mock.calls).toEqual([['S'], ['W'], ['E']]);
  await adapter.cancel(); await adapter.dispose();
});
