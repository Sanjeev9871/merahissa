import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

// The triage wizard is a Client Component and cannot export metadata itself,
// so this server layout supplies the Hindi title, description and canonical.
export const metadata: Metadata = pageMeta({
  title: 'निःशुल्क जाँच: आपके दावे में क्या चाहिए',
  description:
    'छह सवालों के जवाब दीजिए और निःशुल्क जानिए कि हर बैंक, फंड और बीमा कंपनी कौन-से कागज़ात '
    + 'माँगेगी और किस वारिस को कितना हिस्सा मिलेगा। कुछ भी आपके उपकरण से बाहर नहीं जाता।',
  path: '/hi/triage',
});

export default function HindiTriageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
