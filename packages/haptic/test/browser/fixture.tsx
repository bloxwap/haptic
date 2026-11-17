import { createRoot } from 'react-dom/client';
import { useRef, useState, type MouseEvent } from 'react';
import { Haptic } from '@bloxwap/haptic';
import { Drawer } from 'vaul';

declare global { interface Window { originalEvents: { kind: string; target: string; shift: boolean; detail: number; trusted: boolean }[] } }
window.originalEvents = [];
function recordOriginal(kind: string, event: MouseEvent) {
  window.originalEvents.push({ kind, target: (event.target as Element).tagName, shift: event.shiftKey, detail: event.detail, trusted: event.isTrusted });
}
function OriginalInteractions() {
  return <section aria-label="Original event regressions">
    <div id="preserved-events" onClickCapture={event => recordOriginal('capture', event)}>
      <Haptic><button onPointerDown={event => recordOriginal('pointer', event)} onClick={event => recordOriginal('action', event)}>Original events</button></Haptic>
    </div>
    <Haptic iosPhysicalTap><div><button onClick={event => recordOriginal('nested', event)}>Wrapped descendant</button></div></Haptic>
    <Haptic iosPhysicalTap><svg role="button" tabIndex={0} aria-label="SVG target" width="100" height="40" onClick={event => recordOriginal('svg', event)}><rect width="100" height="40" fill="red" /></svg></Haptic>
    <fieldset id="inherited-disabled" disabled><legend>Inherited state</legend><Haptic iosPhysicalTap><button>Inherited target</button></Haptic></fieldset>
  </section>;
}

function SelfDisablingTarget() {
  const [enabled, setEnabled] = useState(true), [activated, setActivated] = useState(false);
  return <div id="self-disabling">
    <Haptic iosPhysicalTap enabled={enabled}><button onClick={() => {
      setActivated(document.querySelector<HTMLInputElement>('#self-disabling input[switch]')?.checked ?? false);
      setEnabled(false);
    }}>Disable own feedback</button></Haptic>
    <output id="native-before-action">{String(activated)}</output>
  </div>;
}

function App() {
  const [action, setAction] = useState(0), [parent, setParent] = useState(0), [submit, setSubmit] = useState(0);
  const [enabled, setEnabled] = useState(true), [drawerMoves, setDrawerMoves] = useState(0);
  const [debug, setDebug] = useState(false), [mounted, setMounted] = useState(true);
  const host = useRef<HTMLButtonElement>(null);
  return <>
    <h1>Haptic interactions</h1>
    <label><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />Enable</label>
    <div onClick={() => setParent(value => value + 1)}>
      <Haptic iosPhysicalTap enabled={enabled}><button ref={host} type="button" onClick={() => setAction(value => value + 1)}>Tap action</button></Haptic>
    </div>
    <button type="button" onClick={() => host.current?.focus()}>Focus target</button>
    <form onSubmit={event => { event.preventDefault(); setSubmit(value => value + 1); }}>
      <input type="hidden" name="token" value="original" />
      <label>Form value<input defaultValue="original" /></label>
      <Haptic iosPhysicalTap><button type="submit">Submit action</button></Haptic>
      <Haptic iosPhysicalTap><button type="reset">Reset action</button></Haptic>
      <Haptic iosPhysicalTap><button type="submit" onClick={event => event.preventDefault()}>Prevent submit</button></Haptic>
      <Haptic iosPhysicalTap><button disabled type="button">Disabled action</button></Haptic>
    </form>
    <Haptic iosPhysicalTap><a href="#destination">Navigate target</a></Haptic>
    <div data-vaul-drawer="" onPointerDown={() => setDrawerMoves(value => value + 1)}><Haptic iosPhysicalTap><button type="button" onClick={() => setAction(value => value + 1)}>Drawer action</button></Haptic></div>
    <Drawer.Root>
      <Drawer.Trigger>Open real drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay style={{ position: 'fixed', inset: 0, background: '#0004' }} />
        <Drawer.Content style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: 40 }}>
          <Drawer.Title>Real Vaul drawer</Drawer.Title>
          <Drawer.Description>Verify that haptic targets preserve the drawer action.</Drawer.Description>
          <Haptic iosPhysicalTap><button onClick={() => setAction(value => value + 1)}>Real drawer action</button></Haptic>
          <Drawer.Close>Close real drawer</Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    <label><input type="checkbox" checked={debug} onChange={event => setDebug(event.target.checked)} />Debug audio</label>
    <button onClick={() => setMounted(value => !value)}>Toggle feedback target</button>
    {mounted && <Haptic iosPhysicalTap feedback="buzz" webHapticsOptions={{ debug, showSwitch: true }}><button>Debug feedback</button></Haptic>}
    <SelfDisablingTarget />
    <OriginalInteractions />
    <output id="actions">{action}</output><output id="parent">{parent}</output><output id="submits">{submit}</output><output id="drawer">{drawerMoves}</output>
    <h2 id="destination">Destination</h2>
  </>;
}
createRoot(document.getElementById('root')!).render(<App />);
