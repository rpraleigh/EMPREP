import { createClient } from '@/lib/supabase-server';
import { listCustomers } from '@rpral/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'];
  if (role !== 'admin') redirect('/ops/dashboard');

  const params    = await searchParams;
  const customers = await listCustomers(supabase, {
    limit: 50,
    ...(params.q ? { search: params.q } : {}),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <span className="text-sm text-gray-500">{customers.length} shown</span>
      </div>

      <form method="GET" className="mb-6">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Search by name or email…"
          className="w-full max-w-sm bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
        />
      </form>

      {customers.length === 0 ? (
        <p className="text-gray-500 text-sm">No customers found.</p>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-700/50">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/ops/customers/${c.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-750 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{c.fullName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
              </div>
              <div className="text-right text-xs text-gray-500 shrink-0 ml-4">
                {c.city ? <p>{c.city}, {c.state}</p> : null}
                <p>{fmtDate(c.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
