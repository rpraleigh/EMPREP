import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient, getAlert, getDeliveryStats, getDeliveriesForAlert } from '@rpral/api';
import AlertBadge from '@/components/alerts/AlertBadge';
import DeliveryStatsCard from '@/components/alerts/DeliveryStatsCard';
import DeliveryTable from '@/components/alerts/DeliveryTable';
import { dispatchExistingAlert, cancelExistingAlert } from '@/lib/alert-actions';

interface Props {
  params: Promise<{ alertId: string }>;
}

export default async function AlertDetailPage({ params }: Props) {
  const { alertId } = await params;
  const client = createServerSupabaseClient();

  const [alert, deliveries] = await Promise.all([
    getAlert(client, alertId),
    getDeliveriesForAlert(client, alertId),
  ]);

  if (!alert) notFound();

  const stats = await getDeliveryStats(client, alertId);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/alerts" className="text-xs text-gray-400 hover:text-gray-600 mb-2 block">
            ← Back to Alerts
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{alert.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <AlertBadge severity={alert.severity} size="md" />
            <span className="text-sm text-gray-500 capitalize">{alert.channel} channel</span>
            {alert.targetArea && (
              <span className="text-sm text-gray-500">📍 {alert.targetArea}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {alert.status === 'draft' && (
            <form action={dispatchExistingAlert.bind(null, alertId)}>
              <button type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                Dispatch
              </button>
            </form>
          )}
          {(alert.status === 'draft' || alert.status === 'pending') && (
            <form action={cancelExistingAlert.bind(null, alertId)}>
              <button type="submit"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Alert details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            Message (English)
          </p>
          <p className="text-sm text-gray-800">{alert.body}</p>
        </div>
        {alert.bodyEs && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Message (Spanish)
            </p>
            <p className="text-sm text-gray-800">{alert.bodyEs}</p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100 text-sm">
          <div>
            <p className="text-xs text-gray-400">Status</p>
            <p className="font-medium capitalize mt-0.5">{alert.status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Dispatched</p>
            <p className="font-medium mt-0.5">
              {alert.dispatchedAt ? new Date(alert.dispatchedAt).toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Created</p>
            <p className="font-medium mt-0.5">{new Date(alert.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Delivery stats (live) */}
      <DeliveryStatsCard initial={stats} />

      {/* Delivery log */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Delivery Log</h3>
        </div>
        <DeliveryTable deliveries={deliveries} />
      </div>
    </div>
  );
}
