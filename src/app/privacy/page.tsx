import { pageMeta } from '@/lib/seo';

// Via pageMeta so the page gets a canonical URL and the brand is appended once
// by the layout template — not hardcoded, which produced "Privacy — Mera Hissa
// · Mera Hissa" and no canonical while the sitemap still submitted the page.
export const metadata = pageMeta({
  title: 'Privacy',
  description:
    'What Mera Hissa collects, how documents are stored and deleted, what the AI '
    + 'never sees, and your rights under the Digital Personal Data Protection Act.',
  path: '/privacy',
});

/**
 * Privacy notice.
 *
 * Written to be read, not to be survived. Every claim here corresponds to
 * something enforced in code, and the file that enforces it is named — if a
 * claim below ever stops being true, a test fails.
 */
export default function Privacy() {
  return (
    <>
      <h1>What we do with your information</h1>
      <p className="hint">Version 2026-08-31</p>

      <p>
        To prepare your claim documents, <strong>Mera Hissa collects and processes
        personal data about you, the person who has died, and the other legal heirs</strong>
        &mdash; including a death certificate and details of a family member&rsquo;s
        money. This notice explains what we collect, why, who processes it on our behalf,
        and how you can have it deleted. We have tried to design the service so that as
        little of it exists, in as few places, for as short a time, as the job allows.
      </p>
      <p>
        Mera Hissa is the data fiduciary for this information under the Digital Personal
        Data Protection Act 2023. We process it only to prepare and review your documents
        and to contact you about your case &mdash; never to advertise to you, and never
        for any purpose you have not agreed to.
      </p>

      <h2>What we collect, and why</h2>
      <ul>
        <li>
          <strong>The deceased&rsquo;s name and date of death.</strong> Printed on every
          claim form. Without them there is nothing to file.
        </li>
        <li>
          <strong>Each heir&rsquo;s name and relationship.</strong> The relationship
          decides the legal share; the name goes on the affidavit.
        </li>
        <li>
          <strong>Institution names, and the last four digits of an account.</strong>{' '}
          We never ask for a full account number. The bank already knows it.
        </li>
        <li>
          <strong>A value range, not a balance.</strong> Ranges are all the document
          rules need, and a range tells anyone who saw it far less than a balance would.
        </li>
        <li>
          <strong>PAN or Aadhaar, only where a form requires it.</strong> Stored
          encrypted, shown to you masked, and never sent to any AI system.
        </li>
      </ul>

      <h2>Documents you upload</h2>
      <p>
        Text is read from your scans <strong>on your own device</strong>, in your
        browser. Nothing is sent anywhere during that step. You see what we extracted,
        correct it, and only then does the file itself reach us.
      </p>
      <p>
        Stored files sit in a private bucket. They are reachable only through a link we
        generate for you that stops working after ten minutes.
      </p>

      <h2>How we use AI, and what it never sees</h2>
      <p>
        We use an AI model to draft covering letters and affidavit wording. The model is
        run by a <strong>third-party inference provider</strong> (currently Groq or
        OpenRouter, depending on availability), so the tokenised prompt described below
        leaves our servers and is processed by them. Before anything is sent, every name,
        account reference and institution is replaced with a placeholder such as{' '}
        <code>&#123;&#123;HEIR_1&#125;&#125;</code>. The model receives the <em>shape</em>{' '}
        of your case &mdash; which law applies, what kinds of asset there are &mdash; and
        never a single real name. Real values are put back on our own servers afterwards.
      </p>
      <p>
        PAN and Aadhaar are not even placeheld. They are simply never included.
      </p>
      <p>
        A check runs on every outbound request and blocks it outright if it detects
        anything resembling an identifier. If that check fires, your case stops and a
        person looks at it. It never quietly sends anyway.
      </p>
      <p>
        Your information is <strong>not used to train any AI system</strong>, ours or
        anyone else&rsquo;s.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Documents are deleted <strong>90 days after your case closes</strong>,
        automatically. You can delete everything sooner, at any time, from your case
        page &mdash; it is a real deletion, not a hidden flag, and we cannot recover it
        afterwards.
      </p>
      <p>
        We keep a record of actions taken on a case &mdash; that a pack was approved, that
        a document was downloaded. That log holds no names and no case contents.
      </p>

      <h2>Who else processes it</h2>
      <p>
        We use a small number of third-party service providers, who process your data
        only on our instructions and only to run this service:
      </p>
      <ul>
        <li>The Mera Hissa reviewer who checks your pack before it reaches you.</li>
        <li><strong>Supabase</strong> &mdash; hosts the database, the file storage, and sends your sign-in link by email.</li>
        <li>
          <strong>Vercel</strong> &mdash; hosts and serves the website, and counts page
          views for us. That counting is <strong>cookieless and aggregate</strong>: it sets
          no cookie, stores no IP address, and cannot identify you or follow you to
          other sites. It tells us that a guide was read, not who read it.
        </li>
        <li>
          <strong>PostHog</strong> &mdash; product analytics, which shows us which parts of
          the site people actually find useful. Unlike the page-view count above,{' '}
          <strong>PostHog sets a cookie in your browser</strong> so a returning visitor can
          be recognised, and processes that data on servers in the United States. It
          records how the site is used &mdash; pages visited and buttons pressed &mdash;
          not the contents of your case.
        </li>
        <li><strong>Groq / OpenRouter</strong> &mdash; the AI inference provider, which receives placeholder tokens only, as described above.</li>
        <li><strong>Razorpay</strong> &mdash; for payment. We never see or store your card or UPI details.</li>
        <li>An advocate, only if you ask us to introduce you, and only what you agree to share.</li>
      </ul>
      <p>
        Some of these providers may process data on servers outside India. We do not sell
        your data to anyone, we do not share it for anyone else&rsquo;s advertising, and
        there are no advertising trackers on this site &mdash; the measurement described
        above is used only to improve the service.
      </p>

      <h2>Your rights</h2>
      <p>
        Under the Digital Personal Data Protection Act 2023 you can ask us what we hold
        about you, ask us to correct it, and ask us to erase it. The erase button is on
        your case page and works immediately. For anything else, write to us and we will
        answer within 30 days.
      </p>

      <h2>If something goes wrong</h2>
      <p>
        If your information is exposed, we will tell you and the Data Protection Board
        &mdash; what happened, what was affected, and what we are doing. We would rather
        tell you awkwardly than not tell you.
      </p>
    </>
  );
}
