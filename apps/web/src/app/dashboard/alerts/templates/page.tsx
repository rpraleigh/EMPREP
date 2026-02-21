import Link from 'next/link';
import { createServerSupabaseClient, listTemplates } from '@rpral/api';
import AlertBadge from '@/components/alerts/AlertBadge';

export default async function TemplatesPage() {
  const client = createServerSupabaseClient();
  const templates = await listTemplates(client);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Alert Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">{templates.length} templates</p>
        </div>
        <Link href="/dashboard/alerts/templates/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          + New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No templates yet</p>
          <p className="text-sm mt-1">Create reusable alert templates to speed up dispatch.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Lang</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 uppercase text-gray-500">{t.locale}</td>
                  <td className="px-4 py-3"><AlertBadge severity={t.severity} /></td>
                  <td className="px-4 py-3 capitalize text-gray-600">{t.channel}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[240px] truncate">{t.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex h-2 w-2 rounded-full ${t.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/alerts/templates/${t.id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      Edit →
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
