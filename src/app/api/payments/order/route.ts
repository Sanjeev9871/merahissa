import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createOrder,
  tierFor,
  TIERS,
} from '@/lib/payments';
import {
  supabaseServer,
  supabaseAdmin,
  currentUser,
} from '@/lib/supabase/server';
import {
  rateLimit,
  rateLimitHeaders,
} from '@/lib/ratelimit';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  caseId: z.string().uuid(),
});

type PaymentInsert = {
  case_id: string;
  razorpay_order_id: string;
  amount_paise: number;
  tier: string;
  status: string;
};

/**
 * Creates a Razorpay order.
 *
 * Note what this endpoint does NOT accept: an amount, or a tier. Both are
 * derived server-side from the case's own asset count and advocate flag. If
 * the client could name its price, it would.
 */
export async function POST(request: NextRequest) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'unauthorised' },
      { status: 401 },
    );
  }

  const limit = await rateLimit('payment', user.id);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many attempts. Please try again shortly.',
      },
      {
        status: 429,
        headers: rateLimitHeaders(limit),
      },
    );
  }

  const parsed = bodySchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'bad request' },
      { status: 400 },
    );
  }

  // Read through the USER's client, so row-level security proves ownership.
  // Using the admin client here would let anyone pay for anyone's case, which
  // sounds harmless until you realise it also reveals the case exists.
  const supabase = await supabaseServer();

  const { data: kase } = await supabase
    .from('cases')
    .select('id, status, advocate_referral_needed')
    .eq('id', parsed.data.caseId)
    .single();

  if (!kase) {
    return NextResponse.json(
      { error: 'not found' },
      { status: 404 },
    );
  }

  if (
    kase.status === 'paid' ||
    kase.status === 'delivered'
  ) {
    return NextResponse.json(
      {
        error: 'This case has already been paid for.',
      },
      { status: 409 },
    );
  }

  const { count } = await supabase
    .from('assets')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('case_id', kase.id);

  const spec = tierFor(
    count ?? 1,
    Boolean(kase.advocate_referral_needed),
  );

  let order;

  try {
    order = await createOrder({
      tier: spec.id,
      caseId: kase.id as string,
    });
  } catch (e) {
    console.error(
      '[payments] order creation failed',
      e,
    );

    return NextResponse.json(
      {
        error:
          'We could not start the payment. Please try again in a moment.',
      },
      { status: 502 },
    );
  }

  // Recorded with the service role: the payments table is deliberately
  // read-only to its owner, so a user cannot mark their own case paid.
  const payment: PaymentInsert = {
    case_id: kase.id as string,
    razorpay_order_id: order.id,
    amount_paise: spec.amountPaise,
    tier: spec.id,
    status: 'created',
  };

  await supabaseAdmin()
    .from('payments')
    .insert(payment as never);

  // Ownership was already proven by the user-client read above; the status
  // transition itself goes through the service role because the family has no
  // UPDATE privilege on public.cases (migration 0003).
  await supabaseAdmin()
    .from('cases')
    .update({ status: 'awaiting_payment' } as never)
    .eq('id', kase.id);

  await audit('payment.verified', {
    actorId: user.id,
    caseId: kase.id as string,
    detail: {
      outcome: 'order_created',
      tier: spec.id,
      amount: spec.amountPaise,
    },
  });

  return NextResponse.json(
    {
      orderId: order.id,
      amountPaise: spec.amountPaise,
      tier: spec.id,
      tierLabel: spec.label,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      tiers: TIERS,
    },
    {
      headers: rateLimitHeaders(limit),
    },
  );
}