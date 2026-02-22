import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getEmployee, listAppointments, setEmployeeActive } from '@rpral/api';
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
  completed:   'bg-green-900/50  text-green-300',
  cancelled:   'bg-gray-700      text-gray-400',
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  requested:   'Requested',
  confirmed:   'Confirmed',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'];
  if (role !== 'admin') redirect('/ops/dashboard');

  const [employee, appointments] = await Promise.all([
    getEmployee(supabase, employeeId),
    listAppointments(supabase, { employeeId, limit: 50 }),
  ]);

  if (!employee) notFound();

  async function toggleActive() {
    'use server';
    const s = await createClient();
    await setEmployeeActive(s, employeeId, !employee!.isActive);
    redirect(`/ops/employees/${employeeId}`);
  }

  const upcomingAppts  = appointments.filter((a) =>
    a.status === 'confirmed' || a.status === 'in_progress',
  );
  const completedAppts = appointments.filter((a) => a.status === 'completed');

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/ops/employees" className="text-xs text-gray-500 hover:text-gray-300 mb-3 inline-block">
          ← Employees
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{employee.fullName}</h1>
            <p className="text-sm text-gray-400 mt-1">{employee.email}</p>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
            employee.isActive
              ? 'bg-green-900/50 text-green-300'
              : 'bg-gray-700 text-gray-400'
          }`}>
            {employee.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Profile */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700/50">
        {employee.phone && <Row label="Phone"  value={employee.phone} />}
        <Row label="Member Since" value={fmtDate(employee.createdAt)} />
        <Row label="Appointments" value={`${appointments.length} total · ${completedAppts.length} completed`} />
      </div>

      {/* Toggle active */}
      <form action={toggleActive}>
        <button
          type="submit"
          className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
            employee.isActive
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {employee.isActive ? 'Deactivate Employee' : 'Reactivate Employee'}
        </button>
      </form>

      {/* Upcoming */}
      {upcomingAppts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Active / Upcoming ({upcomingAppts.length})
          </h2>
          <AppointmentList appointments={upcomingAppts} />
        </section>
      )}

      {/* History */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
          History ({completedAppts.length})
        </h2>
        {completedAppts.length === 0 ? (
          <p className="text-sm text-gray-500">No completed appointments.</p>
        ) : (
          <AppointmentList appointments={completedAppts} />
        )}
      </section>
    </div>
  );
}

function AppointmentList({ appointments }: {
  appointments: Array<{
    id: string;
    type: AppointmentType;
    status: AppointmentStatus;
    scheduledAt: string | null;
    createdAt: string;
  }>;
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-700/50">
      {appointments.map((appt) => (
        <Link
          key={appt.id}
          href={`/ops/appointments/${appt.id}`}
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-750 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold text-white">{TYPE_LABEL[appt.type]}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {appt.scheduledAt
                ? fmtDateTime(appt.scheduledAt)
                : `Requested ${new Date(appt.createdAt).toLocaleDateString()}`}
            </p>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[appt.status]}`}>
            {STATUS_LABEL[appt.status]}
          </span>
        </Link>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-5 py-3">
      <dt className="w-36 text-gray-500 shrink-0 text-sm">{label}</dt>
      <dd className="text-gray-200 text-sm">{value}</dd>
    </div>
  );
}
