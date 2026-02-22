import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient, createStripeClient, handleStripeWebhook } from '@rpral/api';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    const rawBody = await request.text();
    const stripe  = createStripeClient();
    const client  = createServerSupabaseClient();

    await handleStripeWebhook(stripe, client, rawBody, signature, webhookSecret);

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
