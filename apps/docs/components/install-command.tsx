'use client';

import { useEffect, useState } from 'react';
import { CheckIcon } from '@bloxwap/hig-react/brand';
import { IconButton } from '@bloxwap/hig-react/button';
import { Tabs } from '@bloxwap/hig-react/navigation';

const managers = [
  { name: 'bun', command: 'bun add @bloxwap/haptic' },
  { name: 'npm', command: 'npm install @bloxwap/haptic' },
  { name: 'pnpm', command: 'pnpm add @bloxwap/haptic' },
  { name: 'yarn', command: 'yarn add @bloxwap/haptic' },
];

function CopyIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>;
}

/** Package-manager tabs and copy action use HIG Tabs/IconButton; the commands stay SDK-owned. */
export function InstallCommand() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const [selected, setSelected] = useState('npm');
  const [copyResult, setCopyResult] = useState<{ command: string; success: boolean } | null>(null);
  const command = managers.find(manager => manager.name === selected)!.command;
  const result = copyResult?.command === command ? copyResult : null;

  useEffect(() => {
    if (!copyResult) return;
    const timer = window.setTimeout(() => setCopyResult(null), copyResult.success ? 2000 : 5000);
    return () => window.clearTimeout(timer);
  }, [copyResult]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyResult({ command: text, success: true });
    } catch {
      setCopyResult({ command: text, success: false });
    }
  }

  return <div className="package-install">
    <Tabs
      label="Package manager"
      value={selected}
      onValueChange={value => { setSelected(value); setCopyResult(null); }}
      items={managers.map(manager => ({
        value: manager.name,
        label: manager.name,
        disabled: !ready,
        content: <div className="install-command">
          <span className="install-prompt" aria-hidden="true">$</span>
          <code>{manager.command}</code>
          <IconButton intent="ghost" label="Copy install command" disabled={!ready} title={result?.success ? 'Copied!' : 'Copy command'} onClick={() => copy(manager.command)}>
            {result?.success && manager.command === command ? <CheckIcon /> : <CopyIcon />}
          </IconButton>
        </div>,
      }))}
    />
    <span role="status" className={result && !result.success ? 'install-feedback' : 'hig-sr-only'}>
      {result ? result.success ? 'Command copied to clipboard.' : 'Could not copy. Select the command to copy it manually.' : ''}
    </span>
    <p className="install-platforms">React 18+ · SSR-safe · ESM + CommonJS</p>
  </div>;
}
