import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Haptic } from '../src/haptic';

function ios() {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone');
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('AppleWebKit');
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined });
}
it('preserves pointer handlers, original click metadata and one ancestor capture by default on iOS', () => {
  ios(); const pointer = vi.fn(), capture = vi.fn(), action = vi.fn();
  const view = render(<div onClickCapture={capture}><Haptic><button onPointerDown={pointer} onClick={action}>Action</button></Haptic></div>);
  expect(view.container.querySelector('input, label')).toBeNull();
  fireEvent.pointerDown(view.getByRole('button'));
  fireEvent.click(view.getByRole('button'), { ctrlKey: true, detail: 2, clientX: 50 });
  expect(pointer).toHaveBeenCalledOnce(); expect(capture).toHaveBeenCalledOnce();
  expect(action.mock.calls[0][0]).toMatchObject({ ctrlKey: true, detail: 2, clientX: 50 });
});
it('leaves unsupported opted-in targets interactive without an overlay', () => {
  ios(); const errors = vi.spyOn(console, 'error').mockImplementation(() => {}), action = vi.fn();
  const view = render(<><Haptic iosPhysicalTap><div><button onClick={action}>Nested</button></div></Haptic><Haptic iosPhysicalTap><svg data-testid="svg" onClick={action} /></Haptic></>);
  expect(view.container.querySelector('input, label')).toBeNull();
  fireEvent.click(view.getByRole('button')); fireEvent.click(view.getByTestId('svg'));
  expect(action).toHaveBeenCalledTimes(2); expect(errors).toHaveBeenCalledTimes(2);
});
it('rejects stale overlay activation after replacement by an unsupported element', async () => {
  ios(); vi.spyOn(console, 'error').mockImplementation(() => {});
  const view = render(<Haptic iosPhysicalTap><button>Replace</button></Haptic>);
  const input = view.container.querySelector('input')!, label = view.container.querySelector('label')!;
  await act(async () => {
    view.getByRole('button').replaceWith(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    fireEvent.click(input); fireEvent.click(label); fireEvent.focus(input);
  });
  expect(view.container.querySelector('input')).toBeNull();
});
it.each(['fieldset', 'inert'])('tracks inherited %s restrictions in both directions', async kind => {
  ios(); const container = document.createElement(kind === 'fieldset' ? 'fieldset' : 'div');
  const attribute = kind === 'fieldset' ? 'disabled' : 'inert';
  container.setAttribute(attribute, ''); document.body.append(container);
  const view = render(<Haptic iosPhysicalTap><button>Target</button></Haptic>, { container });
  expect(container.querySelector('input[switch]')).toBeNull();
  await act(async () => { container.removeAttribute(attribute); });
  await waitFor(() => expect(container.querySelector('input[switch]')).not.toBeNull());
  await act(async () => { container.setAttribute(attribute, ''); });
  await waitFor(() => expect(container.querySelector('input[switch]')).toBeNull());
  view.unmount(); container.remove();
});
it('observes a new ancestor chain after a target is moved', async () => {
  ios(); const view = render(<Haptic iosPhysicalTap><button>Move</button></Haptic>);
  const ancestor = document.createElement('fieldset'); document.body.append(ancestor);
  await act(async () => { ancestor.append(view.container); });
  await act(async () => { ancestor.disabled = true; });
  await waitFor(() => expect(view.container.querySelector('input[switch]')).toBeNull());
  await act(async () => { ancestor.disabled = false; });
  await waitFor(() => expect(view.container.querySelector('input[switch]')).not.toBeNull());
  view.unmount(); ancestor.remove();
});
it('enables and removes the physical overlay when the explicit opt-in changes', () => {
  ios(); const view = render(<Haptic><button>Target</button></Haptic>);
  expect(view.container.querySelector('input')).toBeNull();
  view.rerender(<Haptic iosPhysicalTap><button>Target</button></Haptic>); expect(view.container.querySelector('input')).not.toBeNull();
  view.rerender(<Haptic><button>Target</button></Haptic>); expect(view.container.querySelector('input')).toBeNull();
});
