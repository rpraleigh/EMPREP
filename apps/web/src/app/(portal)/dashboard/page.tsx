import { createClient } from '../../../lib/supabase-server';
import { getCustomerProfile } from '@rpral/api';
import { getCustomerSupplies } from '@rpral/api';
import { listAppointments } from '@rpral/api';
import { getFollowUpPlan } from '@rpral/api';
import Link from 'next/link';

export default async function CustomerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, appointments, followUpPlan] = await Promise.all([
    getCustomerProfile(supabase, user.id),
    getCustomerProfile(supabase, user.id).then((p) =>
      p ? listAppointments(supabase, { customerId: p.id, limit: 3 }) : [],
    ),
    getCustomerProfile(supabase, user.id).then((p) =>
      p ? getFollowUpPlan(supabase, p.id) : null,
    ),
  ]);

  const supplies = profile ? await getCustomerSupplies(supabase, profile.id) : [];

  if (!profile) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to EMPREP</h1>
        <p className="text-gray-600 mb-6">Complete your profile to get started.</p>
        <Link href="/portal/account" className="btn-primary">Set Up My Account</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile.fullName.split(' ')[0]}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Your preparedness dashboard</p>
      </div>

      {/* Supply summary */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Your Supplies</h2>
          <Link href="/portal/catalog" className="text-sm text-red-600 hover:underline">
            Shop supplies →
          </Link>
        </div>
        {supplies.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
            You have no supplies on record yet.{' '}
            <Link href="/portal/catalog" className="underline font-medium">Browse our catalog</Link>
            {' '}or{' '}
            <Link href="/portal/appointments/new" className="underline font-medium">
              schedule an evaluation
            </Link>
            .
          </div>
        ) : (
          <p className="text-gray-600 text-sm">{supplies.length} item type(s) on record.</p>
        )}
      </section>

      {/* Upcoming appointments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Appointments</h2>
          <Link href="/portal/appointments/new" className="text-sm text-red-600 hover:underline">
            Request one →
          </Link>
        </div>
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming appointments.</p>
        ) : (
          <ul className="space-y-2">
            {appointments.map((appt) => (
              <li key={appt.id} className="bg-white rounded-lg border border-gray-200 p-4 text-sm">
                <span className="font-medium capitalize">{appt.type.replace('_', ' ')}</span>
                {appt.scheduledAt && (
                  <span className="text-gray-500 ml-2">
                    — {new Date(appt.scheduledAt).toLocaleDateString()}
                  </span>
                )}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium
                  ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {appt.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Follow-up plan */}
      {followUpPlan && followUpPlan.isActive && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Follow-Up Plan</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm">
            <p className="text-gray-700">
              Frequency: <span className="font-medium capitalize">{followUpPlan.interval}</span>
            </p>
            {followUpPlan.nextScheduledAt && (
              <p className="text-gray-500 mt-1">
                Next visit due: {new Date(followUpPlan.nextScheduledAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
