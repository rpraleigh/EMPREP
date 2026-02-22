import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getCustomerProfile, getOrder, getOrderItems, getItem } from '@rpral/api';
import type { OrderStatus, OrderItem, SupplyItem } from '@rpral/types';
import Link from 'next/link';

const STATUS_BADGE: Record<OrderStatus, { cls: string; label: string }> = {
  pending:    { cls: 'bg-gray-100    text-gray-500',   label: 'Pending Payment' },
  confirmed:  { cls: 'bg-blue-100   text-blue-700',   label: 'Confirmed' },
  processing: { cls: 'bg-purple-100 text-purple-700', label: 'Processing' },
  shipped:    { cls: 'bg-amber-100  text-amber-700',  label: 'Shipped' },
  delivered:  { cls: 'bg-green-100  text-green-700',  label: 'Delivered' },
  cancelled:  { cls: 'bg-gray-100   text-gray-400',   label: 'Cancelled' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function fmtCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params:       Promise<{ orderId: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { orderId } = await params;
  const { success } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getCustomerProfile(supabase, user.id);
  if (!profile) notFound();

  const order = await getOrder(supabase, orderId);
  if (!order || order.customerId !== profile.id) notFound();

  const orderItems = await getOrderItems(supabase, order.id);

  // Resolve item names (N+1 is fine for typical order sizes)
  const resolvedItems = await Promise.all(
    orderItems.map(async (oi): Promise<{ line: OrderItem; item: SupplyItem | null }> => ({
      line: oi,
      item: await getItem(supabase, oi.supplyItemId),
    })),
  );

  const badge   = STATUS_BADGE[order.status];
  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-xl">
      <Link href="/portal/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Orders
      </Link>

      {/* Success banner */}
      {success === '1' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-green-800">
            <p className="font-semibold">Payment received — thank you!</p>
            <p className="mt-0.5 text-green-700">We&apos;ll be in touch to schedule your delivery.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{shortId}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Placed {fmtDate(order.createdAt)}</p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Items</p>
        </div>
        {resolvedItems.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400">No items on record.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {resolvedItems.map(({ line, item }) => (
              <div key={line.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{item?.name ?? 'Unknown item'}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {fmtCents(line.unitPriceCents)} × {line.quantity}
                  </p>
                </div>
                <p className="font-semibold text-gray-900 shrink-0">
                  {fmtCents(line.unitPriceCents * line.quantity)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          <div className="px-5 py-2.5 flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{fmtCents(order.subtotalCents)}</span>
          </div>
          <div className="px-5 py-2.5 flex justify-between text-sm text-gray-600">
            <span>Tax (8%)</span>
            <span>{fmtCents(order.taxCents)}</span>
          </div>
          <div className="px-5 py-3 flex justify-between text-sm font-bold text-gray-900">
            <span>Total</span>
            <span>{fmtCents(order.totalCents)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {order.shippingAddress && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ship To</p>
          <address className="not-italic text-sm text-gray-700 leading-relaxed">
            {order.shippingAddress.line1}<br />
            {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
          </address>
        </div>
      )}
    </div>
  );
}
