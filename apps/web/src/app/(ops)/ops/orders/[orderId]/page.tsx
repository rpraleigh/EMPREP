import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import {
  getOrder,
  getOrderItems,
  getCustomerById,
  getItem,
  updateOrderStatus,
} from '@rpral/api';
import type { OrderStatus, OrderItem, SupplyItem } from '@rpral/types';
import Link from 'next/link';

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending:    'bg-gray-700      text-gray-400',
  confirmed:  'bg-blue-900/50   text-blue-300',
  processing: 'bg-purple-900/50 text-purple-300',
  shipped:    'bg-amber-900/50  text-amber-300',
  delivered:  'bg-green-900/50  text-green-300',
  cancelled:  'bg-gray-700      text-gray-500',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:    'Pending Payment',
  confirmed:  'Confirmed',
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmed:  'processing',
  processing: 'shipped',
  shipped:    'delivered',
};

const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed:  'Mark Processing',
  processing: 'Mark Shipped',
  shipped:    'Mark Delivered',
};

function fmtCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default async function OpsOrderDetail({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'];
  if (role !== 'admin') redirect('/ops/dashboard');

  const order = await getOrder(supabase, orderId);
  if (!order) notFound();

  const [orderItems, customer] = await Promise.all([
    getOrderItems(supabase, order.id),
    getCustomerById(supabase, order.customerId),
  ]);

  const resolvedItems = await Promise.all(
    orderItems.map(async (oi): Promise<{ line: OrderItem; item: SupplyItem | null }> => ({
      line: oi,
      item: await getItem(supabase, oi.supplyItemId),
    })),
  );

  const nextStatus  = NEXT_STATUS[order.status];
  const advanceLabel = ADVANCE_LABEL[order.status];
  const canCancel   = order.status !== 'delivered' && order.status !== 'cancelled';
  const shortId     = order.id.slice(0, 8).toUpperCase();

  async function advanceStatus() {
    'use server';
    if (!nextStatus) return;
    const s = await createClient();
    await updateOrderStatus(s, orderId, nextStatus);
    redirect(`/ops/orders/${orderId}`);
  }

  async function cancelOrder() {
    'use server';
    const s = await createClient();
    await updateOrderStatus(s, orderId, 'cancelled');
    redirect(`/ops/orders/${orderId}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/ops/orders" className="text-xs text-gray-500 hover:text-gray-300 mb-3 inline-block">
          ← Orders
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-mono">#{shortId}</h1>
            {customer && (
              <p className="text-sm text-gray-400 mt-1">
                <Link href={`/ops/customers/${customer.id}`} className="hover:text-gray-200">
                  {customer.fullName}
                </Link>
                {' · '}{customer.email}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">Placed {fmtDate(order.createdAt)}</p>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Items</p>
        </div>
        {resolvedItems.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-500">No items on record.</p>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {resolvedItems.map(({ line, item }) => (
              <div key={line.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-white">{item?.name ?? 'Unknown item'}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {fmtCents(line.unitPriceCents)} × {line.quantity}
                  </p>
                </div>
                <p className="font-semibold text-white shrink-0">
                  {fmtCents(line.unitPriceCents * line.quantity)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-gray-700 divide-y divide-gray-700/50">
          <div className="px-5 py-2.5 flex justify-between text-sm text-gray-400">
            <span>Subtotal</span><span>{fmtCents(order.subtotalCents)}</span>
          </div>
          <div className="px-5 py-2.5 flex justify-between text-sm text-gray-400">
            <span>Tax (8%)</span><span>{fmtCents(order.taxCents)}</span>
          </div>
          <div className="px-5 py-3 flex justify-between text-sm font-bold text-white">
            <span>Total</span><span>{fmtCents(order.totalCents)}</span>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700/50">
        {order.shippingAddress && (
          <div className="flex gap-4 px-5 py-3">
            <dt className="w-36 text-gray-500 shrink-0 text-sm">Ship To</dt>
            <dd className="text-gray-200 text-sm leading-relaxed">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
            </dd>
          </div>
        )}
        {order.stripePaymentIntentId && (
          <div className="flex gap-4 px-5 py-3">
            <dt className="w-36 text-gray-500 shrink-0 text-sm">Payment</dt>
            <dd className="text-gray-200 text-sm font-mono text-xs">{order.stripePaymentIntentId}</dd>
          </div>
        )}
        {order.notes && (
          <div className="flex gap-4 px-5 py-3">
            <dt className="w-36 text-gray-500 shrink-0 text-sm">Notes</dt>
            <dd className="text-gray-200 text-sm">{order.notes}</dd>
          </div>
        )}
        <div className="flex gap-4 px-5 py-3">
          <dt className="w-36 text-gray-500 shrink-0 text-sm">Last Updated</dt>
          <dd className="text-gray-200 text-sm">{fmtDateTime(order.updatedAt)}</dd>
        </div>
      </div>

      {/* Actions */}
      {(nextStatus || canCancel) && (
        <div className="flex gap-3">
          {nextStatus && (
            <form action={advanceStatus}>
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                {advanceLabel}
              </button>
            </form>
          )}
          {canCancel && (
            <form action={cancelOrder}>
              <button
                type="submit"
                className="bg-gray-700 text-gray-300 rounded-lg px-5 py-2 text-sm font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel Order
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
