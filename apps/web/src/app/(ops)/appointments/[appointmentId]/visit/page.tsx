import { redirect, notFound } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase-server';
import {
  getAppointment,
  createVisitRecord,
  updateAppointmentStatus,
  recordVisitAndAdvancePlan,
  upsertCustomerSupply,
  listItems,
} from '@rpral/api';
import type { VisitAction, FollowUpInterval } from '@rpral/types';

export default async function CompleteVisitPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { appointmentId } = await params;
  const [appt, items] = await Promise.all([
    getAppointment(supabase, appointmentId),
    listItems(supabase),
  ]);

  if (!appt || appt.status !== 'in_progress') notFound();

  async function submitVisit(formData: FormData) {
    'use server';
    const s = await (await import('../../../../../lib/supabase-server')).createClient();
    const { data: { user: u } } = await s.auth.getUser();
    if (!u) redirect('/login');

    const followUpNeeded = formData.get('followUpNeeded') === 'true';
    const followUpInterval = formData.get('followUpInterval') as FollowUpInterval | null;

    // Collect supply actions from repeating fields
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

    const summary        = (formData.get('summary')         as string) || null;
    const recommendations = (formData.get('recommendations') as string) || null;
    const visitRecord = await createVisitRecord(s, {
      appointmentId,
      employeeId: u.id,
      ...(summary         ? { summary }         : {}),
      ...(recommendations ? { recommendations } : {}),
      followUpNeeded,
      ...(followUpNeeded && followUpInterval ? { followUpInterval } : {}),
      supplyActions,
    });

    // Update customer supplies for delivered items
    const deliveredActions = supplyActions.filter((a) => a.action === 'delivered');
    for (const action of deliveredActions) {
      await upsertCustomerSupply(s, {
        customerId:   appt!.customerId,
        supplyItemId: action.supplyItemId,
        quantity:     action.quantity,
        purchasedAt:  new Date().toISOString(),
      });
    }

    // Advance follow-up plan if applicable
    if (followUpNeeded && followUpInterval) {
      await recordVisitAndAdvancePlan(s, appt!.customerId, new Date());
    }

    await updateAppointmentStatus(s, appointmentId, 'completed');
    redirect(`/ops/appointments/${appointmentId}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Visit</h1>

      <form action={submitVisit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visit Summary</label>
          <textarea name="summary" rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="What was the state of their current supplies?" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
          <textarea name="recommendations" rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="What did you recommend they add, replace, or update?" />
        </div>

        {/* Supply actions */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Supply Actions</p>
          <p className="text-xs text-gray-500 mb-3">Record items found, delivered, or recommended during this visit.</p>
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <select name="supplyItemId"
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm col-span-1">
                  <option value="">— item —</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <select name="action"
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm">
                  <option value="found">Found</option>
                  <option value="delivered">Delivered</option>
                  <option value="recommended">Recommended</option>
                  <option value="removed">Removed</option>
                  <option value="expired">Expired</option>
                </select>
                <input type="number" name="quantity" defaultValue={1} min={1}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Follow-Up Needed?</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="followUpNeeded" value="false" defaultChecked className="accent-red-600" />
              <span className="text-sm">No</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="followUpNeeded" value="true" className="accent-red-600" />
              <span className="text-sm">Yes</span>
            </label>
          </div>
          <select name="followUpInterval"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">— select interval —</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="biannual">Every 6 months</option>
            <option value="annual">Annual</option>
          </select>
        </div>

        <button type="submit"
          className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-green-700">
          Complete Visit &amp; Save
        </button>
      </form>
    </div>
  );
}
