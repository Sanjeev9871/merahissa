import type { Narrative } from '../pipeline';
import type { RequirementResult } from '../requirements';
import { fractionToString, type ShareResult } from '../succession';

/**
 * Document CONTENT, separated from rendering.
 *
 * This module decides what appears in a pack and in what order. It returns a
 * plain structure and touches no PDF library, which means the part most
 * likely to be wrong — what we tell a family, and whether the disclaimer is
 * actually present — is unit-testable without rendering anything.
 *
 * `render.ts` turns this structure into bytes with pdf-lib and contains no
 * decisions at all.
 */

export interface TextBlock { kind: 'heading' | 'para' | 'label'; text: string }
export interface ListBlock { kind: 'list'; items: string[]; ordered?: boolean }
export interface TableBlock { kind: 'table'; head: string[]; rows: string[][] }
export interface RuleBlock { kind: 'rule' }
export interface SignatureBlock { kind: 'signature'; lines: string[] }

export type Block = TextBlock | ListBlock | TableBlock | RuleBlock | SignatureBlock;

export interface Page {
  title: string;
  /** Printed small at the top of each page for the family's own filing. */
  subtitle?: string;
  blocks: Block[];
}

export interface PackDocument {
  caseRef: string;
  generatedAt: string;
  /** Template versions used, printed on the last page for traceability. */
  manifest: Array<{ ruleId: string; version: string }>;
  pages: Page[];
}

/**
 * The disclaimer is not decoration. It is what keeps the service lawful for a
 * non-advocate operator, so it goes on EVERY page as a footer, and gets its
 * own page at the front. `assertDisclaimerPresent` enforces that.
 */
export const DISCLAIMER_FOOTER =
  'Mera Hissa prepares documents. This is not legal advice and we do not represent '
  + 'you before any court or tribunal.';

const DISCLAIMER_FULL = [
  // The phrases "not a law firm" and "not legal advice" are asserted verbatim
  // by assertDisclaimerPresent(). Reword the rest freely; do not reword these
  // two, or every pack will correctly refuse to release.
  'Mera Hissa has prepared the documents in this pack from the information you gave us. '
  + 'We are not a law firm, this is not legal advice, and we do not represent you '
  + 'before any court, tribunal or authority.',
  'Every institution can ask for something we have not anticipated, and requirements '
  + 'change without notice. Check the current requirement with the institution before '
  + 'you file, and tell us if it differs from what we have said.',
  'Where your case needs a succession certificate, probate or letters of administration, '
  + 'those are court applications and an advocate must file them. We have flagged that '
  + 'in this pack where it applies.',
  'Documents you gave us are stored encrypted and are deleted 90 days after your case '
  + 'closes. You can ask us to delete everything sooner at any time.',
];

export function buildPackDocument(opts: {
  caseRef: string;
  deceasedName: string;
  dateOfDeath: string | null;
  heirNames: Map<string, string>;
  shares: ShareResult;
  requirements: RequirementResult[];
  narrative: Narrative | null;
  manifest: Array<{ ruleId: string; version: string }>;
  institutionByAsset: Map<string, string>;
  generatedAt?: Date;
}): PackDocument {
  const generatedAt = (opts.generatedAt ?? new Date()).toISOString().slice(0, 10);
  const pages: Page[] = [];

  // --- 1. Cover and disclaimer ---------------------------------------------
  pages.push({
    title: 'About this pack',
    subtitle: `${opts.caseRef} · prepared ${generatedAt}`,
    blocks: [
      { kind: 'para', text: `Estate of ${opts.deceasedName}` },
      ...(opts.dateOfDeath
        ? [{ kind: 'para', text: `Date of death: ${opts.dateOfDeath}` } as Block]
        : []),
      { kind: 'rule' },
      { kind: 'heading', text: 'Please read this first' },
      ...DISCLAIMER_FULL.map((text) => ({ kind: 'para', text }) as Block),
    ],
  });

  // --- 2. Who inherits what -------------------------------------------------
  if (opts.shares.computed && opts.shares.shares.length > 0) {
    pages.push({
      title: 'Entitlement',
      subtitle: opts.caseRef,
      blocks: [
        {
          kind: 'para',
          text: 'These shares follow directly from the statute cited below. They are '
            + 'not our opinion and not a negotiated split.',
        },
        {
          kind: 'table',
          head: ['Heir', 'Share', 'Basis'],
          rows: opts.shares.shares.map((s) => [
            opts.heirNames.get(s.heirId) ?? s.heirId,
            fractionToString(s.share),
            s.basis,
          ]),
        },
        { kind: 'label', text: 'Statutory basis' },
        { kind: 'list', items: opts.shares.authorities },
        ...(opts.shares.notes.length > 0
          ? ([
            { kind: 'label', text: 'Points to check' },
            { kind: 'list', items: opts.shares.notes },
          ] as Block[])
          : []),
      ],
    });
  }

  // --- 3. What to file, per institution ------------------------------------
  for (const req of opts.requirements) {
    if (req.unsupported) continue;
    const institution = opts.institutionByAsset.get(req.assetId) ?? 'this institution';

    pages.push({
      title: `Checklist — ${institution}`,
      subtitle: `${opts.caseRef} · rule ${req.ruleId} v${req.ruleVersion}`,
      blocks: [
        {
          kind: 'para', text: 'Take every item marked required. Missing one is the '
            + 'most common reason a claim is sent back.'
        },
        {
          kind: 'list',
          ordered: true,
          items: req.requirements.map(
            (d) => `${d.label} — ${d.mandatory ? 'required' : 'recommended'}`
              + (d.note ? ` (${d.note})` : ''),
          ),
        },
        ...(req.notes.length > 0
          ? ([{ kind: 'label', text: 'Notes' }, { kind: 'list', items: req.notes }] as Block[])
          : []),
      ],
    });
  }

  // --- 4. Drafted documents -------------------------------------------------
  if (opts.narrative) {
    pages.push({
      title: 'Covering letter',
      subtitle: `${opts.caseRef} · draft for your signature`,
      blocks: [
        { kind: 'para', text: opts.narrative.coveringLetter },
        { kind: 'signature', lines: ['Signature', 'Name', 'Date'] },
      ],
    });

    pages.push({
      title: 'Affidavit of heirship',
      subtitle: `${opts.caseRef} · to be sworn on stamp paper before a notary`,
      blocks: [
        {
          kind: 'para',
          text: 'This must be printed on stamp paper of the value your state requires '
            + 'and sworn before a notary. We cannot notarise it for you.',
        },
        { kind: 'para', text: opts.narrative.heirshipAffidavitBody },
        { kind: 'signature', lines: ['Deponent', 'Notary', 'Date and place'] },
      ],
    });

    pages.push({
      title: 'What happens next',
      subtitle: opts.caseRef,
      blocks: [
        { kind: 'para', text: opts.narrative.familyGuidance },
        ...(opts.narrative.flags.length > 0
          ? ([
            { kind: 'label', text: 'Still needed from you' },
            { kind: 'list', items: opts.narrative.flags },
          ] as Block[])
          : []),
      ],
    });
  }

  // --- 5. Provenance --------------------------------------------------------
  pages.push({
    title: 'How this pack was prepared',
    subtitle: opts.caseRef,
    blocks: [
      {
        kind: 'para',
        text: `Prepared ${generatedAt} using the document rules listed below. `
          + 'Institution requirements change; if you are filing more than a few '
          + 'weeks after this date, confirm the current forms before you go.',
      },
      {
        kind: 'table',
        head: ['Rule set', 'Version'],
        rows: opts.manifest.map((m) => [m.ruleId, m.version]),
      },
      {
        kind: 'para',
        text: 'A person at Mera Hissa reviewed and approved this pack before it was sent '
          + 'to you. If anything here does not match your situation, tell us and we '
          + 'will correct it at no charge.',
      },
    ],
  });

  return { caseRef: opts.caseRef, generatedAt, manifest: opts.manifest, pages };
}

/**
 * Enforced before a pack can be released. A pack without its disclaimer is a
 * compliance problem, not a formatting one, so this throws rather than warns.
 */
export function assertDisclaimerPresent(doc: PackDocument): void {
  const first = doc.pages[0];
  if (!first || first.title !== 'About this pack') {
    throw new Error('Pack is missing its disclaimer page. Refusing to release.');
  }

  const text = first.blocks
    .filter((b): b is TextBlock => b.kind === 'para')
    .map((b) => b.text)
    .join(' ');

  if (!text.includes('not a law firm') || !text.includes('not legal advice')) {
    throw new Error('Disclaimer page does not contain the required wording. Refusing to release.');
  }
}

/** Plain-text rendering, used for previews, tests and email bodies. */
export function toPlainText(doc: PackDocument): string {
  const out: string[] = [];

  for (const page of doc.pages) {
    out.push(`\n=== ${page.title} ===`);
    if (page.subtitle) out.push(page.subtitle);

    for (const b of page.blocks) {
      switch (b.kind) {
        case 'heading': out.push(`\n## ${b.text}`); break;
        case 'label': out.push(`\n${b.text}:`); break;
        case 'para': out.push(b.text); break;
        case 'rule': out.push('---'); break;
        case 'list':
          b.items.forEach((it, i) => out.push(b.ordered ? `${i + 1}. ${it}` : `- ${it}`));
          break;
        case 'table':
          out.push(b.head.join(' | '));
          b.rows.forEach((r) => out.push(r.join(' | ')));
          break;
        case 'signature':
          b.lines.forEach((l) => out.push(`\n${l}: ${'_'.repeat(30)}`));
          break;
      }
    }
    out.push(`\n[${DISCLAIMER_FOOTER}]`);
  }

  return out.join('\n');
}
