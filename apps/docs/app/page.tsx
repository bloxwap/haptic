import Link from 'next/link';
import { CodeWindow } from '@bloxwap/hig-react/recipes/code-window';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { HapticBoard } from '@/components/haptic-board';
import { InstallCommand } from '@/components/install-command';
import { SiteFooter } from '@/components/site-footer';
import { layoutOptions, repository } from '@/lib/site';

export default function Home() {
  return <HomeLayout {...layoutOptions()}><main className="home">
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow"><span className="status-dot" /> Bloxwap / Haptic</p>
        <h1>Give your interface<br />a physical response.</h1>
        <p className="hero-description">Wrap a React target in Haptic. Taps get feedback, and your button keeps its handlers, ref, focus, and accessibility.</p>
        <div className="hero-actions"><a href="#board" className="hig-button" data-intent="primary">Try the haptic board <span aria-hidden="true">↓</span></a><Link className="hig-button" data-intent="secondary" href="/docs">Read the docs <span aria-hidden="true">→</span></Link></div>
        <InstallCommand />
        <p className="support-note">The first npm release is in preparation. <a className="text-link" href={`${repository}/issues/1`}>Follow the release plan</a>.</p>
      </div>
      {/* HIG CodeWindow recipe (language label + focusable code); its entry imports no overlay or Radix peer. */}
      <figure className="code-window" aria-label="React usage example">
        <CodeWindow language="TSX · your-button.tsx"><span className="syntax-keyword">import</span>{' { Haptic } '}<span className="syntax-keyword">from</span>{' '}<span className="syntax-string">{'\'@bloxwap/haptic\''}</span>{';\n\n'}<span className="syntax-muted">{'// Add feedback. Keep your original button.'}</span>{'\n'}<span className="syntax-keyword">export function</span>{' SaveButton() {\n  '}<span className="syntax-keyword">return</span>{' (\n    <'}<span className="syntax-type">Haptic</span>{' feedback='}<span className="syntax-string">{'"success"'}</span>{'>\n      <'}<span className="syntax-type">button</span>{' onClick={save}>\n        Save changes\n      </'}<span className="syntax-type">button</span>{'>\n    </'}<span className="syntax-type">Haptic</span>{'>\n  );\n}'}</CodeWindow>
        <figcaption className="code-status"><span aria-hidden="true" />One component. Your original interaction.</figcaption>
      </figure>
    </section>
    <HapticBoard />
    <section className="principles" aria-label="Features"><article className="hig-surface"><span className="feature-number">01</span><h2>One target. Same action.</h2><p>Your original element stays in place. Links navigate, forms submit, keyboard activation works, and refs point to the same host.</p></article><article className="hig-surface"><span className="feature-number">02</span><h2>Feedback for the device.</h2><p>Physical iOS taps use a native system tick. Vibration-capable browsers support eleven presets, intensity, and custom patterns.</p></article><article className="hig-surface"><span className="feature-number">03</span><h2>Small package. Separate docs.</h2><p>Typed React components, server-safe rendering, ESM and CommonJS. The website and its tooling stay outside your application bundle.</p></article></section>
  </main><SiteFooter /></HomeLayout>;
}
