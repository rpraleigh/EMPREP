import { createClient } from '@/lib/supabase-server';
import { listOrders, listCustomers } from '@rpral/api';
import type { OrderStatus } from '@rpral/types';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const ALL_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
];

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

function fmtCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default async function OpsOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'];
  if (role !== 'admin') redirect('/ops/dashboard');

  const params       = await searchParams;
  const filterStatus = params.status as OrderStatus | undefined;

  const [orders, customers] = await Promise.all([
    listOrders(supabase, {
      ...(filterStatus ? { status: filterStatus } : {}),
      limit: 100,
    }),
    listCustomers(supabase, { limit: 1000 }),
  ]);

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Orders</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/ops/orders"
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            !filterStatus
              ? 'bg-white text-gray-900 border-white'
              : 'border-gray-600 text-gray-400 hover:border-gray-400'
          }`}
        >
          All
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/ops/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filterStatus === s
                ? 'bg-white text-gray-900 border-white'
                : 'border-gray-600 text-gray-400 hover:border-gray-400'
            }`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-sm">No orders found.</p>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-700/50">
          {orders.map((order) => {
            const customer = customerMap.get(order.customerId);
            const shortId  = order.id.slice(0, 8).toUpperCase();
            return (
              <Link
                key={order.id}
                href={`/ops/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-750 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-white font-mono">#{shortId}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {customer ? customer.fullName : '—'} · {fmtDate(order.createdAt)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-white shrink-0 ml-4">
                  {fmtCents(order.totalCents)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
