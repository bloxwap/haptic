import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { HapticBoard } from '@/components/haptic-board';
import { layoutOptions, repository } from '@/lib/site';

export default function Home() {
  return <HomeLayout {...layoutOptions()}><main className="home">
    <section className="hero"><span className="eyebrow">Bloxwap / Haptic</span><h1>Give your interface<br />a physical response.</h1><p>Wrap a React target in Haptic. Taps get feedback, and your button keeps its handlers, ref, focus, and accessibility.</p><div className="hero-actions"><code className="install">npm install @bloxwap/haptic</code><Link className="text-link" href="/docs">Read the docs →</Link></div><p className="support-note">The first npm release is in preparation. <a className="text-link" href={`${repository}/issues/1`}>Follow the release plan</a>.</p></section>
    <HapticBoard />
    <section className="feature-row" aria-label="Features"><article><h3>One target. Same action.</h3><p>Your original element stays in place. Links navigate, forms submit, keyboard activation works, and refs point to the same host.</p></article><article><h3>Feedback for the device.</h3><p>Physical iOS taps use a native system tick. Vibration-capable browsers support eleven presets, intensity, and custom patterns.</p></article><article><h3>Small package. Separate docs.</h3><p>Typed React components, server-safe rendering, ESM and CommonJS. The website and its tooling stay outside your application bundle.</p></article></section>
    <footer className="site-footer"><span>Haptic by Bloxwap · MIT</span><a href={repository}>Source on GitHub ↗</a></footer>
  </main></HomeLayout>;
}
