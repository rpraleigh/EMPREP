import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getCustomerProfile, getAppointment } from '@rpral/api';
import type { AppointmentStatus, AppointmentType } from '@rpral/types';
import Link from 'next/link';

const TYPE_LABEL: Record<AppointmentType, string> = {
  evaluation: 'Evaluation',
  delivery:   'Delivery',
  follow_up:  'Follow-Up Visit',
};

const STATUS_BADGE: Record<AppointmentStatus, { cls: string; label: string }> = {
  requested:   { cls: 'bg-amber-100 text-amber-700',   label: 'Requested' },
  confirmed:   { cls: 'bg-blue-100 text-blue-700',     label: 'Confirmed' },
  in_progress: { cls: 'bg-purple-100 text-purple-700', label: 'In Progress' },
  completed:   { cls: 'bg-green-100 text-green-700',   label: 'Completed' },
  cancelled:   { cls: 'bg-gray-100 text-gray-500',     label: 'Cancelled' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getCustomerProfile(supabase, user.id);
  if (!profile) notFound();

  const appt = await getAppointment(supabase, appointmentId);
  // Ensure this appointment belongs to the current customer
  if (!appt || appt.customerId !== profile.id) notFound();

  const badge = STATUS_BADGE[appt.status];

  return (
    <div className="max-w-xl">
      <Link href="/portal/appointments" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Appointments
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{TYPE_LABEL[appt.type]}</h1>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Details card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50 mb-6">
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Scheduled For</p>
          {appt.scheduledAt ? (
            <p className="text-sm font-semibold text-gray-900">{fmtDate(appt.scheduledAt)}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              {appt.status === 'cancelled' ? '—' : 'Pending confirmation'}
            </p>
          )}
        </div>

        {appt.completedAt && (
          <div className="px-5 py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Completed</p>
            <p className="text-sm text-gray-700">{fmtDate(appt.completedAt)}</p>
          </div>
        )}

        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Requested On</p>
          <p className="text-sm text-gray-700">{fmtDate(appt.createdAt)}</p>
        </div>
      </div>

      {/* Customer notes */}
      {appt.customerNotes && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Your Notes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{appt.customerNotes}</p>
        </div>
      )}

      {/* Admin notes (read-only) */}
      {appt.adminNotes && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Notes from EMPREP</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{appt.adminNotes}</p>
        </div>
      )}

      {/* CTA for pending appointments */}
      {(appt.status === 'requested' || appt.status === 'confirmed') && (
        <p className="text-sm text-gray-500">
          Need to make a change?{' '}
          <a href="mailto:support@emprep.com" className="text-red-600 hover:underline">
            Contact us
          </a>
          .
        </p>
      )}
    </div>
  );
}
