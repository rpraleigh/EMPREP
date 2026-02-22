import { createClient } from '@/lib/supabase-server';
import { getCustomerProfile, listOrders } from '@rpral/api';
import type { Order, OrderStatus } from '@rpral/types';
import Link from 'next/link';

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending:    'bg-gray-100    text-gray-500',
  confirmed:  'bg-blue-100   text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped:    'bg-amber-100  text-amber-700',
  delivered:  'bg-green-100  text-green-700',
  cancelled:  'bg-gray-100   text-gray-400',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function OrderCard({ order }: { order: Order }) {
  const shortId = order.id.slice(0, 8).toUpperCase();
  return (
    <Link
      href={`/portal/orders/${order.id}`}
      className="block bg-white border border-gray-100 rounded-xl shadow-sm p-5 hover:shadow transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Order #{shortId}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(order.createdAt)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-gray-900">{fmtCents(order.totalCents)}</p>
          <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[order.status]}`}>
            {order.status}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getCustomerProfile(supabase, user.id);
  const orders  = profile
    ? await listOrders(supabase, { customerId: profile.id })
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Link
          href="/portal/catalog"
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          Browse catalog →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-500 text-sm mb-4">No orders yet.</p>
          <Link
            href="/portal/catalog"
            className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Shop Supplies
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
