import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import { extractFields } from '../src/lib/ocr-fields.ts';

const field = (fields: ReturnType<typeof extractFields>, key: string) =>
  fields.find((f) => f.key === key);

describe('death certificate extraction', () => {
  const sample = `
    MUNICIPAL CORPORATION
    CERTIFICATE OF DEATH
    Name of the Deceased: RAMESH KUMAR GUPTA
    Date of Death: 14/11/2025
    Place of Death: Pune, Maharashtra
    Registration No: 2025/PN/44821
  `;

  it('pulls the name, date and place', () => {
    const f = extractFields(sample, 'death_certificate');
    expect(field(f, 'deceasedName')?.value).toBe('Ramesh Kumar Gupta');
    expect(field(f, 'dateOfDeath')?.value).toBe('2025-11-14');
    expect(field(f, 'placeOfDeath')?.value).toContain('Pune');
  });

  it('normalises DD/MM/YYYY to ISO, resolving the 03/04 ambiguity', () => {
    // An Indian certificate reading 03/04/2025 means 3 April, not 4 March.
    const f = extractFields('Date of Death: 03/04/2025', 'death_certificate');
    expect(field(f, 'dateOfDeath')?.value).toBe('2025-04-03');
  });

  it('accepts dashes and dots as separators', () => {
    for (const raw of ['14-11-2025', '14.11.2025']) {
      const f = extractFields(`Date of Death: ${raw}`, 'death_certificate');
      expect(field(f, 'dateOfDeath')?.value).toBe('2025-11-14');
    }
  });

  it('expands a two-digit year', () => {
    const f = extractFields('Date of Death: 14/11/25', 'death_certificate');
    expect(field(f, 'dateOfDeath')?.value).toBe('2025-11-14');
  });
});

describe('bad OCR output is dropped, never guessed at', () => {
  const badDates = [
    ['impossible month', 'Date of Death: 14/25/2025'],
    ['impossible day',   'Date of Death: 45/11/2025'],
    ['a future date',    'Date of Death: 01/01/2099'],
    ['a misread century','Date of Death: 14/11/1905'],
  ];

  for (const [label, text] of badDates) {
    it(`drops ${label} rather than returning something plausible`, () => {
      // A plausible wrong date of death propagates into every form in the pack.
      // A blank field is merely annoying.
      expect(field(extractFields(text!, 'death_certificate'), 'dateOfDeath')).toBeUndefined();
    });
  }

  it('returns nothing at all from unreadable noise', () => {
    expect(extractFields('~~~ aaa 123 ###', 'death_certificate')).toEqual([]);
  });

  it('returns nothing for a document type it has no rules for', () => {
    expect(extractFields('Date of Death: 14/11/2025', 'unknown_type')).toEqual([]);
  });
});

describe('claimant identity documents', () => {
  it('recognises a PAN', () => {
    const f = extractFields('Permanent Account Number ABCDE1234F', 'claimant_id');
    expect(field(f, 'pan')?.value).toBe('ABCDE1234F');
  });

  it('ignores strings that only look like a PAN', () => {
    expect(field(extractFields('ABCD1234F ABCDE12345', 'claimant_id'), 'pan')).toBeUndefined();
  });

  it('does not scrape a PAN out of a death certificate', () => {
    // Extraction is scoped per document type so we never collect an
    // identifier from a document the user uploaded for another purpose.
    const f = extractFields('Name of the Deceased: X Y ABCDE1234F', 'death_certificate');
    expect(field(f, 'pan')).toBeUndefined();
  });
});

describe('share certificates', () => {
  const sample = `
    Folio No.: IN30012345
    Number of Shares: 1,250
  `;

  it('pulls folio and share count, stripping thousands separators', () => {
    const f = extractFields(sample, 'share_certificate');
    expect(field(f, 'folio')?.value).toBe('IN30012345');
    expect(field(f, 'shareCount')?.value).toBe('1250');
  });
});

describe('confidence signalling', () => {
  it('scores every field between 0 and 1', () => {
    const f = extractFields(
      'Name of the Deceased: RAMESH GUPTA Date of Death: 14/11/2025 Place of Death: Pune',
      'death_certificate',
    );
    expect(f.length > 0).toBe(true);
    for (const x of f) {
      expect(x.confidence > 0 && x.confidence <= 1).toBe(true);
    }
  });

  it('scores the fuzzier place field below the checking threshold', () => {
    // Below 0.6 the UI highlights a field for the user to verify.
    const f = extractFields('Place of Death: Pune, Maharashtra', 'death_certificate');
    expect(field(f, 'placeOfDeath')!.confidence <= 0.6).toBe(true);
  });

  it('gives every field a human-readable label for the confirm screen', () => {
    const f = extractFields('Date of Death: 14/11/2025', 'death_certificate');
    expect(field(f, 'dateOfDeath')?.label).toBe('Date of death');
  });
});
