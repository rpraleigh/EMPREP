import { createClient } from '@/lib/supabase-server';
import { getCustomerProfile, listAppointments } from '@rpral/api';
import type { Appointment, AppointmentStatus, AppointmentType } from '@rpral/types';
import Link from 'next/link';

const TYPE_LABEL: Record<AppointmentType, string> = {
  evaluation: 'Evaluation',
  delivery:   'Delivery',
  follow_up:  'Follow-Up Visit',
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  requested:   'bg-amber-100 text-amber-700',
  confirmed:   'bg-blue-100  text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100  text-gray-500',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function AppointmentRow({ appt }: { appt: Appointment }) {
  return (
    <Link
      href={`/portal/appointments/${appt.id}`}
      className="block bg-white border border-gray-100 rounded-xl shadow-sm p-4 hover:shadow transition-shadow"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{TYPE_LABEL[appt.type]}</p>
          {appt.scheduledAt ? (
            <p className="text-xs text-gray-500 mt-0.5">{fmtDate(appt.scheduledAt)}</p>
          ) : (
            <p className="text-xs text-gray-400 italic mt-0.5">Date TBD</p>
          )}
          {appt.customerNotes && (
            <p className="text-xs text-gray-400 mt-1.5 truncate max-w-xs">{appt.customerNotes}</p>
          )}
        </div>
        <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[appt.status]}`}>
          {appt.status.replace('_', ' ')}
        </span>
      </div>
    </Link>
  );
}

export default async function AppointmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getCustomerProfile(supabase, user.id);
  const appointments = profile
    ? await listAppointments(supabase, { customerId: profile.id })
    : [];

  const upcoming = appointments.filter(
    (a) => a.status !== 'completed' && a.status !== 'cancelled',
  );
  const history = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled',
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <Link
          href="/portal/appointments/new"
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Request Appointment
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-gray-500 text-sm mb-4">No appointments yet.</p>
          <Link
            href="/portal/appointments/new"
            className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Schedule an Evaluation
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Upcoming</h2>
              <ul className="space-y-3">
                {upcoming.map((appt) => <li key={appt.id}><AppointmentRow appt={appt} /></li>)}
              </ul>
            </section>
          )}
          {history.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">History</h2>
              <ul className="space-y-3">
                {history.map((appt) => <li key={appt.id}><AppointmentRow appt={appt} /></li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
