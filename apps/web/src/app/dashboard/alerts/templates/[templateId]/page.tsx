import { notFound } from 'next/navigation';
import { createServerSupabaseClient, listTemplates } from '@rpral/api';
import TemplateForm from '@/components/alerts/TemplateForm';

interface Props {
  params: Promise<{ templateId: string }>;
}

export default async function EditTemplatePage({ params }: Props) {
  const { templateId } = await params;
  const client = createServerSupabaseClient();
  const templates = await listTemplates(client);
  const template = templates.find((t) => t.id === templateId);

  if (!template) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Edit Template</h1>
        <p className="text-sm text-gray-500 mt-0.5">{template.name} ({template.locale.toUpperCase()})</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <TemplateForm template={template} />
      </div>
    </div>
  );
}
