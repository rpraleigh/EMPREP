'use client';

import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  customerId: string;
  notes:      string;
}

export default function BookAppointmentButton({ customerId, notes }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleBook() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.from('appointments').insert({
        customer_id:    customerId,
        type:           'evaluation',
        customer_notes: notes,
        status:         'requested',
      });
      if (err) throw new Error(err.message);
      router.push('/portal/appointments');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleBook}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl px-6 py-3 text-sm font-semibold transition-colors shadow-sm"
      >
        {loading ? 'Booking…' : 'Book an Evaluation Appointment'}
      </button>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      <p className="text-xs text-gray-400 text-center">
        A technician will assess your home and help you build out your recommended kit.
      </p>
    </div>
  );
}
