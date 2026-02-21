import Link from 'next/link';
import { createServerSupabaseClient } from '@rpral/api';
import { listAlerts } from '@rpral/api';
import AlertBadge from '@/components/alerts/AlertBadge';
import type { Alert } from '@rpral/types';

const STATUS_STYLES: Record<Alert['status'], string> = {
  draft:       'bg-gray-100 text-gray-600',
  pending:     'bg-yellow-100 text-yellow-700',
  dispatching: 'bg-blue-100 text-blue-700',
  sent:        'bg-green-100 text-green-700',
  failed:      'bg-red-100 text-red-700',
  cancelled:   'bg-gray-100 text-gray-400',
};

export default async function AlertsPage() {
  const client = createServerSupabaseClient();
  const alerts = await listAlerts(client, { pageSize: 50 });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{alerts.length} total</p>
        </div>
        <Link
          href="/dashboard/alerts/new"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          + Dispatch Alert
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No alerts yet</p>
          <p className="text-sm mt-1">Dispatch your first alert to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dispatched</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[240px] truncate">
                    {alert.title}
                  </td>
                  <td className="px-4 py-3">
                    <AlertBadge severity={alert.severity} />
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{alert.channel}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[alert.status]}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {alert.dispatchedAt
                      ? new Date(alert.dispatchedAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/alerts/${alert.id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
