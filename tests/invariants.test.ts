import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../src/lib/site.ts';

/**
 * Architectural invariants.
 *
 * The other suites test behaviour. This one tests the SHAPE of the codebase —
 * the properties that make the security argument hold, and that a reasonable
 * change six months from now could quietly break.
 *
 * Every assertion here corresponds to a claim made in the README or the
 * privacy notice. If one fails, either the code regressed or a published
 * promise is no longer true. Both need fixing before release.
 */

// fileURLToPath, not .pathname: on Windows .pathname yields "/C:/…/src" with a
// leading slash that readdirSync cannot open.
const SRC = fileURLToPath(new URL('../src', import.meta.url));

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(SRC).map((path) => ({
  path,
  // Normalise to forward slashes so the endsWith('a/b.ts') checks below work on
  // Windows, where join() produces backslashes.
  rel: path.slice(SRC.length + 1).replaceAll('\\', '/'),
  source: readFileSync(path, 'utf8'),
}));

const clientFiles = files.filter((f) => f.source.includes("'use client'"));
const serverFiles = files.filter((f) => !f.source.includes("'use client'"));
const apiRoutes = files.filter((f) => f.rel.includes('api/') && f.rel.endsWith('route.ts'));

describe('the AI chokepoint', () => {
  it('routes every model call through one module', () => {
    // If a second module can reach a provider directly, the PII guard is
    // bypassable and the privacy notice becomes false.
    const offenders = files.filter(
      (f) => !f.rel.endsWith('ai/provider.ts')
        && (f.source.includes('api.groq.com') || f.source.includes('openrouter.ai')),
    );
    expect(offenders.map((f) => f.rel)).toEqual([]);
  });

  it('guards the provider with assertNoPii before it can fetch', () => {
    const provider = files.find((f) => f.rel.endsWith('ai/provider.ts'))!;
    expect(provider.source).toContain('assertNoPii(');
    // The guard must precede the request, not follow it.
    expect(provider.source.indexOf('assertNoPii(') < provider.source.indexOf('await fetch(')).toBe(true);
  });

  it('never wraps the guard in a try/catch that could swallow it', () => {
    const provider = files.find((f) => f.rel.endsWith('ai/provider.ts'))!;
    const guardLine = provider.source.split('\n').findIndex((l) => l.includes('assertNoPii('));
    const before = provider.source.split('\n').slice(Math.max(0, guardLine - 3), guardLine).join(' ');
    expect(before).not.toContain('try {');
  });
});

describe('secrets stay on the server', () => {
  it('never exposes the service role key to the browser', () => {
    for (const f of files) {
      expect(f.source).not.toContain('NEXT_PUBLIC_SUPABASE_SERVICE');
      expect(f.source).not.toContain('NEXT_PUBLIC_RAZORPAY_KEY_SECRET');
    }
  });

  it('keeps server-only secrets out of every client component', () => {
    const secrets = [
      'SUPABASE_SERVICE_ROLE_KEY', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET',
      'PII_ENCRYPTION_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY', 'CRON_SECRET',
    ];
    for (const f of clientFiles) {
      for (const s of secrets) {
        expect(`${f.rel}:${f.source.includes(s)}`).toBe(`${f.rel}:false`);
      }
    }
  });

  it('guards the admin client against being called in a browser', () => {
    const mod = files.find((f) => f.rel.endsWith('supabase/server.ts'))!;
    expect(mod.source).toContain("typeof window !== 'undefined'");
  });

  it('never imports node:crypto into a client component', () => {
    for (const f of clientFiles) {
      expect(`${f.rel}:${f.source.includes('node:crypto')}`).toBe(`${f.rel}:false`);
    }
  });
});

describe('every API route authenticates', () => {
  // Deliberate exceptions, each with a reason:
  //   webhook  — called by Razorpay, proves itself with an HMAC
  //   cron     — called by Vercel, proves itself with a shared secret
  //   callback — the auth handshake itself
  //   leads    — a public contact form. There is no caller to authenticate;
  //              it is protected by rate limiting, an insert-only RLS policy,
  //              and database constraints instead.
  const EXEMPT = [
    'payments/webhook/route.ts', 'cron/purge/route.ts',
    'auth/callback/route.ts', 'leads/route.ts',
  ];

  for (const route of apiRoutes) {
    const exempt = EXEMPT.some((e) => route.rel.endsWith(e));

    it(`${route.rel} ${exempt ? 'verifies a shared secret' : 'checks the caller'}`, () => {
      if (exempt) {
        const provesItself = route.source.includes('verifyWebhookSignature')
          || route.source.includes('timingSafeEqual')
          || route.source.includes('exchangeCodeForSession')
          // A public form has no caller to verify, so it must at minimum be
          // rate limited — otherwise it is an open write endpoint.
          || route.source.includes('rateLimit(');
        expect(provesItself).toBe(true);
      } else {
        expect(route.source.includes('currentUser()') || route.source.includes('requireUser()')).toBe(true);
      }
    });
  }

  it('has at least one route, so this suite cannot pass vacuously', () => {
    expect(apiRoutes.length > 5).toBe(true);
  });
});

describe('signature verification is constant time', () => {
  it('uses timingSafeEqual, never === on a digest', () => {
    const payments = files.find((f) => f.rel.endsWith('lib/payments.ts'))!;
    expect(payments.source).toContain('timingSafeEqual');
  });

  it('verifies the webhook against the raw body, not a re-parsed object', () => {
    const webhook = files.find((f) => f.rel.endsWith('payments/webhook/route.ts'))!;
    expect(webhook.source).toContain('await request.text()');
    // Parsing must happen after verification.
    expect(webhook.source.indexOf('verifyWebhookSignature') < webhook.source.indexOf('JSON.parse')).toBe(true);
  });

  it('marks the webhook and cron routes as node runtime, since edge lacks node:crypto', () => {
    for (const rel of ['payments/webhook/route.ts', 'cron/purge/route.ts']) {
      const f = files.find((x) => x.rel.endsWith(rel))!;
      expect(f.source).toContain("runtime = 'nodejs'");
    }
  });
});

describe('row-level security is not bypassed casually', () => {
  it('uses the service role only where acting outside one user\'s authority', () => {
    // Reading a user's own data must go through their client so RLS applies.
    const ALLOWED = [
      'lib/supabase/server.ts', 'lib/audit.ts',
      'api/payments/webhook/route.ts', 'api/payments/order/route.ts',
      // verify: records a signature-verified payment, which the family's own
      // client is not permitted to write (payments_admin_write).
      'api/payments/verify/route.ts',
      'api/cron/purge/route.ts', 'api/uploads/route.ts',
      'api/cases/[id]/route.ts', 'api/cases/[id]/generate/route.ts',
      'api/admin/packs/[id]/route.ts', 'api/packs/[id]/download/route.ts',
      // leads: anonymous inserts, so there is no user client to act as.
      // The insert-only RLS policy is what constrains it.
      'api/leads/route.ts',
      // auth callback: records consent into columns the family is no longer
      // permitted to write (migration 0003), so the write is a system action.
      'auth/callback/route.ts',
      'admin/page.tsx',
    ];
    const users = serverFiles
      .filter((f) => f.source.includes('supabaseAdmin('))
      .filter((f) => !ALLOWED.some((a) => f.rel.endsWith(a)))
      .map((f) => f.rel);

    expect(users).toEqual([]);
  });
});

describe('the database enforces what the app claims', () => {
  const sql = readFileSync(
    fileURLToPath(new URL('../supabase/migrations/0001_init.sql', import.meta.url)), 'utf8',
  );

  // The migration aligns its columns, so compare against whitespace-collapsed
  // SQL rather than trying to guess the padding.
  const flatSql = sql.replace(/\s+/g, ' ');

  const TABLES = ['profiles', 'cases', 'heirs', 'assets', 'documents', 'packs', 'payments', 'audit_log'];

  for (const t of TABLES) {
    it(`enables and forces RLS on ${t}`, () => {
      expect(flatSql).toContain(`alter table public.${t} enable row level security`);
      expect(flatSql).toContain(`alter table public.${t} force row level security`);
    });
  }

  it('makes the audit log append-only', () => {
    const flat = sql.replace(/\s+/g, ' ');
    expect(flat).toContain('revoke update, delete on public.audit_log');
    // No policy may grant update or delete on the audit log.
    expect(flat).not.toContain('on public.audit_log for update');
    expect(flat).not.toContain('on public.audit_log for delete');
  });

  it('lets only the data principal delete a case, never an admin', () => {
    const flat = sql.replace(/\s+/g, ' ');
    expect(flat).toContain('create policy cases_delete_own on public.cases for delete using (owner_id = auth.uid())');
  });

  it('stops a user writing their own pack status', () => {
    const flat = sql.replace(/\s+/g, ' ');
    // Owners get SELECT only; writes are admin-gated.
    expect(flat).toContain('create policy packs_select on public.packs for select');
    expect(flat).toContain('create policy packs_admin_write on public.packs for all using (public.is_admin())');
  });

  it('pins search_path on every security-definer function', () => {
    // Without a pinned search_path a caller can shadow `public` and change
    // what a definer function resolves to.
    const definers = sql.split('security definer').length - 1;
    const pinned = sql.split('set search_path = public, pg_temp').length - 1;
    expect(pinned).toBe(definers);
  });
});

describe('published promises hold', () => {
  // JSX wraps prose across source lines, so phrases must be matched against
  // whitespace-collapsed text or a reformat would break the assertion.
  const flat = (rel: string) =>
    files.find((f) => f.rel.endsWith(rel))!.source.replace(/\s+/g, ' ');

  // The chrome disclaimer lives inline in the root layout, which wraps every
  // page. Hindi was removed from the site, so there is one copy to keep true —
  // but it is still the copy that keeps the service lawful for a non-advocate
  // operator, so it is still asserted here rather than trusted to stay put.
  it('shows the disclaimer on every page', () => {
    const chrome = flat('app/layout.tsx');
    expect(chrome).toContain('not a law firm');
    expect(chrome).toContain('not legal advice');
    expect(chrome).toContain('refer you to an advocate');
  });

  it('keeps the 90-day retention figure consistent across code and copy', () => {
    // A promise made in the privacy notice that the code does not keep is
    // worse than no promise. These must move together.
    expect(flat('lib/uploads.ts')).toContain('RETENTION_DAYS = 90');
    expect(flat('app/layout.tsx')).toContain('90 days');
    expect(flat('app/privacy/page.tsx')).toContain('90 days');
  });

  it('states in the privacy notice that data is not used for training', () => {
    expect(flat('app/privacy/page.tsx')).toContain('not used to train');
    expect(flat('app/layout.tsx')).toContain('never used to train');
  });

  // We now hold the full account number, so the notice must say so and say it
  // is encrypted. Quietly collecting it while the page implies otherwise is the
  // exact false-privacy-claim risk this suite exists to catch.
  it('discloses that the full account reference is collected and encrypted', () => {
    const en = flat('app/privacy/page.tsx');
    expect(en).toContain('account, folio or policy number');
    expect(en).toContain('stored encrypted');
  });

  // The encryption has to actually happen, not just be promised.
  it('encrypts the account reference on the write path', () => {
    const route = flat('api/cases/route.ts');
    expect(route).toContain('encryptPii');
    expect(route).toContain('account_ref_enc');
    // And never falls back to storing it in the clear.
    expect(route).not.toContain('account_ref_enc: a.accountRef');
  });

  // PostHog sets a cookie and sends data to the US. Saying "cookieless" while
  // shipping it is the kind of false privacy claim that carries real legal
  // risk, so the notice must name it explicitly.
  it('discloses the cookie-setting analytics in the privacy notice', () => {
    const en = flat('app/privacy/page.tsx');
    expect(en).toContain('PostHog');
    expect(en).toContain('sets a cookie');
  });
});

describe('the public site is findable and honest', () => {
  const flat = (rel: string) =>
    files.find((f) => f.rel.endsWith(rel))!.source.replace(/\s+/g, ' ');

  it('ships a sitemap and a robots policy', () => {
    expect(files.some((f) => f.rel.endsWith('app/sitemap.ts'))).toBe(true);
    expect(files.some((f) => f.rel.endsWith('app/robots.ts'))).toBe(true);
  });

  it('keeps signed-in areas out of the index', () => {
    const robots = flat('app/robots.ts');
    for (const path of ['/api/', '/cases/', '/admin/', '/intake/']) {
      expect(robots).toContain(path);
    }
  });

  it('never lists a signed-in route in the sitemap', () => {
    const sitemap = flat('app/sitemap.ts');
    for (const path of ['/cases', '/admin', '/intake', '/signin']) {
      expect(sitemap).not.toContain(`\${SITE.url}${path}\``);
    }
  });

  it('builds FAQ structured data from the same source the page renders', () => {
    // Two copies would drift, and Google penalises markup that does not match
    // the visible page.
    const seo = flat('lib/seo.tsx');
    expect(seo).toContain("import { FAQS } from './faq.ts'");
    expect(seo).toContain("'@type': 'FAQPage'");
  });

  it('states plainly in the org markup that we are not a law firm', () => {
    expect(flat('lib/seo.tsx')).toContain('not a law firm');
  });
});

describe('lead capture stays an offer, not a gate', () => {
  const flat = (rel: string) =>
    files.find((f) => f.rel.endsWith(rel))!.source.replace(/\s+/g, ' ');

  it('keeps the free check ungated — no lead form on triage', () => {
    // The moment triage asks for an email, the trust argument on the landing
    // page becomes false.
    expect(flat('app/triage/page.tsx')).not.toContain('LeadForm');
  });

  it('requires explicit consent before a lead can be stored', () => {
    expect(flat('lib/leads.ts')).toContain('consentToContact');
    expect(flat('api/leads/route.ts')).toContain('validateLead');
  });

  it('keeps contact consent and marketing consent separate', () => {
    const form = flat('components/LeadForm.tsx');
    expect(form).toContain('consentToContact');
    expect(form).toContain('consentToUpdates');
  });

  it('lets the database enforce consent independently of the app', () => {
    const sql = readFileSync(
      fileURLToPath(new URL('../supabase/migrations/0002_leads.sql', import.meta.url)), 'utf8',
    ).replace(/\s+/g, ' ');

    expect(sql).toContain('constraint lead_has_consent check (consent_to_contact = true)');
    expect(sql).toContain('constraint lead_has_contact check (email is not null or phone is not null)');
    // Anonymous visitors may insert and nothing else.
    expect(sql).toContain('create policy leads_public_insert on public.leads for insert');
    expect(sql).not.toContain('leads for select to anon');
  });
});

describe('staging and production stay separated', () => {
  const flat = (rel: string) =>
    files.find((f) => f.rel.endsWith(rel))!.source.replace(/\s+/g, ' ');

  // The mode guard is only worth anything if it is on the path that reaches
  // Razorpay. createOrder is the one place the key id is read for a charge, so
  // that is where the check has to sit — and it has to sit BEFORE the fetch.
  it('checks the payment mode before creating an order', () => {
    const src = flat('lib/payments.ts');
    expect(src).toContain('assertPaymentModeMatchesDeployment(keyId)');

    const guardAt = src.indexOf('assertPaymentModeMatchesDeployment(keyId)');
    const fetchAt = src.indexOf('https://api.razorpay.com/v1/orders');
    expect(guardAt > 0 && fetchAt > guardAt).toBe(true);
  });

  // Deriving the environment from the origin's host is the load-bearing choice:
  // VERCEL_ENV reads "production" on a separate staging project too, so it
  // cannot be the thing that decides whether real cards may be charged.
  it('decides the environment from the canonical host, not VERCEL_ENV alone', () => {
    const src = flat('lib/site.ts');
    expect(src).toContain("export const PRODUCTION_HOST = 'www.merahissa.in'");
    expect(src).toContain('if (host === PRODUCTION_HOST && process.env.VERCEL) return');
  });

  // If a preview build fell back to the production origin it would both publish
  // canonicals pointing at www and look like production to the payment guard.
  it('never lets a preview deployment claim the production origin', () => {
    const src = flat('lib/site.ts');
    expect(src).toContain("if (vercelEnv === 'preview' && vercelUrl) return");

    const previewAt = src.indexOf("vercelEnv === 'preview'");
    const fallbackAt = src.indexOf('return `https://${PRODUCTION_HOST}`');
    expect(previewAt > 0 && fallbackAt > previewAt).toBe(true);
  });

  // Two independent brakes. robots.txt stops the crawl; the meta tag stops a
  // staging URL someone linked to from being indexed regardless.
  it('keeps everything but production out of the index, twice over', () => {
    const robots = flat('app/robots.ts');
    expect(robots).toContain('if (!isProductionDeploy())');
    expect(robots).toContain("rules: [{ userAgent: '*', disallow: '/' }]");

    const layout = flat('app/layout.tsx');
    expect(layout).toContain('robots: isProductionDeploy()');
    expect(layout).toContain('{ index: false, follow: false, nocache: true }');
  });

  // Production must look exactly as it did before any of this existed.
  it('shows the staging banner nowhere but off production', () => {
    const layout = flat('app/layout.tsx');
    expect(layout).toContain('{!isProductionDeploy() && (');
    expect(layout).toContain('env-banner');
  });
});

describe('a family sees what they are buying before they pay', () => {
  const flat = (rel: string) =>
    files.find((f) => f.rel.endsWith(rel))!.source.replace(/\s+/g, ' ');

  // The landing page's central promise is that you get the real document list
  // before any money changes hands. The case screen asked for payment without
  // naming what the payment produced, which made that promise true of the free
  // check and false of the screen where it mattered most.
  it('lists the required documents above the payment control', () => {
    const page = flat('app/cases/[id]/page.tsx');
    expect(page).toContain('What this claim needs');

    const listAt = page.indexOf('What this claim needs');
    const payAt = page.indexOf('priceLabel={formatRupees');
    expect(listAt > 0 && payAt > listAt).toBe(true);
  });

  // Derived from the same engine that drives generation. A stored copy could
  // say one thing on screen while the pack contained another.
  it('derives that list from the generation engine, not a duplicate', () => {
    const page = flat('app/cases/[id]/page.tsx');
    expect(page).toContain('requirementsFor(');
    expect(page).toContain("from '@/lib/requirements'");
  });

  // Telling someone we will "prepare their documents" while a third of the list
  // is certificates only they can obtain is the kind of omission that reads as
  // a bait and switch when it surfaces later.
  it('says which documents the family still has to obtain themselves', () => {
    const page = flat('app/cases/[id]/page.tsx');
    expect(page).toContain('DOCUMENT_SOURCE');
    expect(page).toContain('You obtain');
    expect(page).toContain('We prepare');
  });

  // Every document code has to be on one side of that line, and the Record type
  // is what enforces it — a Set would silently treat an unclassified code as
  // "ours", which is the wrong way to fail.
  it('classifies every document code exhaustively', () => {
    const src = flat('lib/requirements.ts');
    // `as const satisfies` rather than a plain annotation: it keeps the literal
    // 'you' / 'us' types (which SelfObtainedDocument is derived from) while
    // still failing the build on an unclassified code.
    expect(src).toContain("as const satisfies Record<DocumentCode, 'you' | 'us'>");
    expect(src).toContain("death_certificate: 'you'");
    expect(src).toContain("succession_certificate: 'you'");
    expect(src).toContain("affidavit_of_heirship: 'us'");
  });
});

describe('the documents a family must fetch come with instructions', () => {
  const flat = (rel: string) =>
    files.find((f) => f.rel.endsWith(rel))!.source.replace(/\s+/g, ' ');

  // "You obtain" is not an answer on its own. Where we cannot prepare a
  // document, the least we owe someone is where to go and what to take.
  it('gives a how-to for every document the family obtains itself', () => {
    const page = flat('app/cases/[id]/page.tsx');
    expect(page).toContain("from '@/lib/obtaining'");
    expect(page).toContain('OBTAINING[r.code as SelfObtainedDocument]');
    expect(page).toContain('how-toggle');
  });

  // The guides are keyed on the derived subset, so a document moving from 'us'
  // to 'you' cannot ship without steps — it stops compiling first.
  it('keys the guides on the derived self-obtained type', () => {
    const src = flat('lib/obtaining.ts');
    expect(src).toContain('Record<SelfObtainedDocument, ObtainGuide>');

    const req = flat('lib/requirements.ts');
    expect(req).toContain("as const satisfies Record<DocumentCode, 'you' | 'us'>");
    expect(req).toContain('export type SelfObtainedDocument');
  });

  // Registration and revenue procedure is national in statute and local in
  // practice. A guide that reads as one national process would send someone to
  // the wrong office, so every entry carries its own caveat and the page prints
  // the standing one.
  it('states that the procedure varies, on every guide and on the page', () => {
    const src = flat('lib/obtaining.ts');
    const guides = src.split('varies:').length - 1;
    const entries = src.split('where:').length - 1;
    expect(guides).toBe(entries);

    const page = flat('app/cases/[id]/page.tsx');
    expect(page).toContain('general information');
    expect(page).toContain('not legal advice');
    expect(page).toContain('differ by state');
  });

  // The cheaper route has to be named where one exists. A family that spends
  // six months and 3% of the estate on a succession certificate the bank never
  // needed has been failed by this page, not served by it.
  it('names the cheaper alternative to a succession certificate', () => {
    const src = flat('lib/obtaining.ts');
    expect(src).toContain('legal heir certificate instead');
  });
});

describe('the demo film stays first-party', () => {
  const flat = (rel: string) =>
    files.find((f) => f.rel.endsWith(rel))!.source.replace(/\s+/g, ' ');

  // Two independent reasons this must never become a YouTube or Vimeo embed.
  // The CSP allows frames only from Razorpay, so an iframe would be blocked
  // outright — and a third-party player sets cookies, which would make the
  // privacy notice wrong on a page arguing for restraint with data.
  it('serves the video from our own origin, not an embed', () => {
    const page = flat('app/examples/page.tsx');
    expect(page).toContain('src="/video/what-you-get.mp4"');
    expect(page).not.toContain('<iframe');
    expect(page).not.toContain('youtube');
    expect(page).not.toContain('vimeo');
  });

  // Autoplay on a bereavement page, on a metered Indian mobile connection, for
  // a film about someone else's paperwork. No.
  it('does not autoplay', () => {
    const page = flat('app/examples/page.tsx');
    expect(page).not.toContain('autoPlay');
    expect(page).toContain('preload="metadata"');
  });

  // The film shows an estate being settled. Saying it came from the real
  // generator is a factual claim, and it has to keep being true — the sample
  // pack is built by scripts/sample-pack.ts through the same renderPack the
  // paid route uses, not mocked up in a design tool.
  it('is generated by the real pack renderer', () => {
    // scripts/ sits outside src/, which is all `files` walks — read it directly,
    // the same way the migration assertions above do.
    const script = readFileSync(
      fileURLToPath(new URL('../scripts/sample-pack.ts', import.meta.url)), 'utf8',
    ).replace(/\s+/g, ' ');
    expect(script).toContain("from '../src/lib/pdf/render.ts'");
    expect(script).toContain('renderPack(doc)');
    expect(script).toContain('assertDisclaimerPresent(doc)');
  });

  // Same promise as the rest of this page: nobody real is depicted.
  it('says on the page that nobody real is depicted', () => {
    const page = flat('app/examples/page.tsx');
    expect(page).toContain('illustrative scenarios, not real customers');
    expect(page).toContain('illustrative estate');
  });
});

describe('photography does not invent customers', () => {
  const flat = (rel: string) =>
    files.find((f) => f.rel.endsWith(rel))!.source.replace(/\s+/g, ' ');

  // The Pexels licence forbids using imagery to imply endorsement by the people
  // in it, and this site separately promises not to invent customers. Both land
  // in the same place: alt text may describe what is in the frame, and may not
  // claim the subject is a customer, an heir, or a bereaved family.
  const FORBIDDEN = [
    'our customer', 'a customer', 'client of', 'family we helped',
    'heir who', 'bereaved family', 'satisfied', 'testimonial',
  ];

  const altTexts = () => {
    const out: string[] = [];
    for (const f of files) {
      for (const m of f.source.matchAll(/alt="([^"]*)"/g)) out.push(m[1] ?? '');
    }
    return out;
  };

  it('describes what is in the frame, never who it is', () => {
    const alts = altTexts();
    expect(alts.length > 0).toBe(true);
    for (const alt of alts) {
      const lower = alt.toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(lower.includes(phrase)).toBe(false);
      }
    }
  });

  // A missing width/height is a layout shift, and a page that reflows under a
  // grieving person mid-sentence is worse than a page with no picture on it.
  it('reserves space for every image before it loads', () => {
    for (const f of files) {
      for (const tag of f.source.matchAll(/<img[\s\S]{0,600}?\/>/g)) {
        const el = tag[0];
        if (!el.includes('src=')) continue;
        expect(el.includes('width=')).toBe(true);
        expect(el.includes('height=')).toBe(true);
      }
    }
  });

  // Licensing has to be checkable by someone who did not write the code.
  it('records the source and licence of every photograph', () => {
    const imgDir = fileURLToPath(new URL('../public/img', import.meta.url));
    const credits = readFileSync(join(imgDir, 'CREDITS.md'), 'utf8');
    expect(credits).toContain('Pexels License');

    // Derived from what is actually on disk rather than a hand-kept list, so
    // dropping a new photograph into public/img without crediting it fails here
    // instead of shipping unattributed.
    const shipped = new Set(
      readdirSync(imgDir)
        .filter((f) => f.endsWith('.webp'))
        .map((f) => f.replace(/-\d+\.webp$/, '')),
    );
    expect(shipped.size > 0).toBe(true);
    for (const name of shipped) {
      expect(credits).toContain(name);
    }
  });
});
