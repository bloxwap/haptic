import Link from 'next/link';

export default function NotFound() {
  return <main className="home"><h1>Page not found</h1><p>The page may have moved.</p><Link className="text-link" href="/docs">Open documentation</Link></main>;
}
