import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import {
  validateLead, normalisePhone, normaliseEmail, formatPhone, summariseForLead,
  type LeadInput,
} from '../src/lib/leads.ts';

const base = (over: Partial<LeadInput> = {}): LeadInput => ({
  source: 'triage_result', consentToContact: true, ...over,
});

describe('Indian mobile numbers', () => {
  it('accepts every way a person actually types one', () => {
    for (const raw of [
      '9876543210', '+919876543210', '+91 9876543210', '+91-98765-43210',
      '09876543210', '0091 9876543210', '98765 43210', '(+91) 9876543210',
    ]) {
      expect(normalisePhone(raw)).toBe('919876543210');
    }
  });

  it('rejects landlines, since we confirm callbacks by SMS', () => {
    expect(normalisePhone('01126543210')).toBeNull();   // Delhi landline
    expect(normalisePhone('2226543210')).toBeNull();     // starts with 2
  });

  it('rejects numbers of the wrong length', () => {
    expect(normalisePhone('98765432')).toBeNull();
    expect(normalisePhone('98765432109')).toBeNull();
    expect(normalisePhone('')).toBeNull();
  });

  it('formats for display without losing the stored shape', () => {
    expect(formatPhone('919876543210')).toBe('+91 98765 43210');
  });
});

describe('email addresses', () => {
  it('accepts real-world addresses that stricter patterns wrongly reject', () => {
    for (const e of [
      'a@b.co', 'first.last@example.co.in', 'user+case123@gmail.com',
      "o'brien@example.com", 'UPPER@EXAMPLE.COM',
    ]) {
      expect(normaliseEmail(e)).not.toBeNull();
    }
  });

  it('lowercases and trims', () => {
    expect(normaliseEmail('  Sunita@Example.COM ')).toBe('sunita@example.com');
  });

  it('rejects malformed addresses', () => {
    for (const e of ['nope', 'a@b', 'a b@c.com', '@example.com', 'a@.com', '']) {
      expect(normaliseEmail(e)).toBeNull();
    }
  });
});

describe('validateLead', () => {
  it('accepts an email-only lead', () => {
    const r = validateLead(base({ email: 'sunita@example.com' }));
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.lead.email).toBe('sunita@example.com'); expect(r.lead.phone).toBeNull(); }
  });

  it('accepts a phone-only lead', () => {
    const r = validateLead(base({ phone: '98765 43210' }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.lead.phone).toBe('919876543210');
  });

  it('requires at least one way to reach them', () => {
    const r = validateLead(base());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('no_contact');
  });

  it('refuses to store anything without explicit consent', () => {
    const r = validateLead(base({ email: 'a@b.com', consentToContact: false }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('no_consent');
  });

  it('keeps marketing consent separate from contact consent', () => {
    // Bundling the two is the dark pattern DPDP is aimed at.
    const r = validateLead(base({ email: 'a@b.com' }));
    if (r.ok) expect(r.lead.consentToUpdates).toBe(false);

    const r2 = validateLead(base({ email: 'a@b.com', consentToUpdates: true }));
    if (r2.ok) expect(r2.lead.consentToUpdates).toBe(true);
  });

  it('explains the fix in every rejection, without blaming the person', () => {
    for (const input of [
      base(), base({ email: 'nope' }), base({ phone: '123' }),
      base({ email: 'a@b.com', consentToContact: false }),
    ]) {
      const r = validateLead(input);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message.length > 25).toBe(true);
        expect(r.message.toLowerCase()).not.toContain('invalid');
      }
    }
  });

  it('caps free text rather than truncating it silently', () => {
    const r = validateLead(base({ email: 'a@b.com', message: 'x'.repeat(2001) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('message_too_long');
  });
});

describe('case summary carried into a lead', () => {
  it('carries the shape of the case and nothing identifying', () => {
    const s = summariseForLead({
      regime: 'hindu', heirCount: 3,
      assetKinds: ['bank_deposit', 'bank_deposit', 'iepf_shares'],
      needsAdvocate: false, suggestedTier: 'standard',
    });

    expect(s.heirCount).toBe(3);
    expect(s.assetKinds).toEqual(['bank_deposit', 'iepf_shares']);   // deduplicated

    const json = JSON.stringify(s);
    expect(json).not.toContain('@');
    expect(json.match(/\d{6,}/)).toBeNull();   // no account-like numbers
  });
});
