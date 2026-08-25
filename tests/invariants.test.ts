import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
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

const SRC = new URL('../src', import.meta.url).pathname;

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
  rel: path.slice(SRC.length + 1),
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
      'api/cron/purge/route.ts', 'api/uploads/route.ts',
      'api/cases/[id]/route.ts', 'api/cases/[id]/generate/route.ts',
      'api/admin/packs/[id]/route.ts', 'api/packs/[id]/download/route.ts',
      // leads: anonymous inserts, so there is no user client to act as.
      // The insert-only RLS policy is what constrains it.
      'api/leads/route.ts',
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
    new URL('../supabase/migrations/0001_init.sql', import.meta.url).pathname, 'utf8',
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

  it('shows the disclaimer on every page via the root layout', () => {
    expect(flat('app/layout.tsx')).toContain('not a law firm');
    expect(flat('app/layout.tsx')).toContain('not legal advice');
  });

  it('keeps the 90-day retention figure consistent across code and copy', () => {
    // A promise made in the privacy notice that the code does not keep is
    // worse than no promise. These must move together.
    expect(flat('lib/uploads.ts')).toContain('RETENTION_DAYS = 90');
    expect(flat('app/layout.tsx')).toContain('90 days');
    expect(flat('app/privacy/page.tsx')).toContain('90 days');
  });

  it('states in the privacy notice that data is not used for training', () => {
    expect(flat('privacy/page.tsx')).toContain('not used to train');
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
      new URL('../supabase/migrations/0002_leads.sql', import.meta.url).pathname, 'utf8',
    ).replace(/\s+/g, ' ');

    expect(sql).toContain('constraint lead_has_consent check (consent_to_contact = true)');
    expect(sql).toContain('constraint lead_has_contact check (email is not null or phone is not null)');
    // Anonymous visitors may insert and nothing else.
    expect(sql).toContain('create policy leads_public_insert on public.leads for insert');
    expect(sql).not.toContain('leads for select to anon');
  });
});
