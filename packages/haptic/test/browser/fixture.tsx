import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import { Haptic } from '@bloxwap/haptic';
import { Drawer } from 'vaul';

function App() {
  const [action, setAction] = useState(0), [parent, setParent] = useState(0), [submit, setSubmit] = useState(0);
  const [enabled, setEnabled] = useState(true), [drawerMoves, setDrawerMoves] = useState(0);
  const [debug, setDebug] = useState(false), [mounted, setMounted] = useState(true);
  const host = useRef<HTMLButtonElement>(null);
  return <>
    <h1>Haptic interactions</h1>
    <label><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />Enable</label>
    <div onClick={() => setParent(value => value + 1)}>
      <Haptic enabled={enabled}><button ref={host} type="button" onClick={() => setAction(value => value + 1)}>Tap action</button></Haptic>
    </div>
    <button type="button" onClick={() => host.current?.focus()}>Focus target</button>
    <form onSubmit={event => { event.preventDefault(); setSubmit(value => value + 1); }}>
      <input type="hidden" name="token" value="original" />
      <Haptic><button type="submit">Submit action</button></Haptic>
      <Haptic><button type="submit" onClick={event => event.preventDefault()}>Prevent submit</button></Haptic>
      <Haptic><button disabled type="button">Disabled action</button></Haptic>
    </form>
    <Haptic><a href="#destination">Navigate target</a></Haptic>
    <div data-vaul-drawer="" onPointerDown={() => setDrawerMoves(value => value + 1)}><Haptic><button type="button" onClick={() => setAction(value => value + 1)}>Drawer action</button></Haptic></div>
    <Drawer.Root>
      <Drawer.Trigger>Open real drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay style={{ position: 'fixed', inset: 0, background: '#0004' }} />
        <Drawer.Content style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: 40 }}>
          <Drawer.Title>Real Vaul drawer</Drawer.Title>
          <Drawer.Description>Verify that haptic targets preserve the drawer action.</Drawer.Description>
          <Haptic><button onClick={() => setAction(value => value + 1)}>Real drawer action</button></Haptic>
          <Drawer.Close>Close real drawer</Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    <label><input type="checkbox" checked={debug} onChange={event => setDebug(event.target.checked)} />Debug audio</label>
    <button onClick={() => setMounted(value => !value)}>Toggle feedback target</button>
    {mounted && <Haptic feedback="buzz" webHapticsOptions={{ debug, showSwitch: true }}><button>Debug feedback</button></Haptic>}
    <output id="actions">{action}</output><output id="parent">{parent}</output><output id="submits">{submit}</output><output id="drawer">{drawerMoves}</output>
    <h2 id="destination">Destination</h2>
  </>;
}
createRoot(document.getElementById('root')!).render(<App />);
