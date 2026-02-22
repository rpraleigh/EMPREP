import { redirect, notFound } from 'next/navigation';
import { createClient } from '../../../../lib/supabase-server';
import {
  getAppointment,
  getVisitRecord,
  assignAppointment,
  updateAppointmentStatus,
} from '@rpral/api';
import Link from 'next/link';

export default async function OpsAppointmentDetail({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { appointmentId } = await params;
  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'] as string;
  const isAdmin = role === 'admin';

  const [appt, visitRecord] = await Promise.all([
    getAppointment(supabase, appointmentId),
    getVisitRecord(supabase, appointmentId),
  ]);

  if (!appt) notFound();

  async function confirmAppointment(formData: FormData) {
    'use server';
    const s = await (await import('../../../../lib/supabase-server')).createClient();
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
    const s = await (await import('../../../../lib/supabase-server')).createClient();
    await updateAppointmentStatus(s, appointmentId, 'in_progress');
    redirect(`/ops/appointments/${appointmentId}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            {appt.type.replace('_', ' ')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">ID: {appt.id}</p>
        </div>
        <span className="text-sm font-medium px-3 py-1 bg-gray-100 text-gray-700 rounded-full capitalize">
          {appt.status.replace('_', ' ')}
        </span>
      </div>

      <dl className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 text-sm">
        <Row label="Scheduled" value={appt.scheduledAt ? new Date(appt.scheduledAt).toLocaleString() : 'TBD'} />
        <Row label="Customer Notes" value={appt.customerNotes ?? '—'} />
        {isAdmin && <Row label="Admin Notes" value={appt.adminNotes ?? '—'} />}
      </dl>

      {/* Assign form — admin only, unassigned appointments */}
      {isAdmin && appt.status === 'requested' && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Assign &amp; Schedule</h2>
          <form action={confirmAppointment} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input type="text" name="employeeId" required placeholder="UUID of assigned employee"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At</label>
              <input type="datetime-local" name="scheduledAt"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
              <textarea name="adminNotes" rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button type="submit"
              className="bg-gray-900 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-gray-700">
              Confirm Assignment
            </button>
          </form>
        </section>
      )}

      {/* Mark in-progress */}
      {appt.status === 'confirmed' && !visitRecord && (
        <form action={markInProgress}>
          <button type="submit"
            className="bg-purple-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-purple-700">
            Start Visit
          </button>
        </form>
      )}

      {/* Visit record link */}
      {appt.status === 'in_progress' && !visitRecord && (
        <Link
          href={`/ops/appointments/${appointmentId}/visit`}
          className="inline-block bg-green-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-green-700"
        >
          Complete Visit →
        </Link>
      )}

      {visitRecord && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Visit Summary</h2>
          <dl className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 text-sm">
            <Row label="Summary"         value={visitRecord.summary        ?? '—'} />
            <Row label="Recommendations" value={visitRecord.recommendations ?? '—'} />
            <Row label="Follow-up needed" value={visitRecord.followUpNeeded ? `Yes — ${visitRecord.followUpInterval ?? ''}` : 'No'} />
          </dl>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <dt className="w-40 text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-900">{value}</dd>
    </div>
  );
}
