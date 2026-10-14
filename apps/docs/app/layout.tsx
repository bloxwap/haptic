import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BloxwapSans } from '@bloxwap/font/sans';
import { BloxwapMono } from '@bloxwap/font/mono';
import { Provider } from '@/components/provider';
import { basePath, siteUrl } from '@/lib/site';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}${basePath}/`),
  title: { default: 'Haptic · Bloxwap', template: '%s · Haptic' },
  description: 'Haptic feedback for React. Physical taps on iOS, patterns on vibration-capable browsers, and a target that keeps its original behavior.',
  icons: { icon: `${basePath}/logos/bloxwap-icon-green.svg` },
  openGraph: { title: 'Haptic · Bloxwap', description: 'Give React interactions a physical response.', type: 'website', url: `${siteUrl}${basePath}/` },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={`${BloxwapSans.variable} ${BloxwapMono.variable} dark`} suppressHydrationWarning><body className="flex min-h-screen flex-col antialiased"><Provider>{children}</Provider></body></html>;
}
