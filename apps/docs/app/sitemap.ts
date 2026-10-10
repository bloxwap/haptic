import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { basePath, siteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${siteUrl}${basePath}/` }, ...source.getPages().map(page => ({ url: `${siteUrl}${basePath}${page.url}/` }))];
}
