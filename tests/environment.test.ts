import { describe, it, beforeEach, afterEach } from 'node:test';
import { expect } from './expect.ts';
import {
  paymentModeFromKeyId,
  expectedPaymentMode,
} from '../src/lib/payments.ts';

/**
 * Staging and production run identical code against different Razorpay
 * accounts. The whole separation rests on one question — which deployment is
 * this — so these tests pin the two rules that answer it and the two that act
 * on the answer.
 *
 * deployEnv() itself reads process.env at module load, so it cannot be
 * re-evaluated per test here. What is tested instead is the pure decision
 * logic, plus the source-level guarantees that the decision is actually
 * consulted at the points that matter. The invariants suite proves the wiring;
 * this proves the rules.
 */

describe('razorpay key ids carry their mode', () => {
  it('recognises a test key', () => {
    expect(paymentModeFromKeyId('rzp_test_TXWojbAvPK4ohb')).toBe('test');
  });

  it('recognises a live key', () => {
    expect(paymentModeFromKeyId('rzp_live_ABC123')).toBe('live');
  });

  it('refuses to guess at anything else', () => {
    // Returning null (rather than defaulting to "test") is what makes the
    // assertion fail closed on a malformed or truncated key.
    expect(paymentModeFromKeyId('rzp_ABC123')).toBe(null);
    expect(paymentModeFromKeyId('')).toBe(null);
    expect(paymentModeFromKeyId('sk_live_stripe_shaped')).toBe(null);
    // Prefix only counts at the start; a live key id may not be smuggled in.
    expect(paymentModeFromKeyId('x_rzp_live_ABC')).toBe(null);
  });
});

describe('only production may charge real cards', () => {
  it('requires live mode on production', () => {
    expect(expectedPaymentMode('production')).toBe('live');
  });

  it('requires test mode on staging', () => {
    expect(expectedPaymentMode('staging')).toBe('test');
  });

  it('requires test mode in local development', () => {
    expect(expectedPaymentMode('development')).toBe('test');
  });
});
