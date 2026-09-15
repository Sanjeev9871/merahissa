# Auth email templates

The two emails a person actually receives from Mera Hissa before they have an
account. Both are sent by Supabase Auth, and both are configured in the Supabase
dashboard rather than deployed from this repository — so these files are the
source of truth, and the dashboard is a copy of them. If you edit one, paste it
over the other.

| File | Supabase template | Subject to set |
|---|---|---|
| `confirm-signup.html` | **Confirm signup** | `Confirm your email address · Mera Hissa` |
| `magic-link.html` | **Magic Link** | `Your sign-in link · Mera Hissa` |

Both fire from the same call. `signInWithOtp()` on the sign-in page sends
**Confirm signup** to an address Supabase has not seen before, and **Magic Link**
to one it has. That is why the two have to look identical: most people will
receive one, then the other, and a change of design between them reads as a
phishing attempt.

---

## The delivery problem, which matters more than the design

The email in the screenshot that prompted this work was ugly — unbranded,
`noreply@mail.app.supabase.io`, a "powered by Supabase" footer and an opt-out
link that has no business being on a transactional email. Replacing the
templates fixes all of that.

It does not fix the real problem. **Supabase's built-in email service is capped
at two messages per hour** and carries no delivery or uptime guarantee; Supabase
describes it as best-effort, for demos and for testing templates, and says to
configure custom SMTP for everything else.

Two sign-ins an hour is not a service. Until custom SMTP is configured, the
third person to try to sign in during a busy hour simply never receives a link,
sees nothing explaining why, and leaves.

### Use the Brevo account that already exists

There is already a Brevo account on this project with SMTP relay enabled and a
free allowance of **300 emails a day** — 150 times the built-in limit, at no
cost.

In **Supabase → Project Settings → Authentication → SMTP Settings**, enable
custom SMTP and enter:

| Field | Value |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | `b3ca9a001@smtp-brevo.com` |
| Password | An SMTP key generated in Brevo → SMTP & API → SMTP keys |
| Sender email | `no-reply@merahissa.in` |
| Sender name | `Mera Hissa` |

The SMTP key is a secret. Generate it in Brevo, paste it straight into the
Supabase dashboard, and do not put it in this repository, in `.env`, or in a
commit message.

### One thing blocks this today

`merahissa.in` is **not yet a verified sender in Brevo**. The only senders on the
account are `cloudroots.co.in` addresses, so mail sent as `no-reply@merahissa.in`
will be rejected or land in spam until the domain is authenticated.

In **Brevo → Senders, Domains & Dedicated IPs → Domains**, add `merahissa.in` and
publish the DNS records it gives you. You want all three:

- **DKIM** — Brevo signs the mail; without this, receivers cannot verify it came
  from you.
- **SPF** — authorises Brevo to send as your domain.
- **DMARC** — tells receivers what to do when the first two fail. Start at
  `p=none` and watch the reports before tightening to `p=quarantine`.

A bank-adjacent service that sends unauthenticated mail about someone's
inheritance will be filtered as phishing, and deservedly so. Do this before the
first real user.

---

## Installing the templates

**Supabase → Authentication → Emails → Templates.** Pick the template, paste the
whole file into the message body, set the subject from the table above, save.

Then check two settings that the copy depends on:

- **Email OTP expiry** (Authentication → Providers → Email). Both templates tell
  the reader the link "expires in about an hour". Supabase's default is 3600
  seconds, which matches. If you change one, change the other.
- **Redirect URLs** (Authentication → URL Configuration) must allow
  `https://www.merahissa.in/auth/callback` and the staging equivalent, or the
  link lands on an error page after the person has already trusted it.

---

## Why the templates are built the way they are

Email is not the web. These render in Outlook, in Gmail's stripped renderer, and
on a four-year-old Android phone on a bad connection, which rules out most of
what the site itself does.

- **Tables and inline styles.** The `<style>` block is progressive enhancement
  only; every rule that matters is also inlined, because Outlook and several
  webmail clients discard it.
- **No images at all, not even a logo.** Images are blocked by default in a lot
  of clients, image-heavy mail scores worse with spam filters, and a wordmark set
  in Georgia reads identically whether or not anything loads.
- **No web fonts.** Outlook ignores them and Gmail strips them. Georgia for the
  wordmark and heading keeps the serif feel of the site; the body uses the
  reader's own system sans.
- **A VML button for Outlook.** Outlook's Word renderer will not paint a
  background colour on an anchor, so the button needs a `v:roundrect` behind a
  conditional comment or it disappears into plain blue text.
- **The full URL, printed.** Corporate mail scanners rewrite links and some
  clients strip buttons. Without the URL in the body, the email becomes a dead
  end for exactly the people least able to work around it.
- **A hidden preview line.** Without one the inbox list shows whatever text
  comes first, which is usually the wordmark.
- **Dark mode via `prefers-color-scheme`.** Apple Mail and iOS honour it; Gmail
  does not, which is why the light palette is the inlined default and dark is the
  override rather than the other way round.
- **Under 102 KB.** Gmail clips a message past that and hides the end behind a
  "view entire message" link. Both files are around 9 KB.

## Why the copy is the way it is

The person reading this has usually had a death in the family in the last few
weeks. So: no exclamation marks, no welcome, no product pitch, and no cheerful
onboarding voice. It says what the link does, how long it lasts, and what to do
if they did not ask for it.

Two lines are there for a specific reason and should not be cut:

- **"Please do not forward this email."** The link is a session. Families share
  inboxes and forward things to siblings, and a forwarded magic link hands over
  the case and every document in it.
- **"If you did not ask to sign in, you can ignore this email."** Someone who
  receives an unexpected email about a relative's estate needs to be told
  immediately that nothing is happening without them.

The footer carries the not-a-law-firm line and the postal address. The first is
the same limit the site states everywhere else. The second is ordinary good
practice for transactional mail and helps with filtering.

There is deliberately **no unsubscribe link**. These are transactional emails
sent because someone asked to sign in; an opt-out on them would be meaningless,
and the one in the old Supabase default was never ours to offer.

## What is not covered here

The templates for **Change Email Address**, **Reset Password**, **Invite user**
and **Reauthentication** are still Supabase defaults. None of them can fire on
the current sign-in flow, which is passwordless and invite-free. If a password
flow or team invites are ever added, copy one of these files and change the
heading and the two sentences under it — the surrounding markup is the part that
took the work.
