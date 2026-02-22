import { createClient } from '../../../lib/supabase-server';
import { listAppointments, listCustomers } from '@rpral/api';
import Link from 'next/link';

export default async function OpsDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'] as string;
  const isAdmin = role === 'admin';

  const [upcoming, requested] = await Promise.all([
    listAppointments(supabase, { status: 'confirmed', limit: 10 }),
    listAppointments(supabase, { status: 'requested', limit: 10 }),
  ]);

  const customers = isAdmin ? await listCustomers(supabase, { limit: 5 }) : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Pending Requests"  value={requested.length} href="/ops/appointments?status=requested" />
        <StatCard label="Confirmed Today"   value={upcoming.length}  href="/ops/appointments?status=confirmed" />
        {isAdmin && <StatCard label="Total Customers" value={customers.length} href="/ops/customers" />}
      </div>

      {/* Unassigned requests */}
      {isAdmin && requested.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Unassigned Requests ({requested.length})
          </h2>
          <ul className="space-y-2">
            {requested.map((appt) => (
              <li key={appt.id}>
                <Link
                  href={`/ops/appointments/${appt.id}`}
                  className="flex items-center justify-between bg-white border border-yellow-200 rounded-lg p-4 hover:border-yellow-400"
                >
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {appt.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Requested {new Date(appt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                    Assign →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Upcoming confirmed */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Upcoming Appointments</h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-500 text-sm">No confirmed appointments.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((appt) => (
              <li key={appt.id}>
                <Link
                  href={`/ops/appointments/${appt.id}`}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300"
                >
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {appt.type.replace('_', ' ')}
                    </p>
                    {appt.scheduledAt && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(appt.scheduledAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">confirmed</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 block">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Link>
  );
}
