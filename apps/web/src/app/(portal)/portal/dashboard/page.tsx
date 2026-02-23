import { createClient } from '@/lib/supabase-server';
import {
  getCustomerProfile,
  getCustomerSupplies,
  listAppointments,
  getFollowUpPlan,
} from '@rpral/api';
import type { Appointment, AppointmentStatus, AppointmentType, CustomerSupply, FollowUpInterval } from '@rpral/types';
import Link from 'next/link';

// ─── Formatters & helpers ────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

const APPT_TYPE_LABEL: Record<AppointmentType, string> = {
  evaluation: 'Evaluation',
  delivery:   'Delivery',
  follow_up:  'Follow-Up Visit',
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  requested:   'bg-amber-100  text-amber-700',
  confirmed:   'bg-blue-100   text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed:   'bg-green-100  text-green-700',
  cancelled:   'bg-gray-100   text-gray-500',
};

const INTERVAL_LABEL: Record<FollowUpInterval, string> = {
  monthly:   'Monthly',
  quarterly: 'Quarterly',
  biannual:  'Every 6 Months',
  annual:    'Annually',
};

function expiringWithin90Days(supplies: CustomerSupply[]) {
  const cutoff = Date.now() + 90 * 24 * 60 * 60 * 1000;
  return supplies.filter((s) => s.expiresAt && new Date(s.expiresAt).getTime() < cutoff);
}

function nextActiveAppointment(appointments: Appointment[]) {
  return appointments.find(
    (a) => a.status === 'confirmed' || a.status === 'requested',
  ) ?? null;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = 'gray',
}: {
  label:   string;
  value:   string;
  sub?:    string;
  accent?: 'red' | 'amber' | 'green' | 'blue' | 'gray';
}) {
  const bar: Record<string, string> = {
    red:   'border-l-red-500',
    amber: 'border-l-amber-400',
    green: 'border-l-green-500',
    blue:  'border-l-blue-500',
    gray:  'border-l-gray-300',
  };
  return (
    <div className={`bg-white rounded-xl border border-gray-100 border-l-4 ${bar[accent]} shadow-sm p-5`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
    </div>
  );
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{APPT_TYPE_LABEL[appt.type]}</p>
        {appt.scheduledAt ? (
          <p className="text-gray-500 text-xs mt-0.5">{fmtDate(appt.scheduledAt)}</p>
        ) : (
          <p className="text-gray-400 text-xs mt-0.5 italic">Date TBD</p>
        )}
      </div>
      <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[appt.status]}`}>
        {appt.status.replace('_', ' ')}
      </span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CustomerDashboard() {
  const supabase  = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getCustomerProfile(supabase, user.id);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to EMPREP</h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          Complete your profile so we can tailor your preparedness plan to your household.
        </p>
        <Link
          href="/portal/account"
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          Set Up My Account
        </Link>
      </div>
    );
  }

  const [appointments, supplies, followUpPlan] = await Promise.all([
    listAppointments(supabase, { customerId: profile.id, limit: 5 }),
    getCustomerSupplies(supabase, profile.id),
    getFollowUpPlan(supabase, profile.id),
  ]);

  const activeAppointments = appointments.filter(
    (a) => a.status !== 'completed' && a.status !== 'cancelled',
  );
  const nextAppt     = nextActiveAppointment(appointments);
  const expiringSoon = expiringWithin90Days(supplies);

  // Stat card values
  const supplyValue = supplies.length === 0 ? 'None' : `${supplies.length}`;
  const supplySub   = supplies.length === 0
    ? 'No items on record'
    : expiringSoon.length > 0
      ? `${expiringSoon.length} expiring within 90 days`
      : 'All items current';

  const apptValue = nextAppt?.scheduledAt
    ? fmtDate(nextAppt.scheduledAt)
    : activeAppointments.length > 0
      ? 'Pending confirmation'
      : 'None scheduled';
  const apptSub = nextAppt ? APPT_TYPE_LABEL[nextAppt.type] : undefined;

  const planValue = followUpPlan?.isActive
    ? INTERVAL_LABEL[followUpPlan.interval]
    : 'Not enrolled';
  const planSub   = followUpPlan?.isActive && followUpPlan.nextScheduledAt
    ? `Next visit: ${fmtDate(followUpPlan.nextScheduledAt)}`
    : followUpPlan?.isActive
      ? 'Next visit TBD'
      : 'Contact us to enroll';

  const firstName = profile.fullName.split(' ')[0];

  return (
    <div className="space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* GUIDE ME banner */}
      {supplies.length === 0 && appointments.length === 0 ? (
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-200 mb-1">Get started</p>
          <h2 className="text-lg font-bold mb-1">Get your personalized kit recommendation</h2>
          <p className="text-sm text-red-100 mb-5">
            Tell us your location and we'll build a supply plan tailored to your household and local hazards.
          </p>
          <Link
            href="/portal/guide"
            className="inline-block bg-white text-red-700 font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-red-50 transition-colors"
          >
            Guide Me →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Update your recommendations</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Hazard conditions change. Get a fresh recommendation based on your current profile.
            </p>
          </div>
          <Link
            href="/portal/guide"
            className="shrink-0 text-sm font-semibold text-red-600 hover:text-red-700 hover:underline"
          >
            Guide Me →
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Supply Items"
          value={supplyValue}
          sub={supplySub}
          accent={expiringSoon.length > 0 ? 'amber' : supplies.length > 0 ? 'green' : 'gray'}
        />
        <StatCard
          label="Next Appointment"
          value={apptValue}
          {...(apptSub !== undefined && { sub: apptSub })}
          accent={nextAppt ? 'blue' : 'gray'}
        />
        <StatCard
          label="Follow-Up Plan"
          value={planValue}
          sub={planSub}
          accent={followUpPlan?.isActive ? 'red' : 'gray'}
        />
      </div>

      {/* Expiry warning banner */}
      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          <div className="text-sm text-amber-800">
            <p className="font-semibold">
              {expiringSoon.length} supply item{expiringSoon.length > 1 ? 's' : ''} expiring within 90 days
            </p>
            <p className="mt-0.5 text-amber-700">
              Review your inventory and{' '}
              <Link href="/portal/catalog" className="underline font-medium hover:text-amber-900">
                restock from our catalog
              </Link>
              {' '}or{' '}
              <Link href="/portal/appointments/new" className="underline font-medium hover:text-amber-900">
                schedule a restocking visit
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {/* Appointments */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Upcoming Appointments</h2>
          <Link href="/portal/appointments/new" className="text-sm font-medium text-red-600 hover:text-red-700">
            Request one →
          </Link>
        </div>

        {activeAppointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-gray-500 text-sm mb-4">No upcoming appointments.</p>
            <Link
              href="/portal/appointments/new"
              className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Schedule an Evaluation
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {activeAppointments.map((appt) => (
              <li key={appt.id}>
                <AppointmentCard appt={appt} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Supply inventory summary */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Your Supplies</h2>
          <Link href="/portal/catalog" className="text-sm font-medium text-red-600 hover:text-red-700">
            Shop catalog →
          </Link>
        </div>

        {supplies.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-gray-500 text-sm mb-4">
              No supplies on record yet. Start with an evaluation or browse the catalog.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/portal/catalog"
                className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                Browse Catalog
              </Link>
              <Link
                href="/portal/appointments/new"
                className="inline-block border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                Get Evaluated
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{supplies.length}</span> item type{supplies.length > 1 ? 's' : ''} on record
              </span>
              <Link href="/portal/account" className="text-xs text-gray-400 hover:text-gray-600">
                View all →
              </Link>
            </div>
            {expiringSoon.length > 0 && (
              <div className="px-5 py-3 bg-amber-50">
                <p className="text-xs font-medium text-amber-700">
                  {expiringSoon.length} expiring within 90 days — restock soon to stay prepared.
                </p>
              </div>
            )}
            {supplies.length > 0 && expiringSoon.length === 0 && (
              <div className="px-5 py-3 bg-green-50">
                <p className="text-xs font-medium text-green-700">
                  All supply items are current.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Follow-up plan */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4">Follow-Up Plan</h2>
        {!followUpPlan || !followUpPlan.isActive ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">You are not enrolled in a follow-up plan.</p>
            <p className="text-xs text-gray-400">
              A follow-up plan schedules periodic technician visits to keep your supplies up to date.
              Contact us or complete an initial evaluation to enroll.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {INTERVAL_LABEL[followUpPlan.interval]} visits
                </p>
                {followUpPlan.lastVisitAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last visit: {fmtDate(followUpPlan.lastVisitAt)}
                  </p>
                )}
              </div>
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>
            {followUpPlan.nextScheduledAt && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-500">
                  Next scheduled visit
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {fmtDate(followUpPlan.nextScheduledAt)}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
