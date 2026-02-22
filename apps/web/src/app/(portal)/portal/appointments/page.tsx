import { createClient } from '../../../lib/supabase-server';
import { getCustomerProfile, listAppointments } from '@rpral/api';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  requested:   'bg-yellow-100 text-yellow-700',
  confirmed:   'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed:   'bg-green-100 text-green-700',
  cancelled:   'bg-gray-100 text-gray-500',
};

export default async function AppointmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getCustomerProfile(supabase, user.id);
  const appointments = profile
    ? await listAppointments(supabase, { customerId: profile.id })
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <Link
          href="/portal/appointments/new"
          className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Request Appointment
        </Link>
      </div>

      {appointments.length === 0 ? (
        <p className="text-gray-500 text-sm">No appointments yet.</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((appt) => (
            <li key={appt.id}>
              <Link
                href={`/portal/appointments/${appt.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {appt.type.replace('_', ' ')}
                    </p>
                    {appt.scheduledAt && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {new Date(appt.scheduledAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[appt.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {appt.status.replace('_', ' ')}
                  </span>
                </div>
                {appt.customerNotes && (
                  <p className="text-sm text-gray-400 mt-2 truncate">{appt.customerNotes}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
