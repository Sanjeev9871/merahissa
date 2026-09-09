import { createHmac, timingSafeEqual } from 'node:crypto';
import { deployEnv, type DeployEnv } from './site.ts';

/**
 * Razorpay integration.
 *
 * The security-critical part of this file is signature verification, and the
 * critical part of THAT is that it never trusts the browser. The client tells
 * us a payment succeeded; only a signature computed with our secret proves it.
 *
 * Two separate signature schemes, easily confused:
 *   - Checkout callback: HMAC over `${order_id}|${payment_id}` with KEY_SECRET
 *   - Webhook:           HMAC over the raw request body with WEBHOOK_SECRET
 *
 * The webhook is the authoritative one. The callback is a UX convenience — it
 * tells us to show a success screen. Only the webhook flips a case to paid,
 * because a user can close the browser before the callback fires and an
 * attacker can call the callback endpoint without paying anything.
 */

export type Tier = 'single' | 'standard' | 'complex';

export interface TierSpec {
  id: Tier;
  label: string;
  amountPaise: number;
  blurb: string;
  /** Upper bound on assets this tier covers; used to suggest a tier. */
  maxAssets: number;
}

/**
 * Fixed fees, not success fees.
 *
 * A percentage of recovered value looks attractive and is legal for a
 * non-advocate, but it invites exactly the regulatory attention that follows
 * unclaimed-asset "recovery agents", and RBI/SEBI messaging actively warns
 * families away from agents. Fixed pricing is cleaner to advertise, easier to
 * quote up front, and keeps us plainly on the document-preparation side.
 */
export const TIERS: readonly TierSpec[] = [
  {
    id: 'single',
    label: 'Single institution',
    amountPaise: 499_900,          // ₹4,999
    maxAssets: 1,
    blurb: 'One bank, fund or policy. Forms, affidavit and filing checklist.',
  },
  {
    id: 'standard',
    label: 'Multiple assets',
    amountPaise: 1_499_900,        // ₹14,999
    maxAssets: 8,
    blurb: 'Up to eight holdings across banks, demat, mutual funds and insurance.',
  },
  {
    id: 'complex',
    label: 'Complex estate',
    amountPaise: 2_499_900,        // ₹24,999
    maxAssets: 50,
    blurb: 'Larger estates, IEPF share recovery, and cases needing an advocate referral.',
  },
] as const;

export function tierFor(assetCount: number, needsAdvocate: boolean): TierSpec {
  if (needsAdvocate) return TIERS[2]!;
  return TIERS.find((t) => assetCount <= t.maxAssets) ?? TIERS[2]!;
}

export function formatRupees(paise: number): string {
  // Indian digit grouping: ₹14,999 not ₹14999, ₹1,24,999 not ₹124,999.
  const rupees = Math.round(paise / 100);
  const s = String(rupees);
  if (s.length <= 3) return `₹${s}`;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${rest},${last3}`;
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

/**
 * Constant-time comparison of two hex digests.
 *
 * `a === b` on a signature leaks timing information: it returns early at the
 * first differing byte, which over many requests lets an attacker recover a
 * valid signature byte by byte. timingSafeEqual does not short-circuit.
 *
 * Length is compared first and separately because timingSafeEqual throws on
 * mismatched lengths — that comparison is not itself secret, since the digest
 * length is fixed and public.
 */
function safeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    // Non-hex input reaches here; treat as a failed comparison, never as ok.
    return false;
  }
}

/** Checkout callback signature: HMAC-SHA256(`order_id|payment_id`, KEY_SECRET). */
export function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}): boolean {
  const secret = params.secret ?? process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET is not set');

  const expected = createHmac('sha256', secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');

  return safeEqualHex(expected, params.signature);
}

/**
 * Webhook signature: HMAC-SHA256(raw body, WEBHOOK_SECRET).
 *
 * MUST be given the exact bytes received. Verifying against a re-serialised
 * object (JSON.parse then JSON.stringify) will fail intermittently and
 * mysteriously, because key order and whitespace are not preserved.
 */
export function verifyWebhookSignature(params: {
  rawBody: string;
  signature: string;
  secret?: string;
}): boolean {
  const secret = params.secret ?? process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET is not set');

  const expected = createHmac('sha256', secret).update(params.rawBody).digest('hex');
  return safeEqualHex(expected, params.signature);
}

// ---------------------------------------------------------------------------
// Test mode vs live mode
//
// Staging runs Razorpay test mode; production runs live mode. Getting this
// wrong is expensive in both directions and silent in both directions:
//
//   - live keys on staging  -> a routine test charges someone's real card
//   - test keys on production -> customers see a successful payment and we are
//     never actually paid, and nothing looks broken until the money is counted
//
// Neither shows up as an error on its own, so the mode is derived from the key
// and checked against the deployment before any order is created. A mismatch
// throws; the order route already turns a throw here into a 502 and a "please
// try again" message, which is the correct outcome — refusing to transact is
// always safer than transacting in the wrong mode.
// ---------------------------------------------------------------------------

export type PaymentMode = 'test' | 'live';

/** Razorpay key ids carry their own mode, which is what makes this checkable. */
export function paymentModeFromKeyId(keyId: string): PaymentMode | null {
  if (keyId.startsWith('rzp_test_')) return 'test';
  if (keyId.startsWith('rzp_live_')) return 'live';
  return null;
}

/** Only the real production site may charge real cards. */
export function expectedPaymentMode(env: DeployEnv): PaymentMode {
  return env === 'production' ? 'live' : 'test';
}

/**
 * Fails closed. Throws unless the configured key's mode is the one this
 * deployment is allowed to use.
 */
export function assertPaymentModeMatchesDeployment(keyId: string): void {
  const env = deployEnv();
  const expected = expectedPaymentMode(env);
  const actual = paymentModeFromKeyId(keyId);

  if (actual === null) {
    throw new Error(
      'Razorpay key id is neither a test nor a live key; refusing to create an order',
    );
  }

  if (actual !== expected) {
    // The key id is a publishable value (it is sent to the browser to open
    // checkout), so naming it here does not leak a secret, and knowing which
    // key is loaded is the whole point of the message.
    throw new Error(
      `Razorpay ${actual} key is configured on the "${env}" deployment, which must use `
      + `${expected} mode. Refusing to create an order. Check NEXT_PUBLIC_RAZORPAY_KEY_ID `
      + `and RAZORPAY_KEY_SECRET for this environment.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Order creation
// ---------------------------------------------------------------------------

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Creates an order server-side. The amount is derived from our own tier table,
 * never from anything the browser sent — otherwise a user could post
 * `amount: 100` and buy a complex estate pack for a rupee.
 */
export async function createOrder(opts: {
  tier: Tier;
  caseId: string;
}): Promise<RazorpayOrder> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay keys are not configured');

  // Before anything reaches Razorpay: is this deployment allowed to use this
  // key's mode at all? Staging must be test, production must be live.
  assertPaymentModeMatchesDeployment(keyId);

  const spec = TIERS.find((t) => t.id === opts.tier);
  if (!spec) throw new Error(`Unknown tier "${opts.tier}"`);

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: spec.amountPaise,
      currency: 'INR',
      // Receipt is visible in the Razorpay dashboard, so it carries an opaque
      // case reference rather than anything identifying.
      receipt: `case_${opts.caseId.slice(0, 8)}`,
      notes: { tier: opts.tier },
    }),
  });

  if (!res.ok) {
    throw new Error(`Razorpay order creation failed with ${res.status}`);
  }

  return (await res.json()) as RazorpayOrder;
}

/**
 * Which webhook events we act on. Anything else is acknowledged with 200 and
 * ignored — returning an error to Razorpay for events we simply don't care
 * about causes pointless retries.
 */
export const HANDLED_WEBHOOK_EVENTS = ['payment.captured', 'payment.failed'] as const;
export type HandledEvent = (typeof HANDLED_WEBHOOK_EVENTS)[number];

export function isHandledEvent(event: string): event is HandledEvent {
  return (HANDLED_WEBHOOK_EVENTS as readonly string[]).includes(event);
}
