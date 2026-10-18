// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { Haptic, canTriggerHaptic, triggerHaptic } from '../src';

it('renders the target on a server without browser globals or layout-effect warnings', () => {
  vi.stubGlobal('navigator', undefined);
  const errors = vi.spyOn(console, 'error');
  const html = renderToString(<Haptic><button>Server target</button></Haptic>);
  expect(html).toContain('<button>Server target</button>');
  expect(html).not.toContain('<input');
  expect(errors).not.toHaveBeenCalled();
});

it('probes and resolves imperative feedback on a server without browser resources', async () => {
  expect(canTriggerHaptic()).toEqual({ available: false, mechanism: 'none', observed: false, reason: 'browser-unavailable' });
  await expect(triggerHaptic()).resolves.toEqual({ delivered: false, mechanism: 'none', reason: 'browser-unavailable' });
});
