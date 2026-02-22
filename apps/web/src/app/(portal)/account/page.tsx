import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase-server';
import {
  getCustomerProfile,
  createCustomerProfile,
  updateCustomerProfile,
  getFollowUpPlan,
  upsertFollowUpPlan,
} from '@rpral/api';
import type { FollowUpInterval } from '@rpral/types';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profile, followUpPlan] = await Promise.all([
    getCustomerProfile(supabase, user.id),
    getCustomerProfile(supabase, user.id).then((p) =>
      p ? getFollowUpPlan(supabase, p.id) : null,
    ),
  ]);

  async function saveProfile(formData: FormData) {
    'use server';
    const supabase2 = await (await import('../../../lib/supabase-server')).createClient();
    const { data: { user: u } } = await supabase2.auth.getUser();
    if (!u) redirect('/login');

    const existing = await getCustomerProfile(supabase2, u.id);
    const phone        = (formData.get('phone')        as string) || null;
    const addressLine1 = (formData.get('addressLine1') as string) || null;
    const addressLine2 = (formData.get('addressLine2') as string) || null;
    const city         = (formData.get('city')         as string) || null;
    const state        = (formData.get('state')        as string) || null;
    const zip          = (formData.get('zip')          as string) || null;
    const specialNeeds = (formData.get('specialNeeds') as string) || null;
    const base = {
      fullName:      formData.get('fullName') as string,
      email:         formData.get('email')    as string,
      householdSize: Number(formData.get('householdSize') ?? 1),
      hasPets:       formData.get('hasPets') === 'true',
      ...(phone        ? { phone }        : {}),
      ...(addressLine1 ? { addressLine1 } : {}),
      ...(addressLine2 ? { addressLine2 } : {}),
      ...(city         ? { city }         : {}),
      ...(state        ? { state }        : {}),
      ...(zip          ? { zip }          : {}),
      ...(specialNeeds ? { specialNeeds } : {}),
    };

    if (existing) {
      await updateCustomerProfile(supabase2, existing.id, base);
    } else {
      await createCustomerProfile(supabase2, { userId: u.id, ...base });
    }
    redirect('/portal/account');
  }

  async function saveFollowUpPlan(formData: FormData) {
    'use server';
    const supabase2 = await (await import('../../../lib/supabase-server')).createClient();
    const { data: { user: u } } = await supabase2.auth.getUser();
    if (!u) redirect('/login');
    const p = await getCustomerProfile(supabase2, u.id);
    if (!p) redirect('/portal/account');

    const interval = formData.get('interval') as FollowUpInterval | 'none';
    await upsertFollowUpPlan(supabase2, {
      customerId: p.id,
      interval:   interval === 'none' ? 'annual' : interval,
      isActive:   interval !== 'none',
    });
    redirect('/portal/account');
  }

  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="text-2xl font-bold text-gray-900">Account & Preferences</h1>

      {/* Profile form */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
        <form action={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" name="fullName" defaultValue={profile?.fullName ?? null} required />
            <Field label="Email" name="email" type="email" defaultValue={profile?.email ?? user.email ?? null} required />
            <Field label="Phone" name="phone" type="tel" defaultValue={profile?.phone ?? ''} />
            <Field label="Household Size" name="householdSize" type="number" defaultValue={String(profile?.householdSize ?? 1)} />
          </div>
          <Field label="Address Line 1" name="addressLine1" defaultValue={profile?.addressLine1 ?? ''} />
          <Field label="Address Line 2" name="addressLine2" defaultValue={profile?.addressLine2 ?? ''} />
          <div className="grid grid-cols-3 gap-4">
            <Field label="City"  name="city"  defaultValue={profile?.city  ?? ''} />
            <Field label="State" name="state" defaultValue={profile?.state ?? ''} />
            <Field label="ZIP"   name="zip"   defaultValue={profile?.zip   ?? ''} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Has Pets?</label>
            <select name="hasPets" defaultValue={profile?.hasPets ? 'true' : 'false'}
              className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Needs <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea name="specialNeeds" rows={2} defaultValue={profile?.specialNeeds ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="bg-red-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-red-700">
            Save Profile
          </button>
        </form>
      </section>

      {/* Follow-up plan */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Follow-Up Visit Plan</h2>
        <p className="text-sm text-gray-500 mb-4">
          Supplies like food and water have shelf lives. Periodic visits from our team ensure your
          kit stays current and ready when you need it.
        </p>
        <form action={saveFollowUpPlan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visit frequency</label>
            <div className="space-y-2">
              {[
                { value: 'none',      label: 'No follow-up visits' },
                { value: 'monthly',   label: 'Monthly' },
                { value: 'quarterly', label: 'Every 3 months (Recommended)' },
                { value: 'biannual',  label: 'Every 6 months' },
                { value: 'annual',    label: 'Once a year' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="interval"
                    value={opt.value}
                    defaultChecked={
                      !followUpPlan || !followUpPlan.isActive
                        ? opt.value === 'none'
                        : followUpPlan.interval === opt.value
                    }
                    className="accent-red-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="bg-red-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-red-700">
            Save Plan
          </button>
        </form>
      </section>

      {/* Sign out */}
      <section>
        <form action={async () => {
          'use server';
          const s = await (await import('../../../lib/supabase-server')).createClient();
          await s.auth.signOut();
          redirect('/login');
        }}>
          <button type="submit" className="text-sm text-red-600 hover:underline">Sign Out</button>
        </form>
      </section>
    </div>
  );
}

function Field({
  label, name, type = 'text', defaultValue, required,
}: {
  label: string; name: string; type?: string; defaultValue?: string | null; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
      />
    </div>
  );
}
