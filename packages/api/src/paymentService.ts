import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order } from '@rpral/types';
import { updateOrderStatus } from './orderService';

export interface CreateCheckoutSessionInput {
  order:          Order;
  customerEmail:  string;
  successUrl:     string;
  cancelUrl:      string;
}

export interface CheckoutSessionResult {
  sessionId:  string;
  sessionUrl: string;
}

/** Create a Stripe Checkout session for a pending order. */
export async function createCheckoutSession(
  stripe: Stripe,
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSessionResult> {
  const session = await stripe.checkout.sessions.create({
    mode:               'payment',
    customer_email:     input.customerEmail,
    success_url:        input.successUrl,
    cancel_url:         input.cancelUrl,
    client_reference_id: input.order.id,
    payment_intent_data: {
      metadata: { orderId: input.order.id },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency:     'usd',
          unit_amount:  input.order.totalCents,
          product_data: { name: `EMPREP Order #${input.order.id.slice(0, 8)}` },
        },
      },
    ],
  });

  if (!session.url) throw new Error('Stripe did not return a session URL');
  return { sessionId: session.id, sessionUrl: session.url };
}

/** Handle a Stripe webhook event. Returns the updated order if handled. */
export async function handleStripeWebhook(
  stripe: Stripe,
  client: SupabaseClient,
  rawBody: string,
  signature: string,
  webhookSecret: string,
): Promise<Order | null> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw new Error('Invalid Stripe webhook signature');
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderId = pi.metadata['orderId'];
    if (!orderId) return null;
    return updateOrderStatus(client, orderId, 'confirmed', pi.id);
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderId = pi.metadata['orderId'];
    if (!orderId) return null;
    return updateOrderStatus(client, orderId, 'cancelled', pi.id);
  }

  return null;
}
