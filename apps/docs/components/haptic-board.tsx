'use client';

import { Haptic, useIOSNativeHaptics, type HapticInput } from '@bloxwap/haptic';
import { useState } from 'react';

const presets = [
  ['selection', 'A tiny tick'], ['light', 'A gentle tap'], ['medium', 'A firm tap'], ['heavy', 'A strong tap'],
  ['soft', 'A softer response'], ['rigid', 'Short and crisp'], ['success', 'A confirmation'], ['warning', 'A heads-up'],
  ['error', 'Three sharp taps'], ['nudge', 'Strong, then soft'], ['buzz', 'A longer vibration'],
] as const;

export function HapticBoard() {
  const [enabled, setEnabled] = useState(true);
  const [debug, setDebug] = useState(false);
  const [intensity, setIntensity] = useState(0.5);
  const [actions, setActions] = useState(0);
  const [last, setLast] = useState('none');
  const native = useIOSNativeHaptics();
  const record = (name: string) => { setActions(count => count + 1); setLast(name); };
  const target = (name: string, input: HapticInput, description: string) => (
    <Haptic key={name} enabled={enabled} feedback={input} triggerOptions={{ intensity }} webHapticsOptions={{ debug }} style={{ display: 'grid' }}>
      <button className="preset" onClick={() => record(name)}><strong>{name}</strong><small>{description}</small></button>
    </Haptic>
  );
  return <section className="board" aria-labelledby="board-title">
    <div className="board-heading"><div><h2 id="board-title">Tap to feel it.</h2><p>Choose a preset or try a custom pattern.</p></div><span className="eyebrow">11 presets · 1 component</span></div>
    <div className="settings">
      <label><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />Feedback enabled</label>
      <label><input type="checkbox" checked={debug} onChange={event => setDebug(event.target.checked)} />Desktop audio preview</label>
      <label>Intensity <input aria-label="Intensity" type="range" min="0" max="1" step="0.1" value={intensity} onChange={event => setIntensity(Number(event.target.value))} /><output>{intensity.toFixed(1)}</output></label>
    </div>
    <div className="preset-grid">
      {presets.map(([name, description]) => target(name, name, description))}
      {target('custom', [{ duration: 30 }, { delay: 60, duration: 30 }], 'Your own two-tap pattern')}
    </div>
    <div className="status" role="status">Actions: {actions} · Last: {last}</div>
    <p className="support-note">{native ? 'On iOS, every preset uses the same native system tick. Tap on a supported physical iPhone with system haptics enabled.' : 'Patterns need a vibration-capable device. Desktop audio preview lets you try the feedback without vibration hardware.'} Actions still work when feedback is off.</p>
  </section>;
}
