import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { BloxwapSans } from '@bloxwap/font/sans';
import { BloxwapMono } from '@bloxwap/font/mono';
import { Provider } from '@/components/provider';
import { basePath, siteUrl } from '@/lib/site';
import './global.css';

const display = localFont({
  src: '../fonts/SpaceGrotesk-Bold.ttf', weight: '700',
  variable: '--font-docs-display', display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}${basePath}/`),
  title: { default: 'Haptic · Bloxwap', template: '%s · Haptic' },
  description: 'Haptic feedback for React. Physical taps on iOS, patterns on vibration-capable browsers, and a target that keeps its original behavior.',
  icons: { icon: `${basePath}/logos/bloxwap-icon-green.svg` },
  openGraph: { title: 'Haptic · Bloxwap', description: 'Give React interactions a physical response.', type: 'website', url: `${siteUrl}${basePath}/` },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={`${BloxwapSans.variable} ${BloxwapMono.variable} ${display.variable} dark`} suppressHydrationWarning><body className="flex min-h-screen flex-col antialiased"><Provider>{children}</Provider></body></html>;
}
