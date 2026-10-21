import { createMDX } from 'fumadocs-mdx/next';

export default createMDX()({
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  images: { unoptimized: true },
  reactStrictMode: true,
  // The type gate runs before `next build`: the build script runs `next typegen` then
  // `tsrs --noEmit -p .`, so Next's own (slower) tsc pass is redundant and skipped here.
  typescript: { ignoreBuildErrors: true },
});
