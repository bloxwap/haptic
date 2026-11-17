// Baseline of bloxwap/monorepo apps/app/src/lib/haptics.ts at 448a49318: a WebHaptics engine singleton, for A/B benchmarking only.
import { WebHaptics } from 'web-haptics';
let engine: WebHaptics | null = null;
function fire(preset: 'selection' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): void {
  if (!engine) engine = new WebHaptics();
  engine.trigger(preset).catch(() => {});
}
export const haptics = {
  selection: () => fire('selection'),
  medium: () => fire('medium'),
  heavy: () => fire('heavy'),
  success: () => fire('success'),
  warning: () => fire('warning'),
  error: () => fire('error'),
};
