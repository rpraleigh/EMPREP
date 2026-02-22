import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { listCustomers } from '@rpral/api';
import Link from 'next/link';

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

  const params = await searchParams;
  const customers = await listCustomers(supabase, {
    limit: 50,
    ...(params.q ? { search: params.q } : {}),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>

      <form method="GET" className="mb-6">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Search by name or email…"
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </form>

      {customers.length === 0 ? (
        <p className="text-gray-500 text-sm">No customers found.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">City</th>
              <th className="pb-2 font-medium">Household</th>
              <th className="pb-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="py-3">
                  <Link href={`/ops/customers/${c.id}`} className="font-medium text-gray-900 hover:underline">
                    {c.fullName}
                  </Link>
                </td>
                <td className="py-3 text-gray-500">{c.email}</td>
                <td className="py-3 text-gray-500">{c.city ?? '—'}</td>
                <td className="py-3 text-gray-500">{c.householdSize}</td>
                <td className="py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
