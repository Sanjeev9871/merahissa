import { LeadForm } from '@/components/LeadForm';
import { pageMeta, SITE, breadcrumbJsonLd, JsonLd } from '@/lib/seo';
import { UI } from '@/lib/i18n';

const t = UI.hi;

export const metadata = pageMeta({
  title: 'मेरा हिस्सा से संपर्क करें',
  description:
    'भारत में किसी परिवारजन के बैंक खाते, शेयर या बीमा पर दावे से जुड़ा सवाल पूछिए। '
    + 'हम एक कार्यदिवस में जवाब देते हैं।',
  path: '/hi/contact',
});

export default function HindiContact() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: t.notFound.home, path: '/hi' }, { name: t.nav.contact, path: '/hi/contact' },
      ])} />

      <h1>हमसे बात कीजिए</h1>
      <p className="sub">
        मोटे तौर पर बताइए कि आप किस स्थिति में हैं, और हम ईमानदारी से बताएँगे कि हम मदद कर सकते हैं
        या नहीं। अगर आपके मामले में हमारी नहीं, वकील की ज़रूरत है, तो हम यही कहेंगे।
      </p>

      <LeadForm
        source="contact_form"
        locale="hi"
        heading="हमें संदेश भेजिए"
        blurb="हम एक कार्यदिवस में जवाब देते हैं, हिन्दी या अंग्रेज़ी में।"
      />

      <section className="sect">
        <h2>या सीधे संपर्क कीजिए</h2>
        <p>
          ईमेल <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          {' '}&middot; फ़ोन <a href={`tel:${SITE.phoneHref}`}>{SITE.phone}</a>
        </p>
        <p className="hint">
          सोमवार से शनिवार, सुबह 10 बजे से शाम 7 बजे तक (IST)। हम बिना पूछे फ़ोन नहीं करते और
          फ़ोन पर कभी पैसे नहीं माँगते।
        </p>

        <address style={{ fontStyle: 'normal', marginTop: '1rem' }}>
          <strong style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: '0.9rem' }}>
            Mera Hissa
          </strong>
          <br />
          {SITE.address.street}
          <br />
          {SITE.address.locality}, {SITE.address.region} {SITE.address.postalCode}
          <br />
          {SITE.address.country}
        </address>
      </section>
    </>
  );
}
