export const metadata = { title: 'Privacy — Mera Hissa' };

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
      <p className="hint">Version 2026-08-22</p>

      <p>
        You are giving us a death certificate and details of a family member&rsquo;s
        money. We have tried to design this so that as little of it exists, in as few
        places, for as short a time, as the job allows.
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
        We use an AI model to draft covering letters and affidavit wording. Before
        anything is sent to it, every name, account reference and institution is
        replaced with a placeholder such as <code>&#123;&#123;HEIR_1&#125;&#125;</code>.
        The model receives the <em>shape</em> of your case &mdash; which law applies, what
        kinds of asset there are &mdash; and never a single real name. Real values are put
        back on our own servers afterwards.
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

      <h2>Who else sees it</h2>
      <ul>
        <li>The Mera Hissa reviewer who checks your pack before it reaches you.</li>
        <li>Supabase, who host the database and file storage.</li>
        <li>The AI provider &mdash; placeholders only, as described above.</li>
        <li>Razorpay, for payment. We never see or store your card or UPI details.</li>
        <li>An advocate, only if you ask us to introduce you, and only what you agree to share.</li>
      </ul>
      <p>We do not sell anything to anyone, and there are no advertising trackers on this site.</p>

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
