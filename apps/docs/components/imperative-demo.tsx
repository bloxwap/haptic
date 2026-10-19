'use client';

import { canTriggerHaptic, triggerHaptic, type HapticTriggerResult } from '@bloxwap/haptic';
import { Button } from '@bloxwap/hig-react/button';
import { useEffect, useRef, useState } from 'react';

/** Keep request results visible without presenting browser acceptance as tactile evidence. */
export function ImperativeDemo() {
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState('No request yet.');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    setReady(true);
    return () => { clearTimeout(timer.current); };
  }, []);
  const request = () => {
    const capability = canTriggerHaptic();
    const pending = triggerHaptic('success');
    void pending.then((value: HapticTriggerResult) => {
      setResult(`Available: ${capability.available} · Request accepted: ${value.delivered} · Route: ${value.mechanism}${value.reason ? ` · ${value.reason}` : ''}`);
    });
  };
  return <section className="guide-demo hig-surface" aria-label="Imperative feedback examples">
    <h2>Imperative feedback</h2>
    <p>Try a synchronous request, a request after an await, or a timer. On iOS these report unavailable; use a physical target above for its system tick. Browser acceptance does not prove tactile output.</p>
    <div className="demo-actions">
      <Button disabled={!ready} onClick={request}>Request now</Button>
      <Button intent="secondary" disabled={!ready} onClick={async () => { await Promise.resolve(); request(); }}>Request after await</Button>
      <Button intent="secondary" disabled={!ready} onClick={() => {
        clearTimeout(timer.current);
        setResult('Waiting for timer.');
        timer.current = setTimeout(request, 1000);
      }}>Request from timer</Button>
    </div>
    <p role="status">{result}</p>
  </section>;
}
