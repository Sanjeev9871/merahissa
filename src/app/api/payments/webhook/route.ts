import { NextResponse, type NextRequest } from 'next/server';
import {
  verifyWebhookSignature,
  isHandledEvent,
} from '@/lib/payments';
import { supabaseAdmin } from '@/lib/supabase/server';
import { audit } from '@/lib/audit';

type PaymentRecord = {
  id: string;
  case_id: string;
  amount_paise: number;
  status: string;
};

/**
 * Razorpay webhook. This is the ONLY thing that marks a case paid.
 *
 * The browser's success callback is a UX signal, nothing more. A user can
 * close the tab before it fires, and an attacker can call our success
 * endpoint without paying anything. Money moves only when Razorpay tells us
 * so, over a signature we verify with a secret only we and they hold.
 *
 * Three rules enforced below:
 *   - verify against the RAW body, before parsing
 *   - trust the amount Razorpay reports, not anything the client sent
 *   - be idempotent, because webhooks are retried and can arrive twice
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const signature = request.headers.get(
    'x-razorpay-signature',
  );

  if (!signature) {
    return NextResponse.json(
      { error: 'missing signature' },
      { status: 400 },
    );
  }

  // MUST read the raw text. Parsing first and re-serialising changes the
  // bytes and the signature will never match.
  const rawBody = await request.text();

  let valid: boolean;

  try {
    valid = verifyWebhookSignature({
      rawBody,
      signature,
    });
  } catch {
    // Secret not configured. Fail closed and shout — this is a deploy error.
    console.error(
      '[webhook] RAZORPAY_WEBHOOK_SECRET is not configured',
    );

    return NextResponse.json(
      { error: 'not configured' },
      { status: 500 },
    );
  }

  if (!valid) {
    // Deliberately terse. A verbose error helps someone probing the endpoint.
    await audit('payment.verified', {
      detail: {
        outcome: 'signature_rejected',
      },
    });

    return NextResponse.json(
      { error: 'invalid signature' },
      { status: 400 },
    );
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          amount?: number;
        };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: 'malformed body' },
      { status: 400 },
    );
  }

  // Acknowledge events we do not act on. Returning an error would make
  // Razorpay retry an event we are never going to handle.
  if (
    !event.event ||
    !isHandledEvent(event.event)
  ) {
    return NextResponse.json({
      received: true,
      handled: false,
    });
  }

  const entity = event.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const paymentId = entity?.id;

  if (!orderId || !paymentId) {
    return NextResponse.json(
      { error: 'incomplete payload' },
      { status: 400 },
    );
  }

  const db = supabaseAdmin();

  // Look the order up by the id WE created. The webhook cannot introduce a
  // payment for a case that never had an order.
  const { data: payment } = await db
    .from('payments')
    .select(
      'id, case_id, amount_paise, status',
    )
    .eq('razorpay_order_id', orderId)
    .single() as {
      data: PaymentRecord | null;
    };

  if (!payment) {
    // Unknown order: acknowledge so Razorpay stops retrying, but record it.
    await audit('payment.verified', {
      detail: {
        outcome: 'unknown_order',
      },
    });

    return NextResponse.json({
      received: true,
      handled: false,
    });
  }

  // Idempotency. Retries are normal; double-crediting a case is not.
  if (payment.status === 'captured') {
    return NextResponse.json({
      received: true,
      handled: true,
      idempotent: true,
    });
  }

  if (event.event === 'payment.failed') {
    await db
      .from('payments')
      .update({
        status: 'failed',
      } as never)
      .eq('id', payment.id);

    await audit('payment.verified', {
      caseId: payment.case_id,
      detail: {
        outcome: 'failed',
      },
    });

    return NextResponse.json({
      received: true,
      handled: true,
    });
  }

  // Amount check. Razorpay's figure is authoritative; ours is what we asked
  // for. A mismatch means something is wrong and must not silently pass.
  if (
    typeof entity?.amount === 'number' &&
    entity.amount !== payment.amount_paise
  ) {
    await audit('payment.verified', {
      caseId: payment.case_id,
      detail: {
        outcome: 'amount_mismatch',
        expected: payment.amount_paise,
        got: entity.amount,
      },
    });

    return NextResponse.json(
      {
        received: true,
        handled: false,
      },
      { status: 202 },
    );
  }

  await db
    .from('payments')
    .update({
      status: 'captured',
      razorpay_payment_id: paymentId,
      verified_at: new Date().toISOString(),
    } as never)
    .eq('id', payment.id);

  await db
    .from('cases')
    .update({
      status: 'paid',
    } as never)
    .eq('id', payment.case_id);

  await audit('payment.verified', {
    caseId: payment.case_id,
    detail: {
      outcome: 'captured',
      amount: payment.amount_paise,
    },
  });

  return NextResponse.json({
    received: true,
    handled: true,
  });
}