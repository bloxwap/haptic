'use client';

import { Haptic, useIOSNativeHaptics, type HapticInput } from '@bloxwap/haptic';
import { Slider, Switch } from '@bloxwap/hig-react/selection';
import { useEffect, useState } from 'react';

const presets = [
  ['selection', 'A tiny tick'], ['light', 'A gentle tap'], ['medium', 'A firm tap'], ['heavy', 'A strong tap'],
  ['soft', 'A softer response'], ['rigid', 'Short and crisp'], ['success', 'A confirmation'], ['warning', 'A heads-up'],
  ['error', 'Three sharp taps'], ['nudge', 'Strong, then soft'], ['buzz', 'A longer vibration'],
] as const;

/** The SDK's distinctive preset board. HIG supplies the settings controls; presets and Haptic targets stay SDK-owned. */
export function HapticBoard() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const [enabled, setEnabled] = useState(true);
  const [debug, setDebug] = useState(false);
  const [intensity, setIntensity] = useState(0.5);
  const [actions, setActions] = useState(0);
  const [last, setLast] = useState('none');
  const native = useIOSNativeHaptics();
  const record = (name: string) => { setActions(count => count + 1); setLast(name); };
  const target = (name: string, input: HapticInput, description: string) => (
    <Haptic key={name} enabled={enabled} feedback={input} triggerOptions={{ intensity }} webHapticsOptions={{ debug }} style={{ display: 'grid' }}>
      <button type="button" disabled={!ready} className="preset" data-active={last === name} onClick={() => record(name)}><strong>{name}</strong><small>{description}</small></button>
    </Haptic>
  );
  return <section id="board" className="hero-preview" aria-labelledby="board-title">
    <div className="preview-intro"><p className="eyebrow">11 presets · 1 component</p><h2 id="board-title">Tap to feel it.</h2><p>Choose a preset or try a custom pattern.</p></div>
    <div className="board hig-surface">
      <div className="settings">
        <Switch label="Feedback enabled" disabled={!ready} checked={enabled} onCheckedChange={setEnabled} />
        <Switch label="Desktop audio preview" disabled={!ready} checked={debug} onCheckedChange={setDebug} />
        <div className="board-slider"><Slider label="Intensity" disabled={!ready} min={0} max={1} step={0.1} value={intensity} onValueChange={value => setIntensity(Math.round(value * 10) / 10)} /></div>
      </div>
      <div className="preset-grid">
        {presets.map(([name, description]) => target(name, name, description))}
        {target('custom', [{ duration: 30 }, { delay: 60, duration: 30 }], 'Your own two-tap pattern')}
      </div>
      <div className="status" role="status">Actions: {actions} · Last: {last}</div>
      <p className="support-note">{native ? 'On iOS, every preset uses the same native system tick. Tap on a supported physical iPhone with system haptics enabled.' : 'Patterns need a vibration-capable device. Desktop audio preview lets you try the feedback without vibration hardware.'} Actions still work when feedback is off.</p>
    </div>
  </section>;
}
