import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import {
  buildPackDocument, assertDisclaimerPresent, toPlainText, DISCLAIMER_FOOTER,
  type PackDocument,
} from '../src/lib/pdf/document.ts';
import { computeShares } from '../src/lib/succession.ts';
import { requirementsFor } from '../src/lib/requirements.ts';

const FRESH = new Date('2026-09-01');

const shares = computeShares('hindu', [
  { id: 'w', relationship: 'spouse', isClaimant: true },
  { id: 's1', relationship: 'son', isClaimant: true },
]);

const requirements = [
  requirementsFor({ id: 'a1', kind: 'bank_deposit', valueBand: 'under_1L', hasNomination: false }, FRESH),
];

const build = (over: Partial<Parameters<typeof buildPackDocument>[0]> = {}): PackDocument =>
  buildPackDocument({
    caseRef: 'CASE-3F7A1C2E',
    deceasedName: 'Ramesh Kumar Gupta',
    dateOfDeath: '2025-11-14',
    heirNames: new Map([['w', 'Sunita Gupta'], ['s1', 'Arjun Gupta']]),
    shares,
    requirements,
    narrative: {
      coveringLetter: 'To the Branch Manager, please transmit the balance.',
      heirshipAffidavitBody: '1. I am the widow of the deceased.',
      familyGuidance: 'Take the pack to the branch with originals.',
      flags: ['We still need a copy of the death certificate.'],
    },
    manifest: [{ ruleId: 'bank.no_nomination.small', version: '2026.08.1' }],
    institutionByAsset: new Map([['a1', 'State Bank of India']]),
    generatedAt: new Date('2026-08-22'),
    ...over,
  });

describe('pack structure', () => {
  it('always opens with the disclaimer page', () => {
    expect(build().pages[0]?.title).toBe('About this pack');
  });

  it('includes entitlement, a per-institution checklist, drafts and provenance', () => {
    const titles = build().pages.map((p) => p.title);
    expect(titles).toContain('Entitlement');
    expect(titles).toContain('Checklist — State Bank of India');
    expect(titles).toContain('Covering letter');
    expect(titles).toContain('Affidavit of heirship');
    expect(titles).toContain('What happens next');
    expect(titles).toContain('How this pack was prepared');
  });

  it('names heirs rather than printing internal ids', () => {
    const text = toPlainText(build());
    expect(text).toContain('Sunita Gupta');
    expect(text).toContain('Arjun Gupta');
    // Internal ids must not leak into a document a bank will read.
    expect(text).not.toContain('| w |');
    expect(text).not.toContain('| s1 |');
  });

  it('prints shares as exact fractions, never decimals', () => {
    const text = toPlainText(build());
    expect(text).toContain('1/2');
    expect(text).not.toContain('0.5');
  });

  it('cites the statute the shares rest on', () => {
    expect(toPlainText(build())).toContain('Hindu Succession Act, 1956, s.10');
  });

  it('stamps the rule version so a pack can be explained months later', () => {
    const text = toPlainText(build());
    expect(text).toContain('bank.no_nomination.small');
    expect(text).toContain('2026.08.1');
  });

  it('marks each requirement as required or recommended', () => {
    const text = toPlainText(build());
    expect(text).toContain('required');
    expect(text).toContain('recommended');
  });

  it('tells the family what is still outstanding', () => {
    expect(toPlainText(build())).toContain('death certificate');
  });
});

describe('disclaimer enforcement', () => {
  it('passes a well-formed pack', () => {
    expect(() => assertDisclaimerPresent(build())).not.toThrow();
  });

  it('carries the disclaimer wording on the first page', () => {
    const first = toPlainText(build()).split('===')[2] ?? '';
    expect(first).toContain('not a law firm');
    expect(first).toContain('not legal advice');
  });

  it('repeats the footer on every single page', () => {
    const doc = build();
    const text = toPlainText(doc);
    const occurrences = text.split(DISCLAIMER_FOOTER).length - 1;
    expect(occurrences).toBe(doc.pages.length);
  });

  it('throws when the disclaimer page has been removed', () => {
    const doc = build();
    doc.pages.shift();
    expect(() => assertDisclaimerPresent(doc)).toThrow();
  });

  it('throws when the disclaimer wording has been watered down', () => {
    const doc = build();
    doc.pages[0]!.blocks = [{ kind: 'para', text: 'Thanks for choosing us!' }];
    expect(() => assertDisclaimerPresent(doc)).toThrow();
  });

  it('warns that stamp paper and a notary are the family\'s responsibility', () => {
    const text = toPlainText(build());
    expect(text).toContain('stamp paper');
    expect(text).toContain('cannot notarise it for you');
  });
});

describe('degraded cases still produce a usable pack', () => {
  it('omits the entitlement page when shares could not be computed', () => {
    const doc = build({ shares: computeShares('muslim_sunni', []) });
    expect(doc.pages.map((p) => p.title)).not.toContain('Entitlement');
    // But the disclaimer and provenance survive.
    expect(doc.pages[0]?.title).toBe('About this pack');
    expect(doc.pages.map((p) => p.title)).toContain('How this pack was prepared');
  });

  it('omits drafted documents when the model produced nothing', () => {
    const titles = build({ narrative: null }).pages.map((p) => p.title);
    expect(titles).not.toContain('Covering letter');
    expect(titles).toContain('Checklist — State Bank of India');
  });

  it('skips checklists for unsupported asset kinds rather than printing an empty one', () => {
    const doc = build({
      requirements: [requirementsFor({ id: 'a1', kind: 'nps', valueBand: 'unknown' }, FRESH)],
    });
    expect(doc.pages.some((p) => p.title.startsWith('Checklist'))).toBe(false);
  });

  it('still tells the reader a human approved the pack', () => {
    expect(toPlainText(build({ narrative: null }))).toContain('reviewed and approved');
  });
});
