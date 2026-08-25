/**
 * OCR field extraction — pure logic, no Tesseract dependency.
 *
 * Split out from ocr.ts so it can be unit-tested without loading a WASM OCR
 * engine, and so the parsing rules can be reviewed on their own. This is the
 * part that decides what we believe a scanned certificate says, which makes it
 * worth testing properly.
 */

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  /** 0-1. Below 0.6 the UI highlights the field for checking. */
  confidence: number;
}

/**
 * Field extraction is plain pattern matching, not a model.
 *
 * Two reasons. First, it runs offline in the browser with no API call and no
 * data leaving the device, which is the whole point. Second, a regex that
 * fails is obvious and returns nothing; a model that fails invents a
 * plausible date, and a plausible wrong date of death is far more dangerous
 * than a blank field the user has to fill in.
 */

export function extractFields(text: string, docType: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const flat = text.replace(/\s+/g, ' ');

  if (docType === 'death_certificate') {
    const dod = matchDate(flat, /date\s+of\s+death[:\s]+([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i);
    if (dod) fields.push({ key: 'dateOfDeath', label: 'Date of death', ...dod });

    const name = captureUntilLabel(flat, /name\s+of\s+(?:the\s+)?deceased[:\s]+/i, 'A-Za-z .');
    if (name) {
      fields.push({
        key: 'deceasedName', label: 'Name of the deceased',
        value: titleCase(name), confidence: 0.7,
      });
    }

    const place = captureUntilLabel(flat, /place\s+of\s+death[:\s]+/i, 'A-Za-z ,.');
    if (place) {
      fields.push({
        key: 'placeOfDeath', label: 'Place of death',
        value: titleCase(place), confidence: 0.6,
      });
    }
  }

  if (docType === 'claimant_id') {
    // PAN is matched only to CONFIRM the claimant has the right document in
    // hand. The value is shown to the user and stored encrypted; it is never
    // placed in a payload bound for an AI provider.
    const pan = flat.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
    if (pan?.[1]) {
      fields.push({ key: 'pan', label: 'PAN', value: pan[1], confidence: 0.85 });
    }
  }

  if (docType === 'share_certificate') {
    const folio = flat.match(/folio\s*(?:no\.?|number)?[:\s]+([A-Z0-9\-\/]{4,20})/i);
    if (folio?.[1]) {
      fields.push({ key: 'folio', label: 'Folio number', value: folio[1], confidence: 0.7 });
    }
    const qty = flat.match(/(?:number|no\.?)\s+of\s+shares[:\s]+([0-9,]{1,12})/i);
    if (qty?.[1]) {
      fields.push({
        key: 'shareCount', label: 'Number of shares',
        value: qty[1].replace(/,/g, ''), confidence: 0.65,
      });
    }
  }

  return fields;
}

/**
 * Indian certificates use DD/MM/YYYY. Normalising to ISO here avoids the
 * classic 03/04/2025 ambiguity later, and anything that does not parse to a
 * real past date is dropped rather than guessed at.
 */
function matchDate(text: string, re: RegExp): { value: string; confidence: number } | null {
  const m = text.match(re);
  if (!m?.[1]) return null;

  const parts = m[1].split(/[\/\-.]/).map((p) => parseInt(p, 10));
  const [d, mo, rawY] = parts;
  if (d === undefined || mo === undefined || rawY === undefined) return null;

  const y = rawY < 100 ? 2000 + rawY : rawY;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;

  const date = new Date(Date.UTC(y, mo - 1, d));
  if (Number.isNaN(date.getTime()) || date > new Date()) return null;
  // Guard against a misread century producing 1905 or 2105.
  if (y < 1950 || y > new Date().getFullYear()) return null;

  return { value: date.toISOString().slice(0, 10), confidence: 0.75 };
}

/**
 * Field labels that mark the start of the NEXT field on a certificate.
 *
 * OCR output arrives as one flat run of text, so a naive greedy capture of a
 * name swallows everything up to the end of the line and beyond — a real bug
 * that produced "Ramesh Kumar Gupta Date Of Death". Capturing lazily up to the
 * next label keyword fixes it.
 *
 * Matching requires a preceding space and a trailing word boundary, so a name
 * that happens to begin with one of these strings (Dateram, Ageshwar) is not
 * cut short.
 */
const NEXT_LABEL = [
  'date', 'place', 'sex', 'gender', 'age', 'father', 'mother', 'husband',
  'wife', 'spouse', 'registration', 'reg', 'address', 'informant', 'remarks',
  'occupation', 'nationality', 'religion', 'issued', 'certificate',
].join('|');

/**
 * Capture the run of `allowed` characters after `prefix`, stopping at the next
 * field label, digit, or colon.
 */
function captureUntilLabel(text: string, prefix: RegExp, allowed: string): string | null {
  const start = text.match(prefix);
  if (!start || start.index === undefined) return null;

  const rest = text.slice(start.index + start[0].length);
  const re = new RegExp(
    `^([${allowed}]{3,60}?)(?=\\s+(?:${NEXT_LABEL})\\b|\\s*[:\\d]|$)`,
    'i',
  );

  const m = rest.match(re);
  const value = m?.[1]?.trim();
  return value && value.length >= 3 ? value : null;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
