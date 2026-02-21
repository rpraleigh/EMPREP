'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { AlertDeliveryStats } from '@rpral/types';

interface Props {
  initial: AlertDeliveryStats;
}

interface StatProps {
  label: string;
  value: number;
  color: string;
}

function Stat({ label, value, color }: StatProps) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function DeliveryStatsCard({ initial }: Props) {
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`delivery-stats-${initial.alertId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alert_deliveries',
          filter: `alert_id=eq.${initial.alertId}`,
        },
        async () => {
          // Re-fetch stats on any delivery update
          const { data } = await supabase
            .from('alert_deliveries')
            .select('status')
            .eq('alert_id', initial.alertId);

          if (!data) return;

          const counts = { pending: 0, sent: 0, delivered: 0, failed: 0, error: 0, not_registered: 0 };
          for (const row of data) {
            const s = row.status as keyof typeof counts;
            if (s in counts) counts[s]++;
          }

          setStats({
            alertId: initial.alertId,
            total: data.length,
            pending: counts.pending,
            sent: counts.sent,
            delivered: counts.delivered,
            failed: counts.failed,
            error: counts.error,
            notRegistered: counts.not_registered,
          });
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [initial.alertId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Delivery Status</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        <Stat label="Total"     value={stats.total}        color="text-gray-800" />
        <Stat label="Pending"   value={stats.pending}      color="text-gray-500" />
        <Stat label="Sent"      value={stats.sent}         color="text-blue-600" />
        <Stat label="Delivered" value={stats.delivered}    color="text-green-600" />
        <Stat label="Failed"    value={stats.failed}       color="text-red-600" />
        <Stat label="Expired"   value={stats.notRegistered} color="text-gray-400" />
      </div>
    </div>
  );
}
