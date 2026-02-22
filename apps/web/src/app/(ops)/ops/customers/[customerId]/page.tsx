import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import {
  getCustomerById,
  listAppointments,
  getCustomerSupplies,
  getFollowUpPlan,
  listItems,
} from '@rpral/api';
import type { AppointmentStatus, AppointmentType, CustomerSupply, SupplyItem } from '@rpral/types';
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

function supplyStatus(s: CustomerSupply): { label: string; cls: string } {
  if (!s.expiresAt) return { label: 'No expiry', cls: 'text-gray-500' };
  const daysLeft = Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / 86_400_000);
  if (daysLeft < 0)  return { label: 'Expired',           cls: 'text-red-400' };
  if (daysLeft < 90) return { label: `${daysLeft}d left`, cls: 'text-amber-400' };
  return { label: fmtDate(s.expiresAt), cls: 'text-green-400' };
}

export default async function OpsCustomerDetail({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata as Record<string, unknown>)?.['user_role'];
  if (role !== 'admin') redirect('/ops/dashboard');

  const customer = await getCustomerById(supabase, customerId);
  if (!customer) notFound();

  const [appointments, supplies, followUpPlan, allItems] = await Promise.all([
    listAppointments(supabase, { customerId, limit: 20 }),
    getCustomerSupplies(supabase, customerId),
    getFollowUpPlan(supabase, customerId),
    listItems(supabase),
  ]);

  const itemMap = new Map<string, SupplyItem>(allItems.map((i) => [i.id, i]));

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/ops/customers" className="text-xs text-gray-500 hover:text-gray-300 mb-3 inline-block">
          ← Customers
        </Link>
        <h1 className="text-2xl font-bold text-white">{customer.fullName}</h1>
        <p className="text-sm text-gray-400 mt-1">{customer.email}</p>
      </div>

      {/* Profile details */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700/50">
        {customer.phone        && <Row label="Phone"          value={customer.phone} />}
        {customer.addressLine1 && (
          <Row
            label="Address"
            value={[
              customer.addressLine1,
              customer.addressLine2,
              customer.city && `${customer.city}, ${customer.state} ${customer.zip}`,
            ].filter(Boolean).join(', ')}
          />
        )}
        <Row label="Household Size" value={String(customer.householdSize)} />
        <Row label="Has Pets"       value={customer.hasPets ? 'Yes' : 'No'} />
        {customer.specialNeeds && <Row label="Special Needs" value={customer.specialNeeds} />}
        <Row label="Customer Since" value={fmtDate(customer.createdAt)} />
      </div>

      {/* Follow-up plan */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Follow-Up Plan</h2>
        {followUpPlan ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700/50">
            <Row label="Interval"  value={followUpPlan.interval.charAt(0).toUpperCase() + followUpPlan.interval.slice(1)} />
            <Row label="Status"    value={followUpPlan.isActive ? 'Active' : 'Paused'} />
            <Row label="Last Visit" value={followUpPlan.lastVisitAt ? fmtDate(followUpPlan.lastVisitAt) : '—'} />
            <Row label="Next Due"  value={followUpPlan.nextScheduledAt ? fmtDate(followUpPlan.nextScheduledAt) : '—'} />
          </div>
        ) : (
          <p className="text-sm text-gray-500">No follow-up plan set.</p>
        )}
      </section>

      {/* Supply inventory */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Supply Inventory ({supplies.length})
        </h2>
        {supplies.length === 0 ? (
          <p className="text-sm text-gray-500">No supplies on record.</p>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700/50">
            {supplies.map((s) => {
              const item   = itemMap.get(s.supplyItemId);
              const status = supplyStatus(s);
              return (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{item?.name ?? 'Unknown item'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {s.quantity}</p>
                  </div>
                  <span className={`text-xs ${status.cls}`}>{status.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Appointments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
            Appointments ({appointments.length})
          </h2>
        </div>
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500">No appointments.</p>
        ) : (
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
                    {appt.scheduledAt ? fmtDateTime(appt.scheduledAt) : `Requested ${fmtDate(appt.createdAt)}`}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[appt.status]}`}>
                  {STATUS_LABEL[appt.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
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
