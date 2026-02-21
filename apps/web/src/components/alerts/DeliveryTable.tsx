import type { AlertDelivery } from '@rpral/types';

const STATUS_STYLES: Record<string, string> = {
  pending:        'bg-gray-100 text-gray-600',
  sent:           'bg-blue-100 text-blue-700',
  delivered:      'bg-green-100 text-green-700',
  failed:         'bg-red-100 text-red-700',
  error:          'bg-orange-100 text-orange-700',
  not_registered: 'bg-gray-100 text-gray-400',
};

interface Props {
  deliveries: AlertDelivery[];
}

export default function DeliveryTable({ deliveries }: Props) {
  if (deliveries.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No delivery records yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3">Channel</th>
            <th className="px-4 py-3">Recipient</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Sent at</th>
            <th className="px-4 py-3">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {deliveries.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 capitalize font-medium">{d.channel}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[180px] truncate">
                {d.recipientToken ?? d.recipientPhone ?? '—'}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[d.status] ?? ''}`}>
                  {d.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                {d.sentAt ? new Date(d.sentAt).toLocaleTimeString() : '—'}
              </td>
              <td className="px-4 py-3 text-red-500 text-xs max-w-[200px] truncate">
                {d.errorMessage ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
