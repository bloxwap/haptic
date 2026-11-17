/** All package entry points share ownership of the browser's single actuator. */
const key = Symbol.for('@bloxwap/haptic/vibration/v1');
function state(): { owner: object | null } {
  const registry = globalThis as typeof globalThis & { [key]?: { owner: object | null } };
  return registry[key] ??= { owner: null };
}
export function requestVibration(pattern: number[], owner: object | null = null): boolean {
  const accepted = navigator.vibrate(pattern);
  if (accepted) state().owner = owner;
  return accepted;
}
export function cancelVibration(owner: object): void {
  if (state().owner !== owner) return;
  state().owner = null;
  try { navigator.vibrate(0); } catch { /* Cleanup remains safe if the API disappears. */ }
}
