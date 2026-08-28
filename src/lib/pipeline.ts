import {
  redactCase, rehydrate, type CaseInput, type RedactedCase, type TokenMap,
} from './redaction.ts';
import { computeShares, fractionToString, type Heir as SuccessionHeir, type ShareResult } from './succession.ts';
import {
  requirementsFor, buildManifest, blocksAutoGeneration,
  type RequirementResult,
} from './requirements.ts';
import { completeJson, AiError } from './ai/provider.ts';

/**
 * Pack generation pipeline.
 *
 * The order here is the whole security and correctness argument:
 *
 *   1. COMPUTE deterministically  — shares and document requirements are
 *      decided by code, before the model is involved at all. The model is
 *      never asked what a widow inherits or which form a bank wants.
 *   2. REDACT                     — build a token-only payload.
 *   3. ASK the model              — only for prose: covering letters,
 *      affidavit narrative, plain-language explanations. It receives the
 *      already-decided facts and writes them up.
 *   4. REHYDRATE                  — restore real values server-side.
 *   5. GATE                       — anything stale, unsupported, unresolved
 *      or advocate-flagged blocks the pack at 'queued' for human review.
 *
 * A pack never reaches a family without a person approving it.
 */

export interface GenerationInput extends CaseInput {
  deceasedWasFemale?: boolean;
}

export interface GenerationResult {
  status: 'ready_for_review' | 'held';
  /** Why a held case is held. Shown to the reviewer, never to the family. */
  holdReasons: string[];
  shares: ShareResult;
  requirements: RequirementResult[];
  manifest: ReturnType<typeof buildManifest>;
  /** Model-written prose, with real names restored. Null when held early. */
  narrative: Narrative | null;
  /** Tokens the model invented that we could not resolve. */
  unresolvedTokens: string[];
}

export interface Narrative {
  coveringLetter: string;
  heirshipAffidavitBody: string;
  familyGuidance: string;
  /** Gaps the model spotted, e.g. a document the family has not uploaded. */
  flags: string[];
}

const SYSTEM_PROMPT = `You draft prose for Indian estate transmission paperwork.

You will receive a case described ONLY in placeholder tokens of the form
{{HEIR_1}}, {{DECEASED_1}}, {{INSTITUTION_2}}, {{ACCOUNT_1}}. These stand for
real people, institutions and account numbers that you are not given.

Absolute rules:
1. Use the tokens EXACTLY as supplied. Never invent a token that was not given
   to you. Never guess at a real name, number, address or date.
2. The shares and the document list you are given are already legally decided.
   Do not recompute, question, or alter them. Restate them faithfully.
3. Never give legal advice or predict an outcome. You are writing covering
   prose for documents a qualified person has already selected.
4. Write plainly. The reader has recently been bereaved and is not a lawyer.
   Short sentences. No jargon that you do not immediately explain.
5. Do not add flourish, condolence boilerplate, or filler.

Return ONLY a JSON object with these keys:
  "coveringLetter"          — letter to the institution, formal, under 200 words
  "heirshipAffidavitBody"   — numbered deponent paragraphs for the affidavit
  "familyGuidance"          — plain-language next steps for the family
  "flags"                   — array of strings; anything missing or unclear`;

function buildUserPrompt(
  payload: RedactedCase,
  shares: ShareResult,
  requirements: RequirementResult[],
  heirTokenById: Map<string, string>,
): string {
  const shareLines = shares.shares
    .map((s) => {
      // Emit the heir's TOKEN, not the raw database id. Two reasons: the id is
      // a real UUID that has no business reaching a third-party model, and the
      // share list is claimants-only in a re-ordered sequence, so a positional
      // "ids correspond to tokens in order" instruction was simply false and
      // let the model attribute a share to the wrong person.
      const who = heirTokenById.get(s.heirId) ?? s.heirId;
      return `  - ${who}: ${fractionToString(s.share)} (${s.basis})`;
    })
    .join('\n');

  const docLines = requirements
    .flatMap((r) =>
      r.requirements.map(
        (d) => `  - [${r.assetId}] ${d.label}${d.mandatory ? ' (mandatory)' : ' (recommended)'}`,
      ),
    )
    .join('\n');

  return `CASE: ${payload.caseRef}
Deceased: ${payload.deceased.token}
Date of death: ${payload.deceased.dateOfDeath ?? 'not recorded'}
Succession regime: ${payload.regime}
Will: ${payload.hasWill ? 'yes' : 'no'}

HEIRS
${payload.heirs.map((h) => `  - ${h.token}: ${h.relationship}${h.isMinor ? ' (minor)' : ''}`).join('\n')}

ASSETS
${payload.assets.map((a) =>
  `  - ${a.token}: ${a.kind} held with ${a.institutionToken}` +
  `${a.accountToken ? `, reference ${a.accountToken}` : ''}` +
  `, value band ${a.valueBand}, nomination ${a.hasNomination === null ? 'unknown' : a.hasNomination}`,
).join('\n')}

SHARES ALREADY DETERMINED (do not alter)
${shareLines || '  (none — this case is held for advocate computation)'}

STATUTORY BASIS
${shares.authorities.map((a) => `  - ${a}`).join('\n') || '  (none)'}

DOCUMENTS ALREADY SELECTED (do not add or remove)
${docLines || '  (none)'}

Every person is referred to only by their token (for example {{HEIR_1}}). The
share list above already uses those tokens. Use the tokens exactly as written.`;
}

export async function generatePack(input: GenerationInput): Promise<GenerationResult> {
  const holdReasons: string[] = [];

  // --- 1. Deterministic computation, before any model involvement ----------
  const successionHeirs: SuccessionHeir[] = input.heirs.map((h) => ({
    id: h.id,
    relationship: h.relationship as SuccessionHeir['relationship'],
    isClaimant: h.isClaimant,
  }));

  const shares = computeShares(input.regime, successionHeirs, {
    deceasedWasFemale: input.deceasedWasFemale,
  });

  if (shares.requiresAdvocate) {
    holdReasons.push(shares.advocateReason ?? 'Shares could not be computed automatically.');
  }

  const requirements = input.assets.map((a) =>
    requirementsFor({
      id: a.id, kind: a.kind, valueBand: a.valueBand, hasNomination: a.hasNomination,
    }),
  );

  for (const r of requirements) holdReasons.push(...r.notes.filter(isBlockingNote));
  if (blocksAutoGeneration(requirements)) {
    holdReasons.push('One or more asset rule sets are stale or unsupported.');
  }

  const manifest = buildManifest(requirements);

  // If the legal core is unresolved there is nothing safe for the model to
  // write up, so we stop before spending a call.
  if (shares.requiresAdvocate) {
    return {
      status: 'held', holdReasons, shares, requirements, manifest,
      narrative: null, unresolvedTokens: [],
    };
  }

  // --- 2. Redact -----------------------------------------------------------
  const { payload, map } = redactCase(input);

  // redactCase assigns heir tokens in input order, so input.heirs[i] and
  // payload.heirs[i] line up. This lets the share lines reference each heir by
  // token instead of by the raw database id.
  const heirTokenById = new Map(
    input.heirs.map((h, i) => [h.id, payload.heirs[i]!.token]),
  );

  // --- 3. Ask the model, for prose only ------------------------------------
  let narrative: Narrative | null = null;
  let unresolvedTokens: string[] = [];

  try {
    const raw = await completeJson<Narrative>({
      context: 'pack.narrative',
      temperature: 0.2,
      maxTokens: 2500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(payload, shares, requirements, heirTokenById) },
      ],
    });

    // --- 4. Rehydrate ------------------------------------------------------
    const restored = restoreNarrative(raw, map);
    narrative = restored.narrative;
    unresolvedTokens = restored.unresolved;

    if (unresolvedTokens.length > 0) {
      holdReasons.push(
        `The model produced ${unresolvedTokens.length} placeholder(s) that do not ` +
        `correspond to anyone in this case: ${unresolvedTokens.join(', ')}. ` +
        'Regenerate or correct before release.',
      );
    }
  } catch (e) {
    const detail = e instanceof AiError ? e.message : 'Unexpected failure during generation.';
    holdReasons.push(`Narrative generation failed: ${detail}`);
  }

  // --- 5. Gate -------------------------------------------------------------
  return {
    status: holdReasons.length === 0 ? 'ready_for_review' : 'held',
    holdReasons,
    shares,
    requirements,
    manifest,
    narrative,
    unresolvedTokens,
  };
}

function restoreNarrative(
  raw: Narrative,
  map: TokenMap,
): { narrative: Narrative; unresolved: string[] } {
  const unresolved = new Set<string>();

  const fix = (s: string): string => {
    const r = rehydrate(s ?? '', map);
    r.unresolved.forEach((t) => unresolved.add(t));
    return r.text;
  };

  return {
    narrative: {
      coveringLetter: fix(raw.coveringLetter),
      heirshipAffidavitBody: fix(raw.heirshipAffidavitBody),
      familyGuidance: fix(raw.familyGuidance),
      flags: (raw.flags ?? []).map(fix),
    },
    unresolved: [...unresolved],
  };
}

/**
 * Requirement notes are a mix of advisory ("nomination assumed absent") and
 * blocking ("rule set past its review date"). Only the latter should hold a
 * pack; the rest are context for the reviewer.
 */
function isBlockingNote(note: string): boolean {
  return note.includes('review date') || note.includes('held for manual preparation');
}
