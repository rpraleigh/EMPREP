import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { getCustomerProfile, createAppointment } from '@rpral/api';
import Link from 'next/link';

export default function NewAppointmentPage() {
  return (
    <div className="max-w-xl">
      <Link href="/portal/appointments" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Appointments
      </Link>
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const profile = await getCustomerProfile(supabase, user.id);
    if (!profile) redirect('/portal/account');

    const type  = formData.get('type')  as 'evaluation' | 'delivery' | 'follow_up';
    const notes = formData.get('notes') as string | null;

    await createAppointment(supabase, {
      customerId:    profile.id,
      type,
      ...(notes ? { customerNotes: notes } : {}),
    });

    redirect('/portal/appointments');
  }

  const options = [
    {
      value: 'evaluation',
      label: 'Evaluation',
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
  ] as const;

  return (
    <form action={requestAppointment} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-700 mb-2">Type of service</legend>
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-red-300 has-[:checked]:border-red-500 has-[:checked]:bg-red-50 transition-colors"
          >
            <input type="radio" name="type" value={opt.value} required className="mt-0.5 accent-red-600 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
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
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
      >
        Submit Request
      </button>
    </form>
  );
}
