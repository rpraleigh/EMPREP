import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import {
  getAppointment,
  createVisitRecord,
  updateAppointmentStatus,
  recordVisitAndAdvancePlan,
  upsertCustomerSupply,
  listItems,
} from '@rpral/api';
import type { VisitAction, FollowUpInterval } from '@rpral/types';
import Link from 'next/link';

export default async function CompleteVisitPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [appt, items] = await Promise.all([
    getAppointment(supabase, appointmentId),
    listItems(supabase),
  ]);

  if (!appt || appt.status !== 'in_progress') notFound();

  // Capture for server action closures
  const customerId = appt.customerId;

  async function submitVisit(formData: FormData) {
    'use server';
    const s = await createClient();
    const { data: { user: u } } = await s.auth.getUser();
    if (!u) redirect('/login');

    const followUpNeeded   = formData.get('followUpNeeded') === 'true';
    const followUpInterval = formData.get('followUpInterval') as FollowUpInterval | null;

    const supplyItemIds = formData.getAll('supplyItemId') as string[];
    const actions       = formData.getAll('action')       as string[];
    const quantities    = formData.getAll('quantity')     as string[];

    const supplyActions = supplyItemIds
      .map((id, i) => ({
        supplyItemId: id,
        action:       (actions[i] ?? 'found') as VisitAction,
        quantity:     parseInt(quantities[i] ?? '1', 10),
      }))
      .filter((a) => a.supplyItemId);

    const summary         = (formData.get('summary')         as string) || null;
    const recommendations = (formData.get('recommendations') as string) || null;

    await createVisitRecord(s, {
      appointmentId,
      employeeId: u.id,
      ...(summary         ? { summary }         : {}),
      ...(recommendations ? { recommendations } : {}),
      followUpNeeded,
      ...(followUpNeeded && followUpInterval ? { followUpInterval } : {}),
      supplyActions,
    });

    for (const action of supplyActions.filter((a) => a.action === 'delivered')) {
      await upsertCustomerSupply(s, {
        customerId,
        supplyItemId: action.supplyItemId,
        quantity:     action.quantity,
        purchasedAt:  new Date().toISOString(),
      });
    }

    if (followUpNeeded && followUpInterval) {
      await recordVisitAndAdvancePlan(s, customerId, new Date());
    }

    await updateAppointmentStatus(s, appointmentId, 'completed');
    redirect(`/ops/appointments/${appointmentId}`);
  }

  return (
    <div className="max-w-2xl">
      <Link href={`/ops/appointments/${appointmentId}`} className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
        ← Appointment
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">Complete Visit</h1>

      <form action={submitVisit} className="space-y-6">
        {/* Summary & recommendations */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Visit Summary</label>
            <textarea
              name="summary"
              rows={3}
              placeholder="What was the state of their current supplies?"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Recommendations</label>
            <textarea
              name="recommendations"
              rows={3}
              placeholder="What did you recommend they add, replace, or update?"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none"
            />
          </div>
        </div>

        {/* Supply actions */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">Supply Actions</p>
          <p className="text-xs text-gray-600 mb-4">Record items found, delivered, or recommended during this visit.</p>
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-[1fr_140px_80px] gap-2">
                <select
                  name="supplyItemId"
                  className="bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white"
                >
                  <option value="">— item —</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <select
                  name="action"
                  className="bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white"
                >
                  <option value="found">Found</option>
                  <option value="delivered">Delivered</option>
                  <option value="recommended">Recommended</option>
                  <option value="removed">Removed</option>
                  <option value="expired">Expired</option>
                </select>
                <input
                  type="number"
                  name="quantity"
                  defaultValue={1}
                  min={1}
                  className="bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Follow-Up Needed?</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="followUpNeeded" value="false" defaultChecked className="accent-blue-500" />
              <span className="text-sm text-gray-300">No</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="followUpNeeded" value="true" className="accent-blue-500" />
              <span className="text-sm text-gray-300">Yes</span>
            </label>
          </div>
          <select
            name="followUpInterval"
            className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">— select interval —</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="biannual">Every 6 months</option>
            <option value="annual">Annual</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          Complete Visit &amp; Save
        </button>
      </form>
    </div>
  );
}
