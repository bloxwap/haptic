import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { source } from '@/lib/source';
import { layoutOptions } from '@/lib/site';

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayout {...layoutOptions()} tree={source.getPageTree()} sidebar={{
    defaultOpenLevel: 1,
    footer: <div className="docs-sidebar-footer"><a href="https://bloxwap.com" className="docs-app-link">Open Bloxwap <ArrowUpRight className="size-4" aria-hidden="true" /></a></div>,
  }}>{children}</DocsLayout>;
}
