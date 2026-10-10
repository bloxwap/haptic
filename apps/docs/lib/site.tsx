import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const siteUrl = 'https://bloxwap.github.io';
export const repository = 'https://github.com/bloxwap/haptic';
export const asset = (path: string) => `${basePath}${path}`;

export function layoutOptions(): BaseLayoutProps {
  return {
    nav: { title: <span className="brand"><img src={asset('/logos/bloxwap-icon-green.svg')} width={26} height={26} alt="Bloxwap" /><span>Haptic</span></span>, url: '/' },
    githubUrl: repository,
    themeSwitch: { enabled: false },
    links: [{ text: 'Documentation', url: '/docs', active: 'nested-url' }],
  };
}
