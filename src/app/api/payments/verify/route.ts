import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCheckoutSignature } from '@/lib/payments';
import { supabaseServer, supabaseAdmin, currentUser } from '@/lib/supabase/server';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/**
 * Verifies the Razorpay checkout callback signature.
 *
 * WHY THIS EXISTS ALONGSIDE THE WEBHOOK. The webhook remains the authoritative
 * record: a browser can be closed the instant after paying, so a flow that
 * relies only on the client callback loses payments. But waiting for the
 * webhook leaves a family who has just paid staring at a page that still says
 * "not paid", which reads as money vanishing. So this endpoint confirms the
 * payment immediately and the webhook confirms it independently; both write
 * the same row and either may arrive first.
 *
 * WHY TRUSTING THIS SIGNATURE IS SAFE. The signature is
 * HMAC-SHA256(`order_id|payment_id`) keyed with RAZORPAY_KEY_SECRET, which only
 * Razorpay and this server hold. A client cannot forge one for an order it did
 * not actually pay. It is checked with a timing-safe comparison.
 *
 * WHAT IT STILL DOES NOT TRUST. The signature covers the order and payment ids
 * and nothing else — notably not the amount. So the amount is never taken from
 * this request; the row was written at order time from our own tier table, and
 * the webhook independently reconciles Razorpay's figure against it.
 */
export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const limit = await rateLimit('payment', user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a moment.' },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    // Missing or malformed fields — never treat this as a payment.
    return NextResponse.json(
      { error: 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required.' },
      { status: 400 },
    );
  }

  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = parsed.data;

  // The order must belong to a case this user owns. Read through the user's
  // own client so row-level security does the ownership check for us, rather
  // than trusting an id the browser supplied.
  const supabase = await supabaseServer();
  const { data: rows, error: lookupError } = await supabase
    .from('payments')
    .select('id, case_id, status, amount_paise')
    .eq('razorpay_order_id', orderId)
    .limit(1);

  if (lookupError) {
    console.error('[pay-verify] lookup failed', lookupError);
    return NextResponse.json(
      { error: 'We could not confirm your payment just now. Please try again in a moment.' },
      { status: 503 },
    );
  }

  const payment = rows?.[0];
  if (!payment) {
    // Either no such order, or it is not this user's. Same answer for both.
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  let valid = false;
  try {
    valid = verifyCheckoutSignature({ orderId, paymentId, signature });
  } catch (e) {
    // Thrown only when RAZORPAY_KEY_SECRET is unset, which is a deployment
    // fault, not a bad request.
    console.error('[pay-verify] cannot verify signature', e);
    return NextResponse.json(
      { error: 'Payment verification is not configured.' },
      { status: 500 },
    );
  }

  if (!valid) {
    await audit('payment.verified', {
      actorId: user.id,
      caseId: payment.case_id as string,
      detail: { outcome: 'signature_mismatch' },
    });

    // Explicitly NOT marked paid.
    return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
  }

  // Idempotent: the webhook may already have recorded this. Writing the same
  // values again is harmless, and whichever arrives first wins.
  const db = supabaseAdmin();
  const { error: updateError } = await db
    .from('payments')
    .update({
      razorpay_payment_id: paymentId,
      status: 'captured',
      verified_at: new Date().toISOString(),
    } as never)
    .eq('id', payment.id);

  if (updateError) {
    console.error('[pay-verify] could not record payment', updateError);
    return NextResponse.json(
      { error: 'We verified your payment but could not record it. We have been notified.' },
      { status: 500 },
    );
  }

  // Move the case forward only from the pre-payment states, so a verify that
  // arrives late never drags a case back out of review.
  await db
    .from('cases')
    .update({ status: 'paid' } as never)
    .eq('id', payment.case_id)
    .in('status', ['intake_complete', 'awaiting_payment']);

  await audit('payment.verified', {
    actorId: user.id,
    caseId: payment.case_id as string,
    detail: { outcome: 'captured', source: 'checkout_callback' },
  });

  return NextResponse.json(
    { verified: true, caseId: payment.case_id },
    { headers: rateLimitHeaders(limit) },
  );
}
