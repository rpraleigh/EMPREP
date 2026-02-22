import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase-server';
import { getCustomerProfile, createAppointment } from '@rpral/api';

export default function NewAppointmentPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Request an Appointment</h1>
      <p className="text-gray-500 text-sm mb-8">
        Choose the type of service you need. We&apos;ll confirm a time with you shortly.
      </p>
      <AppointmentRequestForm />
    </div>
  );
}

function AppointmentRequestForm() {
  async function requestAppointment(formData: FormData) {
    'use server';
    const supabase = await (await import('../../../../lib/supabase-server')).createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const profile = await getCustomerProfile(supabase, user.id);
    if (!profile) redirect('/portal/account');

    const type = formData.get('type') as 'evaluation' | 'delivery' | 'follow_up';
    const notes = formData.get('notes') as string | null;

    await createAppointment(supabase, {
      customerId:    profile.id,
      type,
      ...(notes ? { customerNotes: notes } : {}),
    });

    redirect('/portal/appointments');
  }

  return (
    <form action={requestAppointment} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-700">Type of service</legend>

        {[
          {
            value: 'evaluation',
            label: 'Initial Evaluation',
            description:
              'A technician visits your home to assess what you have and recommend a complete preparedness kit.',
          },
          {
            value: 'delivery',
            label: 'Supply Delivery',
            description: 'We deliver supplies from your order directly to your address.',
          },
          {
            value: 'follow_up',
            label: 'Follow-Up Visit',
            description:
              'A technician revisits to check expiry dates, rotate stock, and make sure your kit is still ready.',
          },
        ].map((opt) => (
          <label key={opt.value} className="flex gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-red-400 has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
            <input type="radio" name="type" value={opt.value} required className="mt-1 accent-red-600" />
            <div>
              <p className="font-medium text-gray-900">{opt.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{opt.description}</p>
            </div>
          </label>
        ))}
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Any details we should know beforehand…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700"
      >
        Submit Request
      </button>
    </form>
  );
}
