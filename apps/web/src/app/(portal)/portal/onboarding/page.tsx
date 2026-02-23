import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getCustomerProfile, createCustomerProfile } from '@rpral/api';

// ─── Radio group helper ───────────────────────────────────────────────────────

function YesNo({ name, defaultValue = false }: { name: string; defaultValue?: boolean }) {
  return (
    <div className="flex gap-6">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="radio" name={name} value="yes" defaultChecked={defaultValue}
          className="accent-red-600" />
        <span className="text-sm text-gray-700">Yes</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="radio" name={name} value="no" defaultChecked={!defaultValue}
          className="accent-red-600" />
        <span className="text-sm text-gray-700">No</span>
      </label>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-5">
      {children}
    </h2>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Already onboarded — skip back to dashboard
  const existing = await getCustomerProfile(supabase, user.id);
  if (existing) redirect('/portal/dashboard');

  // ── Server action ────────────────────────────────────────────────────────

  async function completeOnboarding(formData: FormData) {
    'use server';
    const sb = await createClient();
    const { data: { user: u } } = await sb.auth.getUser();
    if (!u) redirect('/login');

    const hasPetsVal  = formData.get('hasPets')  === 'yes';
    const petCountRaw = formData.get('petCount');

    await createCustomerProfile(sb, {
      userId:   u.id,
      fullName: formData.get('fullName') as string,
      email:    u.email ?? (formData.get('email') as string),
      householdSize: Number(formData.get('householdSize') ?? 1),
      hasPets:  hasPetsVal,
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
    });

    redirect('/portal/dashboard');
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-red-600 tracking-wide uppercase mb-2">EMPREP</p>
          <h1 className="text-2xl font-bold text-gray-900">Let's build your emergency profile</h1>
          <p className="text-sm text-gray-500 mt-2">
            This helps us recommend the right supplies and services for your household.
          </p>
        </div>

        <form action={completeOnboarding} className="space-y-8">

          {/* ── Your Emergency Plan ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeading>Your Emergency Plan</SectionHeading>
            <p className="text-sm text-gray-600 mb-4">
              What are you preparing for? <span className="text-gray-400">(select all that apply)</span>
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer has-[:checked]:border-red-300 has-[:checked]:bg-red-50">
                <input type="checkbox" name="wantsGoKit" defaultChecked
                  className="mt-0.5 accent-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Evacuating quickly</p>
                  <p className="text-xs text-gray-400">Go-kit / grab bag for leaving home fast</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer has-[:checked]:border-red-300 has-[:checked]:bg-red-50">
                <input type="checkbox" name="wantsShelterKit" defaultChecked
                  className="mt-0.5 accent-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Sheltering at home</p>
                  <p className="text-xs text-gray-400">Staying in place for extended periods</p>
                </div>
              </label>
            </div>
          </section>

          {/* ── Your Household ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeading>Your Household</SectionHeading>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input type="text" name="fullName" required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Household Size
                </label>
                <input type="number" name="householdSize" defaultValue={1} min={1} max={20}
                  className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>

              <FieldRow label="Children under 5 in the household?">
                <YesNo name="hasInfants" />
              </FieldRow>

              <FieldRow label="Elderly members (65+)?">
                <YesNo name="hasElderly" />
              </FieldRow>
            </div>
          </section>

          {/* ── Pets ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeading>Pets</SectionHeading>
            <div className="space-y-5">
              <FieldRow label="Do you have pets?" hint="Required — must explicitly answer">
                <YesNo name="hasPets" />
              </FieldRow>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How many pets? <span className="text-gray-400 font-normal">(if yes)</span>
                </label>
                <input type="number" name="petCount" min={0} max={99} placeholder="—"
                  className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>

              <FieldRow label="Service animal in your household?">
                <YesNo name="hasServiceAnimal" />
              </FieldRow>
            </div>
          </section>

          {/* ── Medical & Accessibility ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeading>Medical &amp; Accessibility</SectionHeading>
            <div className="space-y-5">
              <FieldRow
                label="Power-dependent medical equipment?"
                hint="CPAP, oxygen concentrator, nebulizer, electric wheelchair, etc."
              >
                <YesNo name="powerDependentMedical" />
              </FieldRow>

              <FieldRow
                label="Refrigerated medications?"
                hint="Insulin, biologics, or other temperature-sensitive drugs"
              >
                <YesNo name="refrigeratedMedications" />
              </FieldRow>

              <FieldRow label="Significant mobility limitations in the household?">
                <YesNo name="hasMobilityLimitations" />
              </FieldRow>
            </div>
          </section>

          {/* ── Transportation ── */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <SectionHeading>Transportation</SectionHeading>
            <FieldRow label="Vehicle available for evacuation?">
              <YesNo name="hasVehicle" defaultValue={true} />
            </FieldRow>
          </section>

          <div className="pb-4">
            <button type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-3 text-sm font-semibold transition-colors shadow-sm">
              Complete Profile &amp; Continue
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
