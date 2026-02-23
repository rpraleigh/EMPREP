import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase-server';
import {
  getItem,
  getKitWithContents,
  getCustomerProfile,
  createOrder,
  createCheckoutSession,
  createStripeClient,
} from '@rpral/api';
import Link from 'next/link';

export default async function CatalogItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const supabase   = await createClient();

  const baseItem = await getItem(supabase, itemId);
  if (!baseItem || !baseItem.isActive) notFound();

  const item = baseItem.isKit
    ? (await getKitWithContents(supabase, itemId)) ?? baseItem
    : baseItem;

  async function checkout(formData: FormData) {
    'use server';
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) redirect('/login');

    const profile = await getCustomerProfile(sb, user.id);
    if (!profile) redirect('/portal/account');

    const qty  = Math.max(1, Number(formData.get('quantity') ?? 1));
    const base = await getItem(sb, itemId);
    if (!base) redirect('/portal/catalog');

    const itemPrices = new Map([[base.id, base.priceCents]]);
    const order = await createOrder(
      sb,
      { customerId: profile.id, items: [{ supplyItemId: base.id, quantity: qty }] },
      itemPrices,
    );

    const h      = await headers();
    const host   = h.get('host') ?? 'localhost:3000';
    const proto  = h.get('x-forwarded-proto') ?? 'http';
    const origin = `${proto}://${host}`;

    const stripe  = createStripeClient();
    const session = await createCheckoutSession(stripe, {
      order,
      customerEmail: profile.email,
      successUrl: `${origin}/portal/orders/${order.id}?success=1`,
      cancelUrl:  `${origin}/portal/catalog/${itemId}`,
    });

    redirect(session.sessionUrl);
  }

  const price   = `$${(item.priceCents / 100).toFixed(2)}`;
  const hasKit  = item.isKit && 'contents' in item && Array.isArray(item.contents) && (item.contents as unknown[]).length > 0;

  return (
    <div className="max-w-2xl">
      <Link href="/portal/catalog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Catalog
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
          {item.isKit && (
            <span className="mt-1 shrink-0 text-xs bg-blue-100 text-blue-700 font-medium px-2.5 py-1 rounded-full">
              Kit
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900 shrink-0">{price}</p>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-gray-600 text-sm leading-relaxed mb-6">{item.description}</p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 mb-8">
        {item.sku            && <span>SKU: {item.sku}</span>}
        {item.unit           && <span>Unit: {item.unit}</span>}
        {item.shelfLifeMonths && <span>{item.shelfLifeMonths}-month shelf life</span>}
      </div>

      {/* Kit contents */}
      {hasKit && 'contents' in item && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">What&apos;s Included</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {item.contents.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-800">{c.item.name}</span>
                <span className="text-gray-500 font-medium">×{c.quantity}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Purchase form */}
      <form action={checkout} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-5">
          <label className="text-sm font-medium text-gray-700 shrink-0">Quantity</label>
          <input
            type="number"
            name="quantity"
            defaultValue={1}
            min={1}
            max={99}
            className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
        >
          Buy Now — {price}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Redirects to secure checkout.{' '}
          <Link href="/portal/appointments/new" className="underline hover:text-gray-600">
            Need delivery instead?
          </Link>
        </p>
      </form>
    </div>
  );
}
