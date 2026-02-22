import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '../../../lib/supabase-server';
import {
  getCustomerProfile,
  getItem,
  createOrder,
  createCheckoutSession,
  createStripeClient,
} from '@rpral/api';
import type { ShippingAddress } from '@rpral/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await getCustomerProfile(supabase, user.id);
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const body = await request.json() as {
      items: Array<{ supplyItemId: string; quantity: number }>;
      shippingAddress?: ShippingAddress;
    };

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    // Fetch current prices
    const itemPrices = new Map<string, number>();
    await Promise.all(
      body.items.map(async (line) => {
        const item = await getItem(supabase, line.supplyItemId);
        if (item) itemPrices.set(item.id, item.priceCents);
      }),
    );

    const order = await createOrder(supabase, {
      customerId: profile.id,
      items:      body.items,
      ...(body.shippingAddress ? { shippingAddress: body.shippingAddress } : {}),
    }, itemPrices);

    const stripe = createStripeClient();
    const origin = request.nextUrl.origin;

    const session = await createCheckoutSession(stripe, {
      order,
      customerEmail: profile.email,
      successUrl:    `${origin}/portal/orders/${order.id}?success=1`,
      cancelUrl:     `${origin}/portal/cart`,
    });

    return NextResponse.json({ sessionUrl: session.sessionUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
