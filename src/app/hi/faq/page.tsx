import Link from 'next/link';
import { TOPIC_ORDER } from '@/lib/faq';
import { FAQS_HI, TOPIC_LABELS_HI, faqsByTopicHi } from '@/lib/faq.hi';
import { pageMeta, breadcrumbJsonLd, JsonLd } from '@/lib/seo';
import { UI } from '@/lib/i18n';

const t = UI.hi;

export const metadata = pageMeta({
  title: 'परिवारजन की संपत्ति पर दावे के आम सवाल',
  description:
    'क्या उत्तराधिकार प्रमाण पत्र चाहिए? क्या नॉमिनी ही पैसा रख लेता है? भारत में किसी के '
    + 'निधन के बाद परिवार जो पूछते हैं, उनके सीधे जवाब।',
  path: '/hi/faq',
});

export default function HindiFaqPage() {
  return (
    <>
      <JsonLd data={[
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: 'hi-IN',
          mainEntity: FAQS_HI.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
        breadcrumbJsonLd([
          { name: t.notFound.home, path: '/hi' },
          { name: t.nav.questions, path: '/hi/faq' },
        ]),
      ]} />

      <h1>परिवार हमसे जो सवाल पूछते हैं</h1>
      <p className="sub">
        सीधे जवाब, उन सवालों के भी जिनका मतलब है कि आपको हमारी ज़रूरत नहीं। अगर आपका सवाल यहाँ
        नहीं है, तो <Link href="/hi/contact">हमसे सीधे पूछिए</Link> &mdash; हम एक कार्यदिवस में
        जवाब देते हैं।
      </p>

      {TOPIC_ORDER.map((topic) => (
        <section className="sect" key={topic}>
          <h2>{TOPIC_LABELS_HI[topic]}</h2>
          <div className="faq-list">
            {faqsByTopicHi(topic).map((f) => (
              <details className="faq" key={f.id} id={f.id}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section className="sect">
        <h2>अब भी उलझन में हैं?</h2>
        <p className="sub">
          निःशुल्क जाँच ऊपर के ज़्यादातर सवालों के पीछे के दो असली सवालों का जवाब देती है: किसे
          कितना मिलेगा, और आपके संस्थान कौन-से कागज़ात माँगेंगे।
        </p>
        <div className="cta-row">
          <Link href="/hi/triage" className="btn btn-lg">{t.cta.check}</Link>
          <span className="cta-note">{t.cta.checkNote}</span>
        </div>
      </section>

      <p className="hint" style={{ marginTop: '2rem' }}>
        {FAQS_HI.length} सवाल। ज़रूरतें बदलती रहती हैं &mdash; समय-संवेदनशील किसी भी बात की पुष्टि
        दाखिल करने से पहले संस्थान से कर लें।
      </p>
    </>
  );
}
