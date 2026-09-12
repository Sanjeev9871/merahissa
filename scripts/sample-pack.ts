/**
 * Renders a sample pack PDF using the REAL generator.
 *
 * Used to produce the stills for the /examples video. The whole point is that
 * what a visitor sees in that video is genuinely what the software produces —
 * same succession engine, same requirements tables, same PDF renderer, same
 * disclaimer pages. If this script ever diverges from the product, the video
 * becomes a claim rather than a demonstration.
 *
 * The case is the illustrative scenario already published on /examples: a
 * Hindu intestate estate, widow and two children, one bank account and one
 * insurance policy. Nobody real is depicted.
 *
 *   npx tsx scripts/sample-pack.ts <outfile.pdf>
 */
import { writeFileSync } from 'node:fs';
import { computeShares, type Heir } from '../src/lib/succession.ts';
import { requirementsFor, buildManifest, type AssetFacts } from '../src/lib/requirements.ts';
import { buildPackDocument, assertDisclaimerPresent } from '../src/lib/pdf/document.ts';
import { renderPack } from '../src/lib/pdf/render.ts';

const HEIRS: Heir[] = [
  { id: 'h1', relationship: 'spouse', isClaimant: true },
  { id: 'h2', relationship: 'son', isClaimant: true },
  { id: 'h3', relationship: 'daughter', isClaimant: true },
];

const heirNames = new Map<string, string>([
  ['h1', 'Sunita Devi'],
  ['h2', 'Rohit Kumar'],
  ['h3', 'Anjali Kumari'],
]);

const ASSETS: AssetFacts[] = [
  { id: 'a1', kind: 'bank_deposit', valueBand: '1L_to_5L', hasNomination: false },
  { id: 'a2', kind: 'insurance_policy', valueBand: '5L_to_10L', hasNomination: true },
];

const institutionByAsset = new Map<string, string>([
  ['a1', 'State Bank of India'],
  ['a2', 'LIC of India'],
]);

const shares = computeShares('hindu', HEIRS, { deceasedWasFemale: false });
const requirements = ASSETS.map((a) => requirementsFor(a, new Date('2026-09-12')));

const doc = buildPackDocument({
  caseRef: 'SAMPLE-0001',
  deceasedName: 'Ramesh Kumar (illustrative)',
  dateOfDeath: '2026-03-14',
  heirNames,
  shares,
  requirements,
  narrative: null,
  manifest: buildManifest(requirements),
  institutionByAsset,
  generatedAt: new Date('2026-09-12'),
});

// The same guard the live generate route runs. A pack without its disclaimer
// pages must never be produced, least of all one used in marketing.
assertDisclaimerPresent(doc);

const out = process.argv[2] ?? 'sample-pack.pdf';
const bytes = await renderPack(doc);
writeFileSync(out, bytes);

console.log(`wrote ${out} — ${doc.pages.length} pages, ${bytes.length} bytes`);
console.log('pages:', doc.pages.map((p) => p.title).join(' | '));
