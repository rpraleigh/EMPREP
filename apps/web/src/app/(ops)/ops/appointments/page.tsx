import { createClient } from '@/lib/supabase-server';
import { listAppointments } from '@rpral/api';
import type { AppointmentStatus, AppointmentType } from '@rpral/types';
import Link from 'next/link';

const TYPE_LABEL: Record<AppointmentType, string> = {
  evaluation: 'Evaluation',
  delivery:   'Delivery',
  follow_up:  'Follow-Up Visit',
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  requested:   'bg-amber-900/50 text-amber-300',
  confirmed:   'bg-blue-900/50  text-blue-300',
  in_progress: 'bg-purple-900/50 text-purple-300',
  completed:   'bg-green-900/50 text-green-300',
  cancelled:   'bg-gray-700     text-gray-400',
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  requested:   'Requested',
  confirmed:   'Confirmed',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

const ALL_STATUSES: AppointmentStatus[] = [
  'requested', 'confirmed', 'in_progress', 'completed', 'cancelled',
];

export default async function OpsAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const role         = (user.app_metadata as Record<string, unknown>)?.['user_role'] as string;
  const params       = await searchParams;
  const filterStatus = params.status as AppointmentStatus | undefined;

  const appointments = await listAppointments(supabase, {
    ...(role === 'employee' && { employeeId: user.id }),
    ...(filterStatus        && { status: filterStatus }),
    limit: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Appointments</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/ops/appointments"
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
            href={`/ops/appointments?status=${s}`}
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

      {appointments.length === 0 ? (
        <p className="text-gray-500 text-sm">No appointments found.</p>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-700/50">
          {appointments.map((appt) => (
            <Link
              key={appt.id}
              href={`/ops/appointments/${appt.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-750 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{TYPE_LABEL[appt.type]}</p>
                {appt.scheduledAt ? (
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(appt.scheduledAt)}</p>
                ) : (
                  <p className="text-xs text-gray-500 italic mt-0.5">Not scheduled</p>
                )}
              </div>
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ml-4 ${STATUS_BADGE[appt.status]}`}>
                {STATUS_LABEL[appt.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
