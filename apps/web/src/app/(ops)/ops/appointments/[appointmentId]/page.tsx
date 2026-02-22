import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import {
  getAppointment,
  getVisitRecord,
  assignAppointment,
  updateAppointmentStatus,
  getCustomerById,
  listEmployees,
} from '@rpral/api';
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

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default async function OpsAppointmentDetail({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role    = (user.app_metadata as Record<string, unknown>)?.['user_role'] as string;
  const isAdmin = role === 'admin';

  const [appt, visitRecord, employees] = await Promise.all([
    getAppointment(supabase, appointmentId),
    getVisitRecord(supabase, appointmentId),
    isAdmin ? listEmployees(supabase) : Promise.resolve([]),
  ]);

  if (!appt) notFound();

  const customer         = await getCustomerById(supabase, appt.customerId);
  const assignedEmployee = employees.find((e) => e.id === appt.employeeId) ?? null;

  async function confirmAppointment(formData: FormData) {
    'use server';
    const s = await createClient();
    const scheduledAt = formData.get('scheduledAt') as string | null;
    const adminNotes  = formData.get('adminNotes')  as string | null;
    await assignAppointment(s, {
      appointmentId,
      employeeId: formData.get('employeeId') as string,
      ...(scheduledAt ? { scheduledAt } : {}),
      ...(adminNotes  ? { adminNotes  } : {}),
    });
    redirect(`/ops/appointments/${appointmentId}`);
  }

  async function markInProgress() {
    'use server';
    const s = await createClient();
    await updateAppointmentStatus(s, appointmentId, 'in_progress');
    redirect(`/ops/appointments/${appointmentId}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <Link href="/ops/appointments" className="text-xs text-gray-500 hover:text-gray-300 mb-3 inline-block">
          ← Appointments
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{TYPE_LABEL[appt.type]}</h1>
            {customer && (
              <p className="text-sm text-gray-400 mt-1">
                <Link href={`/ops/customers/${customer.id}`} className="hover:text-gray-200">
                  {customer.fullName}
                </Link>
                {' · '}{customer.email}
              </p>
            )}
          </div>
          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[appt.status]}`}>
            {STATUS_LABEL[appt.status]}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700/50">
        <Row label="Scheduled"     value={appt.scheduledAt ? fmtDateTime(appt.scheduledAt) : 'TBD'} />
        <Row label="Assigned To"   value={assignedEmployee ? assignedEmployee.fullName : (appt.employeeId ? '(employee)' : 'Unassigned')} />
        <Row label="Customer Notes" value={appt.customerNotes ?? '—'} />
        {isAdmin && <Row label="Admin Notes" value={appt.adminNotes ?? '—'} />}
        <Row label="Created"       value={fmtDateTime(appt.createdAt)} />
      </div>

      {/* Assign form — admin only */}
      {isAdmin && appt.status === 'requested' && (
        <section className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Assign &amp; Schedule
          </h2>
          <form action={confirmAppointment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Employee</label>
              <select
                name="employeeId"
                required
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">— select employee —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Scheduled At</label>
              <input
                type="datetime-local"
                name="scheduledAt"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Admin Notes</label>
              <textarea
                name="adminNotes"
                rows={2}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white resize-none"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Confirm Assignment
            </button>
          </form>
        </section>
      )}

      {/* Start visit */}
      {appt.status === 'confirmed' && !visitRecord && (
        <form action={markInProgress}>
          <button
            type="submit"
            className="bg-purple-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            Start Visit
          </button>
        </form>
      )}

      {/* Complete visit link */}
      {appt.status === 'in_progress' && !visitRecord && (
        <Link
          href={`/ops/appointments/${appointmentId}/visit`}
          className="inline-block bg-green-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          Complete Visit →
        </Link>
      )}

      {/* Visit summary */}
      {visitRecord && (
        <section className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700/50">
          <div className="px-5 py-3">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Visit Summary</p>
          </div>
          <Row label="Summary"          value={visitRecord.summary        ?? '—'} />
          <Row label="Recommendations"  value={visitRecord.recommendations ?? '—'} />
          <Row
            label="Follow-up"
            value={
              visitRecord.followUpNeeded
                ? `Yes — ${visitRecord.followUpInterval ?? ''}`
                : 'No'
            }
          />
          <Row label="Completed" value={fmtDateTime(visitRecord.completedAt)} />
        </section>
      )}
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
