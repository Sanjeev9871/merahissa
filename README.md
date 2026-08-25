# Virasat

Estate claim paperwork for Indian families — guided intake to a filed-ready document pack.

When someone dies in India, their bank accounts, shares, mutual funds, insurance and provident fund do not simply pass to the family. Each institution wants a different form, a different affidavit, and a different set of proofs. Most families discover this one rejection at a time. Virasat turns that into a single guided flow.

**Status:** Weeks 1–3 complete, plus a trust-first landing page, an FAQ, six SEO guides and lead capture. **234 tests passing, no network required.** Intake, client-side OCR upload, Razorpay payments, PDF pack generation, the admin review queue, DPDP deletion and the retention purge are all built.

> Built in a sandbox without npm registry access, so `npm install`, `tsc --noEmit` and `next build` have **not** been run. Every dependency-free module is proven by the test suite; run a typecheck and a build on first clone.

---

## The front door

The person arriving searched something like *"how to claim my father's shares after death"*, three weeks after a funeral. They are grieving, have been told three different things by three bank branches, and this category is full of operators who take a cut of what they recover.

The landing page is built around that, and the rules are the opposite of a normal funnel:

- **No signup wall.** The free check runs before anything is asked for, and gives the real answer — shares under the law, document list per institution — not a teaser.
- **The price is on the page** before any commitment, and it is a fixed fee. Taking a percentage is what the operators families are warned about do.
- **Limits are as prominent as capabilities.** A "What we cannot do" section sits above the fold of the second screen. Naming limits builds more trust here than any claim.
- **Refusing business is a feature.** When a case needs an advocate, the *free* check says so, before money changes hands.
- **No testimonials, and the page says why** — we are new, and inventing them would be the first dishonest thing we did.
- **No urgency, countdowns or scarcity.** Every growth pattern that works on a shopping site reads as predatory to someone who has just buried a parent.
- **The slow step is labelled slow.** Filing takes weeks to months and the process list says so in amber, rather than hiding it.

## Being found

The search intent here is unusually specific and unusually motivated: *"how to claim father's bank account after death"*, *"succession certificate procedure"*, *"IEPF form 5 claim"*. People are not browsing; they need an answer today.

The strategy is to be genuinely the best free answer for those queries, then mark it up so Google can lift it:

- **Six guides** at `/guides/[slug]`, one per real query, each answering the question completely with nothing held back for a paywall. Someone who solves their own problem for free is a success — they tell someone else.
- **Seventeen FAQs** at `/faq`, rendered with native `<details>` so they work before hydration, are keyboard accessible, and find-in-page reaches collapsed answers.
- **Structured data** built from the *same* source the page renders — `FAQPage`, `HowTo`, `Article`, `ProfessionalService`, `BreadcrumbList`. Markup that disagrees with the visible page is penalised, so there is deliberately only one copy.
- **`sitemap.ts` and `robots.ts`** — every signed-in route is `noindex` and absent from the sitemap. A search result pointing at a sign-in wall wastes everyone's click.
- Static generation for guides, canonical URLs, OpenGraph, `en-IN` locale.

## Capturing contact details without breaking the promise

There is a real tension here and the code names it rather than papering over it. The landing page promises "no account, nothing leaves your browser", and that promise is *why* the free check builds trust. An email wall in front of it would trade the whole positioning for a slightly longer list.

So: **the free check stays ungated, always.** Contact details are asked for *after* the answer, as an offer — "shall we take it from here?" — with two separate consent checkboxes, because bundling "contact me about my case" with "send me updates" is the exact pattern the DPDP Act targets.

`tests/invariants.test.ts` enforces this: it fails if a `LeadForm` ever appears on the triage page.

Leads land in a table anonymous visitors can `INSERT` into and nothing else — no select policy, so the form can never be turned into a way to enumerate other people's contact details. The database enforces consent and at-least-one-contact-method as constraints, independently of application code. Unworked leads are purged after a year.

## Three design rules

These are not style preferences. Each exists because of a specific failure mode.

### 1. No personal data ever reaches the AI provider

We use free-tier inference, which means the model provider is untrusted by construction. Two mechanisms, in order of importance:

- **Redaction by construction.** `src/lib/redaction.ts` builds the outbound payload from typed, structured case data, substituting every identifying value for a placeholder token. The model reasons about the *shape* of a case — regime, asset kinds, thresholds — and writes prose containing tokens. It never sees a name.
- **The guard.** `assertNoPii()` scans the finished payload immediately before the network call and **throws** if it finds an identifier pattern. Fail-closed by design: a thrown error and a held case is acceptable; a leaked Aadhaar is not.

Aadhaar and PAN are not tokenised at all — they are dropped. They have no role in the model's reasoning, so they never enter the payload in any form.

`src/lib/ai/provider.ts` is the only module in the codebase that talks to a model, so the guard cannot be bypassed by calling `fetch` directly.

### 2. Anything legally load-bearing is code, not model output

`src/lib/succession.ts` computes intestate shares from statute, as exact integer fractions, with the section cited for each. A language model that is right 95% of the time is unacceptable when the output is what a family tells a bank their entitlement is.

Where automation is genuinely unsafe, we refuse rather than guess. **Muslim intestate succession** (Quranic sharers, residuaries, `awl` and `radd`) and **testate cases** are routed to an advocate. So are Hindu Class II successions and Christian remoter-kindred cases.

Every computed result is checked to sum to exactly 1 before it can leave the function.

### 3. Template correctness is the real product risk, so requirements are versioned data

The biggest danger is not a software bug — it is telling a family that SBI needs form X when SBI changed to form Y in March. `src/lib/requirements.ts` holds every rule as data with a `version`, an `effectiveFrom`, a `sourceNote`, and a **`verifyBy`** date. Past `verifyBy`, cases touching that rule are held for review rather than auto-generated.

That converts "our templates might be stale" from an invisible risk into a loud, dated, blocking one. **The advocate's quarterly review is a review of that one file.**

---

## Architecture

```
Intake ─▶ 1. COMPUTE (deterministic)   shares + document requirements, in code
          2. REDACT                    token-only payload built by construction
          3. ASK MODEL                 prose only: covering letters, affidavit text
          4. REHYDRATE                 real values restored server-side
          5. GATE                      stale / unsupported / unresolved → held
                                       ↓
                                  Admin review → approved → delivered
```

A pack never reaches a family without a person approving it. `src/lib/pipeline.ts` is the orchestration; the tests in `tests/pipeline.test.ts` prove the gate stops cases *before* a model call is spent.

### Stack

| Layer | Choice | Cost |
|---|---|---|
| Framework + hosting | Next.js 15 (App Router, TS) on Vercel Hobby | free |
| DB / auth / storage | Supabase free tier, RLS enforced | free |
| AI inference | Groq free tier, Llama 3.3 70B (fallback OpenRouter/Qwen) | free |
| OCR | Tesseract.js, **client-side in the browser** | free |
| PDFs | pdf-lib + react-pdf | free |
| Payments | Razorpay hosted checkout | 2% / txn |
| Tests | Node's built-in runner — **zero dependencies** | free |

Only fixed cost is the domain, ~₹800/year.

Tests deliberately use `node:test` with a 60-line `expect` shim rather than Vitest or Jest. A supply-chain compromise in a test framework is a compromise of the thing verifying our security guarantees, and those guarantees are the product.

---

## Getting started

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local`. Generate the encryption key with:

```bash
openssl rand -base64 32     # → PII_ENCRYPTION_KEY
```

Create a Supabase project, then run `supabase/migrations/0001_init.sql` in the SQL editor. Get a free Groq key at console.groq.com.

```bash
npm test         # 234 tests, no network needed
npm run typecheck
npm run dev
```

### Storage buckets

Create one **private** bucket named `case-documents`. Do not make it public. Access is only ever via signed URLs with a 10-minute expiry.

### Making yourself an admin

The review queue is gated on a column, not a role name. After your first sign-in:

```sql
update public.profiles set is_admin = true where id = '<your-auth-uid>';
```

### Razorpay webhook

Point a webhook at `https://<your-domain>/api/payments/webhook` for the
`payment.captured` and `payment.failed` events, and set `RAZORPAY_WEBHOOK_SECRET`
to match. **The webhook is the only thing that marks a case paid** — the browser
callback just refreshes the page.

### Cron

`vercel.json` schedules the retention purge daily at 03:00 UTC. Set `CRON_SECRET`;
the endpoint refuses to run without it.

---

## Security model

| Concern | Control |
|---|---|
| Payment forged by the client | Constant-time HMAC over the **raw** webhook body; amount taken from our tier table, never the request |
| Malicious upload | Magic-byte sniffing rejects spoofed MIME; generated storage names (no traversal, no PII in paths) |
| Open redirect on sign-in | `safe-redirect.ts` rejects absolute, protocol-relative and whitespace-smuggled paths |
| Held pack waved through | Approval is server-enforced: a `queued` pack returns 409 regardless of what the UI shows |
| Brute force / quota abuse | Per-bucket rate limits; the admin panel warns when limiting is only in-process |
| AI provider sees PII | Redaction by construction + fail-closed guard; Aadhaar/PAN never sent in any form |
| Database dump leaks ID numbers | AES-256-GCM at the column level, key in app env not the database (`src/lib/crypto.ts`) |
| One user reads another's case | RLS `ENABLE` **and** `FORCE` on every table; ownership flows through `cases.owner_id` |
| User approves their own pack | Owner has SELECT on `packs` but no write; only the service role can approve |
| Payment status forged | Written only by a signature-verified Razorpay webhook, never by the browser |
| Documents linger | 90-day purge stamped on case close; user-triggered deletion any time (DPDP right to erasure) |
| History rewritten | `audit_log` has no UPDATE or DELETE policy for any role; UPDATE/DELETE revoked |
| Upload attacks | Three-MIME allowlist, 8 MB cap, hash recorded |
| Injection / XSS | Strict CSP (see `next.config.ts`), server-side Zod on every mutation |
| Secrets in the browser | `supabaseAdmin()` throws if called client-side |

Built against the **DPDP Act 2023** ahead of full enforcement in May 2027. Consent is stored with its version and timestamp, so we can prove *what* was agreed, not merely *that* it was.

### Where OCR runs

In the user's browser, via Tesseract.js. Extracted fields pre-fill the forms; the raw image is uploaded only after the user confirms. This is a privacy control first and a cost saving second.

---

## Project layout

```
src/lib/
  redaction.ts       PII tokenisation + the fail-closed guard   ← security core
  succession.ts      Statutory share computation                ← legal core
  requirements.ts    Versioned document rules with review dates ← product risk
  pipeline.ts        Orchestration and the safety gate
  payments.ts        Pricing + constant-time signature checks
  uploads.ts         Magic-byte validation, hashing, retention
  ratelimit.ts       Upstash with an honest in-process fallback
  safe-redirect.ts   Open-redirect guard for the auth callback
  crypto.ts          AES-256-GCM column encryption
  ocr-fields.ts      Certificate field parsing (pure, testable)
  ocr.ts             Tesseract.js wrapper, browser-only
  validation.ts      Zod schemas for every mutation
  audit.ts           Append-only trail
  ai/provider.ts     The only module that calls a model
  pdf/document.ts    What a pack SAYS (pure, testable)
  pdf/render.ts      How a pack LOOKS (pdf-lib, no decisions)
  supabase/server.ts User-scoped and service-role clients
src/app/
  page, triage       Landing + free browser-only eligibility check
  signin, auth/      Passwordless OTP, consent capture
  intake             Four-step wizard
  cases, cases/[id]  Tracker, entitlement, payment, deletion
  admin              Review queue — the human in the loop
  api/               cases, uploads, payments, generate, download, cron
supabase/migrations/ Schema, RLS policies, retention functions
tests/               234 tests, no network, no third-party framework
```

## Test suites

| Suite | Covers |
|---|---|
| `redaction` | Tokenisation, rehydration, and the fail-closed PII guard |
| `succession` | Statutory shares, including the multiple-widows case, and refusals |
| `requirements` | Rule selection, staleness gating, manifest, table hygiene |
| `pipeline` | The safety gate holds cases **before** spending a model call |
| `payments` | Constant-time signature checks, tamper and replay rejection |
| `uploads` | Magic-byte sniffing, spoofed MIME, path-traversal-proof names |
| `document` | Pack contents, and that the disclaimer cannot be removed |
| `ocr-fields` | Date normalisation, and dropping bad OCR rather than guessing |
| `safe-redirect` | Open-redirect attempts including whitespace smuggling |
| `leads` | Indian mobile normalisation, email validation, unbundled consent |
| `invariants` | Architectural shape: AI chokepoint, secrets, RLS, SEO hygiene, the ungated free check |

The `invariants` suite is the unusual one. It reads the source tree and asserts
the properties the security argument depends on: that nothing but
`ai/provider.ts` can reach a model, that no client component references a
server secret, that every table has RLS enabled *and* forced, that the audit
log grants no UPDATE or DELETE, and that the 90-day retention figure in the
privacy notice matches the constant in the code. If a claim in this README
stops being true, that suite fails.

---

## Before the first real filing

Non-negotiable gate:

- [ ] An advocate has reviewed **every** rule set in `requirements.ts` and reset each `verifyBy`
- [ ] Deletion flow tested end to end, including storage objects
- [ ] Audit log verified to capture admin views and pack approvals
- [ ] A restore from Supabase backup rehearsed at least once
- [ ] The disclaimer appears on every page **and** inside every generated pack
- [ ] Two or three real cases run manually, start to finish, before any marketing

## Known risks

- **Template drift** is the top risk. Mitigated by `verifyBy`, but mitigation is not elimination — the quarterly review must actually happen.
- **Free-tier AI terms can change.** The provider adapter plus redaction make switching a config change. Paid fallback is roughly ₹2–4 per case.
- **Government portals** (UDGAM, SEBI MITRA) locate assets for free. Stay on the paperwork-preparation side, where they feed demand rather than compete.
- **Fixed fees, not success fees.** Cleaner to advertise, and avoids any resemblance to the recovery agents regulators warn about.
