import { createServerSupabaseClient, listTemplates } from '@rpral/api';
import AlertForm from '@/components/alerts/AlertForm';

export default async function NewAlertPage() {
  const client = createServerSupabaseClient();
  const templates = await listTemplates(client, { isActive: true });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dispatch Alert</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Alert will be sent immediately to all eligible subscribers.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AlertForm templates={templates} />
      </div>
    </div>
  );
}
