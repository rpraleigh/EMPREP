import { createClient } from '../../../lib/supabase-server';
import { listAppointments } from '@rpral/api';
import type { AppointmentStatus } from '@rpral/types';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  requested:   'bg-yellow-100 text-yellow-700',
  confirmed:   'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-500',
};

export default async function OpsAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'] as string;
  const params = await searchParams;
  const filterStatus = params.status as AppointmentStatus | undefined;

  const appointments = await listAppointments(supabase, {
    ...(role === 'employee' && { employeeId: user.id }),
    ...(filterStatus && { status: filterStatus }),
    limit: 100,
  });

  const statuses: AppointmentStatus[] = ['requested', 'confirmed', 'in_progress', 'completed', 'cancelled'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h1>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/ops/appointments"
          className={`px-3 py-1.5 rounded-full text-sm font-medium border ${!filterStatus ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/ops/appointments?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${filterStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
          >
            {s.replace('_', ' ')}
          </Link>
        ))}
      </div>

      {appointments.length === 0 ? (
        <p className="text-gray-500 text-sm">No appointments found.</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((appt) => (
            <li key={appt.id}>
              <Link
                href={`/ops/appointments/${appt.id}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300"
              >
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {appt.type.replace('_', ' ')}
                  </p>
                  {appt.scheduledAt ? (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(appt.scheduledAt).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-0.5 italic">Not scheduled</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[appt.status] ?? ''}`}>
                  {appt.status.replace('_', ' ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
