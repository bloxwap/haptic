'use client';

import { Haptic } from '@bloxwap/haptic';
import { useRef, useState } from 'react';
import { Drawer } from 'vaul';

export function InteractionDemo() {
  const [enabled, setEnabled] = useState(true);
  const [count, setCount] = useState(0);
  const [submitted, setSubmitted] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return <section className="guide-demo" aria-label="Interaction examples">
    <label><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /> Enable feedback</label>
    <div className="demo-actions">
      <Haptic enabled={enabled}><button ref={ref} className="demo-button" onClick={() => setCount(value => value + 1)}>Count action</button></Haptic>
      <button className="demo-button" onClick={() => ref.current?.focus()}>Focus original button</button>
      <Haptic><button disabled className="demo-button">Disabled target</button></Haptic>
      <Haptic><a className="demo-button" href="#interaction-result">Jump to result</a></Haptic>
      <button className="demo-button" onClick={() => setDrawer(true)}>Open drawer example</button>
    </div>
    <form onSubmit={event => { event.preventDefault(); setSubmitted(value => value + 1); }}>
      <label>Form value<input className="demo-input" defaultValue="original" /></label>
      <Haptic feedback="success" enabled={enabled}><button type="submit" className="demo-button">Submit form</button></Haptic>
      <Haptic enabled={enabled}><button type="reset" className="demo-button">Reset form</button></Haptic>
    </form>
    <Drawer.Root open={drawer} onOpenChange={setDrawer}>
      <Drawer.Portal>
        <Drawer.Overlay className="drawer-overlay" />
        <Drawer.Content className="drawer-content">
          <Drawer.Title>Haptic inside a Vaul drawer</Drawer.Title>
          <Drawer.Description>Tap the target without starting an ancestor drag.</Drawer.Description>
          <Haptic enabled={enabled}><button className="demo-button" onClick={() => setCount(value => value + 1)}>Drawer action</button></Haptic>
          <Drawer.Close className="demo-button">Close drawer</Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    <p id="interaction-result" role="status">Actions: {count} · Form submissions: {submitted}</p>
  </section>;
}
