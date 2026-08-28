import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

// The triage page itself is a Client Component and cannot export metadata, so
// this server-component layout supplies its title, description and canonical.
// Without it /triage inherited the root defaults — a title and description
// byte-for-byte identical to the homepage, and no canonical — while sitting in
// the sitemap at priority 0.9.
export const metadata: Metadata = pageMeta({
  title: 'Free check: what your claim needs',
  description:
    'Answer six questions and see, for free, which documents each bank, fund and '
    + 'insurer will ask for and what each heir inherits. Nothing leaves your device.',
  path: '/triage',
});

export default function TriageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
