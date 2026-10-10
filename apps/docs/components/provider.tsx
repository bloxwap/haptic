'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import { basePath } from '@/lib/site';

export function Provider({ children }: { children: ReactNode }) {
  return <RootProvider theme={{ defaultTheme: 'dark', forcedTheme: 'dark' }} search={{ options: { type: 'static', api: `${basePath}/search.json` } }}>{children}</RootProvider>;
}
