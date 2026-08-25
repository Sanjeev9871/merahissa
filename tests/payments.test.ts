import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import { createHmac } from 'node:crypto';
import {
  TIERS, tierFor, formatRupees,
  verifyCheckoutSignature, verifyWebhookSignature, isHandledEvent,
} from '../src/lib/payments.ts';

const SECRET = 'test_secret_do_not_use_in_production';

const checkoutSig = (orderId: string, paymentId: string, secret = SECRET) =>
  createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

const webhookSig = (body: string, secret = SECRET) =>
  createHmac('sha256', secret).update(body).digest('hex');

describe('pricing', () => {
  it('suggests the cheapest tier that covers the asset count', () => {
    expect(tierFor(1, false).id).toBe('single');
    expect(tierFor(2, false).id).toBe('standard');
    expect(tierFor(8, false).id).toBe('standard');
    expect(tierFor(9, false).id).toBe('complex');
  });

  it('always uses the complex tier when an advocate referral is needed', () => {
    // These cases cost us real advocate time regardless of how few assets there are.
    expect(tierFor(1, true).id).toBe('complex');
  });

  it('falls back to the top tier rather than failing on an absurd asset count', () => {
    expect(tierFor(10_000, false).id).toBe('complex');
  });

  it('formats amounts with Indian digit grouping', () => {
    expect(formatRupees(499_900)).toBe('₹4,999');
    expect(formatRupees(1_499_900)).toBe('₹14,999');
    expect(formatRupees(2_499_900)).toBe('₹24,999');
    expect(formatRupees(12_499_900)).toBe('₹1,24,999');   // lakh grouping, not thousands
    expect(formatRupees(50_000)).toBe('₹500');
  });

  it('keeps every tier amount a whole number of rupees', () => {
    for (const t of TIERS) expect(t.amountPaise % 100).toBe(0);
  });

  it('orders tiers by ascending price and capacity', () => {
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i]!.amountPaise > TIERS[i - 1]!.amountPaise).toBe(true);
      expect(TIERS[i]!.maxAssets > TIERS[i - 1]!.maxAssets).toBe(true);
    }
  });
});

describe('checkout callback signature', () => {
  it('accepts a correctly signed callback', () => {
    const ok = verifyCheckoutSignature({
      orderId: 'order_ABC123', paymentId: 'pay_XYZ789',
      signature: checkoutSig('order_ABC123', 'pay_XYZ789'), secret: SECRET,
    });
    expect(ok).toBe(true);
  });

  it('rejects a signature computed with a different secret', () => {
    const ok = verifyCheckoutSignature({
      orderId: 'order_ABC123', paymentId: 'pay_XYZ789',
      signature: checkoutSig('order_ABC123', 'pay_XYZ789', 'wrong_secret'), secret: SECRET,
    });
    expect(ok).toBe(false);
  });

  it('rejects when the order id has been swapped after signing', () => {
    // The attack this prevents: pay for a cheap case, then replay the payment
    // against an expensive one by editing the order id.
    const ok = verifyCheckoutSignature({
      orderId: 'order_DIFFERENT', paymentId: 'pay_XYZ789',
      signature: checkoutSig('order_ABC123', 'pay_XYZ789'), secret: SECRET,
    });
    expect(ok).toBe(false);
  });

  it('rejects when the payment id has been swapped after signing', () => {
    const ok = verifyCheckoutSignature({
      orderId: 'order_ABC123', paymentId: 'pay_DIFFERENT',
      signature: checkoutSig('order_ABC123', 'pay_XYZ789'), secret: SECRET,
    });
    expect(ok).toBe(false);
  });

  it('rejects an empty signature', () => {
    expect(verifyCheckoutSignature({
      orderId: 'order_ABC123', paymentId: 'pay_XYZ789', signature: '', secret: SECRET,
    })).toBe(false);
  });

  it('rejects a non-hex signature without throwing', () => {
    // Buffer.from(x, 'hex') silently truncates on invalid input, which could
    // otherwise turn a garbage signature into an accidental match.
    expect(verifyCheckoutSignature({
      orderId: 'order_ABC123', paymentId: 'pay_XYZ789',
      signature: 'not-hex-at-all-!!!', secret: SECRET,
    })).toBe(false);
  });

  it('rejects a truncated but otherwise valid signature', () => {
    const full = checkoutSig('order_ABC123', 'pay_XYZ789');
    expect(verifyCheckoutSignature({
      orderId: 'order_ABC123', paymentId: 'pay_XYZ789',
      signature: full.slice(0, 32), secret: SECRET,
    })).toBe(false);
  });
});

describe('webhook signature', () => {
  const body = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_XYZ789', order_id: 'order_ABC123' } } },
  });

  it('accepts a correctly signed body', () => {
    expect(verifyWebhookSignature({
      rawBody: body, signature: webhookSig(body), secret: SECRET,
    })).toBe(true);
  });

  it('rejects when a single byte of the body changed', () => {
    const tampered = body.replace('pay_XYZ789', 'pay_XYZ780');
    expect(verifyWebhookSignature({
      rawBody: tampered, signature: webhookSig(body), secret: SECRET,
    })).toBe(false);
  });

  it('rejects an unsigned request', () => {
    expect(verifyWebhookSignature({ rawBody: body, signature: '', secret: SECRET })).toBe(false);
  });

  it('is sensitive to re-serialisation, proving we must use the raw body', () => {
    // Documents the failure mode: parsing and re-stringifying changes the
    // bytes, so verification must run against exactly what arrived.
    const reserialised = JSON.stringify(JSON.parse(body.replace(/"event"/, '"evt"')));
    expect(verifyWebhookSignature({
      rawBody: reserialised, signature: webhookSig(body), secret: SECRET,
    })).toBe(false);
  });
});

describe('webhook event filtering', () => {
  it('handles capture and failure', () => {
    expect(isHandledEvent('payment.captured')).toBe(true);
    expect(isHandledEvent('payment.failed')).toBe(true);
  });

  it('ignores everything else, so Razorpay is not made to retry', () => {
    for (const e of ['order.paid', 'refund.created', 'subscription.charged', 'nonsense']) {
      expect(isHandledEvent(e)).toBe(false);
    }
  });
});
