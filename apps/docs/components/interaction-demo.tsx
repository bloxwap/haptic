'use client';

import { Haptic } from '@bloxwap/haptic';
import { useEffect, useRef, useState } from 'react';
import { Drawer } from 'vaul';

export function InteractionDemo() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const [enabled, setEnabled] = useState(true);
  const [count, setCount] = useState(0);
  const [submitted, setSubmitted] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return <section className="guide-demo" aria-label="Interaction examples">
    <label className="switch"><input disabled={!ready} type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /><span className="switch-ui" aria-hidden="true" />Enable feedback</label>
    <div className="demo-actions">
      <Haptic enabled={enabled}><button disabled={!ready} ref={ref} className="btn btn--sm" onClick={() => setCount(value => value + 1)}>Count action</button></Haptic>
      <button disabled={!ready} className="btn btn--secondary btn--sm" onClick={() => ref.current?.focus()}>Focus original button</button>
      <Haptic><button disabled className="btn btn--secondary btn--sm">Disabled target</button></Haptic>
      <Haptic><a className="btn btn--secondary btn--sm" href="#interaction-result">Jump to result</a></Haptic>
      <button disabled={!ready} className="btn btn--secondary btn--sm" onClick={() => setDrawer(true)}>Open drawer example</button>
    </div>
    <form onSubmit={event => { event.preventDefault(); setSubmitted(value => value + 1); }}>
      <label>Form value<input disabled={!ready} className="demo-input" defaultValue="original" /></label>
      <div className="demo-actions"><Haptic feedback="success" enabled={enabled}><button disabled={!ready} type="submit" className="btn btn--sm">Submit form</button></Haptic>
      <Haptic enabled={enabled}><button disabled={!ready} type="reset" className="btn btn--secondary btn--sm">Reset form</button></Haptic></div>
    </form>
    <Drawer.Root open={drawer} onOpenChange={setDrawer}>
      <Drawer.Portal>
        <Drawer.Overlay className="drawer-overlay" />
        <Drawer.Content className="drawer-content">
          <Drawer.Title>Haptic inside a Vaul drawer</Drawer.Title>
          <Drawer.Description>Tap the target without starting an ancestor drag.</Drawer.Description>
          <div className="demo-actions"><Haptic enabled={enabled}><button className="btn btn--sm" onClick={() => setCount(value => value + 1)}>Drawer action</button></Haptic>
          <Drawer.Close className="btn btn--secondary btn--sm">Close drawer</Drawer.Close></div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    <p id="interaction-result" role="status">Actions: {count} · Form submissions: {submitted}</p>
  </section>;
}
