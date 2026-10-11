// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { Haptic } from '../src';

it('renders the target on a server without browser globals or layout-effect warnings', () => {
  vi.stubGlobal('navigator', undefined);
  const errors = vi.spyOn(console, 'error');
  const html = renderToString(<Haptic><button>Server target</button></Haptic>);
  expect(html).toContain('<button>Server target</button>');
  expect(html).not.toContain('<input');
  expect(errors).not.toHaveBeenCalled();
});
