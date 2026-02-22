import { createClient } from '@/lib/supabase-server';
import { listAppointments, listCustomers, listOrders } from '@rpral/api';
import type { Appointment, AppointmentType } from '@rpral/types';
import Link from 'next/link';

const TYPE_LABEL: Record<AppointmentType, string> = {
  evaluation: 'Evaluation',
  delivery:   'Delivery',
  follow_up:  'Follow-Up Visit',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function StatCard({
  label, value, href, accent = 'gray',
}: {
  label: string; value: number | string; href: string;
  accent?: 'gray' | 'amber' | 'blue' | 'green';
}) {
  const bar: Record<string, string> = {
    gray:  'border-l-gray-400',
    amber: 'border-l-amber-400',
    blue:  'border-l-blue-400',
    green: 'border-l-green-400',
  };
  return (
    <Link
      href={href}
      className={`bg-gray-800 border border-gray-700 border-l-4 ${bar[accent]} rounded-xl p-5 hover:bg-gray-750 block transition-colors`}
    >
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </Link>
  );
}

function ApptRow({ appt }: { appt: Appointment }) {
  return (
    <Link
      href={`/ops/appointments/${appt.id}`}
      className="flex items-center justify-between p-4 hover:bg-gray-750 transition-colors"
    >
      <div>
        <p className="text-sm font-semibold text-white">{TYPE_LABEL[appt.type]}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {appt.scheduledAt ? fmtDateTime(appt.scheduledAt) : `Requested ${fmtDate(appt.createdAt)}`}
        </p>
      </div>
      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

export default async function OpsDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const role    = (user.app_metadata as Record<string, unknown>)?.['user_role'] as string;
  const isAdmin = role === 'admin';

  const [requested, confirmed] = await Promise.all([
    listAppointments(supabase, { status: 'requested', limit: 10 }),
    listAppointments(supabase, {
      status: 'confirmed',
      ...(role === 'employee' ? { employeeId: user.id } : {}),
      limit: 10,
    }),
  ]);

  const [customers, pendingOrders] = isAdmin
    ? await Promise.all([
        listCustomers(supabase, { limit: 1000 }),
        listOrders(supabase, { status: 'pending', limit: 5 }),
      ])
    : [[], []];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Operations Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending Requests"  value={requested.length}  href="/ops/appointments?status=requested" accent="amber" />
        <StatCard label="Confirmed"         value={confirmed.length}  href="/ops/appointments?status=confirmed" accent="blue" />
        {isAdmin && <StatCard label="Customers"      value={customers.length}  href="/ops/customers" />}
        {isAdmin && <StatCard label="Pending Orders" value={pendingOrders.length} href="/ops/orders?status=confirmed" accent={pendingOrders.length > 0 ? 'amber' : 'gray'} />}
      </div>

      {/* Pending requests — admin action required */}
      {isAdmin && requested.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Needs Assignment ({requested.length})
          </h2>
          <div className="bg-gray-800 border border-amber-700/40 rounded-xl overflow-hidden divide-y divide-gray-700/50">
            {requested.map((appt) => <ApptRow key={appt.id} appt={appt} />)}
          </div>
        </section>
      )}

      {/* Upcoming confirmed */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
          {isAdmin ? 'Upcoming Confirmed' : 'Your Upcoming Appointments'}
        </h2>
        {confirmed.length === 0 ? (
          <p className="text-gray-500 text-sm">No confirmed appointments.</p>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-700/50">
            {confirmed.map((appt) => <ApptRow key={appt.id} appt={appt} />)}
          </div>
        )}
      </section>
    </div>
  );
}
