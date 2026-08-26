import { LeadForm } from '@/components/LeadForm';
import { pageMeta, SITE, breadcrumbJsonLd, JsonLd } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Contact Mera Hissa',
  description:
    'Ask a question about claiming a deceased family member\'s bank accounts, shares '
    + 'or insurance in India. We answer within one working day.',
  path: '/contact',
});

export default function Contact() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' },
      ])} />

      <h1>Talk to us</h1>
      <p className="sub">
        Tell us roughly what you are dealing with and we will tell you honestly whether
        we can help. If your case needs a lawyer rather than us, we will say so.
      </p>

      <LeadForm
        source="contact_form"
        heading="Send us a message"
        blurb="We answer within one working day, in English or Hindi."
      />

      <section className="sect">
        <h2>Or reach us directly</h2>
        <p>
          Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          {' '}&middot; Phone <a href={`tel:${SITE.phone}`}>{SITE.phone}</a>
        </p>
        <p className="hint">
          Monday to Saturday, 10am to 7pm IST. We do not cold-call and we never ask for
          money over the phone.
        </p>
      </section>
    </>
  );
}
