import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { layoutOptions } from '@/lib/site';

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayout {...layoutOptions()} tree={source.getPageTree()}>{children}</DocsLayout>;
}
