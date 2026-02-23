import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import {
  getCustomerProfile,
  createCustomerProfile,
  updateCustomerProfile,
  getFollowUpPlan,
  upsertFollowUpPlan,
  getCustomerSupplies,
} from '@rpral/api';
import type { FollowUpInterval, CustomerSupply } from '@rpral/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function expiryStatus(supply: CustomerSupply): 'expired' | 'soon' | 'ok' | 'unknown' {
  if (!supply.expiresAt) return 'unknown';
  const ms = new Date(supply.expiresAt).getTime() - Date.now();
  if (ms < 0) return 'expired';
  if (ms < 90 * 24 * 60 * 60 * 1000) return 'soon';
  return 'ok';
}

// ─── Field component ─────────────────────────────────────────────────────────

function Field({
  label, name, type = 'text', defaultValue, required, half,
}: {
  label: string; name: string; type?: string;
  defaultValue?: string | null; required?: boolean; half?: boolean;
}) {
  return (
    <div className={half ? '' : ''}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const profile = await getCustomerProfile(supabase, user.id);

  const [followUpPlan, supplies] = profile
    ? await Promise.all([
        getFollowUpPlan(supabase, profile.id),
        getCustomerSupplies(supabase, profile.id),
      ])
    : [null, [] as CustomerSupply[]];

  // ── Server actions ──────────────────────────────────────────────────────

  async function saveProfile(formData: FormData) {
    'use server';
    const sb = await createClient();
    const { data: { user: u } } = await sb.auth.getUser();
    if (!u) redirect('/login');

    const existing = await getCustomerProfile(sb, u.id);
    const phone        = (formData.get('phone')        as string) || null;
    const addressLine1 = (formData.get('addressLine1') as string) || null;
    const addressLine2 = (formData.get('addressLine2') as string) || null;
    const city         = (formData.get('city')         as string) || null;
    const state        = (formData.get('state')        as string) || null;
    const zip          = (formData.get('zip')          as string) || null;
    const specialNeeds = (formData.get('specialNeeds') as string) || null;

    const hasPetsVal  = formData.get('hasPets') === 'true';
    const petCountRaw = formData.get('petCount');

    const base = {
      fullName:      formData.get('fullName') as string,
      email:         formData.get('email')    as string,
      householdSize: Number(formData.get('householdSize') ?? 1),
      hasPets:       hasPetsVal,
      wantsGoKit:              formData.get('wantsGoKit')             === 'on',
      wantsShelterKit:         formData.get('wantsShelterKit')        === 'on',
      hasInfants:              formData.get('hasInfants')             === 'yes',
      hasElderly:              formData.get('hasElderly')             === 'yes',
      petCount:                hasPetsVal && petCountRaw ? Number(petCountRaw) : null,
      hasServiceAnimal:        formData.get('hasServiceAnimal')       === 'yes',
      powerDependentMedical:   formData.get('powerDependentMedical')  === 'yes',
      refrigeratedMedications: formData.get('refrigeratedMedications') === 'yes',
      hasMobilityLimitations:  formData.get('hasMobilityLimitations') === 'yes',
      hasVehicle:              formData.get('hasVehicle')             === 'yes',
      ...(phone        ? { phone }        : {}),
      ...(addressLine1 ? { addressLine1 } : {}),
      ...(addressLine2 ? { addressLine2 } : {}),
      ...(city         ? { city }         : {}),
      ...(state        ? { state }        : {}),
      ...(zip          ? { zip }          : {}),
      ...(specialNeeds ? { specialNeeds } : {}),
    };

    if (existing) {
      await updateCustomerProfile(sb, existing.id, base);
    } else {
      await createCustomerProfile(sb, { userId: u.id, ...base });
    }
    redirect('/portal/account');
  }

  async function saveFollowUpPlan(formData: FormData) {
    'use server';
    const sb = await createClient();
    const { data: { user: u } } = await sb.auth.getUser();
    if (!u) redirect('/login');
    const p = await getCustomerProfile(sb, u.id);
    if (!p) redirect('/portal/account');

    const interval = formData.get('interval') as FollowUpInterval | 'none';
    await upsertFollowUpPlan(sb, {
      customerId: p.id,
      interval:   interval === 'none' ? 'annual' : interval,
      isActive:   interval !== 'none',
    });
    redirect('/portal/account');
  }

  async function signOut() {
    'use server';
    const sb = await createClient();
    await sb.auth.signOut();
    redirect('/login');
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const expiringSoon  = supplies.filter((s) => expiryStatus(s) === 'soon');
  const expiredItems  = supplies.filter((s) => expiryStatus(s) === 'expired');

  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="text-2xl font-bold text-gray-900">Account & Preferences</h1>

      {/* ── Personal information ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Personal Information</h2>
        <form action={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name"       name="fullName"      defaultValue={profile?.fullName ?? null} required />
            <Field label="Email"           name="email"         type="email" defaultValue={profile?.email ?? user.email ?? null} required />
            <Field label="Phone"           name="phone"         type="tel"   defaultValue={profile?.phone ?? ''} />
            <Field label="Household Size"  name="householdSize" type="number" defaultValue={String(profile?.householdSize ?? 1)} />
          </div>

          <Field label="Address Line 1" name="addressLine1" defaultValue={profile?.addressLine1 ?? ''} />
          <Field label="Address Line 2 (Apt, Suite…)" name="addressLine2" defaultValue={profile?.addressLine2 ?? ''} />

          <div className="grid grid-cols-3 gap-4">
            <Field label="City"  name="city"  defaultValue={profile?.city  ?? ''} />
            <Field label="State" name="state" defaultValue={profile?.state ?? ''} />
            <Field label="ZIP"   name="zip"   defaultValue={profile?.zip   ?? ''} />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Has Pets?</label>
              <select name="hasPets" defaultValue={profile?.hasPets ? 'true' : 'false'}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Needs <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea name="specialNeeds" rows={2} defaultValue={profile?.specialNeeds ?? ''}
              placeholder="Mobility needs, allergies, medical equipment, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
          </div>

          {/* ── Emergency Preparedness Profile ── */}
          <div className="border-t border-gray-100 pt-5 space-y-5">
            <h3 className="text-sm font-semibold text-gray-700">Emergency Preparedness Profile</h3>

            {/* Scenario */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preparing for…</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="wantsGoKit"
                    defaultChecked={profile?.wantsGoKit ?? false}
                    className="accent-red-600" />
                  <span className="text-sm text-gray-700">Evacuating quickly (go-kit / grab bag)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="wantsShelterKit"
                    defaultChecked={profile?.wantsShelterKit ?? true}
                    className="accent-red-600" />
                  <span className="text-sm text-gray-700">Sheltering at home (extended stay)</span>
                </label>
              </div>
            </div>

            {/* Household */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Children under 5?</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="hasInfants" value="yes"
                      defaultChecked={profile?.hasInfants ?? false}
                      className="accent-red-600" /> Yes
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="hasInfants" value="no"
                      defaultChecked={!(profile?.hasInfants ?? false)}
                      className="accent-red-600" /> No
                  </label>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Elderly members (65+)?</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="hasElderly" value="yes"
                      defaultChecked={profile?.hasElderly ?? false}
                      className="accent-red-600" /> Yes
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="hasElderly" value="no"
                      defaultChecked={!(profile?.hasElderly ?? false)}
                      className="accent-red-600" /> No
                  </label>
                </div>
              </div>
            </div>

            {/* Pets */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Pet count</p>
                <input type="number" name="petCount" min={0} max={99}
                  defaultValue={profile?.petCount ?? ''}
                  placeholder="0"
                  className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Service animal?</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="hasServiceAnimal" value="yes"
                      defaultChecked={profile?.hasServiceAnimal ?? false}
                      className="accent-red-600" /> Yes
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="hasServiceAnimal" value="no"
                      defaultChecked={!(profile?.hasServiceAnimal ?? false)}
                      className="accent-red-600" /> No
                  </label>
                </div>
              </div>
            </div>

            {/* Medical */}
            <div className="grid grid-cols-1 gap-3">
              {([
                { name: 'powerDependentMedical',   label: 'Power-dependent medical equipment?',        val: profile?.powerDependentMedical   ?? false },
                { name: 'refrigeratedMedications', label: 'Refrigerated medications?',                 val: profile?.refrigeratedMedications ?? false },
                { name: 'hasMobilityLimitations',  label: 'Significant mobility limitations?',         val: profile?.hasMobilityLimitations  ?? false },
              ] as const).map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="radio" name={item.name} value="yes"
                        defaultChecked={item.val} className="accent-red-600" /> Yes
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="radio" name={item.name} value="no"
                        defaultChecked={!item.val} className="accent-red-600" /> No
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Transport */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Vehicle available for evacuation?</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="radio" name="hasVehicle" value="yes"
                    defaultChecked={profile?.hasVehicle ?? true}
                    className="accent-red-600" /> Yes
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="radio" name="hasVehicle" value="no"
                    defaultChecked={!(profile?.hasVehicle ?? true)}
                    className="accent-red-600" /> No
                </label>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <button type="submit"
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-5 py-2 text-sm font-semibold transition-colors">
              Save Profile
            </button>
          </div>
        </form>
      </section>

      {/* ── Supply inventory ── */}
      {profile && (
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Supply Inventory</h2>
            <span className="text-xs text-gray-400">{supplies.length} item type{supplies.length !== 1 ? 's' : ''} on record</span>
          </div>

          {supplies.length === 0 ? (
            <p className="text-sm text-gray-500">
              No supplies on record. Your inventory is updated after technician visits and deliveries.
            </p>
          ) : (
            <div className="space-y-2">
              {expiredItems.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700 font-medium">
                  {expiredItems.length} item{expiredItems.length > 1 ? 's' : ''} past expiry — schedule a visit to replace them.
                </div>
              )}
              {expiringSoon.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-700 font-medium">
                  {expiringSoon.length} item{expiringSoon.length > 1 ? 's' : ''} expiring within 90 days.
                </div>
              )}
              <div className="mt-2 divide-y divide-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                {supplies.map((s) => {
                  const status = expiryStatus(s);
                  return (
                    <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-gray-700">
                        Qty: <span className="font-medium text-gray-900">{s.quantity}</span>
                      </span>
                      <div className="text-right">
                        {s.expiresAt ? (
                          <span className={
                            status === 'expired' ? 'text-red-600 font-medium' :
                            status === 'soon'    ? 'text-amber-600 font-medium' :
                                                  'text-gray-400'
                          }>
                            {status === 'expired' ? 'Expired ' : 'Exp '}
                            {fmtDate(s.expiresAt)}
                          </span>
                        ) : (
                          <span className="text-gray-300">No expiry</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Follow-up plan ── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Follow-Up Visit Plan</h2>
        <p className="text-sm text-gray-500 mb-5">
          Supplies like food and water have shelf lives. Periodic visits from our team ensure your
          kit stays current and ready when you need it.
        </p>
        <form action={saveFollowUpPlan} className="space-y-4">
          <div className="space-y-2">
            {([
              { value: 'none',      label: 'No follow-up visits' },
              { value: 'monthly',   label: 'Monthly' },
              { value: 'quarterly', label: 'Every 3 months', recommended: true },
              { value: 'biannual',  label: 'Every 6 months' },
              { value: 'annual',    label: 'Once a year' },
            ] as const).map((opt) => (
              <label key={opt.value}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer has-[:checked]:border-red-300 has-[:checked]:bg-red-50">
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
                <span className="text-sm text-gray-700">
                  {opt.label}
                  {'recommended' in opt && opt.recommended && (
                    <span className="ml-2 text-xs text-red-600 font-medium">Recommended</span>
                  )}
                </span>
              </label>
            ))}
          </div>
          <button type="submit"
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-5 py-2 text-sm font-semibold transition-colors">
            Save Plan
          </button>
        </form>
      </section>

      {/* ── Sign out ── */}
      <section>
        <form action={signOut}>
          <button type="submit" className="text-sm text-red-600 hover:text-red-700 hover:underline">
            Sign Out
          </button>
        </form>
      </section>
    </div>
  );
}
