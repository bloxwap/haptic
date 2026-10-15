'use client';

import { Haptic } from '@bloxwap/haptic';
import { Button } from '@bloxwap/hig-react/button';
import { Field, Input } from '@bloxwap/hig-react/field';
import { Switch } from '@bloxwap/hig-react/selection';
import { useEffect, useRef, useState } from 'react';
import { Drawer } from 'vaul';

/** SDK interaction demo. HIG renders the controls; Haptic keeps each original target, ref and action. */
export function InteractionDemo() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const [enabled, setEnabled] = useState(true);
  const [count, setCount] = useState(0);
  const [submitted, setSubmitted] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return <section className="guide-demo hig-surface" aria-label="Interaction examples">
    <Switch label="Enable feedback" disabled={!ready} checked={enabled} onCheckedChange={setEnabled} />
    <div className="demo-actions">
      <Haptic enabled={enabled}><Button disabled={!ready} ref={ref} onClick={() => setCount(value => value + 1)}>Count action</Button></Haptic>
      <Button intent="secondary" disabled={!ready} onClick={() => ref.current?.focus()}>Focus original button</Button>
      <Haptic><Button intent="secondary" disabled>Disabled target</Button></Haptic>
      <Haptic><a className="hig-button" data-intent="secondary" href="#interaction-result">Jump to result</a></Haptic>
      <Button intent="secondary" disabled={!ready} onClick={() => setDrawer(true)}>Open drawer example</Button>
    </div>
    <form onSubmit={event => { event.preventDefault(); setSubmitted(value => value + 1); }}>
      <Field label="Form value" disabled={!ready}><Input name="value" defaultValue="original" /></Field>
      <div className="demo-actions"><Haptic feedback="success" enabled={enabled}><Button disabled={!ready} type="submit">Submit form</Button></Haptic>
      <Haptic enabled={enabled}><Button intent="secondary" disabled={!ready} type="reset">Reset form</Button></Haptic></div>
    </form>
    <Drawer.Root open={drawer} onOpenChange={setDrawer}>
      <Drawer.Portal>
        <Drawer.Overlay className="hig-backdrop" />
        <Drawer.Content className="drawer-content">
          <Drawer.Title>Haptic inside a Vaul drawer</Drawer.Title>
          <Drawer.Description>Tap the target without starting an ancestor drag.</Drawer.Description>
          <div className="demo-actions"><Haptic enabled={enabled}><Button onClick={() => setCount(value => value + 1)}>Drawer action</Button></Haptic>
          <Drawer.Close className="hig-button" data-intent="secondary">Close drawer</Drawer.Close></div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    <p id="interaction-result" role="status">Actions: {count} · Form submissions: {submitted}</p>
  </section>;
}
