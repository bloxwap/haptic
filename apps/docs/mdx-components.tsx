import defaults from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import { Callout as HIGCallout } from '@bloxwap/hig-react/status';
import { InteractionDemo } from '@/components/interaction-demo';

const severity = { info: 'info', note: 'note', idea: 'tip', success: 'success', warn: 'warning', warning: 'warning', error: 'error' } as const;

/** Docs callouts render the HIG Callout (ReactNode titles, note/tip edges). Static page content does not announce itself as a live region. */
function Callout({ title, type = 'info', children }: { title: ReactNode; type?: keyof typeof severity; children: ReactNode }) {
  return <div className="docs-callout not-prose"><HIGCallout title={title} severity={severity[type]} announce={false}>{children}</HIGCallout></div>;
}

export function getMDXComponents(components: MDXComponents = {}): MDXComponents {
  return { ...defaults, Callout, InteractionDemo, ...components };
}
