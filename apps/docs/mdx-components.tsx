import defaults from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { InteractionDemo } from '@/components/interaction-demo';

export function getMDXComponents(components: MDXComponents = {}): MDXComponents {
  return { ...defaults, InteractionDemo, ...components };
}
